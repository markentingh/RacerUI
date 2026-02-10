//#region "Footer"

ui.views.footer = {
    selectedCar: null,
    selectedTrack: null,
    selectedSkin: null,
    footerHeight: 8 // Footer height in em
};

ui.views.footer.load = () => {
    ui.view.loadComponent('Footer/footer', (html) => {
        const footerContainer = document.querySelector('.footer-container');
        if (footerContainer) {
            footerContainer.remove();
        }
        document.body.insertAdjacentHTML('beforeend', html);
        
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
                ui.views.footer.selectedTrack = JSON.parse(savedTrack);
            } catch (e) {
                console.error('Error parsing saved track data:', e);
            }
        }
        
        ui.views.footer.updateDisplay();
        ui.views.footer.resize();
        ui.views.footer.setupButtonHoverEffects();
        
        // Add resize listener
        window.addEventListener('resize', ui.views.footer.resize);
    });
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
    
    const rect = el.getBoundingClientRect();
    const scaledFooterHeight = window.innerWidth <= 1920 
        ? ui.views.footer.footerHeight 
        : ((ui.views.footer.footerHeight / 1920) * window.innerWidth);
    
    el.style.height = `${scaledFooterHeight}em`;
};

ui.views.footer.selectCar = (car, skin) => {
    ui.views.footer.selectedCar = car;
    ui.views.footer.selectedSkin = skin || null;
    
    // Save to localStorage
    localStorage.setItem('RacerUI:footer-selected-car', JSON.stringify({
        car: car,
        skin: skin
    }));
    
    ui.views.footer.updateDisplay();
};

ui.views.footer.selectTrack = (track) => {
    ui.views.footer.selectedTrack = track;
    
    // Save to localStorage
    localStorage.setItem('RacerUI:footer-selected-track', JSON.stringify(track));
    
    ui.views.footer.updateDisplay();
};

ui.views.footer.updateDisplay = () => {
    const carPreview = document.querySelector('.footer-car-preview');
    const trackPreview = document.querySelector('.footer-track-preview');
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
    } else {
        carPreview.style.backgroundImage = '';
        carPreview.classList.remove('has-preview');
    }

    // Update track preview
    if (ui.views.footer.selectedTrack) {
        let trackPreviewUrl = `/image/assetto corsa/track/${ui.views.footer.selectedTrack.path}`;
        if (ui.views.footer.selectedTrack.subPath) {
            trackPreviewUrl += `/${ui.views.footer.selectedTrack.subPath}`;
        }
        trackPreview.style.backgroundImage = `url('${trackPreviewUrl}')`;
        trackPreview.classList.add('has-preview');
    } else {
        trackPreview.style.backgroundImage = '';
        trackPreview.classList.remove('has-preview');
    }

    // Update session info text
    if (ui.views.footer.selectedCar && ui.views.footer.selectedTrack) {
        sessionInfo.innerHTML = `<span class="car-name">${ui.views.footer.selectedCar.name}</span> at <span class="track-name">${ui.views.footer.selectedTrack.name}</span>`;
        playBtn.disabled = false;
    } else if (ui.views.footer.selectedCar) {
        sessionInfo.innerHTML = `<span class="car-name">${ui.views.footer.selectedCar.name}</span> <span class="no-selection">- Select a track</span>`;
        playBtn.disabled = true;
    } else if (ui.views.footer.selectedTrack) {
        sessionInfo.innerHTML = `<span class="no-selection">Select a car - </span><span class="track-name">${ui.views.footer.selectedTrack.name}</span>`;
        playBtn.disabled = true;
    } else {
        sessionInfo.innerHTML = '<span class="no-selection">Select a car and track to play</span>';
        playBtn.disabled = true;
    }
};

ui.views.footer.play = () => {
    if (!ui.views.footer.selectedCar || !ui.views.footer.selectedTrack) {
        console.warn('Cannot play: Car or track not selected');
        return;
    }

    // Prepare parameters for game launch
    const carPath = ui.views.footer.selectedCar.path;
    const skinPath = ui.views.footer.selectedSkin || '';
    const trackPath = ui.views.footer.selectedTrack.path;
    const trackSubPath = ui.views.footer.selectedTrack.subPath || '';
    
    // Combine track path with subPath if it exists
    const fullTrackPath = trackSubPath ? `${trackPath}/${trackSubPath}` : trackPath;
    
    const gameName = 'assetto corsa';
    
    // Race configuration parameters (with default values for now)
    const config = {
        driverName: 'Player',
        sessionType: 4,              // 1=Practice, 2=Qualification, 3=Race, 4=Hotlap
        sessionName: 'Hotlap',
        spawnSet: 'HOTLAP_START',    // PIT, START, HOTLAP_START
        sunAngle: 16,                // -80 to 80, where 0 = 13:00, 16 = 14:00
        ambientTemp: 26,             // Ambient temperature in °C
        roadTemp: 32,                // Road temperature in °C
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
        config.launcherType)
        .then((success) => {
            if (success) {
                console.log('Game launched successfully');
            } else {
                console.error('Failed to launch game');
            }
        })
        .catch((error) => {
            console.error('Error launching game:', error);
        });
};

// Setup play button click handler when footer is loaded
document.addEventListener('click', (e) => {
    if (e.target.closest('.footer-play-button .play-btn')) {
        ui.views.footer.play();
    }
});

//#endregion
