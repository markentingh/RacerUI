//#region "Tracks"

ui.views.tracks = {
    filter: {
        countries: ['all'],
        types: [],
        search: '',
        sort: 'name',
        start: 0,
        length: 20,
        view: 'grid'
    },
    results: null,
    allTracks: [],
    footerHeight: 8,
    hovered: null,
    selected: null,
    isLoading: false,
    hasMore: true,
    scrollListener: null,
    resizeListener: null,
    virtualDOM: {
        topHiddenRows: 0,
        bottomHiddenRows: 0
    },
    scope: null,   // element DOM lookups run inside while the view is mounted in the track-picker modal
    picker: null,  // (track, layout) => void - when set, Select Track calls this instead of footer.selectTrack
    pickerState: null // stashed page filter/grid state while the picker modal is open
};

// DOM lookups scoped to the mounted container (picker modal) or the document
// (cars-style scope mechanism)
ui.views.tracks.qs = (sel) => ui.views.tracks.scope
    ? ui.views.tracks.scope.querySelector(sel)
    : document.querySelector(sel);

ui.views.tracks.qsa = (sel) => Array.from(
    (ui.views.tracks.scope ? ui.views.tracks.scope : document).querySelectorAll(sel));

ui.views.tracks.byId = (id) => ui.views.tracks.scope
    ? ui.views.tracks.scope.querySelector('#' + id)
    : document.getElementById(id);

// The picker's filter lives in its own localStorage slot so remembering it
// doesn't bleed into the tracks page's filters (and vice versa)
ui.views.tracks.filterKey = () =>
    ui.views.tracks.scope ? 'RacerUI:tracks-filter-picker' : 'RacerUI:tracks-filter';

ui.views.tracks.defaultFilter = () => ({
    countries: ['all'],
    types: [],
    search: '',
    sort: 'name',
    start: 0,
    length: 20,
    view: 'grid'
});

// Mounts the tracks view inside an arbitrary container (the track-picker
// modal) - same init steps as load() minus the page-level plumbing. The
// page's filter/grid state is stashed and the picker works on its own
// filter (saved under its own localStorage key). options.onPick replaces
// the Select Track button's default action
ui.views.tracks.loadInto = (container, options) => {
    options = options || {};
    ui.views.tracks.scope = container;
    ui.views.tracks.picker = options.onPick || null;
    ui.views.tracks.pickerState = {
        filter: ui.views.tracks.filter,
        results: ui.views.tracks.results,
        allTracks: ui.views.tracks.allTracks,
        selected: ui.views.tracks.selected,
        hasMore: ui.views.tracks.hasMore
    };
    ui.views.tracks.filter = ui.views.tracks.defaultFilter();
    ui.views.tracks.results = null;
    ui.views.tracks.allTracks = [];
    ui.views.tracks.selected = null;
    ui.views.tracks.hasMore = true;
    if (localStorage.getItem(ui.views.tracks.filterKey())) {
        ui.views.tracks.filter = {...ui.views.tracks.filter, ...JSON.parse(localStorage.getItem(ui.views.tracks.filterKey()))};
    }
    ui.view.loadComponent('Tracks/tracks', (html) => {
        container.innerHTML = html;
        ui.views.tracks.setupSearchListener();
        ui.views.tracks.setupSortDropdown();
        ui.views.tracks.updateClearFilterButton();
        ui.views.tracks.getFilteredList();
        ui.views.tracks.resize();
        ui.views.tracks.setupInfiniteScroll();
        ui.utils.scaleUI();
    });
};

// Unmounts the picker - DOM lookups go back to the document and the page's
// stashed filter/grid state is restored
ui.views.tracks.unloadFrom = () => {
    ui.views.tracks.scope = null;
    ui.views.tracks.picker = null;
    if (ui.views.tracks.pickerState) {
        Object.assign(ui.views.tracks, ui.views.tracks.pickerState);
        ui.views.tracks.pickerState = null;
    }
};

ui.views.tracks.load = (e) => {
    // Page mount - the view lives at document level again
    ui.views.tracks.scope = null;
    ui.views.tracks.picker = null;
    ui.views.tracks.pickerState = null;
    // Load filter settings from local storage
    if (localStorage.getItem(ui.views.tracks.filterKey())) {
        ui.views.tracks.filter = {...ui.views.tracks.filter, ...JSON.parse(localStorage.getItem(ui.views.tracks.filterKey()))};
    }
    if (ui.views.tracks.qs('.tracks-toolbar') == null) {
        // View not loaded yet
        ui.view.loadComponent(`Tracks/tracks`, (html) => {
            ui.nav.select('tracks');
            ui.view.inject(html, 'tracks');
            if (e && e.id) {
                ui.views.tracks.updateNav(e.id);
            }
            ui.views.tracks.setupSearchListener();
            ui.views.tracks.setupSortDropdown();
            ui.views.tracks.updateClearFilterButton();
            ui.views.tracks.getFilteredList();
        });
    } else {
        // View already loaded
        if (e && e.id) {
            ui.views.tracks.updateNav(e.id);
        }
        if (ui.views.tracks.results == null) {
            ui.views.tracks.updateClearFilterButton();
            ui.views.tracks.getFilteredList();
        }
    }
    window.addEventListener('resize', ui.views.tracks.resize);
    ui.views.tracks.resize();
    ui.views.tracks.setupInfiniteScroll();
    
    // Load footer if not already loaded
    if (!document.querySelector('.footer-container')) {
        ui.views.footer.load();
    }
};

