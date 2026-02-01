//#region "Tracks"

ui.views.tracks = {
    filter: {
        countries: ['all'],
        types: [],
        search: '',
        start: 0,
        length: 20,
        view: 'grid'
    },
    results: null,
    allTracks: [],
    footerHeight: 5.8,
    hovered: null,
    selected: null,
    isLoading: false,
    hasMore: true,
    scrollListener: null,
    resizeListener: null,
    virtualDOM: {
        topHiddenRows: 0,
        bottomHiddenRows: 0
    }
};

ui.views.tracks.load = (e) => {
    // Load filter settings from local storage
    if (localStorage.getItem('RacerUI:tracks-filter')) {
        ui.views.tracks.filter = {...ui.views.tracks.filter, ...JSON.parse(localStorage.getItem('RacerUI:tracks-filter'))};
    }
    if (document.querySelector('.tracks-toolbar') == null) {
        // View not loaded yet
        ui.view.loadComponent(`Tracks/tracks`, (html) => {
            ui.nav.select('tracks');
            ui.view.inject(html, 'tracks');
            if (e && e.id) {
                ui.views.tracks.updateNav(e.id);
            }
            ui.views.tracks.setupSearchListener();
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
};

ui.views.tracks.setupSearchListener = () => {
    const searchInput = document.getElementById('search_tracks');
    const searchClear = document.getElementById('search_clear');
    const clearFilterBtn = document.getElementById('clear_filter_btn');
    
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
            document.querySelectorAll('.filter-country li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-country li[data-country="all"]')?.classList.add('selected');
            
            // Type filter
            document.querySelectorAll('.filter-type li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-type li[data-type="0"]')?.classList.add('selected');
            
            // Update clear filter button visibility
            ui.views.tracks.updateClearFilterButton();
            
            // Reload the filtered list
            ui.views.tracks.getFilteredList();
        });
    }
};

ui.views.tracks.unload = () => {
    window.removeEventListener('resize', ui.views.tracks.resize);
    const container = document.querySelector('.tracks-content');
    if (container && ui.views.tracks.scrollListener) {
        container.removeEventListener('scroll', ui.views.tracks.scrollListener);
    }
}

ui.views.tracks.resize = () => {
    const el = document.querySelector('.tracks-content');
    const rect = el.getBoundingClientRect();
    el.style.height = `calc(${window.innerHeight - rect.top}px - ${window.innerWidth <= 1920 ? ui.views.tracks.footerHeight : ((ui.views.tracks.footerHeight / 1920) * window.innerWidth)}em)`;
}

ui.views.tracks.nav = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    var navItem = document.querySelector(`.tracks-toolbar li.item-${section}`);
    if (navItem.classList.contains('selected')) {
        ui.views.tracks.hideFilter();
        return false;
    }
    document.querySelectorAll('.tracks-toolbar li').forEach((li) => {
        li.classList.remove('selected');
    });
    navItem.classList.add('selected');
    ui.view.loadComponent(`Tracks/filter-${section}`, (html) => {
        document.querySelector('.tracks-filter').innerHTML = html;
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
        document.querySelector('.tracks-toolbar .close-btn').style.display = 'block';
    });
};

ui.views.tracks.hideFilter = () => {
    document.querySelector('.tracks-toolbar .close-btn').style.display = 'none';
    document.querySelector('.tracks-filter').innerHTML = '';
    document.querySelectorAll('.tracks-toolbar li').forEach((li) => {
        li.classList.remove('selected');
    });
    history.pushState(null, '', `/dashboard/tracks` + window.location.search);
};

ui.views.tracks.saveFilter = () => {
    localStorage.setItem('RacerUI:tracks-filter', JSON.stringify(ui.views.tracks.filter));
};

ui.views.tracks.hasActiveFilters = () => {
    // Check if any filters are active (not default state)
    const hasCountryFilter = ui.views.tracks.filter.countries.length > 0 && !ui.views.tracks.filter.countries.includes('all');
    const hasTypesFilter = ui.views.tracks.filter.types.length > 0;
    const hasSearchFilter = ui.views.tracks.filter.search && ui.views.tracks.filter.search.length > 0;
    
    return hasCountryFilter || hasTypesFilter || hasSearchFilter;
};

ui.views.tracks.updateClearFilterButton = () => {
    const clearFilterBtn = document.getElementById('clear_filter_btn');
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
    const container = document.querySelector('.tracks-content');
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

ui.views.tracks.loadMore = () => {
    if (ui.views.tracks.isLoading || !ui.views.tracks.hasMore) return;

    ui.views.tracks.isLoading = true;
    ui.views.tracks.filter.start += ui.views.tracks.filter.length;
    ui.views.tracks.getFilteredList(false);
};

ui.views.tracks.manageVirtualDOM = () => {
    const container = document.querySelector('.tracks-content');
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
    document.querySelectorAll('.filter-view li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.tracks.view.select(li.getAttribute('data-view'));
        }
    });
};

