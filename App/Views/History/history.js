ui.views.history = {
    section: 'results'
};

// Load default game view
ui.views.history.load = (e) => {
    if (e && e.id) {
        ui.views.history.section = e.id;
    }
    if (document.querySelector('.history-toolbar') == null) {
        ui.view.loadComponent(`History/history`, (html) => {
            ui.nav.select('history');
            ui.view.inject(html, 'history');
            ui.views.history.showSection(ui.views.history.section);
        });
    } else {
        ui.views.history.showSection(ui.views.history.section);
    }
};

ui.views.history.nav = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    // pushState triggers the router's locationchange -> history.load({id})
    history.pushState(null, '', `/dashboard/history/${section}` + window.location.search);
    return true;
};

ui.views.history.showSection = (section) => {
    ui.views.history.section = section;
    document.querySelectorAll('.history-toolbar li[class^="item-"]').forEach((li) => {
        li.classList.toggle('selected', li.classList.contains(`item-${section}`));
    });

    const content = document.querySelector('.history-content');
    if (!content) return;

    if (section === 'favorites') {
        ui.views.history.loadFavorites(content);
    } else {
        ui.views.history.showMessage(content, `${ui.views.history.sectionTitle(section)} Coming Soon!`);
    }
};

ui.views.history.sectionTitle = (section) =>
    section.split('-').map((w) => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');

//#region "Favorites"

ui.views.history.EMPTY_FAVORITES_MSG = 'No favorites saved yet.<br/>Expand the footer and use "Add To Favorites" to save your current racing configuration.';

// Renders a status/empty-state message into the content area
ui.views.history.showMessage = (content, message) => {
    ui.view.loadComponent('History/message', (html) => {
        content.innerHTML = html.split('{{message}}').join(message);
        ui.utils.scaleUI();
    });
};

// Paging state for the favorites list (50 rows per API call)
ui.views.history.favPage = { start: 0, length: 50, hasMore: true, isLoading: false };
ui.views.history.favorites = [];

ui.views.history.loadFavorites = (content) => {
    ui.views.history.favorites = [];
    ui.views.history.favPage = { start: 0, length: 50, hasMore: true, isLoading: false };
    ui.views.history.showMessage(content, 'Loading favorites...');
    ui.views.history.setupFavoritesScroll(content);
    ui.views.history.loadMoreFavorites(content);
};

// Fetches the next page of favorites and appends it to the list
ui.views.history.loadMoreFavorites = (content) => {
    const page = ui.views.history.favPage;
    if (page.isLoading || !page.hasMore) return;
    page.isLoading = true;

    ui.ajax({
        url: `/api/favorites?start=${page.start}&length=${page.length}`,
        method: 'GET',
        complete: (response) => {
            page.isLoading = false;
            let data = {};
            try {
                data = JSON.parse(response.responseText) || {};
            } catch (e) { /* empty */ }
            const batch = data.favorites || [];

            if (!batch.length) {
                page.hasMore = false;
                if (page.start === 0) {
                    ui.views.history.showMessage(content, ui.views.history.EMPTY_FAVORITES_MSG);
                }
                return;
            }

            const firstIndex = ui.views.history.favorites.length;
            ui.views.history.favorites.push(...batch);
            page.start += batch.length;
            page.hasMore = ui.views.history.favorites.length < (data.total || 0);

            ui.view.loadComponent('History/favorites-list', (viewHtml) => {
                ui.view.loadComponent('History/favorite-item', (itemHtml) => {
                    const items = batch.map((fav, i) =>
                        ui.views.history.favoriteHtml(itemHtml, fav, firstIndex + i)).join('');
                    const list = content.querySelector('.favorites-list');
                    if (list) {
                        list.insertAdjacentHTML('beforeend', items);
                    } else {
                        content.innerHTML = viewHtml.split('{{items}}').join(items);
                    }
                    ui.utils.scaleUI();
                });
            });
        },
        error: () => {
            page.isLoading = false;
            if (page.start === 0) {
                ui.views.history.showMessage(content, 'Failed to load favorites.');
            }
        }
    });
};

// Infinite scroll - fetch the next page when the list is 80% scrolled
ui.views.history.setupFavoritesScroll = (content) => {
    if (ui.views.history.favScrollListener) {
        content.removeEventListener('scroll', ui.views.history.favScrollListener);
    }
    ui.views.history.favScrollListener = () => {
        if (ui.views.history.section !== 'favorites') return;
        if (content.scrollTop + content.clientHeight >= content.scrollHeight * 0.8) {
            ui.views.history.loadMoreFavorites(content);
        }
    };
    content.addEventListener('scroll', ui.views.history.favScrollListener);
};

// Fills the favorite-item template with one favorite's display data
ui.views.history.favoriteHtml = (itemHtml, fav, index) => {
    const esc = ui.utils.strings.escapeHtml;
    const skinPath = fav.skinPath ? `/${fav.skinPath}` : '';
    const trackSub = fav.trackSubPath ? `/${fav.trackSubPath}` : '';
    const layoutName = ui.views.history.layoutName(fav);
    const cfg = ui.views.history.favoriteConfig(fav);
    const s = cfg.settings || cfg;

    return itemHtml
        .split('{{favIndex}}').join(index)
        .split('{{carPreview}}').join(fav.carPath ? `/image/assetto corsa/skin/${fav.carPath}${skinPath}` : '')
        .split('{{trackPreview}}').join(fav.trackPath ? `/image/assetto corsa/track/${fav.trackPath}${trackSub}` : '')
        .split('{{trackOutline}}').join(fav.trackPath ? `/image/assetto corsa/track-outline/${fav.trackPath}${trackSub}` : '')
        .split('{{title}}').join(esc(fav.title))
        .split('{{carName}}').join(esc(fav.carName))
        .split('{{trackName}}').join(esc(fav.trackParentId ? fav.parentTrackName : fav.trackName))
        .split('{{layoutName}}').join(esc(layoutName))
        .hasBlock('has-layout', layoutName)
        .split('{{settingsSummary}}').join(esc(ui.views.history.settingsSummary(cfg)))
        .split('{{modeSummary}}').join(esc(ui.views.footer.modeSummary(cfg)))
        .split('{{timeMinutes}}').join(s.timeMinutes != null ? s.timeMinutes : 840);
};

// Short layout label for a favorite whose saved track is a layout row:
// strips the parent track name from the layout's full name, then falls
// back to the humanized subfolder ("shibaura_pa" -> "Shibaura Pa")
ui.views.history.layoutName = (fav) => {
    if (!fav.trackParentId) return null;

    let name = fav.trackName || '';
    const parent = fav.parentTrackName || '';
    if (parent && name.startsWith(parent)) {
        const stripped = name.substring(parent.length)
            .replace(/^[\s\-—/()]+|[\s)]+$/g, '')
            .trim();
        if (stripped) return stripped;
    }
    if (name && name !== parent) return name;
    if (fav.trackSubPath) {
        return fav.trackSubPath.replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return null;
};

// Replicates the collapsed footer's settings summary for a saved config
ui.views.history.settingsSummary = (s) => {
    if (s && s.settings) s = s.settings; // legacy blobs wrapped settings
    if (!s || s.timeMinutes == null) return '';

    let h = Math.floor(s.timeMinutes / 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const time = `${h}:${(s.timeMinutes % 60).toString().padStart(2, '0')} ${ampm}`;

    let weather;
    if (s.weatherMode === 'static') {
        const w = ui.views.footer.staticWeatherTypes.find((w) => w.value === s.staticWeatherType);
        weather = w ? w.label : 'Clear';
    } else {
        const id = (s.weatherMode || '').substring('dynamic:'.length);
        const c = (ui.views.footer.weatherControllers || []).find((c) => c.id === id);
        weather = `Dynamic ${c ? c.name : id}`;
    }

    const kmh = Math.round(s.windSpeed);
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const dir = dirs[Math.round(s.windDirection / 22.5) % 16];

    const trackStates = { '-1': 'Auto', '0': 'Dusty', '1': 'Old', '2': 'Slow', '3': 'Green', '4': 'Fast', '5': 'Optimum' };
    const trackState = trackStates[s.trackPreset] || 'Auto';

    return `${time}, ${weather}, ${s.temperature}\u00B0C, Wind at ${kmh}KM/H ${dir}, ${trackState} Track`;
};

ui.views.history.favoriteConfig = (fav) => {
    try {
        return JSON.parse(fav.configJson) || {};
    } catch (e) {
        return {};
    }
};

// Loads the favorite's car/track/settings into the footer and launches
ui.views.history.playFavorite = (btn) => {
    const item = btn.closest('.favorite-item');
    const index = parseInt(item.getAttribute('data-fav-index'), 10);
    const fav = (ui.views.history.favorites || [])[index];
    if (!fav || !fav.carPath || !fav.trackPath) return;

    ui.views.footer.selectedCar = { id: fav.carId, name: fav.carName, path: fav.carPath };
    ui.views.footer.selectedSkin = fav.skinPath || null;

    if (fav.trackParentId) {
        // Saved track is a layout row - parent is the track, row is the layout
        ui.views.footer.selectedTrack = { id: fav.trackParentId, name: fav.parentTrackName, path: fav.trackPath };
        ui.views.footer.selectedLayout = {
            id: fav.trackId,
            name: fav.trackName,
            layoutName: ui.views.history.layoutName(fav),
            path: fav.trackPath,
            subPath: fav.trackSubPath
        };
    } else {
        ui.views.footer.selectedTrack = {
            id: fav.trackId,
            name: fav.trackName,
            path: fav.trackPath,
            subPath: fav.trackSubPath
        };
        ui.views.footer.selectedLayout = null;
    }

    const settings = ui.views.history.favoriteConfig(fav);
    const saved = settings.settings || settings;
    // Merge per-mode settings over the defaults rather than replacing the
    // whole modes object - other modes keep their configured values
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
    // Reflect the favorite's mode + field values on the bound controls
    if (ui.views.footer.refreshModePanels) {
        ui.views.footer.refreshModePanels();
    }
    ui.views.footer.updateDisplay();
    ui.views.footer.play();
};

// Opens the favorite for editing in the expanded footer - loads the saved
// config without touching the user's own settings or localStorage
ui.views.history.editFavorite = (btn) => {
    const item = btn.closest('.favorite-item');
    const index = parseInt(item.getAttribute('data-fav-index'), 10);
    const fav = (ui.views.history.favorites || [])[index];
    if (!fav) return;
    ui.views.footer.openFavoriteEdit(fav);
};

// Shows the delete-confirmation modal (injected at body level so
// position:fixed isn't trapped by the scale-ui transform) for the clicked row
ui.views.history.confirmDelete = (btn) => {
    const item = btn.closest('.favorite-item');
    const index = parseInt(item.getAttribute('data-fav-index'), 10);
    const fav = (ui.views.history.favorites || [])[index];
    if (!fav) return;

    ui.view.loadComponent('History/delete-modal', (html) => {
        const filled = html.split('{{title}}').join(ui.utils.strings.escapeHtml(fav.title));
        const existing = document.getElementById('fav-delete-modal');
        if (existing) {
            existing.outerHTML = filled;
        } else {
            document.body.insertAdjacentHTML('beforeend', filled);
        }
        if (ui.utils.scaleUI) ui.utils.scaleUI();

        const modal = document.getElementById('fav-delete-modal');
        modal.dataset.favIndex = index;
        modal.dataset.favId = fav.id;
        modal.style.display = 'flex';
    });
};

ui.views.history.closeDeleteModal = () => {
    const modal = document.getElementById('fav-delete-modal');
    if (modal) modal.style.display = 'none';
};

// Deletes the favorite server-side, then drops the row + reindexes the list
ui.views.history.deleteFavorite = () => {
    const modal = document.getElementById('fav-delete-modal');
    if (!modal || modal.dataset.favId == null) return;

    const id = parseInt(modal.dataset.favId, 10);
    const index = parseInt(modal.dataset.favIndex, 10);

    ui.ajax({
        url: `/api/favorites/${id}`,
        method: 'DELETE',
        complete: () => {
            ui.views.history.closeDeleteModal();
            (ui.views.history.favorites || []).splice(index, 1);

            const item = document.querySelector(`.favorite-item[data-fav-index="${index}"]`);
            if (item) item.remove();
            document.querySelectorAll('.favorite-item').forEach((el, i) => {
                el.setAttribute('data-fav-index', i);
            });

            if (!ui.views.history.favorites.length) {
                const content = document.querySelector('.history-content');
                if (content) {
                    ui.views.history.showMessage(content, ui.views.history.EMPTY_FAVORITES_MSG);
                }
            }
        }
    });
};

//#endregion