ui.views.tracks.setupSearchListener = () => {
    const searchInput = ui.views.tracks.byId('search_tracks');
    const searchClear = ui.views.tracks.byId('search_clear');
    const clearFilterBtn = ui.views.tracks.byId('clear_filter_btn');
    
    if (searchInput) {
        // Populate search field from cached filter
        if (ui.views.tracks.filter.search) {
            searchInput.value = ui.views.tracks.filter.search;
            if (searchClear) {
                searchClear.style.display = 'inline-block';
            }
        }
        
        // Handle Enter key to search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                ui.views.tracks.filter.search = searchInput.value;
                ui.views.tracks.getFilteredList();
            }
        });
        
        // Show/hide clear button based on input value
        searchInput.addEventListener('input', (e) => {
            if (searchClear) {
                searchClear.style.display = e.target.value ? 'inline-block' : 'none';
            }
        });
    }
    
    // Handle search clear button click
    if (searchClear) {
        searchClear.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (searchInput) {
                searchInput.value = '';
                ui.views.tracks.filter.search = '';
                searchClear.style.display = 'none';
                ui.views.tracks.getFilteredList();
            }
        });
    }
    
    // Handle clear all filters button click
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Reset all filters to default
            ui.views.tracks.filter.countries = ['all'];
            ui.views.tracks.filter.types = [];
            ui.views.tracks.filter.search = '';
            
            // Clear search input
            if (searchInput) {
                searchInput.value = '';
                if (searchClear) {
                    searchClear.style.display = 'none';
                }
            }
            
            // Reset UI state of any open filter section
            // Country filter
            ui.views.tracks.qsa('.filter-country li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.tracks.qs('.filter-country li[data-country="all"]')?.classList.add('selected');
            
            // Type filter
            ui.views.tracks.qsa('.filter-type li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.tracks.qs('.filter-type li[data-type="0"]')?.classList.add('selected');
            
            // Reload currently open filter view if any
            const selectedNavItem = ui.views.tracks.qs('.tracks-toolbar li.selected');
            if (selectedNavItem) {
                const section = selectedNavItem.className.match(/item-(\w+)/)?.[1];
                if (section) {
                    // Reload the filter view
                    switch (section) {
                        case 'view':
                            ui.views.tracks.view.load();
                            break;
                        case 'country':
                            ui.views.tracks.country.load();
                            break;
                        case 'type':
                            ui.views.tracks.type.load();
                            break;
                    }
                }
            }
            
            // Update clear filter button visibility
            ui.views.tracks.updateClearFilterButton();
            
            // Reload the filtered list
            ui.views.tracks.getFilteredList();
        });
    }
};

ui.views.tracks.setupSortDropdown = () => {
    const sortDdl = ui.views.tracks.byId('tracks_sort');
    if (!sortDdl) return;
    const valid = ['name', 'country', 'distance', 'year', 'rating'];
    if (!valid.includes(ui.views.tracks.filter.sort)) ui.views.tracks.filter.sort = 'name';
    sortDdl.value = ui.views.tracks.filter.sort;
    sortDdl.addEventListener('change', () => {
        ui.views.tracks.filter.sort = sortDdl.value;
        ui.views.tracks.getFilteredList();
    });
};

ui.views.tracks.unload = () => {
    window.removeEventListener('resize', ui.views.tracks.resize);
    const container = ui.views.tracks.qs('.tracks-content');
    if (container && ui.views.tracks.scrollListener) {
        container.removeEventListener('scroll', ui.views.tracks.scrollListener);
    }
}

ui.views.tracks.resize = () => {
    const el = ui.views.tracks.qs('.tracks-content');
    if(!el) return;
    const rect = el.getBoundingClientRect();
    if (ui.views.tracks.scope) {
        // Mounted in the picker modal - fill the modal body instead of sizing
        // against the viewport
        el.style.height = '';
    } else {
        el.style.height = `calc(${window.innerHeight - rect.top}px - ${window.innerWidth <= 1920 ? ui.views.tracks.footerHeight : ((ui.views.tracks.footerHeight / 1920) * window.innerWidth)}em)`;
    }
    
    // Set max-height for tracks-filter div accounting for scale factor
    const filterEl = ui.views.tracks.qs('.tracks-filter');
    if (filterEl) {
        const filterRect = filterEl.getBoundingClientRect();
        const scaleFactor = ui.utils.scaleFactor || 1;
        const maxHeight = (window.innerHeight - filterRect.top) / scaleFactor;
        filterEl.style.maxHeight = `${maxHeight}px`;
    }
}

ui.views.tracks.nav = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    var navItem = ui.views.tracks.qs(`.tracks-toolbar li.item-${section}`);
    if (navItem.classList.contains('selected')) {
        ui.views.tracks.hideFilter();
        return false;
    }
    ui.views.tracks.qsa('.tracks-toolbar li').forEach((li) => {
        li.classList.remove('selected');
    });
    navItem.classList.add('selected');
    ui.view.loadComponent(`Tracks/filter-${section}`, (html) => {
        ui.views.tracks.qs('.tracks-filter').innerHTML = html;
        switch(section) {
            case 'view':
                ui.views.tracks.view.load();
                break;
            case 'country':
                ui.views.tracks.country.load();
                break;
            case 'type':
                ui.views.tracks.type.load();
                break;
        }
        // Show close button
        ui.views.tracks.qs('.tracks-toolbar .close-btn').style.display = 'block';
    });
};

