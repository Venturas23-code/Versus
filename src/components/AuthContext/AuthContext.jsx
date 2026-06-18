import React, { createContext, useState, useEffect, useContext} from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children })=> {
    const [account, setAccount] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        async function loadAccount() {
            try{
                const loggedIn = await window.tmdbAPI.isLoggedIn();
                if(loggedIn){
                    const acc = await window.tmdbAPI.GSAccount();
                    setAccount(acc);
                }
            } catch (err){
                console.error('Erro ao carregar conta:', err);
            } finally{
                setLoadingAuth(false)
            }
        }
        loadAccount();
    }, []);

    const login = async() => {
        try{
            await window.tmdbAPI.login();
            const acc = await window.tmdbAPI.GSAccount();
            setAccount(acc);
        } catch (err){
            console.error("Erro no login:", err);
        }
    }

    const logout = async () => {
        try{
            await window.tmdbAPI.logout();
            setAccount(null);
        } catch (err){
            console.error("Erro no logout:", err);
        }
    };

    return(
        <AuthContext.Provider value={{ account, loadingAuth, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => useContext(AuthContext);