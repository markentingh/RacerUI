import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScaleUI } from '@/context/scale';
import { useGame } from '@/context/game';
import { useFooter } from '@/context/footer';
import Icon, { Logo } from '@/components/ui/Icon';
import DarkModeToggle from '@/components/ui/DarkModeToggle';

const MENU = [
  { id: 'game', icon: 'game', label: 'Game', always: true },
  { id: 'cars', icon: 'race-car', label: 'Cars' },
  { id: 'tracks', icon: 'track', label: 'Tracks' },
  { id: 'history', icon: 'history', label: 'History' },
  { id: 'profile', icon: 'profile', label: 'Profile' },
  { id: 'settings', icon: 'settings', label: 'Settings' }
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { game, gameTitle } = useGame();
  const gameLoaded = !!(game && game.id);
  const { collapseDetails } = useFooter();
  const current = location.pathname.split('/')[2] || 'game';

  const go = (path) => {
    collapseDetails();
    navigate(`/dashboard/${path}`);
  };

  return (
    <ScaleUI as="nav">
      <div className="logo">
        <Logo className="light" />
        <Logo className="dark" dark />
      </div>
      <div className="arrow">
        <Icon name="arrow-right" className="dark" />
      </div>
      <ul className="menu">
        {MENU.map((item) => (
          <li
            key={item.id}
            className={`item-${item.id}${item.always || gameLoaded ? '' : ' game-loaded'}${current === item.id ? ' selected' : ''}`}
            onClick={() => go(item.id)}
          >
            <Icon name={item.icon} className="dark" />
            {item.id === 'game' ? (
              <>
                <span id="gameName">{gameTitle}</span>
                <span className="game-default-name">Game</span>
              </>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
      <DarkModeToggle />
      <div className="dropdown-menu game-loaded" style={{ display: 'none' }}>
        <div className="hamburger">
          <span className="material-symbols-outlined">menu</span>
        </div>
        <ul></ul>
      </div>
    </ScaleUI>
  );
}