ui.views.tracks.hideFilter = () => {
    ui.views.tracks.qs('.tracks-toolbar .close-btn').style.display = 'none';
    ui.views.tracks.qs('.tracks-filter').innerHTML = '';
    ui.views.tracks.qsa('.tracks-toolbar li').forEach((li) => {
        li.classList.remove('selected');
    });
    if (!ui.views.tracks.scope) {
        history.pushState(null, '', `/dashboard/tracks` + window.location.search);
    }
};

ui.views.tracks.saveFilter = () => {
    localStorage.setItem(ui.views.tracks.filterKey(), JSON.stringify(ui.views.tracks.filter));
};

ui.views.tracks.hasActiveFilters = () => {
    // Check if any filters are active (not default state)
    const hasCountryFilter = ui.views.tracks.filter.countries.length > 0 && !ui.views.tracks.filter.countries.includes('all');
    const hasTypesFilter = ui.views.tracks.filter.types.length > 0;
    const hasSearchFilter = ui.views.tracks.filter.search && ui.views.tracks.filter.search.length > 0;
    
    return hasCountryFilter || hasTypesFilter || hasSearchFilter;
};

ui.views.tracks.updateClearFilterButton = () => {
    const clearFilterBtn = ui.views.tracks.byId('clear_filter_btn');
    if (clearFilterBtn) {
        if (ui.views.tracks.hasActiveFilters()) {
            clearFilterBtn.parentElement.style.display = 'inline-block';
        } else {
            clearFilterBtn.parentElement.style.display = 'none';
        }
    }
};

ui.views.tracks.getFilterData = (excludeFilter) => {
    // Build filter data object, excluding the specified filter type
    const filterData = {
        Countries: excludeFilter === 'countries' ? [] : (ui.views.tracks.filter.countries.includes('all') ? [] : ui.views.tracks.filter.countries),
        Types: excludeFilter === 'types' ? [] : ui.views.tracks.filter.types,
        Search: ui.views.tracks.filter.search || ''
    };
    return filterData;
};

ui.views.tracks.getFilteredList = (reset = true) => {
    ui.views.tracks.saveFilter();
    ui.views.tracks.updateClearFilterButton();
    
    if (reset) {
        ui.views.tracks.filter.start = 0;
        ui.views.tracks.allTracks = [];
        ui.views.tracks.hasMore = true;
        ui.views.tracks.virtualDOM.topHiddenRows = 0;
        ui.views.tracks.virtualDOM.bottomHiddenRows = 0;
    }
    
    // Prepare filter data for API
    const filterData = {
        Countries: ui.views.tracks.filter.countries.includes('all') ? [] : ui.views.tracks.filter.countries,
        Types: ui.views.tracks.filter.types,
        Search: ui.views.tracks.filter.search || '',
        Sort: ui.views.tracks.filter.sort,
        Start: ui.views.tracks.filter.start,
        Length: ui.views.tracks.filter.length
    };
    
    ui.ajax({
        url: '/api/tracks/filter',
        method: 'POST',
        data: filterData,
        complete: (response) => {
            if (response.status == 200) {
                const data = JSON.parse(response.responseText);
                if (reset) {
                    ui.views.tracks.views.load(data);
                } else {
                    ui.views.tracks.views.appendTracks(data);
                }
            }
        }
    });
};

ui.views.tracks.setupInfiniteScroll = () => {
    const container = ui.views.tracks.qs('.tracks-content');
    if (!container) return;

    // Remove existing listener if any
    if (ui.views.tracks.scrollListener) {
        container.removeEventListener('scroll', ui.views.tracks.scrollListener);
    }

    ui.views.tracks.scrollListener = () => {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Load more when 80% scrolled
        if (scrollTop + clientHeight >= scrollHeight * 0.8 && !ui.views.tracks.isLoading && ui.views.tracks.hasMore) {
            ui.views.tracks.loadMore();
        }

        // Manage virtual DOM
        ui.views.tracks.manageVirtualDOM();
    };

    container.addEventListener('scroll', ui.views.tracks.scrollListener);

    // Add resize listener to recalculate virtual DOM
    if (ui.views.tracks.resizeListener) {
        window.removeEventListener('resize', ui.views.tracks.resizeListener);
    }

    ui.views.tracks.resizeListener = () => {
        // Reset virtual DOM state and recalculate
        ui.views.tracks.virtualDOM.topHiddenRows = 0;
        ui.views.tracks.virtualDOM.bottomHiddenRows = 0;

        const gridView = container?.querySelector('.grid-view');
        if (gridView) {
            gridView.style.paddingTop = '0px';
            gridView.style.paddingBottom = '0px';

            // Show all items
            const items = Array.from(gridView.querySelectorAll('.track:not(.hovered-clone):not(.grid-details)'));
            items.forEach(item => {
                if (item.style.display === 'none') {
                    item.style.display = '';
                }
            });
        }

        // Recalculate virtual DOM after a short delay to let layout settle
        setTimeout(() => {
            ui.views.tracks.manageVirtualDOM();
        }, 100);
    };

    window.addEventListener('resize', ui.views.tracks.resizeListener);
};

