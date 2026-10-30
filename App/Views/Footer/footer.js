//#region "Footer"

ui.views.footer = {
    selectedCar: null,
    selectedTrack: null,
    selectedLayout: null,
    selectedSkin: null,
    footerHeight: 8, // Footer height in em
    expanded: false
};

// Static weather types from AC's WeatherType enum (as written to
// race.ini [LIGHTING] __CM_WEATHER_TYPE by Content Manager / CSP)
ui.views.footer.staticWeatherTypes = [
    { value: 15, label: 'Clear' },
    { value: 16, label: 'Few Clouds' },
    { value: 17, label: 'Scattered Clouds' },
    { value: 18, label: 'Broken Clouds' },
    { value: 19, label: 'Overcast Clouds' },
    { value: 20, label: 'Fog' },
    { value: 21, label: 'Mist' },
    { value: 22, label: 'Smoke' },
    { value: 23, label: 'Haze' },
    { value: 24, label: 'Sand' },
    { value: 25, label: 'Dust' },
    { value: 3,  label: 'Light Drizzle' },
    { value: 4,  label: 'Drizzle' },
    { value: 5,  label: 'Heavy Drizzle' },
    { value: 6,  label: 'Light Rain' },
    { value: 7,  label: 'Rain' },
    { value: 8,  label: 'Heavy Rain' },
    { value: 0,  label: 'Light Thunderstorm' },
    { value: 1,  label: 'Thunderstorm' },
    { value: 2,  label: 'Heavy Thunderstorm' },
    { value: 12, label: 'Light Sleet' },
    { value: 13, label: 'Sleet' },
    { value: 14, label: 'Heavy Sleet' },
    { value: 9,  label: 'Light Snow' },
    { value: 10, label: 'Snow' },
    { value: 11, label: 'Heavy Snow' },
    { value: 26, label: 'Squalls' },
    { value: 27, label: 'Tornado' },
    { value: 28, label: 'Hurricane' },
    { value: 29, label: 'Cold' },
    { value: 30, label: 'Hot' },
    { value: 31, label: 'Windy' },
    { value: 32, label: 'Hail' }
];

// ACTools quick-drive modes reachable through the "More" dropdown (Practice,
// Hotlap and Race get their own toggle buttons)
ui.views.footer.MORE_MODES = ['trackday', 'weekend', 'drift', 'timeattack', 'drag'];

// Modes that race against AI opponents - they get the Candidates section
ui.views.footer.OPPONENT_MODES = ['race', 'trackday', 'weekend', 'drag'];

// Per-mode field defaults, mirroring the SaveableData of ACTools' QuickDrive_*
// pages (penalties on, AI level 95, aggression 0, 7 opponents, grid spot 7)
ui.views.footer.MODE_DEFAULTS = {
    practice:   { penalties: true, startType: 'PIT', ballast: 0, restrictor: 0 },
    hotlap:     { penalties: true, ghostCar: true, ghostCarRecord: true, ghostCarAdvantage: 0, ballast: 0, restrictor: 0 },
    race:       { penalties: true, jumpStartPenalty: 0, laps: 2, opponents: 7, aiLevel: 95, aiAggression: 0, startingPosition: 7 },
    trackday:   { penalties: true, opponents: 7, aiLevel: 95, aiAggression: 0, speedLimit: 0 },
    weekend:    { penalties: true, jumpStartPenalty: 0, laps: 2, practiceDuration: 15, qualificationDuration: 30, opponents: 7, aiLevel: 95, aiAggression: 0 },
    drift:      { penalties: true, startType: 'PIT', ballast: 0, restrictor: 0 },
    timeattack: { penalties: true, ballast: 0, restrictor: 0 },
    drag:       { penalties: true, matches: 10, aiLevel: 100 }
};

ui.views.footer.defaultModeSettings = () =>
    JSON.parse(JSON.stringify(ui.views.footer.MODE_DEFAULTS));

// Launch settings shown in the expanded footer (defaults mirror Content Manager)
ui.views.footer.raceSettings = {
    tab: 'environment',          // settings panel tab: 'environment' | 'race'
    mode: 'hotlap',              // quick-drive mode: practice|hotlap|race|trackday|weekend|drift|timeattack|drag
    modes: ui.views.footer.defaultModeSettings(),
    candidates: [],              // opponent car pool: [{id, name, carPath, skinPath}]
    timeMinutes: 840,            // 14:00 -> SUN_ANGLE 16
    weatherMode: 'static',       // 'static' or 'dynamic:<controllerId>'
    weatherController: 'base',
    staticWeatherType: 15,       // Clear
    dynamicControllerId: null,
    dynamicControllerName: null,
    controllerSettings: {},      // section -> {key: value} for the dynamic controller
    temperature: 26,             // deg C
    windSpeed: 10,               // km/h
    windDirection: 0,            // degrees
    trackPreset: -1              // -1 Auto, 0-5 Dusty..Optimum
};

ui.views.footer.weatherControllers = null; // loaded once from the server

ui.views.footer.load = () => {
    ui.view.loadComponent('Footer/footer', (html) => {
        const footerContainer = document.querySelector('.footer-container');
        if (footerContainer) {
            footerContainer.remove();
        }
        document.body.insertAdjacentHTML('beforeend', html);

        // Restore expanded state after re-inserting the footer
        const newFooterContainer = document.querySelector('.footer-container');
        if (newFooterContainer) {
            newFooterContainer.classList.toggle('expanded', ui.views.footer.expanded);
        }
        document.body.classList.toggle('footer-expanded', ui.views.footer.expanded);

        // Re-apply the scale-ui transform to the re-inserted footer
        if (ui.utils.scaleUI) {
            ui.utils.scaleUI();
        }
        
        // Restore selected car and track from localStorage
        const savedCar = localStorage.getItem('RacerUI:footer-selected-car');
        const savedTrack = localStorage.getItem('RacerUI:footer-selected-track');
        
        if (savedCar) {
            try {
                const carData = JSON.parse(savedCar);
                ui.views.footer.selectedCar = carData.car;
                ui.views.footer.selectedSkin = carData.skin;
            } catch (e) {
                console.error('Error parsing saved car data:', e);
            }
        }
        
        if (savedTrack) {
            try {
                const trackData = JSON.parse(savedTrack);
                if (trackData.track) {
                    ui.views.footer.selectedTrack = trackData.track;
                    ui.views.footer.selectedLayout = trackData.layout || null;
                } else {
                    // Legacy format - the saved value was the track object itself
                    ui.views.footer.selectedTrack = trackData;
                    ui.views.footer.selectedLayout = null;
                }
            } catch (e) {
                console.error('Error parsing saved track data:', e);
            }
        }
        
        ui.views.footer.updateDisplay();
        ui.views.footer.resize();
        ui.views.footer.setupButtonHoverEffects();
        ui.views.footer.initRaceSettings();
        ui.views.footer.syncGameState();
        
        // Add resize listener
        window.addEventListener('resize', ui.views.footer.resize);
    });
};

// Removes the footer on views that don't show it (everything except Cars and
// Tracks). Selection/expanded state is kept so the next load restores it.
ui.views.footer.unload = () => {
    const container = document.querySelector('.footer-container');
    if (container) container.remove();
    const modal = document.getElementById('ftr-fav-modal');
    if (modal) modal.remove();
    document.body.classList.remove('footer-expanded');
    window.removeEventListener('resize', ui.views.footer.resize);
};

