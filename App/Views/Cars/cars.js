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
        start: 0,
        length: 20,
        view: 'grid',
        prevView: 'grid',
    },
    results: null,
    allCars: [],
    footerHeight: 5.8,
    hovered: null,
    selected: null, //result object that has been selected by the user
    isLoading: false,
    hasMore: true,
    scrollListener: null,
    resizeListener: null,
    virtualDOM: {
        topHiddenRows: 0,
        bottomHiddenRows: 0
    }
};

ui.views.cars.load = (e) => {
    //first, load filter settings from local storage
    if (localStorage.getItem('RacerUI:cars-filter')) {
        ui.views.cars.filter = {...ui.views.cars.filter, ...JSON.parse(localStorage.getItem('RacerUI:cars-filter'))};
    }
    if (document.querySelector('.cars-toolbar') == null) {
        //view not loaded yet
        ui.view.loadComponent(`Cars/cars`, (html) => {
            ui.nav.select('cars');
            ui.view.inject(html, 'cars');
            if (e && e.id) {
                ui.views.cars.updateNav(e.id);
            }
            ui.views.cars.setupSearchListener();
            ui.views.cars.updateClearFilterButton();
            ui.views.cars.getFilteredList();
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
    }
    window.addEventListener('resize', ui.views.cars.resize);
    ui.views.cars.resize();
    ui.views.cars.setupInfiniteScroll();
};

ui.views.cars.setupSearchListener = () => {
    const searchInput = document.getElementById('search_cars');
    const searchClear = document.getElementById('search_clear');
    const clearFilterBtn = document.getElementById('clear_filter_btn');
    
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
            document.querySelectorAll('.filter-country li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-country li[data-country="all"]')?.classList.add('selected');
            
            // Manufacturer filter
            document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-manufacturer li[data-make="0"]')?.classList.add('selected');
            
            // Year filter
            document.querySelectorAll('.filter-year li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-year li[data-year="0"]')?.classList.add('selected');
            
            // Class filter
            document.querySelectorAll('.filter-class li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-class li[data-class="all"]')?.classList.add('selected');
            
            // Type filter
            document.querySelectorAll('.filter-type li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-type li[data-type="0"]')?.classList.add('selected');
            
            // Style filter
            document.querySelectorAll('.filter-style li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-style li[data-style="0"]')?.classList.add('selected');
            
            // Specialization filter
            document.querySelectorAll('.filter-specialization li').forEach((li) => {
                li.classList.remove('selected');
            });
            document.querySelector('.filter-specialization li[data-specialization="0"]')?.classList.add('selected');
            
            // Update clear filter button visibility
            ui.views.cars.updateClearFilterButton();
            
            // Reload the filtered list
            ui.views.cars.getFilteredList();
        });
    }
};

ui.views.cars.unload = () => {
    window.removeEventListener('resize', ui.views.cars.resize);
    const container = document.querySelector('.cars-content');
    if (container && ui.views.cars.scrollListener) {
        container.removeEventListener('scroll', ui.views.cars.scrollListener);
    }
}

ui.views.cars.resize = () => {
    const el = document.querySelector('.cars-content');
    const rect = el.getBoundingClientRect();
    el.style.height = `calc(${window.innerHeight - rect.top}px - ${window.innerWidth <= 1920 ? ui.views.cars.footerHeight : ((ui.views.cars.footerHeight / 1920) * window.innerWidth)}em)`;
}

ui.views.cars.nav = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    var navItem = document.querySelector(`.cars-toolbar li.item-${section}`);
    if (navItem.classList.contains('selected')) {
        ui.views.cars.hideFilter();
        return false;
    }
    history.pushState(null, '', `/dashboard/cars/${section}` + window.location.search);
    return true;
};

ui.views.cars.updateNav = (section) => {
    ui.nav.select('cars')
    var navItem = document.querySelector(`.cars-toolbar li.item-${section}`);
    if (navItem.classList.contains('selected')) {
        ui.views.cars.hideFilter();
        return false;
    }
    document.querySelector('.cars-toolbar li').classList.remove('selected');
    navItem.classList.add('selected');
    ui.view.loadComponent(`Cars/filter-${section}`, (html) => {
        ui.view.injectComponent(html, '.cars-filter');
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
        document.querySelector('.cars-toolbar .close-btn').style.display = 'block';
    });
};

ui.views.cars.hideFilter = () => {
    document.querySelector('.cars-toolbar .close-btn').style.display = 'none';
    document.querySelector('.cars-filter').innerHTML = '';
    document.querySelectorAll('.cars-toolbar li').forEach((li) => {
        li.classList.remove('selected');
    });
    history.pushState(null, '', `/dashboard/cars` + window.location.search);
};

