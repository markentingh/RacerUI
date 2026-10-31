//#region "Cars"

ui.views.cars = {
    filter: {
        countries: ['all'], //ISO 3166-1 alpha-2 country codes
        makes: [],//makeId int   
        models: [],//modelId int
        years: [],//4-digit year
        types: [],//typeId int
        styles: [],//styleId int
        specializations: [],//specializationId int
        search: '',
        sort: 'year',
        start: 0,
        length: 20,
        view: 'grid',
        prevView: 'grid',
    },
    results: null,
    allCars: [],
    footerHeight: 8,
    hovered: null,
    selected: null, //result object that has been selected by the user
    isLoading: false,
    hasMore: true,
    scrollListener: null,
    resizeListener: null,
    virtualDOM: {
        topHiddenRows: 0,
        bottomHiddenRows: 0
    },
    scope: null,   // element DOM lookups run inside while the view is mounted in the candidate-picker modal
    picker: null,  // (car, skinName) => void - when set, the Select Car button calls this instead of footer.selectCar
    pickerState: null // stashed page filter/grid state while the picker modal is open
};

// The picker's filter lives in its own localStorage slot so remembering it
// doesn't bleed into the cars page's filters (and vice versa)
ui.views.cars.filterKey = () =>
    ui.views.cars.scope ? 'RacerUI:cars-filter-picker' : 'RacerUI:cars-filter';

ui.views.cars.defaultFilter = () => ({
    countries: ['all'], //ISO 3166-1 alpha-2 country codes
    makes: [],//makeId int
    models: [],//modelId int
    years: [],//4-digit year
    types: [],//typeId int
    styles: [],//styleId int
    specializations: [],//specializationId int
    search: '',
    sort: 'year',
    start: 0,
    length: 20,
    view: 'grid',
    prevView: 'grid',
});

// The cars view is mounted in two places: the page's .content element and the
// footer's candidate-picker modal. All lookups run through these helpers so
// ids/classes don't collide when both instances are in the DOM at once.
ui.views.cars.qs = (sel) => (ui.views.cars.scope || document).querySelector(sel);
ui.views.cars.qsa = (sel) => (ui.views.cars.scope || document).querySelectorAll(sel);
ui.views.cars.byId = (id) => ui.views.cars.scope
    ? ui.views.cars.scope.querySelector('#' + id)
    : document.getElementById(id);

// Mounts the cars view inside an arbitrary container (the candidate-picker
// modal) - same init steps as load() minus the page-level plumbing. The
// page's filter/grid state is stashed and the picker works on its own
// filter (saved under its own localStorage key). options.onPick replaces
// the Select Car button's default action
ui.views.cars.loadInto = (container, options) => {
    options = options || {};
    ui.views.cars.scope = container;
    ui.views.cars.picker = options.onPick || null;
    ui.views.cars.pickerState = {
        filter: ui.views.cars.filter,
        results: ui.views.cars.results,
        allCars: ui.views.cars.allCars,
        selected: ui.views.cars.selected,
        hasMore: ui.views.cars.hasMore
    };
    ui.views.cars.filter = ui.views.cars.defaultFilter();
    ui.views.cars.results = null;
    ui.views.cars.allCars = [];
    ui.views.cars.selected = null;
    ui.views.cars.hasMore = true;
    if (localStorage.getItem(ui.views.cars.filterKey())) {
        ui.views.cars.filter = {...ui.views.cars.filter, ...JSON.parse(localStorage.getItem(ui.views.cars.filterKey()))};
    }
    ui.view.loadComponent('Cars/cars', (html) => {
        container.innerHTML = html;
        ui.views.cars.setupSearchListener();
        ui.views.cars.setupSortDropdown();
        ui.views.cars.updateClearFilterButton();
        ui.views.cars.getFilteredList();
        ui.views.cars.resize();
        ui.views.cars.setupInfiniteScroll();
        ui.utils.scaleUI();
    });
};

// Opens the car details modal for a car object - mounts a minimal grid so the
// existing details flow renders inside the modal body
ui.views.cars.openDetailsModal = (car, skinPath, candidate) => {
    // Compute preview/name the same way the grid does - API-sourced cars
    // don't come with car.preview populated. A candidate's chosen skin
    // drives the preview instead of the first skin
    const skin = skinPath && car.skins
        ? car.skins.find((x) => x.path === skinPath)
        : null;
    car = ui.views.cars.getCarDetails(car, skin);
    ui.view.loadComponent('Cars/car-details-modal', (html) => {
        const existing = document.getElementById('car-details-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', html);
        const backdrop = document.getElementById('car-details-modal');
        const body = backdrop.querySelector('.car-details-body');

        // Stash page state - the details flow mutates selected/scope, and
        // getCarFromItem only resolves cars present in allCars
        const stash = {
            selected: ui.views.cars.selected,
            picker: ui.views.cars.picker,
            hadCar: ui.views.cars.allCars.some((x) => x.path === car.path),
            car: car,
            candidate: candidate,
            skinPath: skinPath
        };
        if (!stash.hadCar) ui.views.cars.allCars.push(car);
        ui.views.cars.picker = (c, skin) => {
            ui.views.footer.selectCar(c, skin);
            ui.views.cars.closeDetailsModal();
        };
        ui.views.cars.scope = body;
        body.innerHTML = `<div class="cars-content"><div class="grid-view"><div class="car" data-path="${car.path}"></div></div></div>`;
        ui.views.cars.views.grid.setup();
        const item = body.querySelector('.car');
        if (item) {
            // Details open from the hover-clone's click, not the item's
            item.dispatchEvent(new Event('mouseenter'));
            const clone = body.querySelector('.hovered-clone');
            if (clone) clone.click();
        }
        backdrop.style.display = '';
        backdrop.querySelector('#car-details-close').onclick = () => {
            ui.views.cars.closeDetailsModal();
        };
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) ui.views.cars.closeDetailsModal();
        });

        // Skin changes inside the details reveal the Save Changes button -
        // it writes the new skin back onto the candidate
        body.addEventListener('click', () => {
            const saveBtn = backdrop.querySelector('#car-details-save');
            if (!saveBtn) return;
            const sel = ui.views.cars.selected;
            const changed = sel && sel.selectedSkin && sel.selectedSkin !== stash.skinPath;
            saveBtn.style.display = changed ? '' : 'none';
        });
        const saveBtn = backdrop.querySelector('#car-details-save');
        if (saveBtn) {
            saveBtn.onclick = () => {
                const sel = ui.views.cars.selected;
                if (stash.candidate && sel && sel.selectedSkin) {
                    stash.candidate.skinPath = sel.selectedSkin;
                    stash.candidate.skinName = ui.views.footer.skinDisplayName(car, sel.selectedSkin);
                    ui.views.footer.renderCandidates();
                    ui.views.footer.saveRaceSettings();
                }
                ui.views.cars.closeDetailsModal();
            };
        }
        ui.views.cars._detailsStash = stash;
    });
};

// Closes the car details modal - restores page state
ui.views.cars.closeDetailsModal = () => {
    const backdrop = document.getElementById('car-details-modal');
    if (backdrop) backdrop.remove();
    const stash = ui.views.cars._detailsStash;
    if (stash) {
        ui.views.cars.selected = stash.selected;
        ui.views.cars.picker = stash.picker;
        if (stash.car && !stash.hadCar) {
            const idx = ui.views.cars.allCars.findIndex((x) => x.path === stash.car.path);
            if (idx > -1) ui.views.cars.allCars.splice(idx, 1);
        }
        ui.views.cars._detailsStash = null;
    }
    ui.views.cars.scope = null;
};

// Unmounts the picker - DOM lookups go back to the document and the page's
// stashed filter/grid state is restored
ui.views.cars.unloadFrom = () => {
    ui.views.cars.scope = null;
    ui.views.cars.picker = null;
    if (ui.views.cars.pickerState) {
        Object.assign(ui.views.cars, ui.views.cars.pickerState);
        ui.views.cars.pickerState = null;
    }
};

ui.views.cars.load = (e) => {
    // Page mount - the view lives at document level again
    ui.views.cars.scope = null;
    ui.views.cars.picker = null;
    ui.views.cars.pickerState = null;
    //first, load filter settings from local storage
    if (localStorage.getItem(ui.views.cars.filterKey())) {
        ui.views.cars.filter = {...ui.views.cars.filter, ...JSON.parse(localStorage.getItem(ui.views.cars.filterKey()))};
    }
    if (ui.views.cars.qs('.cars-toolbar') == null) {
        //view not loaded yet
        ui.view.loadComponent(`Cars/cars`, (html) => {
            ui.nav.select('cars');
            ui.view.inject(html, 'cars');
            if (e && e.id) {
                ui.views.cars.updateNav(e.id);
            }
            ui.views.cars.setupSearchListener();
            ui.views.cars.setupSortDropdown();
            ui.views.cars.updateClearFilterButton();
            ui.views.cars.getFilteredList();
            ui.views.cars.resize();
            ui.views.cars.setupInfiniteScroll();
        });
    } else {
        //view already loaded
        if (e && e.id) {
            ui.views.cars.updateNav(e.id);
        }
        if (ui.views.cars.results == null) {
            ui.views.cars.updateClearFilterButton();
            ui.views.cars.getFilteredList();
        }
        ui.views.cars.resize();
        ui.views.cars.setupInfiniteScroll();
    }
    window.addEventListener('resize', ui.views.cars.resize);
    
    // Load footer if not already loaded
    if (!document.querySelector('.footer-container')) {
        ui.views.footer.load();
    }
};