ui.views.footer.setupButtonHoverEffects = () => {
    const buttons = document.querySelectorAll('.select-car-btn, .select-track-btn, .play-btn');
    
    buttons.forEach((button) => {
        // Wrap button in a positioned container
        const wrapper = document.createElement('div');
        wrapper.className = 'button-wrapper';
        button.parentNode.insertBefore(wrapper, button);
        wrapper.appendChild(button);
        
        // Create hover clone
        const clone = button.cloneNode(true);
        clone.classList.add('button-hovered-clone');
        wrapper.appendChild(clone);
        
        // Hover handlers
        button.addEventListener('mouseenter', () => {
            if (!button.disabled) {
                clone.style.display = 'flex';
                clone.classList.add('growing');
            }
        });
        
        button.addEventListener('mouseleave', () => {
            clone.classList.remove('growing');
            clone.classList.add('shrinking');
            setTimeout(() => {
                clone.style.display = 'none';
                clone.classList.remove('shrinking');
            }, 300);
        });
    });
};

ui.views.footer.resize = () => {
    const el = document.querySelector('.footer-container');
    if (!el) return;

    if (ui.views.footer.expanded) {
        // Fill the viewport up to the dash nav's rendered bottom edge (the
        // cars/tracks toolbar sits right below it). getBoundingClientRect
        // already includes the scale transform, so this is the true bottom
        // at any resolution.
        const nav = document.querySelector('.dash > nav');
        const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
        const actualScale = el.offsetHeight ? (el.getBoundingClientRect().height / el.offsetHeight) : 1;
        el.style.height = `${(window.innerHeight - navBottom) / (actualScale || 1)}px`;
    } else {
        // The scale-ui transform already scales the footer, so the
        // unscaled height stays at footerHeight em (anchored bottom left)
        el.style.height = `${ui.views.footer.footerHeight}em`;
    }
};

ui.views.footer.toggleDetails = () => {
    ui.views.footer.expanded = !ui.views.footer.expanded;

    const container = document.querySelector('.footer-container');
    if (container) {
        if (ui.views.footer.expanded) {
            container.classList.remove('collapsing');
            container.classList.add('expanded');
        } else {
            // Keep the expanded geometry while the bar shrinks so the grid
            // placements don't teleport; drop it when the transition ends
            container.classList.add('collapsing');
            container.classList.remove('expanded');
            setTimeout(() => {
                container.classList.remove('collapsing');
            }, 450);
        }
    }
    document.body.classList.toggle('footer-expanded', ui.views.footer.expanded);

    // Refresh the collapsed summary so it always reflects the latest settings
    ui.views.footer.updateSettingsSummary();

    // Sync the footer height the cars/tracks views subtract from their content
    const footerHeight = ui.views.footer.expanded
        ? (window.innerHeight / 16)
        : ui.views.footer.footerHeight;
    if (ui.views.cars) {
        ui.views.cars.footerHeight = footerHeight;
        if (ui.views.cars.resize) ui.views.cars.resize();
    }
    if (ui.views.tracks) {
        ui.views.tracks.footerHeight = footerHeight;
        if (ui.views.tracks.resize) ui.views.tracks.resize();
    }

    ui.views.footer.resize();
};

// Collapses the footer when expanded (e.g. on dash nav clicks) - no-op otherwise
ui.views.footer.collapseDetails = () => {
    if (ui.views.footer.expanded) {
        ui.views.footer.toggleDetails();
    }
};

ui.views.footer.selectCar = (car, skin) => {
    ui.views.footer.selectedCar = car;
    ui.views.footer.selectedSkin = skin || null;
    
    // Save to localStorage - editing a favorite never touches the user's data
    if (!ui.views.footer.editingFavorite) {
        localStorage.setItem('RacerUI:footer-selected-car', JSON.stringify({
            car: car,
            skin: skin
        }));
    }
    
    ui.views.footer.updateDisplay();
};

ui.views.footer.selectTrack = (track, layout) => {
    ui.views.footer.selectedTrack = track;
    ui.views.footer.selectedLayout = layout || null;
    
    // Save to localStorage - editing a favorite never touches the user's data
    if (!ui.views.footer.editingFavorite) {
        localStorage.setItem('RacerUI:footer-selected-track', JSON.stringify({
            track: track,
            layout: layout || null
        }));
    }
    
    ui.views.footer.updateDisplay();
};

// Measure a preview image's aspect ratio so the expanded preview can show
// the full background-image instead of cropping it with cover
ui.views.footer.setPreviewRatio = (url, varName) => {
    const container = document.querySelector('.footer-container');
    if (!container) return;

    if (!url) {
        container.style.removeProperty(varName);
        return;
    }

    const img = new Image();
    img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
            container.style.setProperty(varName, img.naturalWidth / img.naturalHeight);
        }
    };
    img.src = url;
};

//#region "Race Settings"

// "under water" -> "Under Water"
ui.views.footer.toTitleCase = (text) =>
    text.split(' ').map((w) => w ? w[0].toUpperCase() + w.substring(1) : w).join(' ');

ui.views.footer.formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Parses "14", "14:30", "1430", "2:30 pm" etc. into minutes since midnight
ui.views.footer.parseTime = (text) => {
    if (!text) return null;
    const match = text.trim().toLowerCase().match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = match[2] ? parseInt(match[2], 10) : 0;
    if (match[3] === 'pm' && h < 12) h += 12;
    if (match[3] === 'am' && h === 12) h = 0;
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
};

ui.views.footer.saveRaceSettings = () => {
    // Editing a favorite updates the in-memory config only - the user's own
    // settings must stay untouched in localStorage
    if (!ui.views.footer.editingFavorite) {
        localStorage.setItem('RacerUI:footer-race-settings', JSON.stringify(ui.views.footer.raceSettings));
    }
    ui.views.footer.updateSettingsSummary();
};