ui.views.cars.saveFilter = () => {
    localStorage.setItem('RacerUI:cars-filter', JSON.stringify(ui.views.cars.filter));
};

ui.views.cars.hasActiveFilters = () => {
    // Check if any filters are active (not default state)
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

ui.views.cars.updateClearFilterButton = () => {
    const clearFilterBtn = document.getElementById('clear_filter_btn');
    if (clearFilterBtn) {
        if (ui.views.cars.hasActiveFilters()) {
            clearFilterBtn.parentElement.style.display = 'inline-block';
        } else {
            clearFilterBtn.parentElement.style.display = 'none';
        }
    }
};

ui.views.cars.getFilterData = (excludeFilter) => {
    // Build filter data object, excluding the specified filter type
    const filterData = {
        Countries: excludeFilter === 'countries' ? [] : (ui.views.cars.filter.countries.includes('all') ? [] : ui.views.cars.filter.countries),
        Makes: excludeFilter === 'makes' ? [] : ui.views.cars.filter.makes,
        Years: excludeFilter === 'years' ? [] : ui.views.cars.filter.years,
        Classes: excludeFilter === 'classes' ? [] : (ui.views.cars.filter.classes || []),
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
    const container = document.querySelector('.cars-content');
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
    const container = document.querySelector('.cars-content');
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
        .split('{{countryCode}}').join((car.country || 'unknown').toLowerCase())
        .split('{{country}}').join(car.countryName || car.country || 'Unknown');
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
            ui.view.injectComponent(htmlEmpty, '.cars-content');
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
                        , '.cars-content');
                    ui.views.cars.views.gallery.setup();
                    break;
                case 'grid': case 'gridxl': case 'gridsm':
                    ui.view.injectComponent(htmlView.split('{{items}}').join(output), '.cars-content');
                    ui.views.cars.views.grid.setup();
                    break;
                default:
                    ui.view.injectComponent(htmlView.split('{{items}}').join(output), '.cars-content');
                    break;
            }
            ui.views.cars.isLoading = false;
        });
    });
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
        const gridView = document.querySelector('.cars-content .grid-view');
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
        document.querySelectorAll('.grid-view > .car').forEach((item) => {
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
            const detailsDiv = document.querySelector('.grid-details');
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
            const detailsDiv = document.querySelector('.grid-details');
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
            const view = html
            .split('{{preview}}').join(car.preview)
            .split('{{name}}').join(car.year + ' ' + car.name.replace(car.year, ''))
            .split('{{year}}').join(car.year || 'N/A')
            .split('{{country}}').join(car.countryName || car.country || 'Unknown')
            .split('{{countryCode}}').join((car.country || 'unknown').toLowerCase())
            .split('{{class}}').join(car.class ? ui.utils.strings.capitalize(car.class).replace('Gt', 'GT') : '')
            .split('{{shifter}}').join(car.gears ?? '')
            .split('{{author}}').join(car.author || '')
            .split('{{maxSpeed}}').join(car.maxSpeed ? car.maxSpeed + ' km/h' : 'N/A')
            .split('{{maxBHP}}').join(car.maxBHP || 'N/A')
            .split('{{zeroTo60mph}}').join(car.zeroTo60mph ? car.zeroTo60mph + 's' : 'N/A')
            .split('{{gears}}').join(car.gears || 'N/A')
            .split('{{description}}').join(car.description || '')
            .hasBlock('has-country', car.countryName || car.country)
            .hasBlock('has-shifter', car.shifter);
            item.insertAdjacentHTML('afterend', view);
            ui.views.cars.views.grid.detailsDiv = item.nextSibling;
            ui.views.cars.selected = {car, item};
            // Add selected class to the item
            item.classList.add('selected');
            setTimeout(() => {
                //scroll to car details
                ui.scrollTo(document.querySelector('.cars-content'), item, 500, 'easeInOutQuad', 0);
            }, 350);
        });
    },
    getCarFromItem: (item) => {
        const car = ui.views.cars.allCars.find((car) => {
            return car.path == item.getAttribute('data-path');
        });
        return car;
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
        document.querySelectorAll('.filter-country li').forEach((li) => {
            if (ui.views.cars.filter.countries.includes(li.getAttribute('data-country'))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-view li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.view.select(li.getAttribute('data-view'));
        }
    });
};