ui.views.cars.setupSearchListener = () => {
    const searchInput = ui.views.cars.byId('search_cars');
    const searchClear = ui.views.cars.byId('search_clear');
    const clearFilterBtn = ui.views.cars.byId('clear_filter_btn');
    
    if (searchInput) {
        // Populate search field from cached filter
        if (ui.views.cars.filter.search) {
            searchInput.value = ui.views.cars.filter.search;
            if (searchClear) {
                searchClear.style.display = 'inline-block';
            }
        }
        
        // Handle Enter key to search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                ui.views.cars.filter.search = searchInput.value;
                ui.views.cars.getFilteredList();
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
                ui.views.cars.filter.search = '';
                searchClear.style.display = 'none';
                ui.views.cars.getFilteredList();
            }
        });
    }
    
    // Handle clear all filters button click
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Reset all filters to default
            ui.views.cars.filter.countries = ['all'];
            ui.views.cars.filter.makes = [];
            ui.views.cars.filter.models = [];
            ui.views.cars.filter.years = [];
            ui.views.cars.filter.classes = [];
            ui.views.cars.filter.types = [];
            ui.views.cars.filter.styles = [];
            ui.views.cars.filter.specializations = [];
            ui.views.cars.filter.search = '';
            
            // Clear search input
            if (searchInput) {
                searchInput.value = '';
                if (searchClear) {
                    searchClear.style.display = 'none';
                }
            }
            
            // Reset UI state of any open filter section
            // Country filter
            ui.views.cars.qsa('.filter-country li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.cars.qs('.filter-country li[data-country="all"]')?.classList.add('selected');
            
            // Manufacturer filter
            ui.views.cars.qsa('.filter-manufacturer li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.cars.qs('.filter-manufacturer li[data-make="0"]')?.classList.add('selected');
            
            // Year filter
            ui.views.cars.qsa('.filter-year li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.cars.qs('.filter-year li[data-year="0"]')?.classList.add('selected');
            
            // Class filter
            ui.views.cars.qsa('.filter-class li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.cars.qs('.filter-class li[data-class="all"]')?.classList.add('selected');
            
            // Type filter
            ui.views.cars.qsa('.filter-type li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.cars.qs('.filter-type li[data-type="0"]')?.classList.add('selected');
            
            // Style filter
            ui.views.cars.qsa('.filter-style li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.cars.qs('.filter-style li[data-style="0"]')?.classList.add('selected');
            
            // Specialization filter
            ui.views.cars.qsa('.filter-specialization li').forEach((li) => {
                li.classList.remove('selected');
            });
            ui.views.cars.qs('.filter-specialization li[data-specialization="0"]')?.classList.add('selected');
            
            // Reload currently open filter view if any
            const selectedNavItem = ui.views.cars.qs('.cars-toolbar li.selected');
            if (selectedNavItem) {
                const section = selectedNavItem.className.match(/item-(\w+)/)?.[1];
                if (section) {
                    // Reload the filter view
                    switch (section) {
                        case 'country':
                            ui.views.cars.country.load();
                            break;
                        case 'manufacturer':
                            ui.views.cars.manufacturer.load();
                            break;
                        case 'model':
                            ui.views.cars.model.load();
                            break;
                        case 'year':
                            ui.views.cars.year.load();
                            break;
                        case 'class':
                            ui.views.cars.class.load();
                            break;
                        case 'type':
                            ui.views.cars.type.load();
                            break;
                        case 'style':
                            ui.views.cars.style.load();
                            break;
                        case 'specialization':
                            ui.views.cars.specialization.load();
                            break;
                    }
                }
            }
            
            // Update clear filter button visibility
            ui.views.cars.updateClearFilterButton();
            
            // Reload the filtered list
            ui.views.cars.getFilteredList();
        });
    }
};

ui.views.cars.setupSortDropdown = () => {
    const sortDdl = ui.views.cars.byId('cars_sort');
    if (!sortDdl) return;
    // stale localStorage values (e.g. removed options) snap back to the default
    const valid = ['year', 'yearasc', 'country', 'manufacturer', 'model', 'rating', 'maxspeed'];
    if (!valid.includes(ui.views.cars.filter.sort)) ui.views.cars.filter.sort = 'year';
    sortDdl.value = ui.views.cars.filter.sort;
    sortDdl.addEventListener('change', () => {
        ui.views.cars.filter.sort = sortDdl.value;
        ui.views.cars.getFilteredList();
    });
};

ui.views.cars.unload = () => {
    window.removeEventListener('resize', ui.views.cars.resize);
    const container = ui.views.cars.qs('.cars-content');
    if (container && ui.views.cars.scrollListener) {
        container.removeEventListener('scroll', ui.views.cars.scrollListener);
    }
}

ui.views.cars.resize = () => {
    const el = ui.views.cars.qs('.cars-content');
    if(!el) return;
    const rect = el.getBoundingClientRect();
    if (ui.views.cars.scope) {
        // Mounted in the picker modal - fill the modal body instead of sizing
        // against the viewport
        el.style.height = '';
    } else {
        el.style.height = `calc(${window.innerHeight - rect.top}px - ${window.innerWidth <= 1920 ? ui.views.cars.footerHeight : ((ui.views.cars.footerHeight / 1920) * window.innerWidth)}em)`;
    }
    
    // Set max-height for cars-filter div accounting for scale factor
    const filterEl = ui.views.cars.qs('.cars-filter');
    if (filterEl) {
        const filterRect = filterEl.getBoundingClientRect();
        const scaleFactor = ui.utils.scaleFactor || 1;
        // On the page, keep the filter panel above the footer (expanded or
        // collapsed) - in the picker modal there is no footer below it
        const footerEl = ui.views.cars.scope ? null : document.querySelector('.footer-container');
        const footerHeight = footerEl ? footerEl.getBoundingClientRect().height : 0;
        const maxHeight = (window.innerHeight - filterRect.top - footerHeight) / scaleFactor;
        filterEl.style.maxHeight = `${maxHeight}px`;
    }
}

ui.views.cars.nav = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    var navItem = ui.views.cars.qs(`.cars-toolbar li.item-${section}`);
    if (navItem.classList.contains('selected')) {
        ui.views.cars.hideFilter();
        return false;
    }
    if (ui.views.cars.scope) {
        // Inside the picker modal - no routing (pushState would reload the
        // cars view into the page); load the filter section in place
        ui.views.cars.updateNav(section);
        return true;
    }
    history.pushState(null, '', `/dashboard/cars/${section}` + window.location.search);
    return true;
};

ui.views.cars.updateNav = (section) => {
    if (!ui.views.cars.scope) ui.nav.select('cars');
    var navItem = ui.views.cars.qs(`.cars-toolbar li.item-${section}`);
    if (navItem.classList.contains('selected')) {
        ui.views.cars.hideFilter();
        return false;
    }
    ui.views.cars.qs('.cars-toolbar li').classList.remove('selected');
    navItem.classList.add('selected');
    ui.view.loadComponent(`Cars/filter-${section}`, (html) => {
        ui.view.injectComponent(html, ui.views.cars.qs('.cars-filter'));
        switch (section) {
            case 'country':
                ui.views.cars.country.load();
                break;
            case 'manufacturer':
                ui.views.cars.manufacturer.load();
                break;
            case 'model':
                ui.views.cars.model.load();
                break;
            case 'year':
                ui.views.cars.year.load();
                break;
            case 'class':
                ui.views.cars.class.load();
                break;
            case 'type':
                ui.views.cars.type.load();
                break;
            case 'style':
                ui.views.cars.style.load();
                break;
            case 'specialization':
                ui.views.cars.specialization.load();
                break;
        }
        //show close button
        ui.views.cars.qs('.cars-toolbar .close-btn').style.display = 'block';
    });
};

ui.views.cars.hideFilter = () => {
    ui.views.cars.qs('.cars-toolbar .close-btn').style.display = 'none';
    ui.views.cars.qs('.cars-filter').innerHTML = '';
    ui.views.cars.qsa('.cars-toolbar li').forEach((li) => {
        li.classList.remove('selected');
    });
    if (!ui.views.cars.scope) {
        history.pushState(null, '', `/dashboard/cars` + window.location.search);
    }
};

ui.views.cars.saveFilter = () => {
    localStorage.setItem(ui.views.cars.filterKey(), JSON.stringify(ui.views.cars.filter));
};

ui.views.cars.hasNonModelFilters = () => {
    // Check if any filters other than models are active
    const hasCountryFilter = ui.views.cars.filter.countries.length > 0 && !ui.views.cars.filter.countries.includes('all');
    const hasMakesFilter = ui.views.cars.filter.makes.length > 0;
    const hasYearsFilter = ui.views.cars.filter.years.length > 0;
    const hasClassesFilter = ui.views.cars.filter.classes && ui.views.cars.filter.classes.length > 0;
    const hasTypesFilter = ui.views.cars.filter.types.length > 0;
    const hasStylesFilter = ui.views.cars.filter.styles.length > 0;
    const hasSpecializationsFilter = ui.views.cars.filter.specializations.length > 0;
    const hasSearchFilter = ui.views.cars.filter.search && ui.views.cars.filter.search.length > 0;

    return hasCountryFilter || hasMakesFilter || hasYearsFilter || hasClassesFilter ||
           hasTypesFilter || hasStylesFilter || hasSpecializationsFilter || hasSearchFilter;
};

ui.views.cars.hasActiveFilters = () => {
    return ui.views.cars.hasNonModelFilters() || ui.views.cars.filter.models.length > 0;
};

ui.views.cars.updateClearFilterButton = () => {
    const clearFilterBtn = ui.views.cars.byId('clear_filter_btn');
    if (clearFilterBtn) {
        if (ui.views.cars.hasActiveFilters()) {
            clearFilterBtn.parentElement.style.display = 'inline-block';
        } else {
            clearFilterBtn.parentElement.style.display = 'none';
        }
    }
};

ui.views.cars.filterByClass = (carClass) => {
    ui.views.cars.filter.classes = [carClass];
    ui.views.cars.getFilteredList();
};

ui.views.cars.filterByCountry = (country) => {
    ui.views.cars.filter.countries = [country];
    ui.views.cars.getFilteredList();
};

ui.views.cars.filterByMake = (makeId) => {
    ui.views.cars.filter.makes = [parseInt(makeId)];
    ui.views.cars.getFilteredList();
};

ui.views.cars.getFilterData = (excludeFilter) => {
    // Build filter data object, excluding the specified filter type
    const filterData = {
        Countries: excludeFilter === 'countries' ? [] : (ui.views.cars.filter.countries.includes('all') ? [] : ui.views.cars.filter.countries),
        Makes: excludeFilter === 'makes' ? [] : ui.views.cars.filter.makes,
        Years: excludeFilter === 'years' ? [] : ui.views.cars.filter.years,
        Classes: excludeFilter === 'classes' ? [] : (ui.views.cars.filter.classes || []),
        Models: excludeFilter === 'models' ? [] : ui.views.cars.filter.models,
        Types: excludeFilter === 'types' ? [] : ui.views.cars.filter.types,
        Styles: excludeFilter === 'styles' ? [] : ui.views.cars.filter.styles,
        Specializations: excludeFilter === 'specializations' ? [] : ui.views.cars.filter.specializations,
        Search: ui.views.cars.filter.search || ''
    };
    return filterData;
};

ui.views.cars.getFilteredList = (reset = true) => {
    ui.views.cars.saveFilter();
    ui.views.cars.updateClearFilterButton();
    
    if (reset) {
        ui.views.cars.filter.start = 0;
        ui.views.cars.allCars = [];
        ui.views.cars.hasMore = true;
        ui.views.cars.virtualDOM.topHiddenRows = 0;
        ui.views.cars.virtualDOM.bottomHiddenRows = 0;
    }
    
    // Prepare filter data for API (using PascalCase to match C# model)
    const filterData = {
        Countries: ui.views.cars.filter.countries.includes('all') ? [] : ui.views.cars.filter.countries,
        Makes: ui.views.cars.filter.makes,
        Models: ui.views.cars.filter.models,
        Years: ui.views.cars.filter.years,
        Classes: ui.views.cars.filter.classes || [],
        Types: ui.views.cars.filter.types,
        Styles: ui.views.cars.filter.styles,
        Specializations: ui.views.cars.filter.specializations,
        Search: ui.views.cars.filter.search || '',
        Sort: ui.views.cars.filter.sort,
        Start: ui.views.cars.filter.start,
        Length: ui.views.cars.filter.length
    };
    
    ui.ajax({
        url: '/api/cars/filter',
        method: 'POST',
        data: filterData,
        complete: (response) => {
            if (response.status == 200) {
                const data = JSON.parse(response.responseText);
                if (reset) {
                    ui.views.cars.views.load(data);
                } else {
                    ui.views.cars.views.appendCars(data);
                }
            }
        }
    });
};

ui.views.cars.setupInfiniteScroll = () => {
    const container = ui.views.cars.qs('.cars-content');
    if (!container) return;
    
    // Remove existing listener if any
    if (ui.views.cars.scrollListener) {
        container.removeEventListener('scroll', ui.views.cars.scrollListener);
    }
    
    ui.views.cars.scrollListener = () => {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        // Load more when 80% scrolled
        if (scrollTop + clientHeight >= scrollHeight * 0.8 && !ui.views.cars.isLoading && ui.views.cars.hasMore) {
            ui.views.cars.loadMore();
        }
        
        // Manage virtual DOM
        ui.views.cars.manageVirtualDOM();
    };
    
    container.addEventListener('scroll', ui.views.cars.scrollListener);
    
    // Add resize listener to recalculate virtual DOM
    if (ui.views.cars.resizeListener) {
        window.removeEventListener('resize', ui.views.cars.resizeListener);
    }
    
    ui.views.cars.resizeListener = () => {
        // Reset virtual DOM state and recalculate
        ui.views.cars.virtualDOM.topHiddenRows = 0;
        ui.views.cars.virtualDOM.bottomHiddenRows = 0;
        
        const gridView = container?.querySelector('.grid-view');
        if (gridView) {
            gridView.style.paddingTop = '0px';
            gridView.style.paddingBottom = '0px';
            
            // Show all items
            const items = Array.from(gridView.querySelectorAll('.car:not(.hovered-clone):not(.grid-details)'));
            items.forEach(item => {
                if (item.style.display === 'none') {
                    item.style.display = '';
                }
            });
        }
        
        // Recalculate virtual DOM after a short delay to let layout settle
        setTimeout(() => {
            ui.views.cars.manageVirtualDOM();
        }, 100);
    };
    
    window.addEventListener('resize', ui.views.cars.resizeListener);
};

ui.views.cars.loadMore = () => {
    if (ui.views.cars.isLoading || !ui.views.cars.hasMore) return;
    
    ui.views.cars.isLoading = true;
    ui.views.cars.filter.start += ui.views.cars.filter.length;
    ui.views.cars.getFilteredList(false);
};

ui.views.cars.manageVirtualDOM = () => {
    const container = ui.views.cars.qs('.cars-content');
    const gridView = container?.querySelector('.grid-view');
    if (!gridView) return;
    
    const items = Array.from(gridView.querySelectorAll('.car:not(.hovered-clone):not(.grid-details)'));
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
    const targetLastVisibleRow = Math.min(Math.ceil(ui.views.cars.allCars.length / columns) - 1, Math.ceil((effectiveScrollTop + effectiveViewportHeight) / rowHeight) + rowsBuffer);
    
    // Current state
    let currentTopHiddenRows = ui.views.cars.virtualDOM.topHiddenRows;
    
    // Handle scrolling down - remove from top (only if well past buffer)
    if (targetFirstVisibleRow > currentTopHiddenRows + 1) {
        currentTopHiddenRows++;
        
        // Remove first row of items from DOM by data-path
        const rowToRemove = currentTopHiddenRows - 1;
        const carsToRemove = [];
        for (let i = rowToRemove * columns; i < Math.min((rowToRemove + 1) * columns, ui.views.cars.allCars.length); i++) {
            carsToRemove.push(ui.views.cars.allCars[i]?.path);
        }
        
        items.forEach(item => {
            if (carsToRemove.includes(item.getAttribute('data-path'))) {
                item.remove();
            }
        });
        
        gridView.style.paddingTop = `${currentTopHiddenRows * rowHeight}px`;
        ui.views.cars.virtualDOM.topHiddenRows = currentTopHiddenRows;
    }
    // Handle scrolling up - add to top
    else if (targetFirstVisibleRow < currentTopHiddenRows) {
        currentTopHiddenRows--;
        
        const rowToAdd = currentTopHiddenRows;
        const startIndex = rowToAdd * columns;
        const endIndex = Math.min((rowToAdd + 1) * columns, ui.views.cars.allCars.length);
        
        ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-item`, (htmlItem) => {
            let rowHtml = '';
            for (let i = startIndex; i < endIndex; i++) {
                const car = ui.views.cars.allCars[i];
                if (car) {
                    rowHtml += ui.views.cars.views.renderCarItem(car, htmlItem);
                }
            }
            
            gridView.insertAdjacentHTML('afterbegin', rowHtml);
            ui.views.cars.views.grid.setup();
        });
        
        gridView.style.paddingTop = `${currentTopHiddenRows * rowHeight}px`;
        ui.views.cars.virtualDOM.topHiddenRows = currentTopHiddenRows;
    }
    
    // Handle bottom rows - add missing rows
    const currentItems = Array.from(gridView.querySelectorAll('.car:not(.hovered-clone):not(.grid-details)'));
    const currentPaths = new Set(currentItems.map(item => item.getAttribute('data-path')));
    
    const firstNeededIndex = currentTopHiddenRows * columns;
    const lastNeededIndex = Math.min((targetLastVisibleRow + 1) * columns - 1, ui.views.cars.allCars.length - 1);
    
    const missingCars = [];
    for (let i = firstNeededIndex; i <= lastNeededIndex; i++) {
        const car = ui.views.cars.allCars[i];
        if (car && !currentPaths.has(car.path)) {
            missingCars.push(car);
        }
    }
    
    if (missingCars.length > 0) {
        ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-item`, (htmlItem) => {
            let rowHtml = '';
            missingCars.forEach(car => {
                rowHtml += ui.views.cars.views.renderCarItem(car, htmlItem);
            });
            
            gridView.insertAdjacentHTML('beforeend', rowHtml);
            ui.views.cars.views.grid.setup();
        });
    }
    
    // Handle bottom rows - remove excess
    const totalRows = Math.ceil(ui.views.cars.allCars.length / columns);
    const bottomHiddenRows = Math.max(0, totalRows - targetLastVisibleRow - 1);
    
    if (bottomHiddenRows !== ui.views.cars.virtualDOM.bottomHiddenRows) {
        const carsToRemove = [];
        for (let row = targetLastVisibleRow + 1; row < totalRows; row++) {
            for (let i = row * columns; i < Math.min((row + 1) * columns, ui.views.cars.allCars.length); i++) {
                carsToRemove.push(ui.views.cars.allCars[i]?.path);
            }
        }
        
        const itemsToCheck = Array.from(gridView.querySelectorAll('.car:not(.hovered-clone):not(.grid-details)'));
        itemsToCheck.forEach(item => {
            if (carsToRemove.includes(item.getAttribute('data-path'))) {
                item.remove();
            }
        });
        
        gridView.style.paddingBottom = `${bottomHiddenRows * rowHeight}px`;
        ui.views.cars.virtualDOM.bottomHiddenRows = bottomHiddenRows;
    }
};

