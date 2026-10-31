import React, { useEffect, useRef, useState } from 'react';
import { useHub } from '@/context/hub';
import { useGame } from '@/context/game';
import { ScaleUI } from '@/context/scale';

const OPTIONS = [
  { id: 'checkNewCars', label: 'Check for new cars', group: 0 },
  { id: 'findChildCars', label: 'Find child cars', group: 0 },
  { id: 'getCarDetails', label: 'Get Car Details from AI', group: 0 },
  { id: 'verifyCarDetails', label: 'Verify Car Details', group: 0 },
  { id: 'checkNewTracks', label: 'Check for new tracks', group: 1 },
  { id: 'getTrackDetails', label: 'Get Track Details from AI', group: 1 },
  { id: 'verifyTrackDetails', label: 'Verify Track Details', group: 1 }
];

export default function GamePage() {
  const { connection, connected } = useHub();
  const { game, gameTitle, setPath } = useGame();
  const [checks, setChecks] = useState(Object.fromEntries(OPTIONS.map((o) => [o.id, true])));
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTitle, setProgressTitle] = useState('');
  const [progressText, setProgressText] = useState('');
  const [pathInput, setPathInput] = useState('');
  const listenersRef = useRef([]);

  const hasGame = !!(game && game.id);

  useEffect(() => {
    if (game && game.path) setPathInput(game.path);
  }, [game]);

  const checkAssets = () => {
    if (!connection) return;
    setChecking(true);
    setProgress(0);
    const on = (ev, fn) => { connection.on(ev, fn); listenersRef.current.push([ev, fn]); };
    on('progress', setProgress);
    on('progress-title', setProgressTitle);
    on('progress-text', setProgressText);
    on('progress-complete', complete);
    connection.send('CheckGameAssets', 'assetto corsa',
      checks.checkNewCars, checks.findChildCars, checks.getCarDetails, checks.verifyCarDetails,
      checks.checkNewTracks, checks.getTrackDetails, checks.verifyTrackDetails);
  };

  const complete = () => {
    listenersRef.current.forEach(([ev, fn]) => connection.off(ev, fn));
    listenersRef.current = [];
    setChecking(false);
  };

  useEffect(() => () => {
    listenersRef.current.forEach(([ev, fn]) => connection.off(ev, fn));
  }, [connection]);

  const submitPath = async () => {
    const g = await setPath(pathInput);
    if (g) { /* context already saved */ }
  };

  return (
    <>
      <ScaleUI className={`check-assets${hasGame ? '' : ' hidden'}`} style={{ display: hasGame ? '' : 'none' }}>
        <p>Make sure RacerUI has the latest catalogue of all of your game assets for <span className="game-name">{gameTitle}</span></p>
        {[0, 1].map((group) => (
          <div className="check-options" key={group}>
            {OPTIONS.filter((o) => o.group === group).map((o) => (
              <label key={o.id}>
                <input
                  type="checkbox"
                  id={o.id}
                  checked={checks[o.id]}
                  onChange={(e) => setChecks((c) => ({ ...c, [o.id]: e.target.checked }))}
                /> {o.label}
              </label>
            ))}
          </div>
        ))}
        <button style={{ display: checking ? 'none' : '' }} onClick={checkAssets} disabled={!connected}>
          Check Game Assets
        </button>
        <div className="checking-assets" style={{ display: checking ? 'block' : 'none' }}>
          <div className="progress-title">{progressTitle}</div>
          <div className="progress-text">{progressText}</div>
          <div className="progress"><div className="bar" style={{ width: `${progress}%` }}></div></div>
          <div className="skip-btn" onClick={complete}><button>Skip</button></div>
        </div>
      </ScaleUI>
      <ScaleUI className="set-game-path" style={{ display: hasGame ? 'none' : 'block' }}>
        <p>Set the path to your game directory</p>
        <input type="text" id="gamePath" placeholder="Game Path" value={pathInput} onChange={(e) => setPathInput(e.target.value)} />
        <button onClick={submitPath}>Set Path</button>
      </ScaleUI>
    </>
  );
}