ui.views.tracks.view.select = (view) => {
    ui.views.tracks.filter.view = view;
    document.querySelectorAll('.filter-view li').forEach((li) => {
        li.classList.remove('selected');
    });
    document.querySelectorAll('.filter-view li[data-view="' + view + '"]').forEach((li) => {
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
                    
                    const container = document.querySelector('.filter-country .select-list');
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
                    
                    document.querySelectorAll('.filter-country li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.tracks.country.select(li.getAttribute('data-country'));
                        }
                    });
                    
                    if (ui.views.tracks.filter.countries.length > 0) {
                        document.querySelectorAll('.filter-country li').forEach((li) => {
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
        document.querySelectorAll('.filter-country li').forEach((li) => {
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
        document.querySelectorAll('.filter-country li[data-country="all"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-country li[data-country="' + country + '"]').forEach((li) => {
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
                    
                    const container = document.querySelector('.filter-type .select-list');
                    container.innerHTML = '<li data-type="0">All Types</li>';
                    
                    types.forEach(type => {
                        let itemHtml = itemTemplate
                            .split('{{id}}').join(type.id)
                            .split('{{name}}').join(type.name);
                        container.innerHTML += itemHtml;
                    });
                    
                    document.querySelectorAll('.filter-type li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.tracks.type.select(parseInt(li.getAttribute('data-type')));
                        }
                    });
                    
                    if (ui.views.tracks.filter.types.length > 0) {
                        document.querySelectorAll('.filter-type li').forEach((li) => {
                            if (ui.views.tracks.filter.types.includes(parseInt(li.getAttribute('data-type')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        document.querySelector('.filter-type li[data-type="0"]')?.classList.add('selected');
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
        document.querySelectorAll('.filter-type li').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelector('.filter-type li[data-type="0"]')?.classList.add('selected');
    } else {
        if (ui.views.tracks.filter.types.includes(typeId)) {
            ui.views.tracks.filter.types.splice(ui.views.tracks.filter.types.indexOf(typeId), 1);
        } else {
            ui.views.tracks.filter.types.push(typeId);
        }
        document.querySelectorAll('.filter-type li[data-type="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelectorAll('.filter-type li[data-type="' + typeId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no types selected, select 'All'
        if (ui.views.tracks.filter.types.length === 0) {
            document.querySelector('.filter-type li[data-type="0"]')?.classList.add('selected');
        }
    }
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
    
    const container = document.querySelector('.tracks-content');
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
        const gridView = document.querySelector('.tracks-content .grid-view');
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
    });
};

ui.views.tracks.views.grid = {
    setup: () => {
        document.querySelectorAll('.grid-view > .track').forEach((item) => {
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
    },
    details: (track, item) => {
        // Check if the clicked track is already selected
        if (ui.views.tracks.selected && ui.views.tracks.selected.track && ui.views.tracks.selected.track.path === track.path) {
            // Hide details if the same track is clicked again
            const detailsDiv = document.querySelector('.grid-details');
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
            const detailsDiv = document.querySelector('.grid-details');
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

            const author = track.author && track.author != 'null' ? track.author : null;
            
            const view = html
                .split('{{preview}}').join(previewUrl)
                .split('{{outline}}').join(outlineUrl)
                .split('{{name}}').join(track.name)
                .split('{{country}}').join(track.countryName || track.country || 'Unknown')
                .split('{{countryCode}}').join((track.country || 'unknown').toLowerCase())
                .split('{{city}}').join(track.city || '')
                .split('{{year}}').join(track.year || '')
                .split('{{typeName}}').join(track.typeName || '')
                .split('{{length}}').join(track.length ? (track.length / 1000).toFixed(1) + ' km' : 'N/A')
                .split('{{width}}').join(track.width ? track.width + ' m' : 'N/A')
                .split('{{pitBoxes}}').join(track.pitBoxes || 'N/A')
                .split('{{details}}').join(track.details ? track.details.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>') : '')
                .split('{{author}}').join(author || '')
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
            // Add selected class to the item
            item.classList.add('selected');
            setTimeout(() => {
                ui.scrollTo(document.querySelector('.tracks-content'), item, 500, 'easeInOutQuad', 0);
            }, 350);
        });
    },
    getTrackFromItem: (item) => {
        const track = ui.views.tracks.allTracks.find((track) => {
            return track.path == item.getAttribute('data-path');
        });
        return track;
    }
};

ui.views.tracks.views.grid.load = (data, viewType) => {
    viewType = viewType || 'grid';
    
    ui.view.loadComponent(`Tracks/${viewType}-view`, (template) => {
        ui.view.loadComponent(`Tracks/${viewType}-item`, (itemTemplate) => {
            const container = document.querySelector('.tracks-content');
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