ui.views.cars.getCarDetails = (car, skin) => {
    if(skin == null){
        skin = car.skins?.length > 0 ? car.skins[0] : null;
    }
    car.preview = skin ? '/image/' + encodeURIComponent(ui.game.name) + '/skin/' + encodeURIComponent(car.path) + '/' + encodeURIComponent(skin.path) : '';
    car.name = car.name ?? car.path.replace(/_/g, ' ');
    return car;
}
//#endregion

//#region "Views"

ui.views.cars.views = {};

ui.views.cars.views.renderCarItem = (car, htmlItem) => {
    var carName = (car.year ?? '') + ' ' + car.name.replace(car.year, '');
    car = ui.views.cars.getCarDetails(car);
    return htmlItem
        .split('{{preview}}').join(car.preview || 'no-preview.jpg')
        .split('{{name}}').join(carName)
        .split('{{class}}').join(car.class)
        .split('{{description}}').join(car.description ?? '')
        .split('{{path}}').join(car.path ?? '')
        .split('{{rating}}').join(car.rating || 0)
        .split('{{countryCode}}').join((car.country || 'unknown').toLowerCase())
        .split('{{country}}').join(car.countryName || car.country || 'Unknown')
        .hasBlock('has-rating', (car.rating || 0) > 0);
};

