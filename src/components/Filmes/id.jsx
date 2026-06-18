import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './id.css';
import TMDB from '../../itens/TMDB.json';
import pomfyLogo from '../../assets/filmes/pomfylogofullcolor.png';
import superflixLogo from '../../assets/filmes/superflix_logo.png';

export default function Filme() {
    const { id } = useParams();
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    const imageOriginalBaseUrl = 'https://image.tmdb.org/t/p/original';
    const [filme, setFilme] = useState(null);
    const navigate = useNavigate();

    const [images, setImages] = useState(null);
    const [backdrops, setBackdrops] = useState([]);
    const [currentBackdropIndex, setCurrentBackdropIndex] = useState(0);

    const [recommendations, setRecommendations] = useState({ results: [] });
    const [page, setPage] = useState(1);
    const [carrosselBordas, setCarrosselBordas] = useState({ esquerda: false, direita: true });
    const carrosselRef = React.useRef(null);
    const [movieContent, setMovieContent] = useState(null);

    const [isFavorite, setIsFavorite] = useState(false);
    const [isWatchlist, setIsWatchlist] = useState(false);

    const handleOpenWarezCDN = () => {
        const iframe = `https://warezcdn.lat/filme/${id}`
        console.log("Link: ", iframe);
        navigate(`/player/${encodeURIComponent(iframe)}`);
    };
    const handleOpenSuperFlixAPI = () => {
        const iframe = `https://superflixapi.cyou/filme/${id}`
        console.log("Link: ", iframe);
        navigate(`/player/${encodeURIComponent(iframe)}`);
    };

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer ' + TMDB.key
        }
    };

    useEffect(() => {
        fetch(TMDB.movie[8].url.replace('{movie_id}', id), options)
            .then(res => res.json())
            .then(res => setFilme(res))
            .catch(err => console.error(err));
    }, [id]);
    useEffect(() => {
        window.tmdbAPI.getMovieAccountStates(id).then((states) => {
            console.log(states);
            setIsFavorite(states.favorite);
            setIsWatchlist(states.watchlist);
        })
    }, [id]);

    useEffect(() => {
        fetch(TMDB.movie[10].url.replace('{movie_id}', id), options)
            .then(res => res.json())
            .then(res => {
                setImages(res);
            })
            .catch(err => console.error(err));
    }, [id]);
    const atualizarBordasCarrossel = () => {
        if (!carrosselRef.current) return;
        const trilho = carrosselRef.current;
        const margem = 10;
        const esquerda = trilho.scrollLeft > margem;
        const direita = trilho.scrollLeft + trilho.clientWidth < trilho.scrollWidth - margem;
        setCarrosselBordas({ esquerda, direita });
    };

    const scrollCarrossel = (direcao) => {
        if (!carrosselRef.current) return;
        const trilho = carrosselRef.current;
        const passo = Math.max(280, Math.floor(trilho.clientWidth * 0.9));
        trilho.scrollBy({
            left: direcao === 'direita' ? passo : -passo,
            behavior: 'smooth'
        });
        requestAnimationFrame(atualizarBordasCarrossel);
    };
    // build backdrops array from images or fallback to filme.backdrop_path
    useEffect(() => {
        if (images && images.backdrops && images.backdrops.length > 0) {
            const paths = images.backdrops.map(b => b.file_path).filter(Boolean);
            if (paths.length > 0) setBackdrops(paths);
        } else if (filme && filme.backdrop_path) {
            setBackdrops([filme.backdrop_path]);
        }
    }, [images, filme]);

    // slideshow cycling
    useEffect(() => {
        if (!backdrops || backdrops.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBackdropIndex(i => (i + 1) % backdrops.length);
        }, 5000); // change every 5s

        return () => clearInterval(interval);
    }, [backdrops]);
    useEffect(() => {
        if (!filme) {
            document.title = 'VS | Carregando filme...';
            return;
        }

        document.title = `VS | ${filme.title}`;
    }, [filme]);

    useEffect(() => {
        fetch(TMDB.movie[11].url.replace('{movie_id}', id).replace('{page}', page), options)
            .then(res => res.json())
            .then(res => setRecommendations(res))
            .catch(err => console.error(err));
    }, [id, page]);

    useEffect(() => {
        const trilho = carrosselRef.current;
        if (!trilho) return;
        trilho.addEventListener('scroll', atualizarBordasCarrossel);
        atualizarBordasCarrossel();
        return () => trilho.removeEventListener('scroll', atualizarBordasCarrossel);
    }, []);

    if (!filme) {
        return <p className='FilmeLoading'>Carregando filme...</p>;
    }

    const recommendationsCard = () => {
        return recommendations.results.map(rec => (
            <Link to={`/filme/${rec.id}`} key={rec.id} className='RecommendationCard'>
                <img src={rec.poster_path ? imageBaseUrl + rec.poster_path : 'https://placehold.co/500x750?text=Sem+Imagem'} alt={rec.name} />
            </Link>
        ))
    }

    const handleToggleFavorite = async () => {
        const result = await window.tmdbAPI.addFavorite(id, 'movie', !isFavorite);
        if (result.success) {
            setIsFavorite(!isFavorite)
        }
    };
    const handleToggleWatchlist = async () => {
        const result = await window.tmdbAPI.addWatchlist(id, 'movie', !isWatchlist);
        console.log(result);
        if (result.success) {
            setIsWatchlist(!isWatchlist);
        }
    }
    return (
        <section className='FilmePage'>

            <div className='FilmeAura' />

            <Link className='FilmeBack' onClick={() => navigate(-1)}>
                ← Voltar
            </Link>
            <div className='backdrop_card'>
                {backdrops && backdrops.length > 0 ? (
                    backdrops.map((path, idx) => (
                        <img
                            key={idx}
                            className='backdrop-slide'
                            src={path ? `${imageOriginalBaseUrl}${path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                            alt={filme.name}
                            loading='lazy'
                            decoding='async'
                            style={{ opacity: idx === currentBackdropIndex ? 1 : 0 }}
                        />
                    ))
                ) : (
                    <img
                        src={filme.backdrop_path ? `${imageOriginalBaseUrl}${filme.backdrop_path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                        alt={filme.name}
                        loading='lazy'
                        decoding='async'
                    />
                )}
            </div>
            <article className='FilmeCard'>
                <div className='FilmePosterWrap'>
                    <img
                        src={filme.poster_path ? `${imageBaseUrl}${filme.poster_path}` : 'https://via.placeholder.com/500x750?text=Sem+Poster'}
                        alt={filme.title}
                        className='poster_card'
                        loading='lazy'
                        decoding='async'
                    />
                    <span className='FilmePosterGlow' aria-hidden='true' />
                </div>

                <div className='FilmeContent'>
                    <div>
                        <h1>{filme.title}</h1>
                        <h3>{filme.tagline}</h3>
                    </div>
                    <div className='Filme_Save'>
                        <button onClick={handleToggleFavorite}>
                            {isFavorite ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
                                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                            </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                                <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z" />
                            </svg>}
                            <h4 className='Text-Button Favorite-text'>{isFavorite ? 'Remover dos favoritos' : 'Adicionar nos favoritos'}</h4>
                        </button>
                        <button onClick={handleToggleWatchlist}>
                            {isWatchlist ? <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-clock-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
                            </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16">
                                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" />
                            </svg>}
                            <h4 className='Text-Button Watchlist-text'>{isWatchlist ? 'Terminou de Assistir?' : 'Assistir mais tarde'}</h4>
                        </button>
                    </div>
                    <div className='FilmeMeta'>
                        <span>{filme.release_date ? filme.release_date.slice(0, 4) : 'Sem data'}</span>
                        <span>Nota {filme.vote_average?.toFixed(1) ?? 'N/A'}</span>
                        <span>{filme.runtime ? `${filme.runtime} min` : 'Duracao indisponivel'}</span>
                    </div>

                    <p className='FilmeOverview'>{filme.overview || 'Sinopse indisponivel.'}</p>
                    <div className='API'>
                        <button className='API_Button' onClick={handleOpenSuperFlixAPI}>
                            <span style={{ textTransform: 'uppercase', fontSize: 22, color: '#fff', fontWeight: 900 }}>
                                SuperFlix<span style={{color: '#ff0000'}}>API</span>
                            </span>
                        </button>
                        <button className='API_Button' onClick={handleOpenWarezCDN}>
                            <span style={{ textTransform: 'uppercase', fontSize: 22, color: '#fff', fontWeight: 900 }}>
                                warez<span style={{ color: '#425ff0' }}>cdn</span>
                            </span>
                        </button>
                    </div>
                </div>
                <div className='RecommendationsSection'>
                    <div className='RecommendationsTopo'>
                        <h2>Recomendações</h2>
                        <div className='CarrosselControles'>
                            <button
                                type='button'
                                className='CarrosselBotao'
                                onClick={() => scrollCarrossel('esquerda')}
                                aria-label='Rolar recomendações para esquerda'
                            >
                                ‹
                            </button>
                            <button
                                type='button'
                                className='CarrosselBotao'
                                onClick={() => scrollCarrossel('direita')}
                                aria-label='Rolar recomendações para direita'
                            >
                                ›
                            </button>
                        </div>
                    </div>
                    <div
                        className={`RecommendationsCarrossel ${carrosselBordas.esquerda ? '' : 'sem-esquerda'} ${carrosselBordas.direita ? '' : 'sem-direita'}`.trim()}
                        ref={carrosselRef}
                        onScroll={atualizarBordasCarrossel}
                    >
                        {recommendationsCard()}
                    </div>
                </div>
            </article>
        </section>

    )
}