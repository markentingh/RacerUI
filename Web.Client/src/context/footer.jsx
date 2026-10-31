import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useHub } from './hub';
import { favorites } from '@/api/user/favorites';
import { ac } from '@/api/user/ac';

const FooterContext = createContext(null);

// Static weather types from AC's WeatherType enum
export const STATIC_WEATHER_TYPES = [
  { value: 15, label: 'Clear' }, { value: 16, label: 'Few Clouds' },
  { value: 17, label: 'Scattered Clouds' }, { value: 18, label: 'Broken Clouds' },
  { value: 19, label: 'Overcast Clouds' }, { value: 20, label: 'Fog' },
  { value: 21, label: 'Mist' }, { value: 22, label: 'Smoke' },
  { value: 23, label: 'Haze' }, { value: 24, label: 'Sand' },
  { value: 25, label: 'Dust' }, { value: 3, label: 'Light Drizzle' },
  { value: 4, label: 'Drizzle' }, { value: 5, label: 'Heavy Drizzle' },
  { value: 6, label: 'Light Rain' }, { value: 7, label: 'Rain' },
  { value: 8, label: 'Heavy Rain' }, { value: 0, label: 'Light Thunderstorm' },
  { value: 1, label: 'Thunderstorm' }, { value: 2, label: 'Heavy Thunderstorm' },
  { value: 12, label: 'Light Sleet' }, { value: 13, label: 'Sleet' },
  { value: 14, label: 'Heavy Sleet' }, { value: 9, label: 'Light Snow' },
  { value: 10, label: 'Snow' }, { value: 11, label: 'Heavy Snow' },
  { value: 26, label: 'Squalls' }, { value: 27, label: 'Tornado' },
  { value: 28, label: 'Hurricane' }, { value: 29, label: 'Cold' },
  { value: 30, label: 'Hot' }, { value: 31, label: 'Windy' },
  { value: 32, label: 'Hail' }
];

export const MORE_MODES = ['trackday', 'weekend', 'drift', 'timeattack', 'drag'];
export const OPPONENT_MODES = ['race', 'trackday', 'weekend', 'drag'];

export const MODE_DEFAULTS = {
  practice:   { penalties: true, startType: 'PIT', ballast: 0, restrictor: 0 },
  hotlap:     { penalties: true, ghostCar: true, ghostCarRecord: true, ghostCarAdvantage: 0, ballast: 0, restrictor: 0 },
  race:       { penalties: true, jumpStartPenalty: 0, laps: 2, opponents: 7, aiLevel: 95, aiAggression: 0, startingPosition: 7 },
  trackday:   { penalties: true, opponents: 7, aiLevel: 95, aiAggression: 0, speedLimit: 0 },
  weekend:    { penalties: true, jumpStartPenalty: 0, laps: 2, practiceDuration: 15, qualificationDuration: 30, opponents: 7, aiLevel: 95, aiAggression: 0 },
  drift:      { penalties: true, startType: 'PIT', ballast: 0, restrictor: 0 },
  timeattack: { penalties: true, ballast: 0, restrictor: 0 },
  drag:       { penalties: true, matches: 10, aiLevel: 100 }
};

export const MODE_LABELS = {
  practice: 'Practice', hotlap: 'Hotlap', race: 'Race', trackday: 'Track Day',
  weekend: 'Weekend', drift: 'Drift', timeattack: 'Time Attack', drag: 'Drag'
};

const defaultModeSettings = () => JSON.parse(JSON.stringify(MODE_DEFAULTS));

const defaultRaceSettings = () => ({
  tab: 'environment',
  mode: 'hotlap',
  modes: defaultModeSettings(),
  candidates: [],
  timeMinutes: 840,
  weatherMode: 'static',
  weatherController: 'base',
  staticWeatherType: 15,
  dynamicControllerId: null,
  dynamicControllerName: null,
  controllerSettings: {},
  temperature: 26,
  windSpeed: 10,
  windDirection: 0,
  trackPreset: -1
});

const ordinal = (n) => {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  return n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
};