ui.views.cars.view.select = (view) => {
    ui.views.cars.filter.view = view;
    document.querySelectorAll('.filter-view li').forEach((li) => {
        li.classList.remove('selected');
    });
    document.querySelectorAll('.filter-view li[data-view="' + view + '"]').forEach((li) => {
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
                    
                    // Set up click handlers after populating
                    document.querySelectorAll('.filter-country li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.country.select(li.getAttribute('data-country'));
                        }
                    });
                    
                    // Load selected countries
                    if (ui.views.cars.filter.countries.length > 0) {
                        document.querySelectorAll('.filter-country li').forEach((li) => {
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
        document.querySelectorAll('.filter-country li').forEach((li) => {
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
        document.querySelectorAll('.filter-country li[data-country="all"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-country li[data-country="' + country + '"]').forEach((li) => {
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
                    
                    const container = document.querySelector('.filter-manufacturer .select-list');
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
                    
                    document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.manufacturer.select(parseInt(li.getAttribute('data-make')));
                        }
                    });
                    
                    if (ui.views.cars.filter.makes.length > 0) {
                        document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
                            if (ui.views.cars.filter.makes.includes(parseInt(li.getAttribute('data-make')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        document.querySelector('.filter-manufacturer li[data-make="0"]')?.classList.add('selected');
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
        document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelector('.filter-manufacturer li[data-make="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.makes.includes(makeId)) {
            ui.views.cars.filter.makes.splice(ui.views.cars.filter.makes.indexOf(makeId), 1);
        } else {
            ui.views.cars.filter.makes.push(makeId);
        }
        document.querySelectorAll('.filter-manufacturer li[data-make="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelectorAll('.filter-manufacturer li[data-make="' + makeId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no manufacturers selected, select 'All'
        if (ui.views.cars.filter.makes.length === 0) {
            document.querySelector('.filter-manufacturer li[data-make="0"]')?.classList.add('selected');
        }
    }
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Model Filter"

ui.views.cars.model = {};

ui.views.cars.model.load = () => {
    //load selected models
    if (ui.views.cars.filter.models.length > 0) {
        document.querySelectorAll('.filter-model li').forEach((li) => {
            if (ui.views.cars.filter.models.includes(parseInt(li.getAttribute('data-model')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-model li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.model.select(parseInt(li.getAttribute('data-model')));
        }
    });
};

ui.views.cars.model.select = (modelId) => {
    if (modelId == 0) { // Assuming 0 is the 'all' value for models
        ui.views.cars.filter.models = [];
        document.querySelectorAll('.filter-model li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.models.includes(modelId)) {
            ui.views.cars.filter.models.splice(ui.views.cars.filter.models.indexOf(modelId), 1);
        } else {
            ui.views.cars.filter.models.push(modelId);
        }
        document.querySelectorAll('.filter-model li[data-model="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-model li[data-model="' + modelId + '"]').forEach((li) => {
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
                    
                    const container = document.querySelector('.filter-year .select-list');
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
                    
                    document.querySelectorAll('.filter-year li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.year.select(parseInt(li.getAttribute('data-year')));
                        }
                    });
                    
                    if (ui.views.cars.filter.years.length > 0) {
                        document.querySelectorAll('.filter-year li').forEach((li) => {
                            if (ui.views.cars.filter.years.includes(parseInt(li.getAttribute('data-year')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        document.querySelector('.filter-year li[data-year="0"]')?.classList.add('selected');
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
        document.querySelectorAll('.filter-year li').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelector('.filter-year li[data-year="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.years.includes(year)) {
            ui.views.cars.filter.years.splice(ui.views.cars.filter.years.indexOf(year), 1);
        } else {
            ui.views.cars.filter.years.push(year);
        }
        document.querySelectorAll('.filter-year li[data-year="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelectorAll('.filter-year li[data-year="' + year + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no years selected, select 'All'
        if (ui.views.cars.filter.years.length === 0) {
            document.querySelector('.filter-year li[data-year="0"]')?.classList.add('selected');
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
                    
                    const container = document.querySelector('.filter-type .select-list');
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
                    
                    document.querySelectorAll('.filter-type li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.type.select(parseInt(li.getAttribute('data-type')));
                        }
                    });
                    
                    if (ui.views.cars.filter.types.length > 0) {
                        document.querySelectorAll('.filter-type li').forEach((li) => {
                            if (ui.views.cars.filter.types.includes(parseInt(li.getAttribute('data-type')))) {
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

ui.views.cars.type.select = (typeId) => {
    if (typeId == 0) { // Assuming 0 is the 'all' value for types
        ui.views.cars.filter.types = [];
        document.querySelectorAll('.filter-type li').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelector('.filter-type li[data-type="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.types.includes(typeId)) {
            ui.views.cars.filter.types.splice(ui.views.cars.filter.types.indexOf(typeId), 1);
        } else {
            ui.views.cars.filter.types.push(typeId);
        }
        document.querySelectorAll('.filter-type li[data-type="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelectorAll('.filter-type li[data-type="' + typeId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no types selected, select 'All'
        if (ui.views.cars.filter.types.length === 0) {
            document.querySelector('.filter-type li[data-type="0"]')?.classList.add('selected');
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
                        
                        const container = document.querySelector('.filter-class .select-list');
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
                        document.querySelectorAll('.filter-class li').forEach((li) => {
                            li.onclick = (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                ui.views.cars.class.select(li.getAttribute('data-class'));
                            }
                        });
                        
                        // Load selected classes
                        if (ui.views.cars.filter.classes && ui.views.cars.filter.classes.length > 0) {
                            document.querySelectorAll('.filter-class li').forEach((li) => {
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
        document.querySelectorAll('.filter-class li').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelector('.filter-class li[data-class="all"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.classes.includes(className)) {
            ui.views.cars.filter.classes.splice(ui.views.cars.filter.classes.indexOf(className), 1);
        } else {
            ui.views.cars.filter.classes.push(className);
        }
        document.querySelectorAll('.filter-class li[data-class="all"]').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelectorAll('.filter-class li[data-class="' + className + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no classes selected, select 'All'
        if (ui.views.cars.filter.classes.length === 0) {
            document.querySelector('.filter-class li[data-class="all"]')?.classList.add('selected');
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
                    
                    const container = document.querySelector('.filter-style .select-list');
                    container.innerHTML = '<li data-style="0">All Styles</li>';
                    
                    styles.forEach(style => {
                        let itemHtml = itemTemplate
                            .split('{{id}}').join(style.id)
                            .split('{{name}}').join(style.name);
                        container.innerHTML += itemHtml;
                    });
                    
                    document.querySelectorAll('.filter-style li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.style.select(parseInt(li.getAttribute('data-style')));
                        }
                    });
                    
                    if (ui.views.cars.filter.styles.length > 0) {
                        document.querySelectorAll('.filter-style li').forEach((li) => {
                            if (ui.views.cars.filter.styles.includes(parseInt(li.getAttribute('data-style')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        document.querySelector('.filter-style li[data-style="0"]')?.classList.add('selected');
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
        document.querySelectorAll('.filter-style li').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelector('.filter-style li[data-style="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.styles.includes(styleId)) {
            ui.views.cars.filter.styles.splice(ui.views.cars.filter.styles.indexOf(styleId), 1);
        } else {
            ui.views.cars.filter.styles.push(styleId);
        }
        document.querySelectorAll('.filter-style li[data-style="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelectorAll('.filter-style li[data-style="' + styleId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no styles selected, select 'All'
        if (ui.views.cars.filter.styles.length === 0) {
            document.querySelector('.filter-style li[data-style="0"]')?.classList.add('selected');
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
                    
                    const container = document.querySelector('.filter-specialization .select-list');
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
                    
                    document.querySelectorAll('.filter-specialization li').forEach((li) => {
                        li.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.views.cars.specialization.select(parseInt(li.getAttribute('data-specialization')));
                        }
                    });
                    
                    if (ui.views.cars.filter.specializations.length > 0) {
                        document.querySelectorAll('.filter-specialization li').forEach((li) => {
                            if (ui.views.cars.filter.specializations.includes(parseInt(li.getAttribute('data-specialization')))) {
                                li.classList.add('selected');
                            } else {
                                li.classList.remove('selected');
                            }
                        });
                    } else {
                        document.querySelector('.filter-specialization li[data-specialization="0"]')?.classList.add('selected');
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
        document.querySelectorAll('.filter-specialization li').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelector('.filter-specialization li[data-specialization="0"]')?.classList.add('selected');
    } else {
        if (ui.views.cars.filter.specializations.includes(specializationId)) {
            ui.views.cars.filter.specializations.splice(ui.views.cars.filter.specializations.indexOf(specializationId), 1);
        } else {
            ui.views.cars.filter.specializations.push(specializationId);
        }
        document.querySelectorAll('.filter-specialization li[data-specialization="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
        document.querySelectorAll('.filter-specialization li[data-specialization="' + specializationId + '"]').forEach((li) => {
            li.classList.toggle('selected');
        });
        // If no specializations selected, select 'All'
        if (ui.views.cars.filter.specializations.length === 0) {
            document.querySelector('.filter-specialization li[data-specialization="0"]')?.classList.add('selected');
        }
    }
    ui.views.cars.getFilteredList();
};

//#endregion