// If the grid doesn't overflow its container, no scroll event can ever fire
// and infinite scroll stalls on the first page - keep loading until the
// container scrolls or the results run out
ui.views.tracks.checkOverflowLoad = () => {
    const container = ui.views.tracks.qs('.tracks-content');
    if (container && container.scrollHeight <= container.clientHeight
        && ui.views.tracks.hasMore && !ui.views.tracks.isLoading) {
        ui.views.tracks.loadMore();
    }
};

ui.views.tracks.loadMore = () => {
    if (ui.views.tracks.isLoading || !ui.views.tracks.hasMore) return;

    ui.views.tracks.isLoading = true;
    ui.views.tracks.filter.start += ui.views.tracks.filter.length;
    ui.views.tracks.getFilteredList(false);
};

ui.views.tracks.manageVirtualDOM = () => {
    const container = ui.views.tracks.qs('.tracks-content');
    const gridView = container?.querySelector('.grid-view');
    if (!gridView) return;
    
    const items = Array.from(gridView.querySelectorAll('.track:not(.hovered-clone):not(.grid-details)'));
    if (items.length === 0) return;
    
    // Get grid properties
    const gridStyle = window.getComputedStyle(gridView);
    const columns = gridStyle.gridTemplateColumns.split(' ').length;
    
    // Calculate row height using offsetHeight (unscaled)
    const firstItem = items[0];
    const rowHeight = firstItem.offsetHeight + parseFloat(gridStyle.gap || 0);
    
    // Get scroll position and viewport height
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;
    
    // Account for scale factor
    const scaleFactor = ui.utils.scaleFactor || 1;
    const effectiveScrollTop = scrollTop / scaleFactor;
    const effectiveViewportHeight = viewportHeight / scaleFactor;
    
    const rowsBuffer = 5;
    
    // Calculate which rows should be visible based on scroll
    const targetFirstVisibleRow = Math.max(0, Math.floor(effectiveScrollTop / rowHeight) - rowsBuffer);
    const targetLastVisibleRow = Math.min(Math.ceil(ui.views.tracks.allTracks.length / columns) - 1, Math.ceil((effectiveScrollTop + effectiveViewportHeight) / rowHeight) + rowsBuffer);
    
    // Current state
    let currentTopHiddenRows = ui.views.tracks.virtualDOM.topHiddenRows;
    
    // Handle scrolling down - remove from top (only if well past buffer)
    if (targetFirstVisibleRow > currentTopHiddenRows + 1) {
        currentTopHiddenRows++;
        
        // Remove first row of items from DOM by data-path
        const rowToRemove = currentTopHiddenRows - 1;
        const tracksToRemove = [];
        for (let i = rowToRemove * columns; i < Math.min((rowToRemove + 1) * columns, ui.views.tracks.allTracks.length); i++) {
            tracksToRemove.push(ui.views.tracks.allTracks[i]?.path);
        }
        
        items.forEach(item => {
            if (tracksToRemove.includes(item.getAttribute('data-path'))) {
                item.remove();
            }
        });
        
        gridView.style.paddingTop = `${currentTopHiddenRows * rowHeight}px`;
        ui.views.tracks.virtualDOM.topHiddenRows = currentTopHiddenRows;
    }
    // Handle scrolling up - add to top
    else if (targetFirstVisibleRow < currentTopHiddenRows) {
        currentTopHiddenRows--;
        
        const rowToAdd = currentTopHiddenRows;
        const startIndex = rowToAdd * columns;
        const endIndex = Math.min((rowToAdd + 1) * columns, ui.views.tracks.allTracks.length);
        
        const viewType = ui.views.tracks.filter.view || 'grid';
        ui.view.loadComponent(`Tracks/${viewType}-item`, (itemTemplate) => {
            let rowHtml = '';
            for (let i = startIndex; i < endIndex; i++) {
                const track = ui.views.tracks.allTracks[i];
                if (track) {
                    rowHtml += ui.views.tracks.views.renderTrackItem(track, itemTemplate);
                }
            }
            
            gridView.insertAdjacentHTML('afterbegin', rowHtml);
            ui.views.tracks.views.grid.setup();
        });
        
        gridView.style.paddingTop = `${currentTopHiddenRows * rowHeight}px`;
        ui.views.tracks.virtualDOM.topHiddenRows = currentTopHiddenRows;
    }
    
    // Handle bottom rows - add missing rows
    const currentItems = Array.from(gridView.querySelectorAll('.track:not(.hovered-clone):not(.grid-details)'));
    const currentPaths = new Set(currentItems.map(item => item.getAttribute('data-path')));
    
    const firstNeededIndex = currentTopHiddenRows * columns;
    const lastNeededIndex = Math.min((targetLastVisibleRow + 1) * columns - 1, ui.views.tracks.allTracks.length - 1);
    
    const missingTracks = [];
    for (let i = firstNeededIndex; i <= lastNeededIndex; i++) {
        const track = ui.views.tracks.allTracks[i];
        if (track && !currentPaths.has(track.path)) {
            missingTracks.push(track);
        }
    }
    
    if (missingTracks.length > 0) {
        const viewType = ui.views.tracks.filter.view || 'grid';
        ui.view.loadComponent(`Tracks/${viewType}-item`, (itemTemplate) => {
            let rowHtml = '';
            missingTracks.forEach(track => {
                rowHtml += ui.views.tracks.views.renderTrackItem(track, itemTemplate);
            });
            
            gridView.insertAdjacentHTML('beforeend', rowHtml);
            ui.views.tracks.views.grid.setup();
        });
    }
    
    // Handle bottom rows - remove excess
    const totalRows = Math.ceil(ui.views.tracks.allTracks.length / columns);
    const bottomHiddenRows = Math.max(0, totalRows - targetLastVisibleRow - 1);
    
    if (bottomHiddenRows !== ui.views.tracks.virtualDOM.bottomHiddenRows) {
        const tracksToRemove = [];
        for (let row = targetLastVisibleRow + 1; row < totalRows; row++) {
            for (let i = row * columns; i < Math.min((row + 1) * columns, ui.views.tracks.allTracks.length); i++) {
                tracksToRemove.push(ui.views.tracks.allTracks[i]?.path);
            }
        }
        
        const itemsToCheck = Array.from(gridView.querySelectorAll('.track:not(.hovered-clone):not(.grid-details)'));
        itemsToCheck.forEach(item => {
            if (tracksToRemove.includes(item.getAttribute('data-path'))) {
                item.remove();
            }
        });
        
        gridView.style.paddingBottom = `${bottomHiddenRows * rowHeight}px`;
        ui.views.tracks.virtualDOM.bottomHiddenRows = bottomHiddenRows;
    }
};

