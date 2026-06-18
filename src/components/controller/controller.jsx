import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ATALHOS = [
    { tecla: 'Tab',       descricao: 'Navegar entre páginas'   },
    { tecla: 'Backspace', descricao: 'Voltar página anterior'  },
    { tecla: '/',         descricao: 'Abrir/fechar atalhos'    },
    { tecla: 'Espaço',    descricao: 'Fazer pesquisa na aba Filmes e Séries'},
];

export default function Controller() {
    const navigate = useNavigate();
    const location = useLocation();
    const rotas = ['/', '/filme', '/series', '/tv'];
    const [abrirAjuda, setAbrirAjuda] = useState(false);

    const trocaDePagina = useCallback(() => {
        const indiceAtual = rotas.indexOf(location.pathname);
        const proximoIndice = (indiceAtual + 1) % rotas.length;
        navigate(rotas[proximoIndice]);
    }, [location, navigate]);

    const pesquisa = useCallback(() => {
        document.dispatchEvent(new CustomEvent('abrirPesquisa'));
    }, []);
    useEffect(() => {
        const atalhos = {
            'Backspace': () => navigate(-1),
            'Tab':       () => trocaDePagina(),
            '/':         () => setAbrirAjuda(prev => !prev),
            ' ':     () => pesquisa(),
        };

        const handleKeyDown = (event) => {
            const tagAtiva = document.activeElement?.tagName;
            if(['INPUT', 'TEXTAREA', 'SELECT'].includes(tagAtiva)) return;
            const acao = atalhos[event.key];
            if (acao) {
                event.preventDefault();
                acao();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [navigate, trocaDePagina]);

    if (!abrirAjuda) return null;

    return (
        <div style={estilos.overlay} onClick={() => setAbrirAjuda(false)}>
            <div style={estilos.painel} onClick={e => e.stopPropagation()}>

                <div style={estilos.cabecalho}>
                    <span style={estilos.titulo}>Atalhos do teclado</span>
                    <button
                        style={estilos.fechar}
                        onClick={() => setAbrirAjuda(false)}
                        aria-label="Fechar"
                    >
                        ✕
                    </button>
                </div>

                <div style={estilos.separador} />

                <ul style={estilos.lista}>
                    {ATALHOS.map(({ tecla, descricao }) => (
                        <li key={tecla} style={estilos.item}>
                            <span style={estilos.descricao}>{descricao}</span>
                            <kbd style={estilos.kbd}>{tecla}</kbd>
                        </li>
                    ))}
                </ul>

                <div style={estilos.separador} />

                <p style={estilos.rodape}>
                    Pressione <kbd style={estilos.kbdInline}>/</kbd> para fechar
                </p>
            </div>
        </div>
    );
}

const estilos = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    painel: {
        background: '#141414',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        padding: '20px 24px',
        minWidth: '340px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
    },
    cabecalho: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
    },
    titulo: {
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        letterSpacing: '0.3px',
    },
    fechar: {
        background: 'none',
        border: 'none',
        color: '#666',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: '4px',
        lineHeight: 1,
        transition: 'color 0.15s',
    },
    separador: {
        height: '1px',
        background: '#2a2a2a',
        margin: '4px 0',
    },
    lista: {
        listStyle: 'none',
        margin: '12px 0',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    descricao: {
        color: '#aaa',
        fontSize: '14px',
    },
    kbd: {
        background: '#1e1e1e',
        border: '1px solid #333',
        borderBottom: '2px solid #333',
        borderRadius: '5px',
        padding: '3px 10px',
        color: '#ddd',
        fontSize: '12px',
        fontFamily: 'monospace',
        letterSpacing: '0.5px',
    },
    kbdInline: {
        background: '#1e1e1e',
        border: '1px solid #333',
        borderBottom: '2px solid #333',
        borderRadius: '4px',
        padding: '1px 6px',
        color: '#ddd',
        fontSize: '11px',
        fontFamily: 'monospace',
    },
    rodape: {
        color: '#555',
        fontSize: '12px',
        textAlign: 'center',
        marginTop: '14px',
        marginBottom: 0,
    },
};