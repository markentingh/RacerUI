//#region "Tracks"

ui.views.tracks = {
    filter: {
        countries: ['all'],
        types: [],
        search: '',
        start: 0,
        length: 100,
        view: 'grid'
    },
    results: null,
    footerHeight: 5.8
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
};

ui.views.tracks.setupSearchListener = () => {
    const searchInput = document.getElementById('search_tracks');
    const searchClear = document.getElementById('search_clear');
    const clearFilterBtn = document.getElementById('clear_filter_btn');
    
    if (searchInput) {
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

ui.views.tracks.getFilteredList = () => {
    ui.views.tracks.saveFilter();
    ui.views.tracks.updateClearFilterButton();
    
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
                ui.views.tracks.views.load(JSON.parse(response.responseText));
            }
        }
    });
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

ui.views.tracks.views.load = (data) => {
    ui.views.tracks.results = data;
    
    const container = document.querySelector('.tracks-content');
    if (!container) return;
    
    // Check for empty results
    if (!data.tracks || data.tracks.length === 0) {
        ui.view.loadComponent('Tracks/empty-results', (html) => {
            container.innerHTML = html;
        });
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
                const clone = item.cloneNode(true);
                clone.className += ' hovered-clone';
                clone.onmouseover = null;
                clone.style.zIndex = 1;
                item.prepend(clone);
                ui.views.tracks.hovered = clone;

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
    getTrackFromItem: (item) => {
        const track = ui.views.tracks.results.tracks.find((track) => {
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
                // Generate track preview image URL
                let previewUrl = `/image/assetto corsa/track/${track.path}`;
                
                // If track has a subPath (multi-layout track), include it in the URL
                if (track.subPath) {
                    previewUrl += `/${track.subPath}`;
                }
                
                let itemHtml = itemTemplate
                    .split('{{id}}').join(track.id)
                    .split('{{name}}').join(track.name)
                    .split('{{path}}').join(track.path)
                    .split('{{preview}}').join(previewUrl)
                    .split('{{country}}').join(track.country || '')
                    .split('{{countryName}}').join(track.countryName || '')
                    .split('{{typeName}}').join(track.typeName || '')
                    .split('{{distance}}').join(track.distance ? track.distance.toFixed(2) + ' km' : '');
                itemsHtml += itemHtml;
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
    ui.views.tracks.views.load(ui.views.tracks.results);
    ui.views.tracks.saveFilter();
};

//#endregion