// "Race - 10 Laps, 7 Opponents, 7th Starting Position"
export const modeSummary = (settings) => {
  let s = settings || {};
  if (s && s.settings) s = s.settings;
  s = s || {};
  if (!s.mode) return '';
  const mode = s.mode;
  const ms = (s.modes && s.modes[mode]) || {};
  const parts = [];
  switch (mode) {
    case 'race':
      parts.push(`${ms.laps} Laps`, `${ms.opponents} Opponents`, `${ordinal(ms.startingPosition)} Starting Position`);
      break;
    case 'weekend':
      parts.push(`${ms.practiceDuration} min Practice`, `${ms.qualificationDuration} min Qualifying`, `${ms.laps} Laps`, `${ms.opponents} Opponents`);
      break;
    case 'trackday': parts.push(`${ms.opponents} Opponents`); break;
    case 'drag': parts.push(`${ms.matches} Matches`); break;
    case 'hotlap': if (ms.ghostCar) parts.push('Ghost Car'); break;
  }
  if (ms.ballast) parts.push(`Ballast ${ms.ballast} kg`);
  if (ms.restrictor) parts.push(`Restrictor ${ms.restrictor} %`);
  return parts.length ? `${MODE_LABELS[mode] || mode} - ${parts.join(', ')}` : (MODE_LABELS[mode] || mode);
};

