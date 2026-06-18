import React,{useState, useEffect} from "react";
import { useNavigate, useParams } from "react-router-dom";
import './Player.css'

export default function Player() {
    const { url } = useParams();
    const navigate = useNavigate();
    const [pressedKey, setPressedKey] = useState(null);

    useEffect(() => {
        const shortcuts = {
            'Backspace': () => navigate(-1),
            // Adicione mais atalhos aqui:
            // 'F1': () => navigate('/ajuda'),
            // 'Escape': () => navigate('/'),
        };

        const handleKeyDown = (event) => {
            const action = shortcuts[event.key];
            if (action) {
                event.preventDefault(); // evita comportamento padrão do navegador
                action();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    return(
        <div className="iframe">
            <iframe src={decodeURIComponent(url)} width="100%" height="100%" frameborder="0" allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *; clipboard-write *; accelerometer *; gyroscope *; web-share *" allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>
        </div>
    )
}