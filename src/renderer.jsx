import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Filmes from './components/Filmes/Filmes';
import Series from './components/Series/Series';
import TV from './components/TV/TV';
import Filme from './components/Filmes/id';
import Serie from './components/Series/id';
import Painel from './components/Painel_Lateral/Painel';
import Account from './components/Account/Account';
import Player from './components/Player/Player';
import Controller from './components/controller/controller';
import { AuthProvider } from './components/AuthContext/AuthContext';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Controller />
        <Painel />
        <main>
          <Routes>
            <Route path="/filme" element={<Filmes />} />
            <Route path="/filme/:id" element={<Filme />} />
            <Route path="/series" element={<Series />} />
            <Route path="/serie/:id" element={<Serie />} />
            <Route path="/tv" element={<TV />} />
            <Route path='/' element={<Account />} />
            <Route path='/player/:url' element={<Player />} />
          </Routes>
        </main>
      </HashRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
