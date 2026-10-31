import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useHub } from './hub';

const GameContext = createContext(null);

const GAMES = [
  { name: 'assetto corsa', class: 'game-assetto-corsa', icon: 'icon-assetto-corsa' }
];

export function GameProvider({ children }) {
  const { connection, connected } = useHub();
  const [game, setGame] = useState(() => {
    try { return JSON.parse(localStorage.getItem('RacerUI:game')); } catch { return null; }
  });

  const save = useCallback((g) => {
    setGame((prev) => {
      const merged = { ...prev, ...g };
      localStorage.setItem('RacerUI:game', JSON.stringify({
        name: merged.name, path: merged.path, id: merged.id, title: merged.title
      }));
      return merged;
    });
  }, []);

  // Load game details once the hub handshake completes
  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    const load = async () => {
      let name = 'assetto corsa';
      try {
        const cached = JSON.parse(localStorage.getItem('RacerUI:game'));
        if (cached?.name) name = cached.name;
      } catch { /* none */ }
      const g = await connection.invoke('GetGameDetails', name).catch(() => null);
      if (!cancelled && g) save(g);
    };
    load();
    const onDetails = (json) => { try { save(JSON.parse(json)); } catch { /* ignore */ } };
    connection.on('gameDetails', onDetails);
    return () => { cancelled = true; connection.off('gameDetails', onDetails); };
  }, [connected, connection, save]);

  // Reflect the loaded game on <body> like the original ui.game.load
  useEffect(() => {
    if (game?.id) {
      const info = GAMES.find((g) => g.name === game.name);
      document.body.classList.add('game-loaded');
      if (info) document.body.classList.add(info.class);
      return () => {
        document.body.classList.remove('game-loaded');
        if (info) document.body.classList.remove(info.class);
      };
    }
  }, [game]);

  const setPath = useCallback(async (path) => {
    const g = await connection.invoke('SetGamePath', path, game?.name).catch(() => null);
    if (g) save(g);
    return g;
  }, [connection, game, save]);

  return (
    <GameContext.Provider value={{ game, setPath, gameName: game?.name || 'assetto corsa', gameTitle: game?.title || 'Game' }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