// "2:30 PM, Dynamic Pure, 26°C, Wind at 7KM/H NNE, Optimum Track"
export const settingsSummary = (s, weatherControllers) => {
  if (s && s.settings) s = s.settings;
  if (!s || s.timeMinutes == null) return '';
  let h = Math.floor(s.timeMinutes / 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const time = `${h}:${(s.timeMinutes % 60).toString().padStart(2, '0')} ${ampm}`;

  let weather;
  if (s.weatherMode === 'static') {
    const w = STATIC_WEATHER_TYPES.find((w) => w.value === s.staticWeatherType);
    weather = w ? w.label : 'Clear';
  } else {
    const id = (s.weatherMode || '').substring('dynamic:'.length);
    const c = (weatherControllers || []).find((c) => c.id === id);
    weather = `Dynamic ${c ? c.name : id}`;
  }

  const kmh = Math.round(s.windSpeed);
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const dir = dirs[Math.round(s.windDirection / 22.5) % 16];

  const trackStates = { '-1': 'Auto', '0': 'Dusty', '1': 'Old', '2': 'Slow', '3': 'Green', '4': 'Fast', '5': 'Optimum' };
  const trackState = trackStates[s.trackPreset] || 'Auto';

  return `${time}, ${weather}, ${s.temperature}°C, Wind at ${kmh}KM/H ${dir}, ${trackState} Track`;
};

const restoreRaceSettings = () => {
  const s = defaultRaceSettings();
  try {
    const saved = localStorage.getItem('RacerUI:footer-race-settings');
    if (saved) Object.assign(s, JSON.parse(saved));
  } catch { /* ignore */ }
  const modes = defaultModeSettings();
  const savedModes = s.modes || {};
  Object.keys(savedModes).forEach((m) => {
    modes[m] = Object.assign({}, modes[m] || {}, savedModes[m]);
  });
  s.modes = modes;
  return s;
};

export function FooterProvider({ children }) {
  const { connection } = useHub();

  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [raceSettings, setRaceSettings] = useState(restoreRaceSettings);
  const [expanded, setExpanded] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [weatherControllers, setWeatherControllers] = useState(null);
  const [gameLaunchState, setGameLaunchState] = useState('idle');
  const [carPicker, setCarPicker] = useState(null);     // {title, onPick}
  const [trackPicker, setTrackPicker] = useState(null); // {title}
  const [favModalOpen, setFavModalOpen] = useState(false);
  const startTimeoutRef = useRef(null);
  const editingRef = useRef(null);
  editingRef.current = editingFavorite;
  const settingsRef = useRef(raceSettings);
  settingsRef.current = raceSettings;

  const footerHeight = expanded ? window.innerHeight / 16 : 8;

  // Restore saved selections on mount
  useEffect(() => {
    try {
      const savedCar = localStorage.getItem('RacerUI:footer-selected-car');
      if (savedCar) {
        const d = JSON.parse(savedCar);
        setSelectedCar(d.car); setSelectedSkin(d.skin || null);
      }
    } catch { /* ignore */ }
    try {
      const savedTrack = localStorage.getItem('RacerUI:footer-selected-track');
      if (savedTrack) {
        const d = JSON.parse(savedTrack);
        if (d.track) { setSelectedTrack(d.track); setSelectedLayout(d.layout || null); }
        else { setSelectedTrack(d); setSelectedLayout(null); }
      }
    } catch { /* ignore */ }
  }, []);

  const persist = (s) => {
    if (!editingRef.current) {
      localStorage.setItem('RacerUI:footer-race-settings', JSON.stringify(s));
    }
  };

  const updateRaceSettings = useCallback((patch) => {
    setRaceSettings((prev) => {
      const next = typeof patch === 'function' ? patch({ ...prev }) : { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  // Per-mode settings object with defaults applied
  const modeSettings = useCallback((mode) => {
    const s = settingsRef.current;
    return { ...(MODE_DEFAULTS[mode] || {}), ...((s.modes && s.modes[mode]) || {}) };
  }, []);

  const updateModeSetting = useCallback((mode, key, value) => {
    setRaceSettings((prev) => {
      const modes = { ...(prev.modes || defaultModeSettings()) };
      modes[mode] = { ...(MODE_DEFAULTS[mode] || {}), ...(modes[mode] || {}), [key]: value };
      const next = { ...prev, modes };
      persist(next);
      return next;
    });
  }, []);

  const selectCar = useCallback((car, skin) => {
    setSelectedCar(car);
    setSelectedSkin(skin || null);
    if (!editingRef.current) {
      localStorage.setItem('RacerUI:footer-selected-car', JSON.stringify({ car, skin }));
    }
  }, []);

  const selectTrack = useCallback((track, layout) => {
    setSelectedTrack(track);
    setSelectedLayout(layout || null);
    if (!editingRef.current) {
      localStorage.setItem('RacerUI:footer-selected-track', JSON.stringify({ track, layout: layout || null }));
    }
  }, []);

  const getEffectiveTrack = useCallback(() => {
    const layout = selectedLayout;
    return (layout && selectedTrack && layout.path === selectedTrack.path) ? layout : selectedTrack;
  }, [selectedTrack, selectedLayout]);

  const toggleDetails = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (!next) {
        setCollapsing(true);
        setTimeout(() => setCollapsing(false), 450);
      }
      document.body.classList.toggle('footer-expanded', next);
      return next;
    });
  }, []);

  const discardFavoriteEdit = useCallback(() => {
    const edit = editingRef.current;
    if (!edit) return;
    setRaceSettings(edit.stash);
    setSelectedCar(edit.car);
    setSelectedSkin(edit.skin);
    setSelectedTrack(edit.track);
    setSelectedLayout(edit.layout);
    setEditingFavorite(null);
  }, []);

  const collapseDetails = useCallback(() => {
    discardFavoriteEdit();
    if (expanded) toggleDetails();
  }, [expanded, toggleDetails, discardFavoriteEdit]);

  // Favorite edit -------------------------------------------------------
  const openFavoriteEdit = useCallback((fav) => {
    setEditingFavorite({
      fav,
      stash: JSON.parse(JSON.stringify(settingsRef.current)),
      car: selectedCar, skin: selectedSkin, track: selectedTrack, layout: selectedLayout
    });
    setSelectedCar({ id: fav.carId, name: fav.carName, path: fav.carPath });
    setSelectedSkin(fav.skinPath || null);
    if (fav.trackParentId) {
      setSelectedTrack({ id: fav.trackParentId, name: fav.parentTrackName, path: fav.trackPath });
      setSelectedLayout({
        id: fav.trackId, name: fav.trackName, layoutName: fav.layoutName || null,
        path: fav.trackPath, subPath: fav.trackSubPath
      });
    } else {
      setSelectedTrack({ id: fav.trackId, name: fav.trackName, path: fav.trackPath, subPath: fav.trackSubPath });
      setSelectedLayout(null);
    }
    let cfg = {};
    try { cfg = JSON.parse(fav.configJson) || {}; } catch { /* empty */ }
    const saved = { ...(cfg.settings || cfg) };
    const savedModes = saved.modes;
    delete saved.modes;
    setRaceSettings((prev) => {
      const next = { ...prev, ...saved };
      if (savedModes) {
        const modes = { ...(next.modes || defaultModeSettings()) };
        Object.keys(savedModes).forEach((mode) => {
          modes[mode] = Object.assign({}, MODE_DEFAULTS[mode] || {}, savedModes[mode]);
        });
        next.modes = modes;
      }
      return next;
    });
    if (!expanded) {
      setExpanded(true);
      document.body.classList.add('footer-expanded');
    }
  }, [expanded, selectedCar, selectedSkin, selectedTrack, selectedLayout]);

  const closeFavoriteEdit = useCallback((update) => {
    const edit = editingRef.current;
    if (!edit) return;
    const finish = () => {
      setRaceSettings(edit.stash);
      setSelectedCar(edit.car);
      setSelectedSkin(edit.skin);
      setSelectedTrack(edit.track);
      setSelectedLayout(edit.layout);
      setEditingFavorite(null);
      if (expanded) {
        setExpanded(false);
        document.body.classList.remove('footer-expanded');
      }
    };
    if (update) {
      favorites.update(edit.fav.id, {
        title: edit.title !== undefined ? edit.title : edit.fav.title,
        configJson: JSON.stringify(settingsRef.current)
      }).then(finish).catch(finish);
    } else {
      finish();
    }
  }, [expanded]);

  const setFavoriteTitle = useCallback((title) => {
    setEditingFavorite((prev) => prev ? { ...prev, title } : prev);
  }, []);

  // Weather controllers -------------------------------------------------
  const loadWeatherControllers = useCallback(() => {
    if (weatherControllers != null) return Promise.resolve(weatherControllers);
    return ac.weatherControllers()
      .then((res) => { setWeatherControllers(res.data || []); return res.data || []; })
      .catch(() => { setWeatherControllers([]); return []; });
  }, [weatherControllers]);

  const loadControllerSettings = useCallback((controllerId) => {
    return ac.controllerSettings(controllerId)
      .then((res) => res.data || [])
      .catch(() => []);
  }, []);

  // Candidates ----------------------------------------------------------
  const skinDisplayName = useCallback((car, skinPath) => {
    if (!skinPath) return '';
    const skin = car && car.skins && car.skins.find((sk) => sk.path === skinPath);
    return (skin && skin.name) || skinPath;
  }, []);

  const currentCandidate = useCallback(() => {
    if (!selectedCar) return null;
    const skinPath = selectedSkin || null;
    return {
      id: selectedCar.id, year: selectedCar.year,
      name: selectedCar.name || selectedCar.carName || selectedCar.path,
      carPath: selectedCar.path, skinPath,
      skinName: skinDisplayName(selectedCar, skinPath)
    };
  }, [selectedCar, selectedSkin, skinDisplayName]);

  const addCandidate = useCallback((car, skinPath) => {
    updateRaceSettings((prev) => ({
      ...prev,
      candidates: [...(prev.candidates || []), {
        id: car.id, year: car.year,
        name: car.name || car.carName || car.path,
        carPath: car.path, skinPath: skinPath || null,
        skinName: skinDisplayName(car, skinPath)
      }]
    }));
  }, [updateRaceSettings, skinDisplayName]);

  const removeCandidate = useCallback((index) => {
    updateRaceSettings((prev) => {
      const candidates = [...(prev.candidates || [])];
      candidates.splice(index, 1);
      return { ...prev, candidates };
    });
  }, [updateRaceSettings]);

  // Game launch ---------------------------------------------------------
  const onGameState = useCallback((running) => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    setGameLaunchState(running ? 'running' : 'idle');
  }, []);

  useEffect(() => {
    if (!connection) return;
    connection.on('gameState', onGameState);
    connection.invoke('GetGameState')
      .then((running) => setGameLaunchState((s) => s === 'idle' ? (running ? 'running' : 'idle') : s))
      .catch(() => { });
    return () => connection.off('gameState', onGameState);
  }, [connection, onGameState]);

  const buildLaunchSettings = useCallback(() => {
    const s = settingsRef.current;
    const isStatic = s.weatherMode === 'static';
    const mode = s.mode || 'hotlap';
    const m = (s.modes && s.modes[mode]) || {};
    const launch = {
      WeatherType: isStatic ? s.staticWeatherType : 15,
      WeatherController: isStatic ? s.weatherController : s.dynamicControllerId,
      ControllerSettings: isStatic ? null : s.controllerSettings,
      WindSpeedKmh: s.windSpeed,
      WindDirectionDeg: s.windDirection,
      TrackPreset: s.trackPreset,
      Mode: mode
    };
    if (m.penalties !== undefined) launch.Penalties = m.penalties;
    if (m.jumpStartPenalty !== undefined) launch.JumpStartPenalty = m.jumpStartPenalty;
    if (m.startType !== undefined) launch.StartType = m.startType;
    if (m.ballast !== undefined) launch.BallastKg = m.ballast;
    if (m.restrictor !== undefined) launch.RestrictorPct = m.restrictor;
    if (m.ghostCar !== undefined) launch.GhostCar = m.ghostCar;
    if (m.ghostCarRecord !== undefined) launch.RecordGhostCar = m.ghostCarRecord;
    if (m.ghostCarAdvantage !== undefined) launch.GhostCarAdvantage = m.ghostCarAdvantage;
    if (m.opponents !== undefined) launch.Opponents = m.opponents;
    if (m.aiLevel !== undefined) launch.AiLevel = m.aiLevel;
    if (m.aiAggression !== undefined) launch.AiAggression = m.aiAggression;
    if (m.startingPosition !== undefined) launch.StartingPosition = m.startingPosition;
    if (m.laps !== undefined) launch.RaceLaps = m.laps;
    if (m.speedLimit !== undefined) launch.SpeedLimitKmh = m.speedLimit;
    if (m.practiceDuration !== undefined) launch.PracticeDurationMinutes = m.practiceDuration;
    if (m.qualificationDuration !== undefined) launch.QualificationDurationMinutes = m.qualificationDuration;
    if (m.matches !== undefined) launch.MatchesCount = m.matches;
    if (OPPONENT_MODES.includes(mode) && s.candidates && s.candidates.length) {
      launch.Candidates = s.candidates.map((c) => ({ CarPath: c.carPath, SkinPath: c.skinPath }));
    }
    return launch;
  }, []);

  const play = useCallback(() => {
    if (!selectedCar || !selectedTrack || gameLaunchState !== 'idle' || !connection) return;
    const carPath = selectedCar.path;
    const skinPath = selectedSkin || '';
    const effective = getEffectiveTrack();
    const fullTrackPath = effective.subPath ? `${effective.path}/${effective.subPath}` : effective.path;
    const s = settingsRef.current;
    const sunAngle = Math.round(16.0 * (s.timeMinutes * 60 - 46800) / 3600);

    setGameLaunchState('starting');
    startTimeoutRef.current = setTimeout(() => {
      startTimeoutRef.current = null;
      setGameLaunchState((st) => st === 'starting' ? 'idle' : st);
    }, 60000);

    connection.invoke('PlayGame',
      carPath, skinPath, fullTrackPath, 'assetto corsa',
      'Player', 4, 'Hotlap', 'HOTLAP_START', sunAngle,
      s.temperature, s.temperature, '4_mid_clear', 95, 5, 1, 0, 0,
      1.0, 95, 1, 1, 90, 2,
      JSON.stringify(buildLaunchSettings()))
      .then((success) => {
        if (!success) {
          if (startTimeoutRef.current) { clearTimeout(startTimeoutRef.current); startTimeoutRef.current = null; }
          setGameLaunchState('idle');
        }
      })
      .catch(() => {
        if (startTimeoutRef.current) { clearTimeout(startTimeoutRef.current); startTimeoutRef.current = null; }
        setGameLaunchState('idle');
      });
  }, [connection, selectedCar, selectedSkin, selectedTrack, gameLaunchState, getEffectiveTrack, buildLaunchSettings]);

  // Favorites -----------------------------------------------------------
  const saveFavorite = useCallback((title) => {
    const effective = getEffectiveTrack();
    return favorites.save({
      title,
      configJson: JSON.stringify(settingsRef.current),
      carId: selectedCar && selectedCar.id,
      skin: selectedSkin,
      trackId: effective && effective.id
    });
  }, [selectedCar, selectedSkin, getEffectiveTrack]);

  const hasSelection = !!(selectedCar && selectedTrack);
  const playEnabled = gameLaunchState === 'idle' && hasSelection;

  // Picker modals -------------------------------------------------------
  const openCarPicker = useCallback((title, onPick) => setCarPicker({ title: title || 'Select Your Car', onPick }), []);
  const openCandidatePicker = useCallback((title) => {
    setCarPicker({
      title: title || 'Select Your Vehicle Candidate',
      onPick: (car, skinName) => { addCandidate(car, skinName); setCarPicker(null); }
    });
  }, [addCandidate]);
  const closeCarPicker = useCallback(() => setCarPicker(null), []);
  const openTrackPicker = useCallback((title, onPick) => setTrackPicker({ title: title || 'Select Your Track', onPick }), []);
  const closeTrackPicker = useCallback(() => setTrackPicker(null), []);

  return (
    <FooterContext.Provider value={{
      selectedCar, selectedSkin, selectedTrack, selectedLayout,
      selectCar, selectTrack, getEffectiveTrack,
      raceSettings, updateRaceSettings, modeSettings, updateModeSetting,
      expanded, collapsing, toggleDetails, collapseDetails, footerHeight,
      editingFavorite, openFavoriteEdit, closeFavoriteEdit, discardFavoriteEdit, setFavoriteTitle,
      weatherControllers, loadWeatherControllers, loadControllerSettings,
      gameLaunchState, play, playEnabled, hasSelection,
      favModalOpen, setFavModalOpen, saveFavorite,
      carPicker, trackPicker, openCarPicker, openCandidatePicker, closeCarPicker, openTrackPicker, closeTrackPicker,
      currentCandidate, skinDisplayName, addCandidate, removeCandidate,
      staticWeatherTypes: STATIC_WEATHER_TYPES
    }}>
      {children}
    </FooterContext.Provider>
  );
}

export function useFooter() {
  const context = useContext(FooterContext);
  if (!context) throw new Error('useFooter must be used within a FooterProvider');
  return context;
}