// Collapsed-footer summary line, e.g. "2:30 PM, Dynamic Pure, Wind at 7MPH NNE"
ui.views.footer.updateSettingsSummary = () => {
    const el = document.querySelector('.footer-container .session-settings');
    if (!el) return;
    const s = ui.views.footer.raceSettings;

    // Time in 12h format
    let h = Math.floor(s.timeMinutes / 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const time = `${h}:${(s.timeMinutes % 60).toString().padStart(2, '0')} ${ampm}`;

    // Weather - static shows the weather type, dynamic shows the controller name
    let weather;
    if (s.weatherMode === 'static') {
        const w = ui.views.footer.staticWeatherTypes.find((w) => w.value === s.staticWeatherType);
        weather = w ? w.label : 'Clear';
    } else {
        const id = s.weatherMode.substring('dynamic:'.length);
        const c = (ui.views.footer.weatherControllers || []).find((c) => c.id === id);
        weather = `Dynamic ${c ? c.name : id}`;
    }

    // Wind - speed in km/h + 16-point compass direction
    const kmh = Math.round(s.windSpeed);
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const dir = dirs[Math.round(s.windDirection / 22.5) % 16];

    el.textContent = `${time}, ${weather}, ${s.temperature}\u00B0C, Wind at ${kmh}KM/H ${dir}`;

    const modeEl = document.querySelector('.footer-container .session-mode');
    if (modeEl) {
        modeEl.textContent = ui.views.footer.modeSummary();
    }
};

const MODE_LABELS = {
    practice: 'Practice', hotlap: 'Hotlap', race: 'Race', trackday: 'Track Day',
    weekend: 'Weekend', drift: 'Drift', timeattack: 'Time Attack', drag: 'Drag'
};

const ordinal = (n) => {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    return n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
};

// Collapsed-footer third row - the selected race mode + its key settings
// (e.g. "Race - 10 Laps, 7 Opponents, 7th Starting Position")
ui.views.footer.modeSummary = (settings) => {
    let s = settings || ui.views.footer.raceSettings;
    if (s && s.settings) s = s.settings; // legacy blobs wrapped settings
    s = s || {};
    if (!s.mode) return ''; // legacy saves predate race modes
    const mode = s.mode;
    const ms = (s.modes && s.modes[mode]) || {};
    const parts = [];
    switch (mode) {
        case 'race':
            parts.push(`${ms.laps} Laps`, `${ms.opponents} Opponents`,
                `${ordinal(ms.startingPosition)} Starting Position`);
            break;
        case 'weekend':
            parts.push(`${ms.practiceDuration} min Practice`, `${ms.qualificationDuration} min Qualifying`,
                `${ms.laps} Laps`, `${ms.opponents} Opponents`);
            break;
        case 'trackday':
            parts.push(`${ms.opponents} Opponents`);
            break;
        case 'drag':
            parts.push(`${ms.matches} Matches`);
            break;
        case 'hotlap':
            if (ms.ghostCar) parts.push('Ghost Car');
            break;
    }
    if (ms.ballast) parts.push(`Ballast ${ms.ballast} kg`);
    if (ms.restrictor) parts.push(`Restrictor ${ms.restrictor} %`);
    return parts.length ? `${MODE_LABELS[mode] || mode} - ${parts.join(', ')}` : (MODE_LABELS[mode] || mode);
};

// Favorite-edit mode - while set, the footer edits a saved favorite's config
// instead of the user's own settings; nothing is written to localStorage
ui.views.footer.editingFavorite = null;

// Re-applies the current raceSettings to every bound control - used when the
// settings change outside the form (e.g. loading a favorite for editing)
ui.views.footer.refreshSettingsControls = () => {
    const s = ui.views.footer.raceSettings;
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const qs = (sel) => container.querySelector(sel);

    const setVal = (el, v) => { if (el) el.value = v; };
    setVal(qs('#ftr-static-weather'), s.staticWeatherType);
    setVal(qs('#ftr-weather-mode'), s.weatherMode);
    setVal(qs('#ftr-weather-controller'), s.weatherController);
    setVal(qs('#ftr-track-state'), s.trackPreset);
    setVal(qs('#ftr-time-slider'), s.timeMinutes);
    setVal(qs('#ftr-time-input'), ui.views.footer.formatTime(s.timeMinutes));
    setVal(qs('#ftr-temp-slider'), s.temperature);
    setVal(qs('#ftr-wind-slider'), s.windSpeed);
    const tempValue = qs('#ftr-temp-value');
    if (tempValue) tempValue.textContent = `${s.temperature}°C`;
    const windValue = qs('#ftr-wind-value');
    if (windValue) windValue.textContent = `${s.windSpeed} km/h`;
    ui.views.footer.setWindDirection(s.windDirection);
    ui.views.footer.applyWeatherMode();
    ui.views.footer.selectSettingsTab(s.tab || 'environment', false);
    ui.views.footer.refreshModePanels();
    ui.views.footer.updateSettingsSummary();
};

// Opens the favorite's settings in the expanded footer for editing. The
// user's own settings are stashed and nothing is persisted to localStorage
// while the edit is open
ui.views.footer.openFavoriteEdit = (fav) => {
    ui.views.footer.editingFavorite = {
        fav: fav,
        stash: JSON.parse(JSON.stringify(ui.views.footer.raceSettings))
    };

    const mount = () => {
        const edit = ui.views.footer.editingFavorite;
        if (!edit) return;

        // Load the favorite's car/track/config into the live state
        ui.views.footer.selectedCar = { id: fav.carId, name: fav.carName, path: fav.carPath };
        ui.views.footer.selectedSkin = fav.skinPath || null;
        if (fav.trackParentId) {
            ui.views.footer.selectedTrack = { id: fav.trackParentId, name: fav.parentTrackName, path: fav.trackPath };
            ui.views.footer.selectedLayout = {
                id: fav.trackId, name: fav.trackName,
                layoutName: fav.layoutName || null,
                path: fav.trackPath, subPath: fav.trackSubPath
            };
        } else {
            ui.views.footer.selectedTrack = {
                id: fav.trackId, name: fav.trackName,
                path: fav.trackPath, subPath: fav.trackSubPath
            };
            ui.views.footer.selectedLayout = null;
        }

        let cfg = {};
        try { cfg = JSON.parse(fav.configJson) || {}; } catch (e) { }
        const saved = cfg.settings || cfg;
        const savedModes = saved.modes;
        delete saved.modes;
        Object.assign(ui.views.footer.raceSettings, saved);
        if (savedModes) {
            if (!ui.views.footer.raceSettings.modes) {
                ui.views.footer.raceSettings.modes = ui.views.footer.defaultModeSettings();
            }
            Object.keys(savedModes).forEach((mode) => {
                ui.views.footer.raceSettings.modes[mode] = Object.assign(
                    {}, ui.views.footer.MODE_DEFAULTS[mode] || {}, savedModes[mode]);
            });
        }

        const footerEl = document.querySelector('.footer-container');
        footerEl.classList.add('editing-fav');
        if (!ui.views.footer.expanded) ui.views.footer.toggleDetails();
        // unload() strips these while the expanded flag stays set - force them
        // so the page content hides regardless of which path got us here
        footerEl.classList.add('expanded');
        document.body.classList.add('footer-expanded');
        ui.views.footer.refreshSettingsControls();
        ui.views.footer.updateDisplay();
    };

    // The footer is unloaded on the history view - mount it first, then open
    if (document.querySelector('.footer-container')) {
        mount();
    } else {
        ui.views.footer.load();
        const poll = setInterval(() => {
            if (document.querySelector('.footer-container')) {
                clearInterval(poll);
                mount();
            }
        }, 50);
    }
};

// Closes favorite-edit mode. update=true PUTs the edited configJson first.
// Either way the user's stashed settings are restored and the footer unloads
ui.views.footer.closeFavoriteEdit = (update) => {
    const edit = ui.views.footer.editingFavorite;
    if (!edit) return;

    const finish = () => {
        ui.views.footer.raceSettings = edit.stash;
        ui.views.footer.editingFavorite = null;
        const container = document.querySelector('.footer-container');
        if (container) {
            container.classList.remove('editing-fav');
            // Fades out alongside the collapse animation (see footer.less)
            container.classList.add('fav-edit-closing');
        }
        // Collapse the footer (body class comes off immediately so the
        // favorites list fades in alongside the collapse animation), then
        // unload once the transition has played out
        if (ui.views.footer.expanded) {
            ui.views.footer.toggleDetails();
        }
        setTimeout(() => ui.views.footer.unload(), 450);
        // Refresh the favorites list with the updated config - the list
        // renders inside .history-content, not .content
        const content = document.querySelector('.history-content');
        if (ui.views.history && content) {
            ui.views.history.loadFavorites(content);
        }
    };

    if (update) {
        ui.ajax({
            url: `/api/favorites/${edit.fav.id}`,
            method: 'PUT',
            data: { configJson: JSON.stringify(ui.views.footer.raceSettings) },
            complete: finish,
            error: finish
        });
    } else {
        finish();
    }
};

ui.views.footer.restoreRaceSettings = () => {
    try {
        const saved = localStorage.getItem('RacerUI:footer-race-settings');
        if (saved) {
            Object.assign(ui.views.footer.raceSettings, JSON.parse(saved));
        }
    } catch (e) {
        console.error('Error restoring race settings:', e);
    }
    // Merge per-mode settings over the defaults so modes or fields added
    // after a save still get their defaults
    const modes = ui.views.footer.defaultModeSettings();
    const savedModes = ui.views.footer.raceSettings.modes || {};
    Object.keys(savedModes).forEach((m) => {
        modes[m] = Object.assign({}, modes[m] || {}, savedModes[m]);
    });
    ui.views.footer.raceSettings.modes = modes;
};

ui.views.footer.initRaceSettings = () => {
    ui.views.footer.restoreRaceSettings();

    const settings = ui.views.footer.raceSettings;
    const container = document.querySelector('.footer-container');
    if (!container) return;

    // Static weather types
    const staticSelect = container.querySelector('#ftr-static-weather');
    staticSelect.innerHTML = '';
    ui.views.footer.staticWeatherTypes.forEach((w) => {
        staticSelect.appendChild(new Option(w.label, w.value));
    });
    staticSelect.value = settings.staticWeatherType;
    staticSelect.onchange = () => {
        settings.staticWeatherType = parseInt(staticSelect.value, 10);
        ui.views.footer.saveRaceSettings();
    };

    // Weather system mode (Static / Dynamic: <controller>) + controller dropdown
    const modeSelect = container.querySelector('#ftr-weather-mode');
    const controllerSelect = container.querySelector('#ftr-weather-controller');
    modeSelect.onchange = () => {
        settings.weatherMode = modeSelect.value;
        ui.views.footer.applyWeatherMode();
        ui.views.footer.saveRaceSettings();
    };
    controllerSelect.onchange = () => {
        settings.weatherController = controllerSelect.value;
        ui.views.footer.saveRaceSettings();
    };
    ui.views.footer.loadWeatherControllers();

    // Track state preset
    const trackState = container.querySelector('#ftr-track-state');
    trackState.value = settings.trackPreset;
    trackState.onchange = () => {
        settings.trackPreset = parseInt(trackState.value, 10);
        ui.views.footer.saveRaceSettings();
    };

    // Time of day - slider and manual input stay in sync
    const timeSlider = container.querySelector('#ftr-time-slider');
    const timeInput = container.querySelector('#ftr-time-input');
    const setTime = (minutes) => {
        settings.timeMinutes = Math.max(0, Math.min(1439, minutes));
        timeSlider.value = settings.timeMinutes;
        timeInput.value = ui.views.footer.formatTime(settings.timeMinutes);
    };
    timeSlider.oninput = () => {
        setTime(parseInt(timeSlider.value, 10));
        ui.views.footer.saveRaceSettings();
    };
    timeInput.onchange = () => {
        const parsed = ui.views.footer.parseTime(timeInput.value);
        setTime(parsed !== null ? parsed : settings.timeMinutes);
        ui.views.footer.saveRaceSettings();
    };
    setTime(settings.timeMinutes);

    // Temperature slider
    const tempSlider = container.querySelector('#ftr-temp-slider');
    const tempValue = container.querySelector('#ftr-temp-value');
    const setTemp = (v) => {
        settings.temperature = v;
        tempSlider.value = v;
        tempValue.textContent = `${v}\u00B0C`;
    };
    tempSlider.oninput = () => {
        setTemp(parseInt(tempSlider.value, 10));
        ui.views.footer.saveRaceSettings();
    };
    setTemp(settings.temperature);

    // Wind slider + compass direction
    const windSlider = container.querySelector('#ftr-wind-slider');
    const windValue = container.querySelector('#ftr-wind-value');
    const setWind = (v) => {
        settings.windSpeed = v;
        windSlider.value = v;
        windValue.textContent = `${v} km/h`;
    };
    windSlider.oninput = () => {
        setWind(parseInt(windSlider.value, 10));
        ui.views.footer.saveRaceSettings();
    };
    setWind(settings.windSpeed);

    ui.views.footer.setupWindCompass();
    ui.views.footer.setWindDirection(settings.windDirection);
    ui.views.footer.applyWeatherMode();
    ui.views.footer.initRaceTabs();
    ui.views.footer.updateSettingsSummary();
};

//#region "Race tab"

// The settings object for one quick-drive mode, with defaults applied.
// Fills missing defaults IN PLACE - event handlers capture this object, so
// its identity must stay stable (never swap it for a new merged object)
ui.views.footer.modeSettings = (mode) => {
    const s = ui.views.footer.raceSettings;
    if (!s.modes) s.modes = ui.views.footer.defaultModeSettings();
    const ms = s.modes[mode] || (s.modes[mode] = {});
    const defaults = ui.views.footer.MODE_DEFAULTS[mode] || {};
    Object.keys(defaults).forEach((k) => {
        if (ms[k] === undefined) ms[k] = defaults[k];
    });
    return ms;
};

ui.views.footer.initRaceTabs = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const settings = ui.views.footer.raceSettings;

    container.querySelectorAll('.settings-tab').forEach((tab) => {
        tab.addEventListener('click', () => ui.views.footer.selectSettingsTab(tab.dataset.tab));
    });
    ui.views.footer.selectSettingsTab(settings.tab || 'environment', false);

    container.querySelectorAll('.mode-toggle[data-mode]').forEach((btn) => {
        btn.addEventListener('click', () => ui.views.footer.selectRaceMode(btn.dataset.mode));
    });

    const moreDdl = container.querySelector('#ftr-mode-more');
    if (moreDdl) {
        moreDdl.addEventListener('change', () => {
            if (moreDdl.value) ui.views.footer.selectRaceMode(moreDdl.value);
        });
        if (ui.views.footer.MORE_MODES.includes(settings.mode)) {
            moreDdl.value = settings.mode;
        }
    }

    container.querySelectorAll('.mode-panel').forEach((panel) => {
        ui.views.footer.bindModePanel(panel);
    });

    const addBtn = container.querySelector('#ftr-candidates-add');
    if (addBtn) addBtn.addEventListener('click', () => ui.views.footer.openCandidatePicker());
    const pickerClose = document.getElementById('ftr-car-picker-close');
    if (pickerClose) pickerClose.addEventListener('click', () => ui.views.footer.closeCandidatePicker());
    const pickerBackdrop = document.getElementById('ftr-car-picker');
    if (pickerBackdrop) {
        pickerBackdrop.addEventListener('click', (e) => {
            if (e.target === pickerBackdrop) ui.views.footer.closeCandidatePicker();
        });
    }

    // Favorite-edit buttons (visible only while .editing-fav is set)
    const favEditCancel = document.getElementById('ftr-fav-edit-cancel');
    const favEditUpdate = document.getElementById('ftr-fav-edit-update');
    if (favEditCancel) favEditCancel.onclick = () => ui.views.footer.closeFavoriteEdit(false);
    if (favEditUpdate) favEditUpdate.onclick = () => ui.views.footer.closeFavoriteEdit(true);

    ui.views.footer.syncOpponentLimits();
    ui.views.footer.syncModeToggles();
    ui.views.footer.showModePanel();
    ui.views.footer.renderCandidates();
};