ui.views.cars.views.load = (list) => {
    if (list) {
        ui.views.cars.results = list;
        ui.views.cars.allCars = list.cars || [];
        ui.views.cars.hasMore = list.cars && list.cars.length >= ui.views.cars.filter.length;
    }else{
        list = ui.views.cars.results;
    }
    
    // Check if no cars found - show empty results view
    if (!list.cars || list.cars.length === 0) {
        ui.view.loadComponent('Cars/empty-results', (htmlEmpty) => {
            ui.view.injectComponent(htmlEmpty, ui.views.cars.qs('.cars-content'));
        });
        ui.views.cars.isLoading = false;
        return;
    }
    
    //load view
    ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-view`, (htmlView) => {
        ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-item`, (htmlItem) => {
            var output = '';
            list.cars.forEach((car) => {
                output += ui.views.cars.views.renderCarItem(car, htmlItem);
            });

            //set up view
            const car = list.cars.length > 0 ? list.cars[0] : null;
            var carName = (car.year ?? '') + ' ' + car.name.replace(car.year, '');
            if(car == null) return;
            switch(ui.views.cars.filter.view){
                case 'gallery':
                    ui.view.injectComponent(htmlView
                        .split('{{name}}').join(carName)
                        .split('{{items}}').join(output)
                        .split('{{preview}}').join(car.preview)
                        , ui.views.cars.qs('.cars-content'));
                    ui.views.cars.views.gallery.setup();
                    break;
                case 'grid': case 'gridxl': case 'gridsm':
                    ui.view.injectComponent(htmlView.split('{{items}}').join(output), ui.views.cars.qs('.cars-content'));
                    ui.views.cars.views.grid.setup();
                    break;
                default:
                    ui.view.injectComponent(htmlView.split('{{items}}').join(output), ui.views.cars.qs('.cars-content'));
                    break;
            }
            ui.views.cars.isLoading = false;
            ui.views.cars.resize();
            ui.views.cars.setupInfiniteScroll();
            ui.views.cars.checkOverflowLoad();
        });
    });
};

// If the grid doesn't overflow its container, no scroll event can ever fire
// and infinite scroll stalls on the first page - keep loading until the
// container scrolls or the results run out
ui.views.cars.checkOverflowLoad = () => {
    const container = ui.views.cars.qs('.cars-content');
    if (container && container.scrollHeight <= container.clientHeight
        && ui.views.cars.hasMore && !ui.views.cars.isLoading) {
        ui.views.cars.loadMore();
    }
};

