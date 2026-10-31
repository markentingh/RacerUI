import React from 'react';
import { useTheme } from '@/context/theme';

// Mirrors the <darkmode-toggle> custom element from the original app
export default function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <div className="darkmode-toggle">
      <div className="toggle-dark-mode" onClick={() => toggleDarkMode()}>
        <span>Dark Mode</span>
        <div className={`toggle for-darkmode${darkMode ? ' on' : ''}`}>
          <div className="switch">
            <span className="light material-symbols-outlined">light_mode</span>
            <span className="dark material-symbols-outlined">dark_mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}