ui.views.footer.selectSettingsTab = (tab, save = true) => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    container.querySelectorAll('.settings-tab').forEach((t) =>
        t.classList.toggle('selected', t.dataset.tab === tab));
    container.querySelectorAll('.settings-panels .tab-panel').forEach((p) => {
        p.style.display = p.dataset.panel === tab ? '' : 'none';
    });
    ui.views.footer.raceSettings.tab = tab;
    if (save) ui.views.footer.saveRaceSettings();
};

ui.views.footer.selectRaceMode = (mode) => {
    if (!mode) return;
    const settings = ui.views.footer.raceSettings;
    settings.mode = mode;

    const moreDdl = document.querySelector('#ftr-mode-more');
    if (moreDdl) {
        if (ui.views.footer.MORE_MODES.includes(mode)) {
            // Programmatic mode switch (e.g. a saved favorite) - reflect it
            if (moreDdl.value !== mode) moreDdl.value = mode;
        } else if (moreDdl.clear) {
            // A main mode was picked - the More menu drops back to placeholder
            moreDdl.clear();
        }
    }
    ui.views.footer.syncModeToggles();
    ui.views.footer.showModePanel();
    ui.views.footer.saveRaceSettings();
};

// The active mode's control gets the 3px underline - a .mode-toggle button or,
// for the extended modes, the More dropdown itself
ui.views.footer.syncModeToggles = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const mode = ui.views.footer.raceSettings.mode;
    container.querySelectorAll('.mode-toggle[data-mode]').forEach((b) =>
        b.classList.toggle('selected', b.dataset.mode === mode));
    const moreDdl = container.querySelector('#ftr-mode-more');
    if (moreDdl) {
        moreDdl.classList.toggle('selected', ui.views.footer.MORE_MODES.includes(mode));
    }
};

