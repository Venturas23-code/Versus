import { app, BrowserWindow, ipcMain, Menu, globalShortcut, autoUpdater, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import Store from 'electron-store';
import { type } from 'node:os';
import { title } from 'node:process';

dotenv.config();
const store = new Store();

let currentSessionId = store.get('session_id') || null;
let accountID = store.get('account_id') || null;
let accountIMAGE = store.get('account_img') || null;

const server = 'https://versus-jet.vercel.app'
const url = `${server}/update/${process.platform}/${app.getVersion()}`
autoUpdater.setFeedURL({url});

const UPDATE_CHECK_INTERVAL = 10*60*1000;

setInterval(() => {
  autoUpdater.checkForUpdates()
}, UPDATE_CHECK_INTERVAL);

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Versus tem atualização disponivel',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    details: 'Uma nova versão está disponivel para ser baixada. Reinicie o Versus para aplicar a Atualização'
  }
  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  })
})
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const isMyPlayer = details.url.includes('https://aboveboardcomplicate.com/');
    //console.log(details.url);
    if (isMyPlayer) {
      //console.log('🚫 Bloqueando popup indesejado:', details.url);
      return {
        action: 'deny',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true
        }
      };
    }

    // Se chegou aqui, é anúncio do superflix ou outra fonte indesejada
    //console.log('✅ Permitindo player:', details.url);
    return { action: 'allow' };
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  Menu.setApplicationMenu(null);
  mainWindow.maximize();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const TMDB_API_KEY = process.env.TMDB_KEY;
const TMDB_API = process.env.TMDB_API_KEY;
const REDIRECT_URI = 'vsauth://callback';
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer ' + TMDB_API_KEY
  }
};

ipcMain.handle('login-tmdb', async () => {
  try {
    const tokenResponse = await fetch(`https://api.themoviedb.org/3/authentication/token/new`, options);
    //console.log(TMDB_API_KEY);
    const tokenData = await tokenResponse.json();
    //console.log('Token Data: ', tokenData);
    if (!tokenData.success) throw new Error('Falha ao gerar request token');
    const requestToken = tokenData.request_token;

    const authWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      autoHideMenuBar: true,
      alwaysOnTop: true
    });
    globalShortcut.register('F5', () => {
      authWindow.reload();
    })
    globalShortcut.register('CommandOrControl+R', () => {
      authWindow.reload();
    })
    authWindow.on('will-quit', () => {
      globalShortcut.unregisterAll();
    })

    const authUrl = `https://www.themoviedb.org/authenticate/${requestToken}?redirect_to=${REDIRECT_URI}`;
    authWindow.loadURL(authUrl);

    return new Promise((resolve, reject) => {
      let settled = false;
      const handleUrl = async (url) => {
        if (!url.startsWith(REDIRECT_URI)) return;
        if (settled) return;

        settled = true;

        if (!authWindow.isDestroyed()) authWindow.close();

        const urlObj = new URL(url);
        const approved = urlObj.searchParams.get('approved');
        const callbackToken = urlObj.searchParams.get('request_token'); // ✅ pegar da URL

        //console.log('[callback token]', callbackToken);
        //console.log('[original token]', requestToken);

        if (approved === 'true') {
          try {
            // Criação de sessão — usa API Key v3
            const sessionResponse = await fetch(
              `https://api.themoviedb.org/3/authentication/session/new?api_key=${TMDB_API}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_token: callbackToken }),
              }
            );
            const sessionData = await sessionResponse.json();
            //console.log('[session response]', sessionData);

            if (sessionData.success) {
              currentSessionId = sessionData.session_id;
              store.set('session_id', sessionData.session_id);
              resolve(sessionData.session_id);
            } else {
              reject(new Error('Falha ao gerar Session ID'));
            }
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error('Autenticação cancelada ou negada pelo usuário.'));
        }
      };
      authWindow.webContents.on('will-redirect', (event, url) => {
        //console.log('[will-redirect]', url);
        event.preventDefault();
        handleUrl(url);
      })
      authWindow.webContents.on('will-navigate', (event, url) => {
        //console.log('[will-navigate]', url);
        if (url.startsWith(REDIRECT_URI)) {
          event.preventDefault();
          handleUrl(url);
        }
      });
      authWindow.webContents.on('did-navigate', (event, url) => {
        //console.log('[did-navigate]', url);
        handleUrl(url);
      })
      authWindow.on('closed', () => {
        if (!settled) { reject(new Error('A janela de login foi fechada antes da conclusão.')); }
      });
    });
  } catch (err) {
    console.error('Erro no fluxo do TMDB: ', err);
    throw err;
  }
});

const tmdbFetch = async (endpoint) => {
  const response = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer ' + TMDB_API_KEY
    }
  });
  return response.json();
};

const tmdbPost = async (endpoint, body) => {
  const resposta = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: 'Bearer ' + TMDB_API_KEY,
    },
    body: JSON.stringify(body)
  });
  return resposta.json();
}
//Movie
ipcMain.handle('favorite-movie', async (_, page = 1) => {
  return tmdbFetch(`/account/${accountID}/favorite/movies?language=pt-BR&page=${page}&session_id=${currentSessionId}`);
});
ipcMain.handle('favorite-tv', async (_, page = 1) => {
  return tmdbFetch(`/account/${accountID}/favorite/tv?language=pt-BR&page=${page}&session_id=${currentSessionId}`);
});
ipcMain.handle('watchlist-movie', async (_, page = 1) => {
  return tmdbFetch(`/account/${accountID}/watchlist/movies?language=pt-BR&page=${page}&session_id=${currentSessionId}`);
});
ipcMain.handle('watchlist-tv', async (_, page = 1) => {
  return tmdbFetch(`/account/${accountID}/watchlist/tv?language=pt-BR&page=${page}&session_id=${currentSessionId}`);
});
ipcMain.handle('add_favorite', async (_,{mediaID, mediaType, favorite = true}) => {
  return tmdbPost(`/account/${accountID}/favorite?session_id=${currentSessionId}`, {
    media_type: mediaType,
    media_id: mediaID,
    favorite
  });
});
ipcMain.handle('add_watchlist', async (_, {mediaID, mediaType, watchlist= true}) => {
  return tmdbPost(`/account/${accountID}/watchlist?session_id=${currentSessionId}`, {
    media_type: mediaType,
    media_id: mediaID,
    watchlist
  });
})
ipcMain.handle('movie-account-states', async(_, movieId) => {
  return tmdbFetch(`/movie/${movieId}/account_states?session_id=${currentSessionId}`);
})
ipcMain.handle('tv-account-states', async (_, tvId) => {
  return tmdbFetch(`/tv/${tvId}/account_states?session_id=${currentSessionId}`);
})

//Account
ipcMain.handle('is-logged-in', () => {
  return currentSessionId !== null;
});

ipcMain.handle('logout', () => {
  currentSessionId = null;
  store.delete('session_id');
  accountID = null;
  store.delete('account_id');
  accountIMAGE = null;
  store.delete('account_img');
});

ipcMain.handle('get-save-account', async () => {
  if (!currentSessionId) throw new Error('Usuário não autenticado');

  const response = await fetch(
    `https://api.themoviedb.org/3/account?api_key=${TMDB_API}&session_id=${currentSessionId}`,
    {
      headers: { accept: 'application/json' }
    }
  );
  const data = await response.json();
  store.set('account_id', data.id);
  store.set('account_img', data.avatar.tmdb.avatar_path);
  //console.log('[get-account response]', data); // ✅ ver o retorno completo
  return data;
});