ui.views.cars.views.appendCars = (list) => {
    if (!list || !list.cars || list.cars.length === 0) {
        ui.views.cars.hasMore = false;
        ui.views.cars.isLoading = false;
        return;
    }
    
    ui.views.cars.allCars = ui.views.cars.allCars.concat(list.cars);
    ui.views.cars.hasMore = list.cars.length >= ui.views.cars.filter.length;
    
    ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-item`, (htmlItem) => {
        const gridView = ui.views.cars.qs('.cars-content .grid-view');
        if (!gridView) {
            ui.views.cars.isLoading = false;
            return;
        }
        
        list.cars.forEach((car) => {
            const output = ui.views.cars.views.renderCarItem(car, htmlItem);
            gridView.insertAdjacentHTML('beforeend', output);
        });
        
        ui.views.cars.views.grid.setup();
        ui.views.cars.isLoading = false;
        ui.views.cars.checkOverflowLoad();
    });
};

ui.views.cars.views.changeView = (view) => {
    ui.views.cars.filter.view = view;
    ui.views.cars.filter.start = 0;
    ui.views.cars.allCars = [];
    ui.views.cars.hasMore = true;
    ui.views.cars.views.load();
    ui.views.cars.saveFilter();
};

ui.views.cars.views.grid = {
    detailsDiv: null,
    setup: () => {
        ui.views.cars.qsa('.grid-view > .car').forEach((item) => {
            item.onmouseenter = (e) => {
                //hover over car grid item
                e.preventDefault();
                e.stopPropagation();
                //stop if already hovered
                if(item.querySelector('.hovered-clone')) return;
                if(ui.views.cars.hovered != null){
                    //hide previously hovered car grid item clone
                    const hovered = ui.views.cars.hovered;
                    hovered.classList.add('hiding');
                    setTimeout(() => {
                        if(hovered != null){
                            hovered.remove();
                        }
                    }, 250);
                }

                //clone car grid item
                const car = ui.views.cars.views.grid.getCarFromItem(item);
                const clone = item.cloneNode(true);
                clone.className += ' hovered-clone';
                clone.onmouseover = null;
                clone.style.zIndex = 1;
                item.prepend(clone);
                ui.views.cars.hovered = clone;

                clone.onclick = (e) => {
                    //click on car grid item clone
                    e.preventDefault();
                    e.stopPropagation();
                        ui.views.cars.views.grid.details(car, item);
                };
                clone.onmouseleave = (e) => {
                    //leave car grid item clone
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
    details: (car, item) => {
        //display car details within the grid
        // Check if the clicked car is already selected
        if (ui.views.cars.selected && ui.views.cars.selected.car && ui.views.cars.selected.car.path === car.path) {
            // Hide details if the same car is clicked again
            const detailsDiv = ui.views.cars.qs('.grid-details');
            if (detailsDiv) {
                detailsDiv.classList.add('hiding');
                setTimeout(() => {
                    if (detailsDiv) {
                        detailsDiv.remove();
                    }
                    if (ui.views.cars.selected && ui.views.cars.selected.item) {
                        ui.views.cars.selected.item.classList.remove('selected');
                    }
                    ui.views.cars.selected = null;
                }, 350);
            }
            return;
        }
        ui.view.loadComponent(`Cars/grid-details`, (html) => {
            const detailsDiv = ui.views.cars.qs('.grid-details');
            if(detailsDiv != null){
                detailsDiv.classList.add('hiding');
                setTimeout(() => {
                    if(detailsDiv != null){
                        detailsDiv.remove();
                    }
                }, 350);
            }
            // Remove selected class from previously selected item
            if (ui.views.cars.selected && ui.views.cars.selected.item) {
                ui.views.cars.selected.item.classList.remove('selected');
            }
            console.log(car);
            
            // Load skin-item template and render skins
            ui.view.loadComponent(`Cars/skin-item`, (skinItemHtml) => {
                let skinsOutput = '';
                if (car.skins && car.skins.length > 0) {
                    car.skins.forEach((skin) => {
                        const liveryPath = `/image/assetto corsa/livery/${car.path}/${skin.path}`;
                        const previewPath = `/image/assetto corsa/skin/${car.path}/${skin.path}`;
                        skinsOutput += skinItemHtml
                            .split('{{livery}}').join(liveryPath)
                            .split('{{preview}}').join(previewPath)
                            .split('{{skinPath}}').join(skin.path)
                            .split('{{skinId}}').join(skin.id)
                            .split('{{skinName}}').join(skin.name || '');
                    });
                }
                
                const view = html
                .split('{{preview}}').join(car.preview)
                .split('{{skins}}').join(skinsOutput)
                .split('{{name}}').join(car.year + ' ' + car.name.replace(car.year, ''))
                .split('{{year}}').join(car.year || 'N/A')
                .split('{{country}}').join(car.countryName || car.country || 'Unknown')
                .split('{{countryCode}}').join((car.country || 'unknown').toLowerCase())
                .split('{{class}}').join(car.class ? ui.utils.strings.capitalize(car.class).replace('Gt', 'GT') : '')
                .split('{{make}}').join(car.makeName || '')
                .split('{{makeId}}').join(car.makeId || '')
                .split('{{shifter}}').join(car.gears ?? '')
                .split('{{author}}').join(car.author || '')
                .split('{{maxSpeed}}').join(car.maxSpeed ? car.maxSpeed + ' km/h' : 'N/A')
                .split('{{maxBHP}}').join(car.maxBHP || 'N/A')
                .split('{{zeroTo60mph}}').join(car.zeroTo60mph ? car.zeroTo60mph + 's' : 'N/A')
                .split('{{gears}}').join(car.gears || 'N/A')
                .split('{{description}}').join(car.description || '')
                .split('{{details}}').join(car.details || '')
                .split('{{id}}').join(car.id)
                .split('{{rating}}').join(car.rating || 0)
                .hasBlock('has-country', car.countryName || car.country)
                .hasBlock('has-max-speed', car.maxSpeed)
                .hasBlock('has-max-bhp', car.maxBHP)
                .hasBlock('has-mph', car.zeroTo60mph)
                .hasBlock('has-shifter', car.shifter)
                .hasBlock('has-details', car.details.replace(/\n/g, '<br/><br/>'));
                item.insertAdjacentHTML('afterend', view);
                ui.views.cars.views.grid.detailsDiv = item.nextSibling;
                ui.views.cars.selected = {car, item};

                // Keep the model + grid-item badge in sync when a rating saves
                ui.views.cars.views.grid.detailsDiv.addEventListener('rated', (e) => {
                    car.rating = e.detail.rating;
                    ui.views.cars.views.grid.applyRating(item, car);
                });

                // Add selected class to the item
                item.classList.add('selected');

                // Setup skin hover and click handlers
                ui.views.cars.views.grid.setupSkinHandlers();
                
                // Setup tab handlers
                ui.views.cars.views.grid.setupTabHandlers();
                
                // Setup select car button handler
                ui.views.cars.views.grid.setupSelectCarHandler();

                // Setup button hover effects
                ui.views.cars.views.grid.setupButtonHoverEffects();

                // Load the power/torque graph
                ui.views.cars.views.grid.setupPowerGraph(car);

                // Pencil icon in the details header opens the edit form
                ui.views.cars.carEdit.init(ui.views.cars.views.grid.detailsDiv, car);
                
                setTimeout(() => {
                    //scroll to car details
                    ui.scrollTo(ui.views.cars.qs('.cars-content'), item, 500, 'easeInOutQuad', 0);
                }, 350);
            });
        });
    },
    setupSelectCarHandler: () => {
        // Add event listeners to all select car buttons
        const selectCarBtns = ui.views.cars.qsa('.select-car-btn');
        selectCarBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                // Get the selected car and skin from ui.views.cars.selected
                if (ui.views.cars.selected && ui.views.cars.selected.car) {
                    let skinName = ui.views.cars.selected.selectedSkin || null;
                    
                    // If no skin is selected, use the first skin from the car
                    if (!skinName && ui.views.cars.selected.car.skins && ui.views.cars.selected.car.skins.length > 0) {
                        skinName = ui.views.cars.selected.car.skins[0].path;
                    }

                    if (ui.views.cars.picker) {
                        // Mounted in the footer's candidate-picker modal - the
                        // selection goes to the race candidate list instead
                        ui.views.cars.picker(ui.views.cars.selected.car, skinName);
                    } else {
                        // Update footer with car and skin info
                        ui.views.footer.selectCar(ui.views.cars.selected.car, skinName);
                    }
                }
            });
        });
    },
    setupButtonHoverEffects: () => {
        const buttons = ui.views.cars.qsa('.select-car-btn');
        
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
    setupTabHandlers: () => {
        const tabButtons = ui.views.cars.qsa('.car-tab');

        tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Remove active class from all tabs and contents - re-query
                // contents at click time, the edit-mode panes are injected
                // after this handler binds
                tabButtons.forEach(btn => btn.classList.remove('active'));
                ui.views.cars.qsa('.car-tab-content').forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                const targetContent = ui.views.cars.qs(`.car-tab-content[data-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    },
    setupSkinHandlers: () => {
        const skinItems = ui.views.cars.qsa('.skin-item');
        
        skinItems.forEach((skinItem) => {
            // Wrap skin-item in a positioned container
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            skinItem.parentNode.insertBefore(wrapper, skinItem);
            wrapper.appendChild(skinItem);
            
            // Create hover clone
            const clone = skinItem.cloneNode(true);
            clone.classList.add('skin-hovered-clone');
            wrapper.appendChild(clone);
            
            // Hover handlers
            skinItem.addEventListener('mouseenter', () => {
                clone.style.display = 'block';
                clone.classList.add('growing');
            });
            
            skinItem.addEventListener('mouseleave', () => {
                clone.classList.remove('growing');
                clone.classList.add('shrinking');
                setTimeout(() => {
                    clone.style.display = 'none';
                    clone.classList.remove('shrinking');
                }, 300);
            });
            
            // Click handler to change preview (only on original, clone has pointer-events: none)
            skinItem.parentNode.addEventListener('click', () => {
                const previewContainer = ui.views.cars.qs('.grid-details .preview-container');
                const oldPreviewDiv = ui.views.cars.qs('.grid-details .preview');
                const previewPath = skinItem.getAttribute('data-preview');
                const skinName = skinItem.getAttribute('data-skin');
                
                // Remove selected class from all skins
                ui.views.cars.qsa('.skin-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Add selected class to clicked skin
                skinItem.classList.add('selected');
                
                // Store selected skin in ui.views.cars.selected object
                if (ui.views.cars.selected) {
                    ui.views.cars.selected.selectedSkin = skinName;
                }
                
                if (previewContainer && oldPreviewDiv && previewPath) {
                    // Create new preview div
                    const newPreviewDiv = document.createElement('div');
                    newPreviewDiv.className = 'preview preview-fade-in';
                    newPreviewDiv.style.backgroundImage = `url('${previewPath}')`;
                    
                    // Insert new preview before old one
                    previewContainer.insertBefore(newPreviewDiv, oldPreviewDiv);
                    
                    // Trigger fade-in animation
                    setTimeout(() => {
                        newPreviewDiv.classList.add('visible');
                    }, 10);
                    
                    // Remove old preview after fade-in completes
                    setTimeout(() => {
                        oldPreviewDiv.remove();
                        newPreviewDiv.classList.remove('preview-fade-in', 'visible');
                    }, 510); // 500ms fade + 10ms buffer
                }
            });
        });
    },
    getCarFromItem: (item) => {
        const car = ui.views.cars.allCars.find((car) => {
            return car.path == item.getAttribute('data-path');
        });
        return car;
    },
    setupPowerGraph: (car) => {
        const container = ui.views.cars.views.grid.detailsDiv && ui.views.cars.views.grid.detailsDiv.querySelector
            ? ui.views.cars.views.grid.detailsDiv.querySelector('.car-graph')
            : ui.views.cars.qs('.grid-details .car-graph');
        if (!container || !car.id) return;
        ui.ajax({
            url: `/api/cars/${car.id}/powercurve`,
            method: 'GET',
            complete: (response) => {
                try {
                    const data = JSON.parse(response.responseText);
                    ui.views.cars.views.grid.renderPowerGraph(container, data);
                } catch (error) {
                    console.error('Error loading power curve:', error);
                }
            }
        });
    },
    renderPowerGraph: (container, data) => {
        const rpm = data.rpm || data.Rpm || [];
        const torque = data.torque || data.Torque || [];
        const power = data.power || data.Power || [];
        if (rpm.length < 2) return;

        const W = 640, H = 248;
        const m = { left: 56, right: 56, top: 14, bottom: 40 };
        const pw = W - m.left - m.right;
        const ph = H - m.top - m.bottom;

        // domain floor is 0 - negative rpm entries (engine braking data in
        // some luts) stay in the series but are clipped at the left axis edge
        const rpmMin = Math.max(0, Math.min.apply(null, rpm));
        const rpmMax = Math.max.apply(null, rpm);

        // round a max value up to 5 "nice" tick steps (1/2/2.5/5 x 10^n)
        const niceScale = (v) => {
            const raw = (v || 1) / 5;
            const mag = Math.pow(10, Math.floor(Math.log10(raw)));
            const norm = raw / mag;
            const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
            return { step, max: step * 5 };
        };
        const t = niceScale(Math.max.apply(null, torque));
        const p = niceScale(Math.max.apply(null, power));

        const x = (r) => m.left + (r - rpmMin) / (rpmMax - rpmMin || 1) * pw;
        const yT = (v) => m.top + ph - v / t.max * ph;
        const yP = (v) => m.top + ph - v / p.max * ph;
        const f = (n) => Math.round(n * 100) / 100;

        let svg = `<svg class="pt-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;

        // horizontal gridlines + left (Nm) / right (bhp) labels
        for (let i = 0; i <= 5; i++) {
            const y = f(m.top + ph - i / 5 * ph);
            svg += `<line class="pt-grid" x1="${m.left}" y1="${y}" x2="${m.left + pw}" y2="${y}"/>`;
            svg += `<text class="pt-label pt-tick-torque" x="${m.left - 6}" y="${f(y + 4)}" text-anchor="end">${Math.round(t.step * i)}</text>`;
            svg += `<text class="pt-label pt-tick-power" x="${m.left + pw + 6}" y="${f(y + 4)}" text-anchor="start">${Math.round(p.step * i)}</text>`;
        }

        // axis frame: bottom + left + right
        svg += `<line class="pt-axis" x1="${m.left}" y1="${m.top + ph}" x2="${m.left + pw}" y2="${m.top + ph}"/>`;
        svg += `<line class="pt-axis" x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${m.top + ph}"/>`;
        svg += `<line class="pt-axis" x1="${m.left + pw}" y1="${m.top}" x2="${m.left + pw}" y2="${m.top + ph}"/>`;

        // rpm ticks along the bottom (5-7 nice round values inside the range)
        const rpmStep = niceScale(rpmMax - rpmMin).step;
        for (let r = Math.ceil(rpmMin / rpmStep) * rpmStep; r <= rpmMax; r += rpmStep) {
            svg += `<line class="pt-grid" x1="${f(x(r))}" y1="${m.top}" x2="${f(x(r))}" y2="${m.top + ph}"/>`;
            svg += `<text class="pt-label" x="${f(x(r))}" y="${m.top + ph + 16}" text-anchor="middle">${r}</text>`;
        }

        // rpm label centered below the plot + series legend aligned far right
        const legendY = H - 10;
        const e = m.left + pw;
        svg += `<text class="pt-label" x="${f(m.left + pw / 2)}" y="${legendY}" text-anchor="middle">rpm</text>`;
        svg += `<text class="pt-label pt-legend-torque" x="${f(e)}" y="${legendY}" text-anchor="end">torque</text>`;
        svg += `<line class="pt-line pt-line-torque" x1="${f(e - 68)}" y1="${legendY - 4}" x2="${f(e - 44)}" y2="${legendY - 4}"/>`;
        svg += `<text class="pt-label pt-legend-power" x="${f(e - 84)}" y="${legendY}" text-anchor="end">power</text>`;
        svg += `<line class="pt-line pt-line-power" x1="${f(e - 150)}" y1="${legendY - 4}" x2="${f(e - 124)}" y2="${legendY - 4}"/>`;

        // unit labels rotated 90deg, centered on their axes
        const cy = m.top + ph / 2;
        svg += `<text class="pt-label pt-legend-torque" x="14" y="${f(cy)}" text-anchor="middle" transform="rotate(-90 14 ${f(cy)})">Nm</text>`;
        svg += `<text class="pt-label pt-legend-power" x="${W - 14}" y="${f(cy)}" text-anchor="middle" transform="rotate(-90 ${W - 14} ${f(cy)})">bhp</text>`;

        // series polylines - clipped to the plot area so out-of-range
        // points (negative rpm/torque) never draw outside the axes
        const torquePts = rpm.map((r, i) => `${f(x(r))},${f(yT(torque[i]))}`).join(' ');
        const powerPts = rpm.map((r, i) => `${f(x(r))},${f(yP(power[i]))}`).join(' ');
        svg += `<defs><clipPath id="pt-clip"><rect x="${m.left}" y="${m.top}" width="${pw}" height="${ph}"/></clipPath></defs>`;
        svg += `<g clip-path="url(#pt-clip)">`;
        svg += `<polyline class="pt-line pt-line-torque" points="${torquePts}"/>`;
        svg += `<polyline class="pt-line pt-line-power" points="${powerPts}"/>`;
        svg += `</g>`;

        svg += `</svg>`;
        container.innerHTML = svg;
    },
    applyRating: (item, car) => {
        // Create or update the filled-stars badge on a car grid item
        let badge = item.querySelector('rating-stars.rating-badge');
        if ((car.rating || 0) <= 0) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('rating-stars');
            badge.className = 'rating-badge';
            badge.setAttribute('filled-only', '');
            badge.setAttribute('readonly', '');
            badge.setAttribute('rating', String(car.rating));
            item.prepend(badge);
        } else {
            badge.setAttribute('rating', String(car.rating));
        }
    }
}