ui.views.footer.showModePanel = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const mode = ui.views.footer.raceSettings.mode;
    container.querySelectorAll('.mode-panel').forEach((p) => {
        p.style.display = p.dataset.mode === mode ? '' : 'none';
    });
    const candidates = container.querySelector('#ftr-candidates');
    if (candidates) {
        candidates.style.display = ui.views.footer.OPPONENT_MODES.includes(mode) ? '' : 'none';
    }
};

// Wires every [data-setting] control inside a mode panel to that mode's
// settings object: checkboxes, sliders (each with a labelled live value) and
// dropdowns (data-numeric coerces the option value to a number)
ui.views.footer.bindModePanel = (panel) => {
    const mode = panel.dataset.mode;
    const ms = ui.views.footer.modeSettings(mode);
    panel.querySelectorAll('[data-setting]').forEach((el) => {
        const key = el.dataset.setting;
        if (ms[key] === undefined) return;
        if (el.tagName === 'DROPDOWN-LIST') {
            el.value = String(ms[key]);
            el.addEventListener('change', () => {
                ui.views.footer.modeSettings(mode)[key] =
                    el.hasAttribute('data-numeric') ? parseInt(el.value, 10) : el.value;
                ui.views.footer.saveRaceSettings();
            });
        } else if (el.type === 'checkbox') {
            el.checked = !!ms[key];
            el.addEventListener('change', () => {
                ui.views.footer.modeSettings(mode)[key] = el.checked;
                ui.views.footer.saveRaceSettings();
            });
        } else if (el.type === 'range') {
            const cell = el.closest('.slider-cell');
            const out = cell ? cell.querySelector('.slider-value') : null;
            const unit = el.dataset.unit || '';
            el.value = ms[key];
            if (out) out.textContent = ms[key] + unit;
            // 'input' keeps the label + in-memory value live while dragging;
            // 'change' fires on release and is what persists to localStorage
            el.addEventListener('input', () => {
                ui.views.footer.modeSettings(mode)[key] = parseFloat(el.value);
                if (out) out.textContent = el.value + unit;
                if (key === 'opponents') ui.views.footer.syncStartingPositionLimit(panel);
            });
            el.addEventListener('change', () => {
                ui.views.footer.saveRaceSettings();
            });
        }
    });
};

// Re-applies the current mode settings to every bound control - used when the
// settings change outside the form (e.g. playing a favorite)
ui.views.footer.refreshModePanels = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    container.querySelectorAll('.mode-panel').forEach((panel) => {
        const ms = ui.views.footer.modeSettings(panel.dataset.mode);
        panel.querySelectorAll('[data-setting]').forEach((el) => {
            const key = el.dataset.setting;
            if (ms[key] === undefined) return;
            if (el.tagName === 'DROPDOWN-LIST') {
                el.value = String(ms[key]);
            } else if (el.type === 'checkbox') {
                el.checked = !!ms[key];
            } else if (el.type === 'range') {
                el.value = ms[key];
                const cell = el.closest('.slider-cell');
                const out = cell ? cell.querySelector('.slider-value') : null;
                if (out) out.textContent = ms[key] + (el.dataset.unit || '');
            }
        });
    });
    const moreDdl = document.querySelector('#ftr-mode-more');
    if (moreDdl) {
        const mode = ui.views.footer.raceSettings.mode;
        if (ui.views.footer.MORE_MODES.includes(mode)) moreDdl.value = mode;
        else if (moreDdl.clear) moreDdl.clear();
    }
    ui.views.footer.syncModeToggles();
    ui.views.footer.showModePanel();
    ui.views.footer.renderCandidates();
    ui.views.footer.syncOpponentLimits();
};

// Opponent sliders are capped by the selected track's pit boxes (one slot is
// the player) - the same limit ACTools applies to its race grid
ui.views.footer.syncOpponentLimits = () => {
    const t = ui.views.footer.getEffectiveTrack();
    const pits = (t && t.pitBoxes) || 0;
    const max = Math.max(1, (pits || 25) - 1);
    document.querySelectorAll('.mode-panel input[data-setting="opponents"]').forEach((el) => {
        el.max = max;
        const ms = ui.views.footer.modeSettings(el.closest('.mode-panel').dataset.mode);
        if (ms.opponents > max) {
            ms.opponents = max;
            el.value = max;
            const cell = el.closest('.slider-cell');
            const out = cell && cell.querySelector('.slider-value');
            if (out) out.textContent = max + (el.dataset.unit || '');
        }
        ui.views.footer.syncStartingPositionLimit(el.closest('.mode-panel'));
    });
};

// Resolves a skin's display name (ui_skin.json name) from its path, falling
// back to the path itself when the car's skin list isn't available
ui.views.footer.skinDisplayName = (car, skinPath) => {
    if (!skinPath) return '';
    const skin = car && car.skins && car.skins.find((sk) => sk.path === skinPath);
    return (skin && skin.name) || skinPath;
};

// A candidate entry for the currently selected car+skin (used to seed the
// list and as the shape for picker additions)
ui.views.footer.currentCandidate = () => {
    const car = ui.views.footer.selectedCar;
    if (!car) return null;
    const skinPath = ui.views.footer.selectedSkin || null;
    return {
        id: car.id,
        year: car.year,
        name: car.name || car.carName || car.path,
        carPath: car.path,
        skinPath,
        skinName: ui.views.footer.skinDisplayName(car, skinPath)
    };
};

ui.views.footer.renderCandidates = () => {
    const list = document.getElementById('ftr-candidates-list');
    if (!list) return;
    const s = ui.views.footer.raceSettings;
    if (!Array.isArray(s.candidates)) s.candidates = [];

    // With an empty list the player's own car is the first candidate - the
    // same thing ACTools does with its opponent candidates
    if (!s.candidates.length && ui.views.footer.selectedCar) {
        s.candidates.push(ui.views.footer.currentCandidate());
    }

    list.innerHTML = '';
    s.candidates.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'candidate-item';
        const name = document.createElement('span');
        name.className = 'candidate-name';
        name.textContent = ((c.year ? c.year + ' ' : '') + (c.name || c.carPath || ''));
        const rm = document.createElement('button');
        rm.className = 'candidate-remove';
        rm.title = 'Remove Candidate';
        rm.innerHTML = '<svg viewBox="0 0 64 64" class="dark"><use xlink:href="#icon-close" x="0" y="0" width="64" height="64"></use></svg>';
        rm.addEventListener('click', () => {
            s.candidates.splice(i, 1);
            ui.views.footer.renderCandidates();
            ui.views.footer.saveRaceSettings();
        });
        row.append(name, rm);
        list.appendChild(row);
    });
};

// Opens the car picker modal - the full cars view (filters, grid, details)
// mounted inside it; the Select Car button adds the car to the candidate
// list. The title is configurable so the modal can be reused elsewhere
ui.views.footer.openCandidatePicker = (title) => {
    const backdrop = document.getElementById('ftr-car-picker');
    const body = document.getElementById('ftr-car-picker-body');
    if (!backdrop || !body) return;
    const titleEl = document.getElementById('ftr-car-picker-title');
    if (titleEl) titleEl.textContent = title || 'Select Your Vehicle Candidate';
    backdrop.style.display = '';
    ui.views.cars.loadInto(body, {
        onPick: (car, skinName) => {
            const s = ui.views.footer.raceSettings;
            s.candidates.push({
                id: car.id,
                year: car.year,
                name: car.name || car.carName || car.path,
                carPath: car.path,
                skinPath: skinName || null,
                skinName: ui.views.footer.skinDisplayName(car, skinName)
            });
            ui.views.footer.renderCandidates();
            ui.views.footer.saveRaceSettings();
            ui.views.footer.closeCandidatePicker();
        }
    });
};