//#endregion

//#region "View Filter"

ui.views.tracks.view = {};

ui.views.tracks.view.load = () => {
    ui.views.tracks.qsa('.filter-view li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.tracks.view.select(li.getAttribute('data-view'));
        }
    });
};

ui.views.tracks.view.select = (view) => {
    ui.views.tracks.filter.view = view;
    ui.views.tracks.qsa('.filter-view li').forEach((li) => {
        li.classList.remove('selected');
    });
    ui.views.tracks.qsa('.filter-view li[data-view="' + view + '"]').forEach((li) => {
        li.classList.add('selected');
    });
    ui.views.tracks.views.load();
    ui.views.tracks.saveFilter();
};

//#endregion

//#region "Country Filter"

ui.views.tracks.country = {};

ui.views.tracks.country.load = () => {
    ui.view.loadComponent('Tracks/filter-country-item', (itemTemplate) => {
        ui.ajax({
            url: '/api/tracks/countries',
            method: 'POST',
            data: ui.views.tracks.getFilterData('countries'),
            complete: (response) => {
                try {
                    const countries = JSON.parse(response.responseText);
                    
                    const container = ui.views.tracks.qs('.filter-country .select-list');
                    if (!container) {
                        console.error('Container .filter-country .select-list not found');
                        return;
                    }
                    
                    container.innerHTML = '<li data-country="all"><image src="/images/flags/80x60/all.png"/>All Countries</li>';
                    
                    // Add each country item
                    countries.forEach(country => {
                        let itemHtml = itemTemplate
                            .split('{{code}}').join(country.code)
                            .split('{{name}}').join(country.name);
                        container.innerHTML += itemHtml;
                    });
                    
                    ui.views.tracks.qsa('.filter-country li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.tracks.country.select(li.getAttribute('data-country'));
                        }
                    });
                    
                    if (ui.views.tracks.filter.countries.length > 0) {
                        ui.views.tracks.qsa('.filter-country li').forEach((li) => {
                            if (ui.views.tracks.filter.countries.includes(li.getAttribute('data-country'))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error loading countries:', error);
                }
            }
        });
    });
};

ui.views.tracks.country.select = (country) => {
    if (country == 'all') {
        ui.views.tracks.filter.countries = ['all'];
        ui.views.tracks.qsa('.filter-country li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.tracks.filter.countries.includes(country)) {
            ui.views.tracks.filter.countries.splice(ui.views.tracks.filter.countries.indexOf(country), 1);
        } else {
            ui.views.tracks.filter.countries.push(country);
        }
        if (ui.views.tracks.filter.countries.indexOf('all') > -1) {
            ui.views.tracks.filter.countries.splice(ui.views.tracks.filter.countries.indexOf('all'), 1);
        }
        ui.views.tracks.qsa('.filter-country li[data-country="all"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    ui.views.tracks.qsa('.filter-country li[data-country="' + country + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.tracks.getFilteredList();
};

//#endregion

//#region "Type Filter"

ui.views.tracks.type = {};

ui.views.tracks.type.load = () => {
    ui.view.loadComponent('Tracks/filter-type-item', (itemTemplate) => {
        ui.ajax({
            url: '/api/tracks/types',
            method: 'POST',
            data: ui.views.tracks.getFilterData('types'),
            complete: (response) => {
                try {
                    const types = JSON.parse(response.responseText);
                    
                    const container = ui.views.tracks.qs('.filter-type .select-list');
                    container.innerHTML = '<li data-type="0">All Types</li>';
                    
                    types.forEach(type => {
                        let itemHtml = itemTemplate
                            .split('{{id}}').join(type.id)
                            .split('{{name}}').join(type.name);
                        container.innerHTML += itemHtml;
                    });
                    
                    ui.views.tracks.qsa('.filter-type li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.tracks.type.select(parseInt(li.getAttribute('data-type')));
                        }
                    });
                    
                    if (ui.views.tracks.filter.types.length > 0) {
                        ui.views.tracks.qsa('.filter-type li').forEach((li) => {
                            if (ui.views.tracks.filter.types.includes(parseInt(li.getAttribute('data-type')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        ui.views.tracks.qs('.filter-type li[data-type="0"]')?.classList.add('selected');
                    }
                } catch (error) {
                    console.error('Error loading types:', error);
                }
            }
        });
    });
};

ui.views.tracks.type.select = (typeId) => {
    if (typeId == 0) {
        ui.views.tracks.filter.types = [];
        ui.views.tracks.qsa('.filter-type li').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.tracks.qs('.filter-type li[data-type="0"]')?.classList.add('selected');
    } else {
        if (ui.views.tracks.filter.types.includes(typeId)) {
            ui.views.tracks.filter.types.splice(ui.views.tracks.filter.types.indexOf(typeId), 1);
        } else {
            ui.views.tracks.filter.types.push(typeId);
        }
        ui.views.tracks.qsa('.filter-type li[data-type="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.tracks.qsa('.filter-type li[data-type="' + typeId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no types selected, select 'All'
        if (ui.views.tracks.filter.types.length === 0) {
            ui.views.tracks.qs('.filter-type li[data-type="0"]')?.classList.add('selected');
        }
    }
    ui.views.tracks.getFilteredList();
};

// Simple filter functions for grid-details clickable filters
ui.views.tracks.filterByCountry = (country) => {
    ui.views.tracks.filter.countries = [country];
    ui.views.tracks.getFilteredList();
};

ui.views.tracks.filterByCity = (city) => {
    ui.views.tracks.filter.search = city;
    ui.views.tracks.getFilteredList();
};

ui.views.tracks.filterByYear = (year) => {
    ui.views.tracks.filter.search = year;
    ui.views.tracks.getFilteredList();
};

ui.views.tracks.filterByType = (typeId) => {
    ui.views.tracks.filter.types = [parseInt(typeId)];
    ui.views.tracks.getFilteredList();
};

//#endregion

//#region "Views"

ui.views.tracks.views = {};

ui.views.tracks.views.renderTrackItem = (track, itemTemplate) => {
    let previewUrl = `/image/assetto corsa/track/${track.path}`;
    if (track.subPath) {
        previewUrl += `/${track.subPath}`;
    }
    
    let outlineUrl = `/image/assetto corsa/track-outline/${track.path}`;
    if (track.subPath) {
        outlineUrl += `/${track.subPath}`;
    }

    var city = track.city && track.city != 'null' ? track.city : '';
    
    return itemTemplate
        .split('{{id}}').join(track.id)
        .split('{{name}}').join(track.name)
        .split('{{path}}').join(track.path)
        .split('{{preview}}').join(previewUrl)
        .split('{{outline}}').join(outlineUrl)
        .split('{{country}}').join(track.country || '')
        .split('{{countryName}}').join(track.countryName || '')
        .split('{{city}}').join(city)
        .split('{{typeName}}').join(track.typeName || '')
        .split('{{length}}').join(track.length ? (track.length / 1000).toFixed(1) + ' km' : '')
        .split('{{distance}}').join(track.distance ? track.distance.toFixed(2) + ' km' : '')
        .split('{{rating}}').join(track.rating || 0)
        .hasBlock('has-rating', (track.rating || 0) > 0)
        .hasBlock('has-city', city != '');
};

ui.views.tracks.views.load = (data) => {
    if (data) {
        ui.views.tracks.results = data;
        ui.views.tracks.allTracks = data.tracks || [];
        ui.views.tracks.hasMore = data.tracks && data.tracks.length >= ui.views.tracks.filter.length;
    } else {
        data = ui.views.tracks.results;
    }
    
    const container = ui.views.tracks.qs('.tracks-content');
    if (!container) return;
    
    // Check for empty results
    if (!data || !data.tracks || data.tracks.length === 0) {
        ui.view.loadComponent('Tracks/empty-results', (html) => {
            container.innerHTML = html;
        });
        ui.views.tracks.isLoading = false;
        return;
    }
    
    // Determine which view to load based on filter.view
    const viewType = ui.views.tracks.filter.view || 'grid';
    
    switch(viewType) {
        case 'grid':
        case 'gridsm':
        case 'gridxl':
            ui.views.tracks.views.grid.load(data, viewType);
            break;
        default:
            ui.views.tracks.views.grid.load(data, 'grid');
            break;
    }
    ui.views.tracks.isLoading = false;
    ui.views.tracks.checkOverflowLoad();
};

ui.views.tracks.views.appendTracks = (data) => {
    if (!data || !data.tracks || data.tracks.length === 0) {
        ui.views.tracks.hasMore = false;
        ui.views.tracks.isLoading = false;
        return;
    }
    
    ui.views.tracks.allTracks = ui.views.tracks.allTracks.concat(data.tracks);
    ui.views.tracks.hasMore = data.tracks.length >= ui.views.tracks.filter.length;
    
    const viewType = ui.views.tracks.filter.view || 'grid';
    
    ui.view.loadComponent(`Tracks/${viewType}-item`, (itemTemplate) => {
        const gridView = ui.views.tracks.qs('.tracks-content .grid-view');
        if (!gridView) {
            ui.views.tracks.isLoading = false;
            return;
        }
        
        data.tracks.forEach(track => {
            const itemHtml = ui.views.tracks.views.renderTrackItem(track, itemTemplate);
            gridView.insertAdjacentHTML('beforeend', itemHtml);
        });
        
        ui.views.tracks.views.grid.setup();
        ui.views.tracks.isLoading = false;
        ui.views.tracks.checkOverflowLoad();
    });
};

ui.views.tracks.views.grid = {
    setup: () => {
        ui.views.tracks.qsa('.grid-view > .track').forEach((item) => {
            item.onmouseenter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Stop if already hovered
                if(item.querySelector('.hovered-clone')) return;
                
                if(ui.views.tracks.hovered != null){
                    // Hide previously hovered track grid item clone
                    const hovered = ui.views.tracks.hovered;
                    hovered.classList.add('hiding');
                    setTimeout(() => {
                        if(hovered != null){
                            hovered.remove();
                        }
                    }, 250);
                }

                // Clone track grid item
                const track = ui.views.tracks.views.grid.getTrackFromItem(item);
                const clone = item.cloneNode(true);
                clone.className += ' hovered-clone';
                clone.onmouseover = null;
                clone.style.zIndex = 1;
                item.prepend(clone);
                ui.views.tracks.hovered = clone;

                clone.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    ui.views.tracks.views.grid.details(track, item);
                };
                clone.onmouseleave = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clone.classList.add('hiding');
                    setTimeout(() => {
                        if(clone != null){
                            clone.remove();
                        }
                    }, 250);
                };
            };
        });
        ui.utils.scaleUI();
    },
    details: (track, item) => {
        // Check if the clicked track is already selected
        if (ui.views.tracks.selected && ui.views.tracks.selected.track && ui.views.tracks.selected.track.path === track.path) {
            // Hide details if the same track is clicked again
            const detailsDiv = ui.views.tracks.qs('.grid-details');
            if (detailsDiv) {
                detailsDiv.classList.add('hiding');
                setTimeout(() => {
                    if (detailsDiv) {
                        detailsDiv.remove();
                    }
                    if (ui.views.tracks.selected && ui.views.tracks.selected.item) {
                        ui.views.tracks.selected.item.classList.remove('selected');
                    }
                    ui.views.tracks.selected = null;
                }, 350);
            }
            return;
        }
        ui.view.loadComponent('Tracks/grid-details', (html) => {
            const detailsDiv = ui.views.tracks.qs('.grid-details');
            if (detailsDiv != null) {
                detailsDiv.classList.add('hiding');
                setTimeout(() => {
                    if (detailsDiv != null) {
                        detailsDiv.remove();
                    }
                }, 350);
            }
            // Remove selected class from previously selected item
            if (ui.views.tracks.selected && ui.views.tracks.selected.item) {
                ui.views.tracks.selected.item.classList.remove('selected');
            }
            
            // Generate track preview image URL
            let previewUrl = `/image/assetto corsa/track/${track.path}`;
            if (track.subPath) {
                previewUrl += `/${track.subPath}`;
            }

            // Generate track outline image URL
            let outlineUrl = `/image/assetto corsa/track-outline/${track.path}`;
            if (track.subPath) {
                outlineUrl += `/${track.subPath}`;
            }

            var author = track.author && track.author != 'null' ? track.author : null;
            if(author != null && author.length > 20){
                author = author.substring(0, 20) + '...';
            }
            const view = html
                .split('{{preview}}').join(previewUrl)
                .split('{{outline}}').join(outlineUrl)
                .split('{{name}}').join(track.name)
                .split('{{country}}').join(track.countryName || track.country || 'Unknown')
                .split('{{countryCode}}').join((track.country || 'unknown').toLowerCase())
                .split('{{city}}').join(track.city || '')
                .split('{{year}}').join(track.year || '')
                .split('{{typeName}}').join(track.typeName || '')
                .split('{{typeId}}').join(track.type || '')
                .split('{{length}}').join(track.length ? (track.length / 1000).toFixed(1) + ' km' : 'N/A')
                .split('{{width}}').join(track.width ? track.width + ' m' : 'N/A')
                .split('{{pitBoxes}}').join(track.pitBoxes || 'N/A')
                .split('{{details}}').join(track.details ? track.details.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>') : '')
                .split('{{author}}').join(author || '')
                .split('{{id}}').join(track.id)
                .split('{{rating}}').join(track.rating || 0)
                .hasBlock('has-country', track.countryName || track.country)
                .hasBlock('has-city', track.city)
                .hasBlock('has-year', track.year)
                .hasBlock('has-type', track.typeName)
                .hasBlock('has-length', track.length)
                .hasBlock('has-width', track.width)
                .hasBlock('has-pitboxes', track.pitBoxes)
                .hasBlock('has-details', track.details)
                .hasBlock('has-author', author);
            item.insertAdjacentHTML('afterend', view);
            ui.views.tracks.views.grid.detailsDiv = item.nextSibling;
            ui.views.tracks.selected = {track, item};

            // Keep the model + grid-item badge in sync when a rating saves
            ui.views.tracks.views.grid.detailsDiv.addEventListener('rated', (e) => {
                track.rating = e.detail.rating;
                ui.views.tracks.views.grid.applyRating(item, track);
            });

            // Add selected class to the item
            item.classList.add('selected');
            
            // Setup track layouts dropdown
            ui.views.tracks.views.grid.setupLayoutsSelect(track);

            // Setup select track button handler
            ui.views.tracks.views.grid.setupSelectTrackHandler();
            
            // Setup button hover effects
            ui.views.tracks.views.grid.setupButtonHoverEffects();
            
            setTimeout(() => {
                ui.scrollTo(ui.views.tracks.qs('.tracks-content'), item, 500, 'easeInOutQuad', 0);
            }, 350);
        });
    },
    getCommonTrackName: (names) => {
        // Ported from ACTools' FindNameForMultiLayoutMode: the longest prefix
        // shared by every layout name, trimmed and without a trailing separator
        const baseName = names[0];
        if (!baseName) return null;

        const minLength = Math.min(...names.filter(n => n).map(n => n.length));
        for (let i = minLength; i > 2; i--) {
            let result = baseName.substring(0, i);
            if (names.slice(1).some(n => !n || n.substring(0, i) !== result)) continue;

            result = result.trim();
            if (result.length > 2 && /[-—/(]$/.test(result)) {
                result = result.substring(0, result.length - 1).trim();
            }
            return result;
        }
        return null;
    },
    setupLayoutsSelect: (track) => {
        const select = ui.views.tracks.byId('track_layouts_select');
        if (!select || !ui.views.tracks.selected) return;

        // The parent row is the main layout; track.layouts are the additional layouts
        const layouts = [track].concat(track.layouts || []);
        ui.views.tracks.selected.layout = layouts[0];

        // Single-layout track - keep the dropdown hidden
        if (layouts.length <= 1) return;

        // Show only the layout part of each name (strip the shared track-name prefix)
        const commonName = ui.views.tracks.views.grid.getCommonTrackName(layouts.map(t => t.name));
        layouts.forEach((t) => {
            t.layoutName = t.name;
            if (commonName && t.name && t.name.startsWith(commonName)) {
                const stripped = t.name.substring(commonName.length)
                    .replace(/^[\s\-—/()]+|[\s)]+$/g, '')
                    .trim();
                if (stripped) {
                    t.layoutName = stripped;
                    return;
                }
            }
            // Fall back to the layout folder name (e.g. "main_layout" -> "Main Layout")
            if (t.subPath) {
                t.layoutName = t.subPath.replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());
            }
        });

        select.parentElement.style.display = '';
        select.innerHTML = '';
        layouts.forEach((t, i) => {
            select.appendChild(new Option(t.layoutName, i));
        });

        select.addEventListener('change', () => {
            const layout = layouts[parseInt(select.value)];
            ui.views.tracks.selected.layout = layout;

            // Update the outline image to the selected layout
            const outlineImg = ui.views.tracks.qs('.grid-details .track-outline-float');
            if (outlineImg) {
                let outlineUrl = `/image/assetto corsa/track-outline/${layout.path}`;
                if (layout.subPath) {
                    outlineUrl += `/${layout.subPath}`;
                }
                outlineImg.style.display = '';
                outlineImg.src = outlineUrl;
            }
        });
    },
    setupSelectTrackHandler: () => {
        // Add event listeners to all select track buttons
        const selectTrackBtns = ui.views.tracks.qsa('.select-track-btn');
        selectTrackBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                // Get track from ui.views.tracks.selected
                if (ui.views.tracks.selected && ui.views.tracks.selected.track) {
                    if (ui.views.tracks.picker) {
                        // Picker modal intercept - e.g. candidate picking
                        ui.views.tracks.picker(ui.views.tracks.selected.track, ui.views.tracks.selected.layout);
                    } else {
                        ui.views.footer.selectTrack(ui.views.tracks.selected.track, ui.views.tracks.selected.layout);
                    }
                }
            });
        });
    },
    setupButtonHoverEffects: () => {
        const buttons = ui.views.tracks.qsa('.select-track-btn');
        
        buttons.forEach((button) => {
            // Skip if already wrapped
            if (button.parentNode.classList && button.parentNode.classList.contains('button-wrapper')) return;
            
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
    },
    getTrackFromItem: (item) => {
        const track = ui.views.tracks.allTracks.find((track) => {
            return track.path == item.getAttribute('data-path');
        });
        return track;
    },
    applyRating: (item, track) => {
        // Create or update the filled-stars badge on a track grid item
        let badge = item.querySelector('rating-stars.rating-badge');
        if ((track.rating || 0) <= 0) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('rating-stars');
            badge.className = 'rating-badge';
            badge.setAttribute('filled-only', '');
            badge.setAttribute('readonly', '');
            badge.setAttribute('rating', String(track.rating));
            item.prepend(badge);
        } else {
            badge.setAttribute('rating', String(track.rating));
        }
    }
};

ui.views.tracks.views.grid.load = (data, viewType) => {
    viewType = viewType || 'grid';
    
    ui.view.loadComponent(`Tracks/${viewType}-view`, (template) => {
        ui.view.loadComponent(`Tracks/${viewType}-item`, (itemTemplate) => {
            const container = ui.views.tracks.qs('.tracks-content');
            let itemsHtml = '';
            
            data.tracks.forEach(track => {
                itemsHtml += ui.views.tracks.views.renderTrackItem(track, itemTemplate);
            });
            
            const html = template.split('{{items}}').join(itemsHtml);
            container.innerHTML = html;
            
            // Setup hover functionality after content is loaded
            ui.views.tracks.views.grid.setup();
        });
    });
};

ui.views.tracks.views.changeView = (view) => {
    ui.views.tracks.filter.view = view;
    ui.views.tracks.filter.start = 0;
    ui.views.tracks.allTracks = [];
    ui.views.tracks.hasMore = true;
    ui.views.tracks.views.load();
    ui.views.tracks.saveFilter();
};

//#endregion
