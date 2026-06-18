// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer, ipcMain } = require('electron');

contextBridge.exposeInMainWorld('tmdbAPI', {
    //Account
    login: () => ipcRenderer.invoke('login-tmdb'),
    isLoggedIn: () => ipcRenderer.invoke('is-logged-in'),
    logout: () => ipcRenderer.invoke('logout'),
    GSAccount: () => ipcRenderer.invoke('get-save-account'),
    getMovieAccountStates: (movieId) => ipcRenderer.invoke('movie-account-states', movieId),
    getTvAccountStates: (tvId) => ipcRenderer.invoke('tv-account-states', tvId),
    
    //Movie
    favoriteMovie: (page) => ipcRenderer.invoke('favorite-movie', page),
    favoriteTV: (page) => ipcRenderer.invoke('favorite-tv', page),
    WatchlistMovie: (page) => ipcRenderer.invoke('watchlist-movie', page),
    WatchlistTV: (page) => ipcRenderer.invoke('watchlist-tv', page),
    addFavorite: (mediaID, mediaType, favorite = true) => ipcRenderer.invoke('add_favorite', { mediaID, mediaType, favorite}),
    addWatchlist: (mediaID, mediaType, watchlist = true) => ipcRenderer.invoke('add_watchlist', {mediaID, mediaType, watchlist}),

    //Funções
});