ui.views.footer.closeCandidatePicker = () => {
    ui.views.cars.unloadFrom();
    const backdrop = document.getElementById('ftr-car-picker');
    if (backdrop) backdrop.style.display = 'none';
    const body = document.getElementById('ftr-car-picker-body');
    if (body) body.innerHTML = '';
};

// The grid can't have more starting positions than cars (opponents + player)
ui.views.footer.syncStartingPositionLimit = (panel) => {
    if (!panel) return;
    const startPos = panel.querySelector('input[data-setting="startingPosition"]');
    if (!startPos) return;
    const ms = ui.views.footer.modeSettings(panel.dataset.mode);
    const limit = (ms.opponents || 0) + 1;
    startPos.max = limit;
    if (ms.startingPosition > limit) {
        ms.startingPosition = limit;
        startPos.value = limit;
        const cell = startPos.closest('.slider-cell');
        const out = cell && cell.querySelector('.slider-value');
        if (out) out.textContent = limit + (startPos.dataset.unit || '');
    }
};

//#endregion

// Enumerates CSP weather controllers (extension/weather-controllers/*) from the
// server, splitting them the way Content Manager does: controllers that follow
// the selected weather go in the "Controller" dropdown, the rest become
// "Dynamic: <name>" entries in the "Type" dropdown
ui.views.footer.loadWeatherControllers = () => {
    const render = (controllers) => {
        const container = document.querySelector('.footer-container');
        if (!container) return;
        const settings = ui.views.footer.raceSettings;
        const modeSelect = container.querySelector('#ftr-weather-mode');
        const controllerSelect = container.querySelector('#ftr-weather-controller');

        modeSelect.innerHTML = '';
        modeSelect.appendChild(new Option('Static', 'static'));
        controllerSelect.innerHTML = '';

        controllers.forEach((c) => {
            if (c.followsWeather) {
                controllerSelect.appendChild(new Option(c.name, c.id));
            } else {
                modeSelect.appendChild(new Option(`Dynamic: ${c.name}`, `dynamic:${c.id}`));
            }
        });

        // Restore selections (fall back to first option when the saved id no longer exists)
        const savedMode = settings.weatherMode;
        if (savedMode !== 'static' && !modeSelect.querySelector(`option[value="${savedMode}"]`)) {
            settings.weatherMode = 'static';
        }
        modeSelect.value = settings.weatherMode;
        if (controllerSelect.querySelector(`option[value="${settings.weatherController}"]`)) {
            controllerSelect.value = settings.weatherController;
        } else {
            settings.weatherController = controllerSelect.value || 'base';
        }
        ui.views.footer.applyWeatherMode();
        ui.views.footer.updateSettingsSummary();
    };

    if (ui.views.footer.weatherControllers) {
        render(ui.views.footer.weatherControllers);
        return;
    }

    ui.ajax({
        url: '/api/ac/weather-controllers',
        method: 'GET',
        complete: (response) => {
            try {
                ui.views.footer.weatherControllers = JSON.parse(response.responseText);
            } catch (e) {
                ui.views.footer.weatherControllers = [];
            }
            render(ui.views.footer.weatherControllers);
        },
        error: () => {
            // No CSP/controllers installed - static weather only
            ui.views.footer.weatherControllers = [];
            render([]);
        }
    });
};

// Shows/hides the Static Weather dropdown vs the dynamic controller settings
// form based on the selected weather mode
ui.views.footer.applyWeatherMode = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const settings = ui.views.footer.raceSettings;
    const isStatic = settings.weatherMode === 'static';

    container.querySelector('#ftr-static-weather-group').style.display = isStatic ? '' : 'none';
    const dynamicArea = container.querySelector('#ftr-dynamic-weather');
    dynamicArea.style.display = isStatic ? 'none' : '';

    if (!isStatic) {
        const controllerId = settings.weatherMode.substring('dynamic:'.length);
        if (settings.dynamicControllerId !== controllerId) {
            settings.dynamicControllerId = controllerId;
            settings.controllerSettings = {};
            ui.views.footer.loadDynamicSettings(controllerId);
        } else if (!dynamicArea.hasChildNodes()) {
            // Settings already loaded for this controller (e.g. restored from
            // localStorage) but the DOM was rebuilt - re-render the fields
            ui.views.footer.loadDynamicSettings(controllerId);
        }
    }
};

// Parses the selected dynamic controller's settings.ini server-side and renders
// a field per setting (the same generic mechanism Content Manager uses)
ui.views.footer.loadDynamicSettings = (controllerId) => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const area = container.querySelector('#ftr-dynamic-weather');
    const settings = ui.views.footer.raceSettings;

    ui.ajax({
        url: `/api/ac/weather-controllers/${encodeURIComponent(controllerId)}/settings`,
        method: 'GET',
        complete: (response) => {
            let fields = [];
            try {
                fields = JSON.parse(response.responseText);
            } catch (e) { /* no settings */ }

            area.innerHTML = '';

            ui.view.loadComponent('Footer/dynamic-field', (fieldHtml) => {

            // Render checkbox fields first so they pack onto shared grid rows;
            // full-width text/select fields come after
            const ordered = [...fields.filter((f) => f.type === 'bool'),
                             ...fields.filter((f) => f.type !== 'bool')];

            ordered.forEach((f) => {
                const section = settings.controllerSettings[f.section] ||
                    (settings.controllerSettings[f.section] = {});
                // Keep a previously saved value; fall back to the ini default
                const current = section[f.key] !== undefined ? section[f.key] : f.value;
                section[f.key] = current;

                const row = document.createElement('label');
                row.className = 'dynamic-field';
                const inputId = `ftr-dyn-${f.key}`;

                row.innerHTML = fieldHtml
                    .split('{{inputId}}').join(inputId)
                    .split('{{inputType}}').join(f.type === 'number' ? 'number' : 'text')
                    .hasBlock('is-bool', f.type === 'bool')
                    .hasBlock('is-select', f.type === 'select')
                    .hasBlock('is-input', f.type !== 'bool' && f.type !== 'select');
                row.querySelector('span').textContent = f.label;

                if (f.type === 'bool') {
                    const checked = current === '1' || String(current).toLowerCase() === 'true';
                    row.classList.add('bool-field');
                    row.querySelector('input').checked = checked;
                    section[f.key] = checked ? '1' : '0';
                    row.querySelector('input').onchange = (e) => {
                        section[f.key] = e.target.checked ? '1' : '0';
                        ui.views.footer.saveRaceSettings();
                    };
                } else if (f.type === 'select') {
                    const ddl = row.querySelector('dropdown-list');
                    f.options.forEach((o) => {
                        const sel = o.value === current;
                        ddl.appendChild(new Option(ui.views.footer.toTitleCase(o.label),
                            o.value, sel, sel));
                    });
                    ddl.addEventListener('change', (e) => {
                        section[f.key] = e.target.value;
                        ui.views.footer.saveRaceSettings();
                    });
                } else {
                    const input = row.querySelector('input');
                    input.value = current;
                    input.onchange = (e) => {
                        section[f.key] = e.target.value;
                        ui.views.footer.saveRaceSettings();
                    };
                }

                // Long descriptions become tooltips on the control itself
                if (f.hint) {
                    const control = row.querySelector('input, select, dropdown-list');
                    if (control) control.title = f.hint;
                }

                area.appendChild(row);
            });

            ui.views.footer.saveRaceSettings();
            });
        },
        error: () => {
            area.innerHTML = '';
        }
    });
};