ui.views.cars.views.gallery = {
    setup: () => {
    }
}


//#endregion

//#region "View Filter"

ui.views.cars.view = {};

ui.views.cars.view.load = () => {
    //load selected countries
    if (ui.views.cars.filter.countries.length > 0) {
        ui.views.cars.qsa('.filter-country li').forEach((li) => {
            if (ui.views.cars.filter.countries.includes(li.getAttribute('data-country'))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    ui.views.cars.qsa('.filter-view li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.view.select(li.getAttribute('data-view'));
        }
    });
};

ui.views.cars.view.select = (view) => {
    ui.views.cars.filter.view = view;
    ui.views.cars.qsa('.filter-view li').forEach((li) => {
        li.classList.remove('selected');
    });
    ui.views.cars.qsa('.filter-view li[data-view="' + view + '"]').forEach((li) => {
        li.classList.add('selected');
    });
};

//#endregion

//#region "Country Filter"

ui.views.cars.country = {};

ui.views.cars.country.load = () => {
    // Load template
    ui.view.loadComponent('Cars/filter-country-item', (itemTemplate) => {
        // Fetch countries data with current filter state
        ui.ajax({
            url: '/api/cars/countries',
            method: 'POST',
            data: ui.views.cars.getFilterData('countries'),
            complete: (response) => {
                try {
                    const countries = JSON.parse(response.responseText);
                    
                    const container = ui.views.cars.qs('.filter-country .select-list');
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
                    
                    // Set up click handlers after populating
                    ui.views.cars.qsa('.filter-country li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.country.select(li.getAttribute('data-country'));
                        }
                    });
                    
                    // Load selected countries
                    if (ui.views.cars.filter.countries.length > 0) {
                        ui.views.cars.qsa('.filter-country li').forEach((li) => {
                            if (ui.views.cars.filter.countries.includes(li.getAttribute('data-country'))) {
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

ui.views.cars.country.select = (country) => {
    if (country == 'all') {
        ui.views.cars.filter.countries = ['all'];
        ui.views.cars.qsa('.filter-country li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.countries.includes(country)) {
            ui.views.cars.filter.countries.splice(ui.views.cars.filter.countries.indexOf(country), 1);
        } else {
            ui.views.cars.filter.countries.push(country);
        }
        if (ui.views.cars.filter.countries.indexOf('all') > -1) {
            ui.views.cars.filter.countries.splice(ui.views.cars.filter.countries.indexOf('all'), 1);
        }
        ui.views.cars.qsa('.filter-country li[data-country="all"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    ui.views.cars.qsa('.filter-country li[data-country="' + country + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Manufacturer Filter"

ui.views.cars.manufacturer = {};

ui.views.cars.manufacturer.load = () => {
    ui.view.loadComponent('Cars/filter-manufacturer-item', (itemTemplate) => {
        ui.ajax({
            url: '/api/cars/manufacturers',
            method: 'POST',
            data: ui.views.cars.getFilterData('makes'),
            complete: (response) => {
                try {
                    const manufacturers = JSON.parse(response.responseText);
                    
                    const container = ui.views.cars.qs('.filter-manufacturer .select-list');
                    if (!container) {
                        console.error('Container .filter-manufacturer .select-list not found');
                        return;
                    }
                    
                    container.innerHTML = '<li data-make="0">All Manufacturers</li>';
                    
                    manufacturers.forEach(make => {
                        let itemHtml = itemTemplate
                            .split('{{id}}').join(make.id)
                            .split('{{name}}').join(make.name);
                        container.innerHTML += itemHtml;
                    });
                    
                    ui.views.cars.qsa('.filter-manufacturer li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.manufacturer.select(parseInt(li.getAttribute('data-make')));
                        }
                    });
                    
                    if (ui.views.cars.filter.makes.length > 0) {
                        ui.views.cars.qsa('.filter-manufacturer li').forEach((li) => {
                            if (ui.views.cars.filter.makes.includes(parseInt(li.getAttribute('data-make')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        ui.views.cars.qs('.filter-manufacturer li[data-make="0"]')?.classList.add('selected');
                    }
                } catch (error) {
                    console.error('Error loading manufacturers:', error);
                }
            }
        });
    });
};

ui.views.cars.manufacturer.select = (makeId) => {
    if (makeId == 0) { // Assuming 0 is the 'all' value for manufacturers
        ui.views.cars.filter.makes = [];
        ui.views.cars.qsa('.filter-manufacturer li').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qs('.filter-manufacturer li[data-make="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.makes.includes(makeId)) {
            ui.views.cars.filter.makes.splice(ui.views.cars.filter.makes.indexOf(makeId), 1);
        } else {
            ui.views.cars.filter.makes.push(makeId);
        }
        ui.views.cars.qsa('.filter-manufacturer li[data-make="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qsa('.filter-manufacturer li[data-make="' + makeId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no manufacturers selected, select 'All'
        if (ui.views.cars.filter.makes.length === 0) {
            ui.views.cars.qs('.filter-manufacturer li[data-make="0"]')?.classList.add('selected');
        }
    }
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Model Filter"

ui.views.cars.model = {};

ui.views.cars.model.load = () => {
    const container = ui.views.cars.qs('.filter-model .select-list');
    if (!container) return;

    // Models are a narrowing filter - they are only listed once another
    // filter is active, never fetched for the whole catalog
    if (!ui.views.cars.hasNonModelFilters()) {
        container.innerHTML = '<li class="filter-hint">Select a manufacturer, class or year to list models</li>';
        return;
    }

    ui.view.loadComponent('Cars/filter-model-item', (itemTemplate) => {
        ui.ajax({
            url: '/api/cars/models',
            method: 'POST',
            data: ui.views.cars.getFilterData('models'),
            complete: (response) => {
                try {
                    const models = JSON.parse(response.responseText);
                    container.innerHTML = '<li data-model="0">All Models</li>';

                    models.forEach(model => {
                        let itemHtml = itemTemplate
                            .split('{{id}}').join(model.id)
                            .split('{{name}}').join(model.name);
                        container.innerHTML += itemHtml;
                    });

                    ui.views.cars.qsa('.filter-model li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.model.select(parseInt(li.getAttribute('data-model')));
                        }
                    });

                    if (ui.views.cars.filter.models.length > 0) {
                        ui.views.cars.qsa('.filter-model li').forEach((li) => {
                            if (ui.views.cars.filter.models.includes(parseInt(li.getAttribute('data-model')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        ui.views.cars.qs('.filter-model li[data-model="0"]')?.classList.add('selected');
                    }
                } catch (error) {
                    console.error('Error loading models:', error);
                }
            }
        });
    });
};

ui.views.cars.model.select = (modelId) => {
    if (modelId == 0) { // Assuming 0 is the 'all' value for models
        ui.views.cars.filter.models = [];
        ui.views.cars.qsa('.filter-model li').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qs('.filter-model li[data-model="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.models.includes(modelId)) {
            ui.views.cars.filter.models.splice(ui.views.cars.filter.models.indexOf(modelId), 1);
        } else {
            ui.views.cars.filter.models.push(modelId);
        }
        ui.views.cars.qsa('.filter-model li[data-model="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        // If no models selected, select 'All'
        if (ui.views.cars.filter.models.length === 0) {
            ui.views.cars.qs('.filter-model li[data-model="0"]')?.classList.add('selected');
        }
    }
    ui.views.cars.qsa('.filter-model li[data-model="' + modelId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Year Filter"

ui.views.cars.year = {};

ui.views.cars.year.load = () => {
    ui.view.loadComponent('Cars/filter-year-item', (itemTemplate) => {
        ui.ajax({
            url: '/api/cars/years',
            method: 'POST',
            data: ui.views.cars.getFilterData('years'),
            complete: (response) => {
                try {
                    const years = JSON.parse(response.responseText);
                    
                    const container = ui.views.cars.qs('.filter-year .select-list');
                    if (!container) {
                        console.error('Container .filter-year .select-list not found');
                        return;
                    }
                    
                    container.innerHTML = '<li data-year="0">All Years</li>';
                    
                    years.forEach(year => {
                        let itemHtml = itemTemplate
                            .split('{{year}}').join(year);
                        container.innerHTML += itemHtml;
                    });
                    
                    ui.views.cars.qsa('.filter-year li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.year.select(parseInt(li.getAttribute('data-year')));
                        }
                    });
                    
                    if (ui.views.cars.filter.years.length > 0) {
                        ui.views.cars.qsa('.filter-year li').forEach((li) => {
                            if (ui.views.cars.filter.years.includes(parseInt(li.getAttribute('data-year')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        ui.views.cars.qs('.filter-year li[data-year="0"]')?.classList.add('selected');
                    }
                } catch (error) {
                    console.error('Error loading years:', error);
                }
            }
        });
    });
};

ui.views.cars.year.select = (year) => {
    if (year == 0) { // Assuming 0 is the 'all' value for years
        ui.views.cars.filter.years = [];
        ui.views.cars.qsa('.filter-year li').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qs('.filter-year li[data-year="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.years.includes(year)) {
            ui.views.cars.filter.years.splice(ui.views.cars.filter.years.indexOf(year), 1);
        } else {
            ui.views.cars.filter.years.push(year);
        }
        ui.views.cars.qsa('.filter-year li[data-year="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qsa('.filter-year li[data-year="' + year + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no years selected, select 'All'
        if (ui.views.cars.filter.years.length === 0) {
            ui.views.cars.qs('.filter-year li[data-year="0"]')?.classList.add('selected');
        }
    }
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Type Filter"

ui.views.cars.type = {};

ui.views.cars.type.load = () => {
    ui.view.loadComponent('Cars/filter-type-item', (itemTemplate) => {
        ui.ajax({
            url: '/api/cars/types',
            method: 'POST',
            data: ui.views.cars.getFilterData('types'),
            complete: (response) => {
                try {
                    const types = JSON.parse(response.responseText);
                    
                    const container = ui.views.cars.qs('.filter-type .select-list');
                    if (!container) {
                        console.error('Container .filter-type .select-list not found');
                        return;
                    }
                    
                    container.innerHTML = '<li data-type="0">All Types</li>';
                    
                    types.forEach(type => {
                        let itemHtml = itemTemplate
                            .split('{{id}}').join(type.id)
                            .split('{{name}}').join(type.name);
                        container.innerHTML += itemHtml;
                    });
                    
                    ui.views.cars.qsa('.filter-type li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.type.select(parseInt(li.getAttribute('data-type')));
                        }
                    });
                    
                    if (ui.views.cars.filter.types.length > 0) {
                        ui.views.cars.qsa('.filter-type li').forEach((li) => {
                            if (ui.views.cars.filter.types.includes(parseInt(li.getAttribute('data-type')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        ui.views.cars.qs('.filter-type li[data-type="0"]')?.classList.add('selected');
                    }
                } catch (error) {
                    console.error('Error loading types:', error);
                }
            }
        });
    });
};

ui.views.cars.type.select = (typeId) => {
    if (typeId == 0) { // Assuming 0 is the 'all' value for types
        ui.views.cars.filter.types = [];
        ui.views.cars.qsa('.filter-type li').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qs('.filter-type li[data-type="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.types.includes(typeId)) {
            ui.views.cars.filter.types.splice(ui.views.cars.filter.types.indexOf(typeId), 1);
        } else {
            ui.views.cars.filter.types.push(typeId);
        }
        ui.views.cars.qsa('.filter-type li[data-type="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qsa('.filter-type li[data-type="' + typeId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no types selected, select 'All'
        if (ui.views.cars.filter.types.length === 0) {
            ui.views.cars.qs('.filter-type li[data-type="0"]')?.classList.add('selected');
        }
    }
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Class Filter"

ui.views.cars.class = {};

ui.views.cars.class.load = () => {
    // Load templates
    ui.view.loadComponent('Cars/filter-class-category', (categoryTemplate) => {
        ui.view.loadComponent('Cars/filter-class-item', (itemTemplate) => {
            // Fetch car classes data
            ui.ajax({
                url: '/api/cars/classes',
                method: 'POST',
                data: ui.views.cars.getFilterData('classes'),
                complete: (response) => {
                    try {
                        const classesByCategory = JSON.parse(response.responseText);
                        
                        const container = ui.views.cars.qs('.filter-class .select-list');
                        container.innerHTML = '<li data-class="all">All Classes</li>';
                        
                        classesByCategory.forEach(category => {
                            // Create category section from template
                            let categoryHtml = categoryTemplate.split('{{category}}').join(category.category);
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = categoryHtml;
                            const categoryElement = tempDiv.firstElementChild;
                            
                            // Get the class list UL element
                            const classList = categoryElement.querySelector('.class-list');
                            
                            // Add each class item
                            category.classes.forEach(carClass => {
                                let itemHtml = itemTemplate
                                    .split('{{class}}').join(carClass.name)
                                    .split('{{name}}').join(carClass.name);
                                classList.innerHTML += itemHtml;
                            });
                            
                            container.appendChild(categoryElement);
                        });
                        
                        // Set up click handlers after populating
                        ui.views.cars.qsa('.filter-class li').forEach((li) => {
                            li.onclick = (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                ui.views.cars.class.select(li.getAttribute('data-class'));
                            }
                        });
                        
                        // Load selected classes
                        if (ui.views.cars.filter.classes && ui.views.cars.filter.classes.length > 0) {
                            ui.views.cars.qsa('.filter-class li').forEach((li) => {
                                if (ui.views.cars.filter.classes.includes(li.getAttribute('data-class'))) {
                                    li.classList.add('selected');
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Error loading car classes:', error);
                    }
                }
            });
        });
    });
};

ui.views.cars.class.select = (className) => {
    if (!ui.views.cars.filter.classes) {
        ui.views.cars.filter.classes = [];
    }
    
    if (className === 'all') {
        ui.views.cars.filter.classes = [];
        ui.views.cars.qsa('.filter-class li').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qs('.filter-class li[data-class="all"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.classes.includes(className)) {
            ui.views.cars.filter.classes.splice(ui.views.cars.filter.classes.indexOf(className), 1);
        } else {
            ui.views.cars.filter.classes.push(className);
        }
        ui.views.cars.qsa('.filter-class li[data-class="all"]').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qsa('.filter-class li[data-class="' + className + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no classes selected, select 'All'
        if (ui.views.cars.filter.classes.length === 0) {
            ui.views.cars.qs('.filter-class li[data-class="all"]')?.classList.add('selected');
        }
    }
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Style Filter"

ui.views.cars.style = {};

ui.views.cars.style.load = () => {
    ui.view.loadComponent('Cars/filter-style-item', (itemTemplate) => {
        ui.ajax({
            url: '/api/cars/styles',
            method: 'POST',
            data: ui.views.cars.getFilterData('styles'),
            complete: (response) => {
                try {
                    const styles = JSON.parse(response.responseText);
                    
                    const container = ui.views.cars.qs('.filter-style .select-list');
                    container.innerHTML = '<li data-style="0">All Styles</li>';
                    
                    styles.forEach(style => {
                        let itemHtml = itemTemplate
                            .split('{{id}}').join(style.id)
                            .split('{{name}}').join(style.name);
                        container.innerHTML += itemHtml;
                    });
                    
                    ui.views.cars.qsa('.filter-style li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.style.select(parseInt(li.getAttribute('data-style')));
                        }
                    });
                    
                    if (ui.views.cars.filter.styles.length > 0) {
                        ui.views.cars.qsa('.filter-style li').forEach((li) => {
                            if (ui.views.cars.filter.styles.includes(parseInt(li.getAttribute('data-style')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        ui.views.cars.qs('.filter-style li[data-style="0"]')?.classList.add('selected');
                    }
                } catch (error) {
                    console.error('Error loading styles:', error);
                }
            }
        });
    });
};

ui.views.cars.style.select = (styleId) => {
    if (styleId == 0) { // Assuming 0 is the 'all' value for styles
        ui.views.cars.filter.styles = [];
        ui.views.cars.qsa('.filter-style li').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qs('.filter-style li[data-style="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.styles.includes(styleId)) {
            ui.views.cars.filter.styles.splice(ui.views.cars.filter.styles.indexOf(styleId), 1);
        } else {
            ui.views.cars.filter.styles.push(styleId);
        }
        ui.views.cars.qsa('.filter-style li[data-style="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qsa('.filter-style li[data-style="' + styleId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no styles selected, select 'All'
        if (ui.views.cars.filter.styles.length === 0) {
            ui.views.cars.qs('.filter-style li[data-style="0"]')?.classList.add('selected');
        }
    }
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Specialization Filter"

ui.views.cars.specialization = {};

ui.views.cars.specialization.load = () => {
    ui.view.loadComponent('Cars/filter-specialization-item', (itemTemplate) => {
        ui.ajax({
            url: '/api/cars/specializations',
            method: 'POST',
            data: ui.views.cars.getFilterData('specializations'),
            complete: (response) => {
                try {
                    const specializations = JSON.parse(response.responseText);
                    
                    const container = ui.views.cars.qs('.filter-specialization .select-list');
                    if (!container) {
                        console.error('Container .filter-specialization .select-list not found');
                        return;
                    }
                    
                    container.innerHTML = '<li data-specialization="0">All Specializations</li>';
                    
                    specializations.forEach(spec => {
                        let itemHtml = itemTemplate
                            .split('{{id}}').join(spec.id)
                            .split('{{name}}').join(spec.name);
                        container.innerHTML += itemHtml;
                    });
                    
                    ui.views.cars.qsa('.filter-specialization li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.specialization.select(parseInt(li.getAttribute('data-specialization')));
                        }
                    });
                    
                    if (ui.views.cars.filter.specializations.length > 0) {
                        ui.views.cars.qsa('.filter-specialization li').forEach((li) => {
                            if (ui.views.cars.filter.specializations.includes(parseInt(li.getAttribute('data-specialization')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        ui.views.cars.qs('.filter-specialization li[data-specialization="0"]')?.classList.add('selected');
                    }
                } catch (error) {
                    console.error('Error loading specializations:', error);
                }
            }
        });
    });
};

ui.views.cars.specialization.select = (specializationId) => {
    if (specializationId == 0) { // Assuming 0 is the 'all' value for specializations
        ui.views.cars.filter.specializations = [];
        ui.views.cars.qsa('.filter-specialization li').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qs('.filter-specialization li[data-specialization="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.specializations.includes(specializationId)) {
            ui.views.cars.filter.specializations.splice(ui.views.cars.filter.specializations.indexOf(specializationId), 1);
        } else {
            ui.views.cars.filter.specializations.push(specializationId);
        }
        ui.views.cars.qsa('.filter-specialization li[data-specialization="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        ui.views.cars.qsa('.filter-specialization li[data-specialization="' + specializationId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no specializations selected, select 'All'
        if (ui.views.cars.filter.specializations.length === 0) {
            ui.views.cars.qs('.filter-specialization li[data-specialization="0"]')?.classList.add('selected');
        }
    }
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "CarEdit"

// In-place car details editor - pencil button in the details header swaps the
// stats/chart area for a country/year/manufacturer/model form
ui.views.cars.carEdit = {
    state: null,  // { detailsDiv, car, makes, models }

    // Called after each details render - appends the pencil once per cell
    init: (detailsDiv, car) => {
        const h4 = detailsDiv && detailsDiv.querySelector('.info h4');
        if (!h4 || h4.querySelector('.edit-car-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'edit-car-btn';
        btn.title = 'Edit Car Details';
        btn.innerHTML = '<svg viewBox="0 0 64 64" class="dark"><use xlink:href="#icon-pencil" x="0" y="0" width="64" height="64"></use></svg>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.carEdit.open(detailsDiv, car);
        });
        h4.appendChild(btn);
    },

    open: (detailsDiv, car) => {
        const info = detailsDiv.querySelector('.info');
        if (!info || info.querySelector('.car-edit-form')) return;
        ui.views.cars.carEdit.state = { detailsDiv, car, makes: null, models: null };

        // Editing mode: stats tab + stats pane hide, a Details tab shows the
        // form as its own tab content
        detailsDiv.classList.add('car-editing');
        const editTab = detailsDiv.querySelector('.car-edit-tab');
        if (editTab) editTab.style.display = '';

        // Activate the edit tab/pane the same way a tab click would
        detailsDiv.querySelectorAll('.car-tab').forEach((t) => t.classList.remove('active'));
        detailsDiv.querySelectorAll('.car-tab-content').forEach((c) => c.classList.remove('active'));
        if (editTab) editTab.classList.add('active');

        ui.view.loadComponent('Cars/car-edit-form', (html) => {
            info.insertAdjacentHTML('beforeend', html);
            const form = info.querySelector('.car-edit-form');

            // The Info tab shows an editable textarea instead of .car-info
            // while editing - steal its data-content so the tab handler
            // activates the textarea pane instead
            const carInfo = detailsDiv.querySelector('.car-info');
            if (carInfo) carInfo.removeAttribute('data-content');
            const infoText = info.querySelector('#car-edit-info-text');
            if (infoText) infoText.value = car.details || '';

            ui.views.cars.carEdit.loadDropdowns(detailsDiv, car, form);
            form.querySelector('#car-edit-add-make').addEventListener('click',
                () => ui.views.cars.carEdit.openSubModal('make'));
            form.querySelector('#car-edit-add-model').addEventListener('click',
                () => ui.views.cars.carEdit.openSubModal('model'));
            // Save/Cancel sit below the tab contents - sibling of the panes
            info.querySelector('#car-edit-save').addEventListener('click',
                () => ui.views.cars.carEdit.save(detailsDiv, car, form));
            info.querySelector('#car-edit-cancel').addEventListener('click',
                () => ui.views.cars.carEdit.close(detailsDiv));
            form.querySelector('#car-edit-make').addEventListener('change',
                () => ui.views.cars.carEdit.fillModels(detailsDiv, car, form));
        });
    },

    loadDropdowns: (detailsDiv, car, form) => {
        // Countries
        ui.ajax({
            url: '/api/cars/countries',
            method: 'GET',
            complete: (r) => {
                const list = JSON.parse(r.responseText || '[]');
                const sel = form.querySelector('#car-edit-country');
                list.forEach((c) => sel.appendChild(new Option(c.name || c.Name, (c.code || c.Code || '').toLowerCase())));
                if (car.country) sel.value = car.country.toLowerCase();
            }
        });
        // Manufacturers
        ui.ajax({
            url: '/api/cars/makes',
            method: 'GET',
            complete: (r) => {
                ui.views.cars.carEdit.state.makes = JSON.parse(r.responseText || '[]');
                const sel = form.querySelector('#car-edit-make');
                sel.innerHTML = '';
                ui.views.cars.carEdit.state.makes.forEach((m) => sel.appendChild(new Option(m.name || m.Name, m.id || m.Id)));
                if (car.makeId) sel.value = car.makeId;
            }
        });
        // Models - loaded once, filtered by the chosen manufacturer
        ui.ajax({
            url: '/api/cars/models',
            method: 'GET',
            complete: (r) => {
                ui.views.cars.carEdit.state.models = JSON.parse(r.responseText || '[]');
                ui.views.cars.carEdit.fillModels(detailsDiv, car, form, car.modelId);
            }
        });
        form.querySelector('#car-edit-year').value = car.year || '';
    },

    // Refills the model select with models of the current manufacturer
    fillModels: (detailsDiv, car, form, selectId) => {
        const st = ui.views.cars.carEdit.state;
        if (!st || !st.models) return;
        const makeId = parseInt(form.querySelector('#car-edit-make').value) || null;
        const sel = form.querySelector('#car-edit-model');
        sel.innerHTML = '';
        st.models
            .filter((m) => !makeId || (m.makeId ?? m.MakeId) === makeId)
            .forEach((m) => sel.appendChild(new Option(m.name || m.Name, m.id || m.Id)));
        if (selectId) sel.value = selectId;
    },

    // Small New Manufacturer / New Model popup
    openSubModal: (type) => {
        const st = ui.views.cars.carEdit.state;
        if (!st) return;
        ui.view.loadComponent('Cars/car-edit-submodal', (html) => {
            const existing = document.getElementById('car-edit-submodal');
            if (existing) existing.remove();
            document.body.insertAdjacentHTML('beforeend', html);
            const modal = document.getElementById('car-edit-submodal');
            const title = modal.querySelector('#ces-title');
            const makeLabel = modal.querySelector('#ces-make-label');
            const nameInput = modal.querySelector('#ces-name');
            const isModel = type === 'model';
            title.textContent = isModel ? 'New Model' : 'New Manufacturer';
            nameInput.value = '';

            // Model creation needs the manufacturer selected in the form
            const form = st.detailsDiv.querySelector('.car-edit-form');
            const makeSel = form.querySelector('#car-edit-make');
            const makeName = makeSel.options.find((o) => o.value === makeSel.value)?.textContent || '';
            makeLabel.style.display = isModel ? '' : 'none';
            if (isModel) makeLabel.textContent = `Manufacturer: ${makeName}`;

            const close = () => modal.remove();
            modal.querySelector('#ces-cancel').onclick = close;
            modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
            modal.querySelector('#ces-create').onclick = () => {
                const name = nameInput.value.trim();
                if (!name) return;
                const data = isModel ? { Name: name, MakeId: parseInt(makeSel.value) } : { Name: name };
                ui.ajax({
                    url: isModel ? '/api/cars/models' : '/api/cars/makes',
                    method: 'POST',
                    data: data,
                    complete: (r) => {
                        const created = JSON.parse(r.responseText || '{}');
                        close();
                        ui.views.cars.carEdit.refreshAfterCreate(type, created.id);
                    },
                    error: close
                });
            };
            modal.style.display = 'flex';
            setTimeout(() => nameInput.focus(), 0);
        });
    },

    // After creating a make/model: refetch the list, rebuild the dropdown,
    // select the new record
    refreshAfterCreate: (type, newId) => {
        const st = ui.views.cars.carEdit.state;
        if (!st) return;
        const form = st.detailsDiv.querySelector('.car-edit-form');
        if (!form) return;
        if (type === 'make') {
            ui.ajax({
                url: '/api/cars/makes',
                method: 'GET',
                complete: (r) => {
                    st.makes = JSON.parse(r.responseText || '[]');
                    const sel = form.querySelector('#car-edit-make');
                    sel.innerHTML = '';
                    st.makes.forEach((m) => sel.appendChild(new Option(m.name || m.Name, m.id || m.Id)));
                    sel.value = newId;
                    ui.views.cars.carEdit.fillModels(st.detailsDiv, st.car, form);
                }
            });
        } else {
            ui.ajax({
                url: '/api/cars/models',
                method: 'GET',
                complete: (r) => {
                    st.models = JSON.parse(r.responseText || '[]');
                    ui.views.cars.carEdit.fillModels(st.detailsDiv, st.car, form, newId);
                }
            });
        }
    },

    save: (detailsDiv, car, form) => {
        const makeSel = form.querySelector('#car-edit-make');
        const modelSel = form.querySelector('#car-edit-model');
        const payload = {
            Country: form.querySelector('#car-edit-country').value || null,
            Year: parseInt(form.querySelector('#car-edit-year').value) || null,
            MakeId: parseInt(makeSel.value) || null,
            ModelId: parseInt(modelSel.value) || null,
            Details: detailsDiv.querySelector('#car-edit-info-text')?.value || null
        };
        ui.ajax({
            url: `/api/cars/${car.id}`,
            method: 'PUT',
            data: payload,
            complete: () => {
                // Reflect the edit on the loaded car + the visible details
                const makeName = makeSel.options.find((o) => o.value === makeSel.value)?.textContent || car.makeName;
                const countrySel = form.querySelector('#car-edit-country');
                const countryName = countrySel.options.find((o) => o.value === countrySel.value)?.textContent || car.countryName;
                Object.assign(car, payload, { makeName, countryName });
                ui.views.cars.carEdit.applyToDetails(detailsDiv, car);
                ui.views.cars.carEdit.close(detailsDiv);
            }
        });
    },

    // Updates the read-only details row with the freshly saved values
    applyToDetails: (detailsDiv, car) => {
        const countrySpan = detailsDiv.querySelector('.car-country span');
        if (countrySpan) countrySpan.textContent = car.countryName || '';
        const flag = detailsDiv.querySelector('.car-country img.flag');
        if (flag && car.country) flag.src = `/images/flags/80x60/${car.country.toLowerCase()}.png`;
        const classDivs = detailsDiv.querySelectorAll('.car-origin .car-class span');
        if (classDivs.length > 1) classDivs[classDivs.length - 1].textContent = car.makeName || '';
        const h4 = detailsDiv.querySelector('.info h4');
        if (h4) h4.textContent = ((car.year ? car.year + ' ' : '') + (car.name || '').replace(car.year || '', ''));
        const infoP = detailsDiv.querySelector('.car-info p');
        if (infoP && car.details) infoP.innerHTML = car.details.replace(/\n/g, '<br/><br/>');
    },

    close: (detailsDiv) => {
        detailsDiv.classList.remove('car-editing');
        detailsDiv.querySelector('.car-edit-form')?.remove();
        detailsDiv.querySelector('.car-edit-info')?.remove();
        detailsDiv.querySelector('.car-edit-actions')?.remove();
        // .car-info owns data-content again once the edit textarea is gone
        const carInfo = detailsDiv.querySelector('.car-info');
        if (carInfo) carInfo.setAttribute('data-content', 'info');
        const editTab = detailsDiv.querySelector('.car-edit-tab');
        if (editTab) {
            editTab.style.display = 'none';
            editTab.classList.remove('active');
        }
        // Back to the stats view
        detailsDiv.querySelector('.car-tab[data-tab="stats"]')?.classList.add('active');
        detailsDiv.querySelector('.car-stats')?.classList.add('active');
        ui.views.cars.carEdit.state = null;
    }
};

//#endregion
