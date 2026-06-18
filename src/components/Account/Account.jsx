import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import './Account.css';
import { useAuth } from "../AuthContext/AuthContext";

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const SECOES = [
    {
        chave: 'favoritosMovie',
        titulo: '❤️ Filmes Favoritos',
        buscar: () => window.tmdbAPI.favoriteMovie(),
        tipo: 'filme'
    },
    {
        chave: 'favoritosSeries',
        titulo: '❤️ Séries Favoritas',
        buscar: () => window.tmdbAPI.favoriteTV(),
        tipo: 'serie'
    },
    {
        chave: 'assistirMovie',
        titulo: '🕓 Filmes Para Assistir Mais Tarde',
        buscar: () => window.tmdbAPI.WatchlistMovie(),
        tipo: 'filme'
    },
    {
        chave: 'assistirTV',
        titulo: '🕓 Séries Para Assistir Mais Tarde',
        buscar: () => window.tmdbAPI.WatchlistTV(),
        tipo: 'serie'
    }
    
];

export default function Account() {
    const {account, loadingAuth, login, logout} = useAuth();
    const [dev, setDev]           = useState(false);

    // carrosseis: { [chave]: { filmes, carregando, erro } }
    const [carrosseis, setCarrosseis] = useState(() =>
        Object.fromEntries(SECOES.map(s => [s.chave, { filmes: [], carregando: false, erro: '' }]))
    );
    const [bordas, setBordas] = useState({});
    const trilhoRefs = useRef({});
    const navigate   = useNavigate();

    // ── Conta ────────────────────────────────────────────────
    useEffect(() => { document.title = 'VS | Conta'; }, []);

    useEffect(() => {
        if(!loadingAuth && !account){
            login();
        }
    }, [loadingAuth, account, login]);

    useEffect(() => {
        if (account?.id === 22151105) setDev(true);
        else setDev(false);
    }, [account]);

    // ── Carrosseis (só carrega depois que a conta estiver pronta) ──
    useEffect(() => {
        if (!account) return;

        SECOES.forEach(({ chave, buscar }) => {
            setCarrosseis(prev => ({
                ...prev,
                [chave]: { ...prev[chave], carregando: true, erro: '' },
            }));

            buscar()
                .then(res => {
                    const filmes = Array.isArray(res?.results) ? res.results
                                 : Array.isArray(res)          ? res
                                 : [];
                    setCarrosseis(prev => ({
                        ...prev,
                        [chave]: { filmes, carregando: false, erro: '' },
                    }));
                })
                .catch(err => {
                    console.error(err);
                    setCarrosseis(prev => ({
                        ...prev,
                        [chave]: { filmes: [], carregando: false, erro: 'Não foi possível carregar.' },
                    }));
                });
        });
    }, [account]);

    // ── Bordas fade ───────────────────────────────────────────
    const atualizarBordas = (chave) => {
        const el = trilhoRefs.current[chave];
        if (!el) return;
        const margem  = 1;
        const esq = el.scrollLeft > margem;
        const dir = el.scrollLeft + el.clientWidth < el.scrollWidth - margem;
        setBordas(prev => {
            const cur = prev[chave];
            if (cur?.esq === esq && cur?.dir === dir) return prev;
            return { ...prev, [chave]: { esq, dir } };
        });
    };

    useEffect(() => {
        const atualizar = () => SECOES.forEach(s => atualizarBordas(s.chave));
        const raf = requestAnimationFrame(atualizar);
        window.addEventListener('resize', atualizar);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', atualizar); };
    }, [carrosseis]);

    const scroll = (chave, dir) => {
        const el = trilhoRefs.current[chave];
        if (!el) return;
        const passo = Math.max(280, Math.floor(el.clientWidth * 0.9));
        el.scrollBy({ left: dir === 'direita' ? passo : -passo, behavior: 'smooth' });
        requestAnimationFrame(() => atualizarBordas(chave));
    };

    // ── Logout ───────────────────────────────────────────────
    // ── Render ───────────────────────────────────────────────
    const renderFilmes = (filmes, tipo) =>
        filmes.map(m => (
            <button
                key={m.id}
                className="Card"
                type="button"
                onClick={() => navigate(`/${tipo}/${m.id}`)}
            >
                <img
                    src={m.poster_path
                        ? `${IMAGE_BASE}${m.poster_path}`
                        : `https://placehold.co/500x750?text=${encodeURIComponent(m.title)}`}
                    alt={m.title}
                    loading="lazy"
                    decoding="async"
                />
            </button>
        ));

    return (
        <section className="AccountPage">
            {/* ── Perfil ── */}
            <div className="AccountCard">
                {loadingAuth && <p className="AccountLoading">Carregando conta...</p>}

                {!loadingAuth && account && (
                    <div className="Perfil">
                        <div className="avatar-wrapper">
                            <img
                                className="perfil_foto"
                                src={`https://image.tmdb.org/t/p/original${account.avatar.tmdb.avatar_path}`}
                                alt={account.username}
                            />
                        </div>
                        <div className="text">
                            <div>
                                <h1 className="Username">{account.username}</h1>
                                {dev && <span className="Insignts">DEV</span>}
                            </div>
                            {account.name && <h3 className="Nome">{account.name}</h3>}
                        </div>
                    </div>
                )}

                <button className="btn-sair" onClick={logout} disabled={!account || loadingAuth}>
                    Sair da conta
                </button>
            </div>

            {/* ── Carrosseis ── */}
            {account && (
                <div className="CarrosselLista">
                    {SECOES.map(({ chave, titulo, tipo }) => {
                        const secao = carrosseis[chave];
                        const b     = bordas[chave] || {};

                        return (
                            <section key={chave} className="CarrosselSecao">
                                <div className="CarrosselTopo">
                                    <h2>{titulo}</h2>
                                    {!secao.carregando && secao.filmes.length > 0 && (
                                        <div className="CarrosselControles">
                                            <button
                                                type="button"
                                                className="CarrosselBotao"
                                                onClick={() => scroll(chave, 'esquerda')}
                                                aria-label="Rolar para a esquerda"
                                            >‹</button>
                                            <button
                                                type="button"
                                                className="CarrosselBotao"
                                                onClick={() => scroll(chave, 'direita')}
                                                aria-label="Rolar para a direita"
                                            >›</button>
                                        </div>
                                    )}
                                </div>

                                <div className={`CarrosselTrilho ${b.esq ? '' : 'sem-esquerda'} ${b.dir ? '' : 'sem-direita'}`.trim()}>
                                    <div
                                        className="Filmes"
                                        ref={el => {
                                            trilhoRefs.current[chave] = el;
                                            if (el) requestAnimationFrame(() => atualizarBordas(chave));
                                        }}
                                        onScroll={() => atualizarBordas(chave)}
                                    >
                                        {secao.carregando && (
                                            <p className="LoadingText">Carregando...</p>
                                        )}
                                        {!secao.carregando && secao.erro && (
                                            <p className="LoadingText">{secao.erro}</p>
                                        )}
                                        {!secao.carregando && !secao.erro && secao.filmes.length === 0 && (
                                            <p className="LoadingText">Nenhum filme aqui ainda.</p>
                                        )}
                                        {!secao.carregando && secao.filmes.length > 0 && renderFilmes(secao.filmes, tipo)}
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

        </section>
    );
}