// Wind compass - click/drag on the dial sets the wind direction
ui.views.footer.setupWindCompass = () => {
    const compass = document.querySelector('#ftr-wind-compass');
    if (!compass) return;

    const updateFromEvent = (e) => {
        const rect = compass.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        let deg = Math.round(Math.atan2(dx, -dy) * 180 / Math.PI);
        ui.views.footer.setWindDirection(((deg % 360) + 360) % 360);
        ui.views.footer.saveRaceSettings();
    };

    compass.addEventListener('pointerdown', (e) => {
        compass.setPointerCapture(e.pointerId);
        updateFromEvent(e);
    });
    compass.addEventListener('pointermove', (e) => {
        if (e.buttons === 1) updateFromEvent(e);
    });
};

ui.views.footer.setWindDirection = (deg) => {
    ui.views.footer.raceSettings.windDirection = deg;
    const needle = document.querySelector('#ftr-wind-needle');
    if (needle) {
        needle.setAttribute('transform', `rotate(${deg} 50 50)`);
    }
    const compass = document.querySelector('#ftr-wind-compass');
    if (compass) {
        compass.title = `Wind direction: ${deg}\u00B0`;
    }
};

// Serializes the race settings into the settingsJson argument for PlayGame.
// A dynamic controller launch uses weather type 15 (Clear) and its own id as
// the controller, like Content Manager; static mode passes the chosen type.
ui.views.footer.buildLaunchSettings = () => {
    const s = ui.views.footer.raceSettings;
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
    // Only the fields the active mode's form exposes are sent
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
    if (ui.views.footer.OPPONENT_MODES.includes(mode) && s.candidates && s.candidates.length) {
        launch.Candidates = s.candidates.map((c) => ({ CarPath: c.carPath, SkinPath: c.skinPath }));
    }
    return launch;
};

//#endregion

// Returns the track the game should launch with - the chosen layout when it
// belongs to the selected track, otherwise the selected track itself
ui.views.footer.getEffectiveTrack = () => {
    const track = ui.views.footer.selectedTrack;
    const layout = ui.views.footer.selectedLayout;
    return (layout && track && layout.path === track.path) ? layout : track;
};

ui.views.footer.updateDisplay = () => {
    const carPreview = document.querySelector('.footer-car-preview');
    const trackPreview = document.querySelector('.footer-track-preview');
    const trackOutline = document.querySelector('.footer-track-outline');
    const sessionInfo = document.querySelector('.footer-session-info .session-text');
    const playBtn = document.querySelector('.footer-play-button .play-btn');

    if (!carPreview || !trackPreview || !sessionInfo || !playBtn) return;

    // Update car preview
    if (ui.views.footer.selectedCar) {
        let carPreviewUrl = `/image/assetto corsa/skin/${ui.views.footer.selectedCar.path}`;
        if (ui.views.footer.selectedSkin) {
            carPreviewUrl += `/${ui.views.footer.selectedSkin}`;
        }
        carPreview.style.backgroundImage = `url('${carPreviewUrl}')`;
        carPreview.classList.add('has-preview');
        ui.views.footer.setPreviewRatio(carPreviewUrl, '--car-preview-ratio');
    } else {
        carPreview.style.backgroundImage = '';
        carPreview.classList.remove('has-preview');
        ui.views.footer.setPreviewRatio(null, '--car-preview-ratio');
    }

    // Update track preview (uses the selected layout's subPath when set)
    if (ui.views.footer.selectedTrack) {
        const effectiveTrack = ui.views.footer.getEffectiveTrack();
        let trackPreviewUrl = `/image/assetto corsa/track/${effectiveTrack.path}`;
        if (effectiveTrack.subPath) {
            trackPreviewUrl += `/${effectiveTrack.subPath}`;
        }
        trackPreview.style.backgroundImage = `url('${trackPreviewUrl}')`;
        trackPreview.classList.add('has-preview');
        ui.views.footer.setPreviewRatio(trackPreviewUrl, '--track-preview-ratio');

        if (trackOutline) {
            let outlineUrl = `/image/assetto corsa/track-outline/${effectiveTrack.path}`;
            if (effectiveTrack.subPath) {
                outlineUrl += `/${effectiveTrack.subPath}`;
            }
            trackOutline.style.display = '';
            trackOutline.src = outlineUrl;
        }
    } else {
        trackPreview.style.backgroundImage = '';
        trackPreview.classList.remove('has-preview');
        ui.views.footer.setPreviewRatio(null, '--track-preview-ratio');

        if (trackOutline) {
            trackOutline.removeAttribute('src');
        }
    }

    // The opponents sliders' maximum follows the selected track's pit boxes
    ui.views.footer.syncOpponentLimits();
    // Re-render candidates - an empty list reseeds from the selected car
    ui.views.footer.renderCandidates();

    // Update session info text - show the layout name next to the track name
    // when a layout different from the selected track is chosen
    const layout = ui.views.footer.selectedLayout;
    const track = ui.views.footer.selectedTrack;
    const layoutName = layout ? (layout.layoutName || layout.name) : null;
    const showLayout = layout && track && layoutName &&
        (layout.id !== track.id || layout.name !== track.name);
    const car = ui.views.footer.selectedCar;
    const esc = ui.utils.strings.escapeHtml;

    ui.view.loadComponent('Footer/session-info', (html) => {
        sessionInfo.innerHTML = html
            .split('{{carName}}').join(esc(car && car.name))
            .split('{{trackName}}').join(esc(track && track.name))
            .split('{{layoutName}}').join(esc(layoutName))
            .hasBlock('has-layout', showLayout)
            .hasBlock('has-car-and-track', car && track)
            .hasBlock('has-car-only', car && !track)
            .hasBlock('has-track-only', !car && track)
            .hasBlock('has-none', !car && !track);
    });
    ui.views.footer.updatePlayButtonEnabled();
};

// Play button state machine: idle -> starting -> running (driven by the
// server's acs.exe process watch, broadcast as 'gameState')
ui.views.footer.gameLaunchState = 'idle';
ui.views.footer._startTimeout = null;

ui.views.footer.setPlayButtonState = (state) => {
    ui.views.footer.gameLaunchState = state;
    const btn = document.querySelector('.footer-play-button .play-btn');
    if (!btn) return;

    btn.classList.toggle('launching', state === 'starting');
    btn.classList.toggle('running', state === 'running');

    const label = btn.querySelector('span');
    if (label) {
        label.textContent = state === 'running' ? 'Session Running'
            : state === 'starting' ? 'Starting...' : 'Start Race';
    }
    ui.views.footer.updatePlayButtonEnabled();
};

ui.views.footer.updatePlayButtonEnabled = () => {
    const btn = document.querySelector('.footer-play-button .play-btn');
    if (!btn) return;
    const hasSelection = !!(ui.views.footer.selectedCar && ui.views.footer.selectedTrack);
    btn.disabled = ui.views.footer.gameLaunchState !== 'idle' || !hasSelection;

    const favBtn = document.querySelector('#ftr-add-favorite');
    if (favBtn) favBtn.disabled = !hasSelection;
};

// Called by the server broadcast whenever acs.exe starts or exits
ui.views.footer.onGameState = (running) => {
    if (ui.views.footer._startTimeout) {
        clearTimeout(ui.views.footer._startTimeout);
        ui.views.footer._startTimeout = null;
    }
    ui.views.footer.setPlayButtonState(running ? 'running' : 'idle');
};

// Registers the gameState listener and syncs the button with the current
// acs.exe state (covers page reloads mid-session and externally launched games)
ui.views.footer.syncGameState = () => {
    if (!dashHub) return;
    dashHub.off('gameState', ui.views.footer.onGameState);
    dashHub.on('gameState', ui.views.footer.onGameState);
    dashHub.invoke('GetGameState')
        .then((running) => {
            if (ui.views.footer.gameLaunchState === 'idle') {
                ui.views.footer.setPlayButtonState(running ? 'running' : 'idle');
            }
        })
        .catch(() => { });
};

//#region "Favorites"

ui.views.footer.openFavoriteModal = () => {
    if (!ui.views.footer.selectedCar || !ui.views.footer.selectedTrack) return;

    const modal = document.getElementById('ftr-fav-modal');
    if (!modal) return;

    // Reset back to the input form
    modal.querySelector('#ftr-fav-form').style.display = '';
    modal.querySelector('#ftr-fav-message').style.display = 'none';
    modal.querySelector('#ftr-fav-name').value = '';
    modal.querySelector('#ftr-fav-cancel').style.display = '';
    modal.querySelector('#ftr-fav-save').style.display = '';
    modal.querySelector('#ftr-fav-ok').style.display = 'none';
    modal.querySelector('.fav-modal-actions').classList.remove('saved');
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('ftr-fav-name').focus(), 0);
};

ui.views.footer.closeFavoriteModal = () => {
    const modal = document.getElementById('ftr-fav-modal');
    if (modal) modal.style.display = 'none';
};

ui.views.footer.saveFavorite = () => {
    const nameInput = document.getElementById('ftr-fav-name');
    const title = nameInput.value.trim();
    if (!title) {
        nameInput.focus();
        return;
    }

    const effectiveTrack = ui.views.footer.getEffectiveTrack();

    ui.ajax({
        url: '/api/favorites',
        method: 'POST',
        data: {
            title: title,
            configJson: JSON.stringify(ui.views.footer.raceSettings),
            carId: ui.views.footer.selectedCar.id,
            skin: ui.views.footer.selectedSkin,
            trackId: effectiveTrack && effectiveTrack.id
        },
        complete: () => {
            const modal = document.getElementById('ftr-fav-modal');
            if (!modal) return;
            modal.querySelector('#ftr-fav-form').style.display = 'none';
            modal.querySelector('#ftr-fav-message').style.display = '';
            modal.querySelector('#ftr-fav-cancel').style.display = 'none';
            modal.querySelector('#ftr-fav-save').style.display = 'none';
            modal.querySelector('#ftr-fav-ok').style.display = '';
            modal.querySelector('.fav-modal-actions').classList.add('saved');
        },
        error: () => {
            nameInput.focus();
        }
    });
};

//#endregion

ui.views.footer.play = () => {
    if (!ui.views.footer.selectedCar || !ui.views.footer.selectedTrack) {
        console.warn('Cannot play: Car or track not selected');
        return;
    }
    if (ui.views.footer.gameLaunchState !== 'idle') return;

    // Prepare parameters for game launch
    const carPath = ui.views.footer.selectedCar.path;
    const skinPath = ui.views.footer.selectedSkin || '';
    const effectiveTrack = ui.views.footer.getEffectiveTrack();
    const trackPath = effectiveTrack.path;
    const trackSubPath = effectiveTrack.subPath || '';
    
    // Combine track path with subPath if it exists
    const fullTrackPath = trackSubPath ? `${trackPath}/${trackSubPath}` : trackPath;
    
    const gameName = 'assetto corsa';
    const settings = ui.views.footer.raceSettings;

    // Time of day -> sun angle (AC's formula: 0 at 13:00, +16 deg per hour)
    const sunAngle = Math.round(16.0 * (settings.timeMinutes * 60 - 46800) / 3600);

    // Race configuration parameters (with default values for now)
    const config = {
        driverName: 'Player',
        sessionType: 4,              // 1=Practice, 2=Qualification, 3=Race, 4=Hotlap
        sessionName: 'Hotlap',
        spawnSet: 'HOTLAP_START',    // PIT, START, HOTLAP_START
        sunAngle: sunAngle,          // -80 to 80, where 0 = 13:00, 16 = 14:00
        ambientTemp: settings.temperature,
        roadTemp: settings.temperature,
        weatherName: '4_mid_clear',  // Weather preset ID
        aiLevel: 95,                 // AI difficulty (0-100)
        raceLaps: 5,                 // Number of laps for race
        cars: 1,                     // Number of cars (1 = solo)
        sessionDuration: 0,          // Session duration in minutes (0 = unlimited)
        sessionLaps: 0,              // Number of laps for session (0 = unlimited)
        timeMultiplier: 1.0,         // Time progression multiplier
        trackGripStart: 95,          // Starting track grip percentage
        trackGripRandomness: 1,      // Track grip randomness
        trackGripLapGain: 1,         // Grip gain per lap
        trackGripTransfer: 90,       // Grip transfer between sessions
        launcherType: 2              // 0=Direct launch, 1=Official launcher, 2=Steam launch (default)
    };

    console.log('Launching game with:', { 
        car: carPath, 
        skin: skinPath, 
        track: fullTrackPath, 
        game: gameName,
        config: config
    });

    ui.views.footer.setPlayButtonState('starting');

    // Safety net: if acs.exe never shows up (failed launch, launcher cancelled),
    // fall back to idle so the button doesn't stay stuck on "Starting..."
    ui.views.footer._startTimeout = setTimeout(() => {
        ui.views.footer._startTimeout = null;
        if (ui.views.footer.gameLaunchState === 'starting') {
            ui.views.footer.setPlayButtonState('idle');
        }
    }, 60000);

    // Call SignalR method to launch the game with full configuration
    dashHub.invoke('PlayGame',
        carPath, 
        skinPath, 
        fullTrackPath, 
        gameName,
        config.driverName,
        config.sessionType,
        config.sessionName,
        config.spawnSet,
        config.sunAngle,
        config.ambientTemp,
        config.roadTemp,
        config.weatherName,
        config.aiLevel,
        config.raceLaps,
        config.cars,
        config.sessionDuration,
        config.sessionLaps,
        config.timeMultiplier,
        config.trackGripStart,
        config.trackGripRandomness,
        config.trackGripLapGain,
        config.trackGripTransfer,
        config.launcherType,
        JSON.stringify(ui.views.footer.buildLaunchSettings()))
        .then((success) => {
            if (success) {
                console.log('Game launched successfully');
            } else {
                console.error('Failed to launch game');
                if (ui.views.footer._startTimeout) {
                    clearTimeout(ui.views.footer._startTimeout);
                    ui.views.footer._startTimeout = null;
                }
                ui.views.footer.setPlayButtonState('idle');
            }
        })
        .catch((error) => {
            console.error('Error launching game:', error);
            if (ui.views.footer._startTimeout) {
                clearTimeout(ui.views.footer._startTimeout);
                ui.views.footer._startTimeout = null;
            }
            ui.views.footer.setPlayButtonState('idle');
        });
};

// Setup play button click handler when footer is loaded
document.addEventListener('click', (e) => {
    if (e.target.closest('.footer-play-button .play-btn')) {
        ui.views.footer.play();
    }
    if (e.target.closest('.footer-container .details-btn') || e.target.closest('.hide-details-btn')) {
        ui.views.footer.toggleDetails();
    }
    if (e.target.closest('#ftr-add-favorite')) {
        ui.views.footer.openFavoriteModal();
    }
    if (e.target.closest('#ftr-fav-save')) {
        ui.views.footer.saveFavorite();
    }
    if (e.target.closest('#ftr-fav-cancel') || e.target.closest('#ftr-fav-ok')) {
        ui.views.footer.closeFavoriteModal();
    }
    if (e.target.classList && e.target.classList.contains('fav-modal-backdrop')) {
        ui.views.footer.closeFavoriteModal();
    }
});

//#endregion
