(() => {
    const ui = {
        utils: {}
    };


    /* DO NOT REMOVE THE CODE BELOW */
    ui.ajax = function ({ url, data, complete, error, json, async, contentType, method, username, password }) {
    var opt = {
        method: method ?? (data ? 'POST' : 'GET'),
        data: data ? JSON.stringify(data) : null,
        url: url,
        async: async,
        username: username,
        password: password,
        contentType: contentType ?? (data ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8'),
        dataType: json ? 'json' : 'html',
        success: function (xhr) {
            if (typeof complete == 'function') { complete(xhr); }
        },
        error: function (xhr) {
            if (typeof error == 'function') { error(xhr); }
        }
    }

    //set up AJAX request
    var req = new XMLHttpRequest();

    //set up callbacks
    req.onload = function () {
        if (req.status >= 200 && req.status < 400) {
            //request success
            if (opt.success) opt.success(req);
        } else {
            //connected to server, but returned an error
            if (opt.error) opt.error(req);
        }
        ui.ajax.wait = false;
        ui.ajax.runQueue();
    };

    req.onerror = function () {
        //an error occurred before connecting to server
        if (opt.error) opt.error(req);
        ui.ajax.wait = false;
        ui.ajax.runQueue();
    };

    //finally, add AJAX request to queue
    ui.ajax.queue.unshift({ req: req, opt: opt });
    ui.ajax.runQueue();
};

ui.ajax.runQueue = () => {
    if (ui.ajax.wait === true) return;
    if (ui.ajax.queue.length == 0) return;
    ui.ajax.wait = true;
    let queue = ui.ajax.queue[ui.ajax.queue.length - 1];
    let req = queue.req;
    let opt = queue.opt;
    ui.ajax.queue.pop();
    req.open(opt.method, opt.url, opt.async, opt.username, opt.password);
    req.setRequestHeader('Content-Type', opt.contentType);
    req.send(opt.data);
};

ui.ajax.queue = [];
ui.ajax.wait = false;
ui.darkmode = { enabled: false };
ui.darkmode.load = () => {
    ui.darkmode.enabled = localStorage.getItem('darkmode') ?? false;
    ui.darkmode.toggle(ui.darkmode.enabled == 'true');
};

ui.darkmode.toggle = (on) => {
    if (on === false) {
        //light mode
        document.body.classList.remove('dark-mode');
        const elems = [...document.querySelectorAll('.toggle-dark-mode')];
        if (elems) elems.forEach(a => {
            a.querySelector('.toggle.for-darkmode').classList.remove('on');
        });
        [...document.querySelectorAll('.toggle-dark-mode > span')]?.forEach(a => {
            a.innerHTML = 'Light Mode';
        })
        localStorage.setItem('darkmode', false);
        ui.darkmode.enabled = false;

    } else {
        //dark mode
        document.body.classList.add('dark-mode');
        const elems = [...document.querySelectorAll('.toggle-dark-mode')];
        if (elems) elems.forEach(a => {
            a.querySelector('.toggle.for-darkmode').classList.add('on');
        });
        [...document.querySelectorAll('.toggle-dark-mode > span')]?.forEach(a => {
            a.innerHTML = 'Dark Mode';
        })
        localStorage.setItem('darkmode', true);
        ui.darkmode.enabled = true;
    }
};
ui.easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: t => t * t * t,
  easeOutCubic: t => --t * t * t + 1,
  easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - --t * t * t * t,
  easeInOutQuart: t => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),
  easeInQuint: t => t * t * t * t * t,
  easeOutQuint: t => 1 + --t * t * t * t * t,
  easeInOutQuint: t => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t)
};

ui.game = {
    name: 'assetto corsa',
    path: null,
    id: null
};

ui.games = [
    {
        name: 'assetto corsa',
        class: 'game-assetto-corsa',
        icon: 'icon-assetto-corsa'
    }
]

ui.game.load = () => {
    console.log('Loading initial game information...');
    ui.game.get().then((game) => {
        if(game?.id && game?.title){
            console.log('Game selected: ' + game.title);
            var gameInfo = ui.games.find(g => g.name == game.name);
            ui.nav.gameName(game.title);
            document.querySelectorAll('.game-loaded').forEach(el => { 
                el.classList.remove('game-loaded'); 
            });
            document.body.classList.add('game-loaded');
            document.body.classList.add(gameInfo.class);
        }
    });
};

ui.game.get = async () => {
    var game = localStorage.getItem('RacerUI:game');
    if(ui.game.id == null && game){
        game = JSON.parse(game);
        var loadedGame = await dashHub.invoke('GetGameDetails', game.name);
        if(loadedGame){
            ui.game = {
                ...ui.game, 
                ...loadedGame
            };
        }
    }
    if(ui.game.id == null){
        //if all else fails, try to load assetto corsa
        ui.game = {
            ...ui.game, 
            ...(await dashHub.invoke('GetGameDetails', 'assetto corsa'))
        };
    }
    return new Promise((resolve) => { resolve(ui.game); });
};

ui.game.set = (game) => {
    ui.game = {...ui.game, ...game};
    localStorage.setItem('RacerUI:game', JSON.stringify({
        name: ui.game.name,
        path: ui.game.path,
        id: ui.game.id,
        title: ui.game.title
    }));
};

ui.game.setPath = async (path) => {
    var game = await dashHub.invoke('SetGamePath', path, ui.game?.name);
    if(game){
        ui.game.set(game);
    }
    return new Promise((resolve) => { resolve(game); });
};

ui.nav = {};

ui.nav.select = (id) => {
    document.querySelectorAll('.dash nav ul.menu li').forEach(li => {
        li.classList.remove('selected');
    });
    document.querySelector(`.dash nav ul.menu li.item-${id}`).classList.add('selected');
}

ui.nav.navigate = (path) => {
    // Update the URL first, which will trigger the route execution via our location change listener
    history.pushState({path: path}, '', `/dashboard/${path}`);
    
    // The route execution will be handled by the event listener in routes.js
    // But we'll also update the UI here for immediate feedback
    const baseId = path.split('/')[0];
    ui.nav.select(baseId);
}

ui.nav.gameName = (name) => {
    document.getElementById('gameName').textContent = name;
}

ui.notFound = () => {
    ui.view.loadComponent(`Errors/404`, (html) => {
        document.querySelector('.content').innerHTML = html;
        console.warn('Route not found - 404 page displayed');
    });
};

ui.profile = {};

// Load profile view with optional username
ui.profile.load = () => {
    ui.view.loadComponent(`Profile/profile`, (html) => {
        document.querySelector('.content').innerHTML = html;

    });
};
//window resize to scale UI
ui.utils.scaleFactor = 0;
ui.utils.scaleUI = () => {
    let scale = (1.0 / 1920) * window.innerWidth;
    if (scale < 1) scale = 1;
    if(scale != ui.utils.scaleFactor){
        ui.utils.scaleFactor = scale;
        // Create or update CSS variable for scale factor
        let styleEl = document.getElementById('scale-factor-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'scale-factor-style';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `:root { --scale-factor: ${scale}; }`;
    }
    
    // Apply scale to elements with scale-ui class
    const scalable = document.querySelectorAll('.scale-ui');
    scalable.forEach(el => el.style.transform = `scale(${scale})`);
}
    
window.addEventListener('resize', ui.utils.scaleUI);
ui.scrollTo = (scrollingElement, targetElement, duration, ease, offset = 0) => {
    const startTime = performance.now();
    const startY = scrollingElement.scrollTop;
    const easingFunction = ui.easing[ease] || ui.easing.linear;

    function animateScroll(currentTime) {
        const elapsedTime = currentTime - startTime;
        const rawProgress = Math.min(elapsedTime / duration, 1);
        const easedProgress = easingFunction(rawProgress);

        // The destination is the target's offsetTop, adjusted for scale and the user offset.
        const destinationScrollTop = (targetElement.offsetTop + offset) * ui.utils.scaleFactor;

        // Interpolate from the original startY to the calculated destination
        const newY = startY + ((destinationScrollTop - startY) * easedProgress);
        scrollingElement.scrollTo(0, newY);

        if (rawProgress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }

    requestAnimationFrame(animateScroll);
};
ui.toggle = {};
ui.toggle.flip = (elem, callback) => {
    if (elem.classList.contains('on')) {
        elem.classList.remove('on');
        if (callback) callback(false);
    } else {
        elem.classList.add('on');
        if (callback) callback(true);
    }
}; 
ui.view = {cache:{}};
ui.views = {}; //contains all loaded views

ui.view.loadComponent = (path, callback) => {
    if(ui.view.cache[path]){
        if (callback) callback(ui.view.cache[path]);
        return;
    }
    ui.ajax({
        url: `/views/${path}`,
        complete: (response) => {
            ui.view.cache[path] = response.responseText;
            if (callback) callback(response.responseText);
        }
    });
}

ui.view.inject = (html, name) => {
    const content = document.querySelector(`div.content`);
    content.innerHTML = html;
    content.className = 'content ' + name;
    ui.utils.scaleUI();
}

ui.view.injectComponent = (html, selector) => {
    const content = document.querySelector(selector);
    content.innerHTML = html;
    ui.utils.scaleUI();
}

ui.view.hasBlock = (html, name, visible) => {
    const template = typeof html === 'string' ? html : '';
    if (!name) {
        return template;
    }

    const blockName = String(name).trim();
    if (!blockName) {
        return template;
    }

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`{{${escapeRegex(blockName)}}}([\\s\\S]*?){{\/${escapeRegex(blockName)}}}`, 'g');
    return template.replace(pattern, (_match, content) => visible ? content : '');
}

if (!String.prototype.hasBlock) {
    String.prototype.hasBlock = function(name, visible) {
        return ui.view.hasBlock(String(this), name, visible);
    }
}


let dashHub = null; //SignalR hub instance
ui.hub = {};

ui.hub.load = () => {
    if (dashHub == null) {
        dashHub = new signalR.HubConnectionBuilder().withUrl('/dashboardhub', { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets }).build();
        
        //event listeners
        dashHub.on('update', ui.hub.log);
        dashHub.on('handshake', ui.hub.handshake);
        dashHub.on('gameDetails', ui.hub.gameDetails);

        dashHub.start().catch(ui.hub.error);
        setTimeout(() => { 
            dashHub.send('Handshake'); 
            ui.hub.keepAliveAgain();
        }, 500);
    }
};

ui.hub.error = (e) => {
    console.log(e);
};

ui.hub.log = (msg) => {
    console.log(msg);
};

ui.hub.keepAlive = () => {
    dashHub.send('KeepAlive');
    ui.hub.keepAliveAgain();
}

ui.hub.keepAliveAgain = () => {
    setTimeout(() => { ui.hub.keepAlive(); }, 1000 * 10);
}

ui.hub.handshake = () => {
    //load current game
    ui.game.load();
    //finally, initialize routing
    ui.routing.init();
}

ui.hub.gameDetails = (game) => {
    if(game){
        ui.game.set(JSON.parse(game));
    }
};
class DarkModeToggle extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
          <div class="toggle-dark-mode">
            <span>Dark Mode</span>
            <div class="toggle for-darkmode">
                <div class="switch">
                    <span class="light material-symbols-outlined">light_mode</span>
                    <span class="dark material-symbols-outlined">dark_mode</span>
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define('darkmode-toggle', DarkModeToggle);
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
        length: 100,
        view: 'grid',
        prevView: 'grid',
    },
    results: null,
    footerHeight: 5.8,
    hovered: null,
    selected: null //result object that has been selected by the user
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
};

ui.views.cars.setupSearchListener = () => {
    const searchInput = document.getElementById('search_cars');
    const searchClear = document.getElementById('search_clear');
    const clearFilterBtn = document.getElementById('clear_filter_btn');
    
    if (searchInput) {
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

ui.views.cars.getFilteredList = () => {
    ui.views.cars.saveFilter();
    ui.views.cars.updateClearFilterButton();
    
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
                ui.views.cars.views.load(JSON.parse(response.responseText));
            }
        }
    });
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

ui.views.cars.views.load = (list) => {
    if (list) {
        ui.views.cars.results = list;
    }else{
        list = ui.views.cars.results;
    }
    
    // Check if no cars found - show empty results view
    if (!list.cars || list.cars.length === 0) {
        ui.view.loadComponent('Cars/empty-results', (htmlEmpty) => {
            ui.view.injectComponent(htmlEmpty, '.cars-content');
        });
        return;
    }
    
    //load view
    ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-view`, (htmlView) => {
        ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-item`, (htmlItem) => {
            var output = '';
            list.cars.forEach((car) => {
                //prepare each car in list and render HTML output of all items
            var carName = (car.year ?? '') + ' ' + car.name.replace(car.year, '');
                car = ui.views.cars.getCarDetails(car);
                output += htmlItem
                    .split('{{preview}}').join(car.preview || 'no-preview.jpg')
                    .split('{{name}}').join(carName)
                    .split('{{class}}').join(car.class)
                    .split('{{description}}').join(car.description ?? '')
                    .split('{{path}}').join(car.path ?? '')
                    .split('{{countryCode}}').join((car.country || 'unknown').toLowerCase())
                    .split('{{country}}').join(car.countryName || car.country || 'Unknown');
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
        });
    });
}

ui.views.cars.views.changeView = (view) => {
    ui.views.cars.filter.view = view;
    ui.views.cars.views.load()
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
        if (ui.views.cars.selected && ui.views.cars.selected.car.path === car.path) {
            // Hide details if the same car is clicked again
            const detailsDiv = document.querySelector('.grid-details');
            if (detailsDiv) {
                detailsDiv.classList.add('hiding');
                setTimeout(() => {
                    if (detailsDiv) {
                        detailsDiv.remove();
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
            setTimeout(() => {
                //scroll to car details
                ui.scrollTo(document.querySelector('.cars-content'), item, 500, 'easeInOutQuad', 0);
            }, 350);
        });
    },
    getCarFromItem: (item) => {
        const car = ui.views.cars.results.cars.find((car) => {
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

ui.views.game = {
    isCheckingAssets:false,
    checkingProgress:0
};

// Load default game view
ui.views.game.load = () => {
    ui.view.loadComponent(`Game/game`, (html) => {
        ui.nav.select('game');
        ui.view.inject(html, 'game');
        ui.views.game.checkingAssetsShowUI();
        ui.game.get().then((game) => {
            if (game == null || game.id == null || game.id == 0) {
                document.querySelector('.set-game-path').style.display = 'block';
                document.querySelector('.check-assets').style.display = 'none';
                document.querySelector('.set-game-path input').value = game.path;
            } else {
                document.querySelector('.set-game-path').style.display = 'none';
                document.querySelector('.check-assets').style.display = 'block';
            }
        });
    });
};
    

// Check game assets (referenced in the HTML component)
ui.views.game.checkAssets = () => {
    console.log('Checking game assets...');
    ui.views.game.isCheckingAssets = true;
    ui.views.game.checkingProgress = 0;
    ui.views.game.checkingAssetsShowUI();
    var checkNewCars = document.querySelector('#checkNewCars').checked;
    var findChildCars = document.querySelector('#findChildCars').checked;
    var getCarDetails = document.querySelector('#getCarDetails').checked;
    var verifyCarDetails = document.querySelector('#verifyCarDetails').checked;
    var checkNewTracks = document.querySelector('#checkNewTracks').checked;
    dashHub.on('progress', ui.views.game.updateProgress);
    dashHub.on('progress-title', ui.views.game.updateProgressTitle);
    dashHub.on('progress-text', ui.views.game.updateProgressText);
    dashHub.on('progress-complete', ui.views.game.updateProgressComplete);
    dashHub.send('CheckGameAssets', ui.game.name, checkNewCars, findChildCars, getCarDetails, verifyCarDetails, checkNewTracks);
};

ui.views.game.skipCheckAssets = () => {
    ui.views.game.updateProgressComplete();
};

ui.views.game.updateProgressTitle = (title) => {
    document.querySelector('.checking-assets .progress-title').textContent = title;
}

ui.views.game.updateProgressText = (text) => {
    document.querySelector('.checking-assets .progress-text').textContent = text;
}

ui.views.game.updateProgress = (progress) => {
    var el = document.querySelector('.checking-assets .progress .bar');
    if(el != null) el.style.width = progress + '%';
    ui.views.game.checkingProgress = progress;
}

ui.views.game.updateProgressComplete = () => {
    ui.views.game.isCheckingAssets = false;
    dashHub.off('progress', ui.views.game.updateProgress);
    dashHub.off('progress-title', ui.views.game.updateProgressTitle);
    dashHub.off('progress-text', ui.views.game.updateProgressText);
    dashHub.off('progress-complete', ui.views.game.updateProgressComplete);
    ui.views.game.checkingAssetsShowUI();
}

ui.views.game.checkingAssetsShowUI = () => {
    if(ui.views.game.isCheckingAssets && document.querySelector('.check-assets')){
        document.querySelector('.check-assets > button').style.display = 'none';
        document.querySelector('.checking-assets').style.display = 'block';
        document.querySelector('.checking-assets .bar').style.width = ui.views.game.checkingProgress + '%';
    }else if(!ui.views.game.isCheckingAssets && document.querySelector('.checking-assets')){
        document.querySelector('.check-assets > button').style.display = '';
        document.querySelector('.checking-assets').style.display = 'none';
    }
};

ui.views.game.setPath = () => {
    var path = document.querySelector('#gamePath').value;
    RacerUI.game.setPath(path).then((game) => {
        if(game){
            document.querySelector('.set-game-path').style.display = 'none';
            document.querySelector('.check-assets').style.display = 'block';
        }
    });
};

ui.views.history = {};

// Load default game view
ui.views.history.load = () => {
    ui.view.loadComponent(`History/history`, (html) => {
        ui.nav.select('history');   
        ui.view.inject(html, 'history');
    });
};

ui.views.profile = {};

// Load default game view
ui.views.profile.load = () => {
    ui.view.loadComponent(`Profile/profile`, (html) => {
        ui.nav.select('profile');
        ui.view.inject(html, 'profile');
    });
};

ui.views.settings = {};

// Load default game view
ui.views.settings.load = () => {
    ui.view.loadComponent(`Settings/settings`, (html) => {
        ui.nav.select('settings');
        ui.view.inject(html, 'settings');
    });
};

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

ui.routes = [
    { path: 'dashboard', action: ui.views.game.load, },
    { path: 'dashboard/game', action: ui.views.game.load },
    { path: 'dashboard/game/:id', action: ui.views.game.load }, 
    { path: 'dashboard/cars', action: ui.views.cars.load, unload: ui.views.cars.unload },
    { path: 'dashboard/cars/:id', action: ui.views.cars.load, unload: ui.views.cars.unload },
    { path: 'dashboard/tracks', action: ui.views.tracks.load },
    { path: 'dashboard/history', action: ui.views.history.load },
    { path: 'dashboard/settings', action: ui.views.settings.load },
    { path: 'dashboard/profile', action: ui.views.profile.load },
    { path: 'dashboard/*', action: ui.notFound } // Wildcard route for 404
];

ui.routing = {
    prevPath: null,
    prevRoute: null
};

// Parse path parameters according to route pattern
ui.routing.parseParams = (pattern, path) => {
    // Convert route pattern to regex
    const optionalParamRegex = /:([^\/?]+)\?/g;
    const requiredParamRegex = /:([^\/?]+)/g;
    const wildcardRegex = /\*/g;
    
    // Handle optional parameters first
    let regexPattern = pattern
        .replace(optionalParamRegex, '(?:\/([^\/]+))?')
        .replace(requiredParamRegex, '([^\/]+)')
        .replace(wildcardRegex, '(.*)'); 
    
    // Add start/end markers and handle empty segments
    regexPattern = `^${regexPattern}$`;
    
    // Create regex object
    const regex = new RegExp(regexPattern);
    
    // Extract parameter names from pattern
    const paramNames = [];
    let match;
    
    // Extract optional param names
    while ((match = optionalParamRegex.exec(pattern)) !== null) {
        paramNames.push(match[1]);
    }
    
    // Reset and extract required param names
    requiredParamRegex.lastIndex = 0;
    while ((match = requiredParamRegex.exec(pattern)) !== null) {
        paramNames.push(match[1]);
    }
    
    // Add wildcard param if present
    if (pattern.includes('*')) {
        paramNames.push('wildcard');
    }
    
    // Test if path matches the pattern
    const pathMatch = regex.exec(path);
    
    if (!pathMatch) {
        return null; // No match
    }
    
    // Extract parameter values
    const params = {};
    for (let i = 0; i < paramNames.length; i++) {
        params[paramNames[i]] = pathMatch[i + 1] || null; // +1 because first match is the full string
    }
    
    return params;
};

// Find matching route and extract params
ui.routing.get = (path) => {
    // Normalize path by removing leading/trailing slashes
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    for (const route of ui.routes) {
        const normalizedPattern = route.path.replace(/^\/+|\/+$/g, '');
        const params = ui.routing.parseParams(normalizedPattern, normalizedPath);
        
        if (params !== null) {
            return {
                route: route,
                params: params
            };
        }
    }
    
    // Find wildcard route as fallback
    const wildcardRoute = ui.routes.find(route => route.path === '*');
    return wildcardRoute ? { route: wildcardRoute, params: {} } : null;
};

// Execute a route with the given path
ui.routing.execute = (path) => {
    const result = ui.routing.get(path);
    if (result) {
        console.log('Executing route: ' + result.route.path);
        if(ui.routing.prevPath != null){
            if(ui.routing.prevRoute.unload){
                ui.routing.prevRoute.unload();
            }
        }
        ui.routing.prevPath = path;
        ui.routing.prevRoute = result.route;
        result.route.action(result.params);
        return true;
    }
    
    return false;
};

// Extract path from URL
ui.routing.getPathFromUrl = () => {
    const fullPath = window.location.pathname;
    return fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
};

ui.routing.executeUrl = () => {
    const initialPath = ui.routing.getPathFromUrl();
    if (initialPath) {
        ui.routing.execute(initialPath);
    }
}

// Initialize routing
ui.routing.init = () => {
    // Handle initial route
    ui.routing.executeUrl();

    // Listen for various navigation events in browser
    window.addEventListener('popstate', ui.routing.executeUrl);
    window.addEventListener('locationchange', ui.routing.executeUrl);
    window.addEventListener('hashchange', ui.routing.executeUrl);
    
    // Create a proxy for history.pushState and history.replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Override pushState
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        // Dispatch a custom event
        window.dispatchEvent(new Event('locationchange'));
    };
    
    // Override replaceState
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        // Dispatch a custom event
        window.dispatchEvent(new Event('locationchange'));
    };
};

// Call init when the DOM is loaded
//document.addEventListener('DOMContentLoaded', ui.routing.init);
ui.utils.addStyleSheet = (id, url) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.src = url;
    link.id = id;
    document.querySelector('head').appendChild(link);
};

ui.utils.loadJsFile = (id, url) => {
    const js = document.createElement('script');
    js.src = url;
    js.id = id;
    document.querySelector('body').appendChild(js);
};

ui.utils.injectJs = (id, sourcecode) => {
    const js = document.createElement('script');
    js.id = id;
    js.innerText = sourcecode;
    document.querySelector('body').appendChild(js);
};
ui.utils.strings = {
    capitalize: (val) => { return String(val).charAt(0).toUpperCase() + String(val).slice(1) }
};

//initialize the app after all scripts are defined
console.log('initializing RacerUI web app...');

document.addEventListener('DOMContentLoaded', function() {
    //load dark mode setting from local storage
    ui.darkmode.load();
    ui.utils.scaleUI();

    //set up dark mode toggle
    const toggle = document.querySelector('.toggle.for-darkmode');
    if (toggle) {
        toggle.addEventListener('click', () => ui.toggle.flip(toggle, (on) => {
            ui.darkmode.toggle(on);
        }));
    }

    setTimeout(() => {
        const init = document.querySelector('.init');
        init.classList.add('fade');
        setTimeout(() => init.remove(), 1000);
        ui.utils.scaleUI();
    }, 500);
});

//load SVG files for logo & icons
var svg = document.createElement('div');
svg.classList.add('svg-assets');
document.body.append(svg);
ui.ajax({
    url: '/images/racerui-logo.svg',
    complete: (response) => {
        svg.innerHTML += response.responseText;
    }
});
ui.ajax({
    url: '/images/icons.svg',
    complete: (response) => {
        svg.innerHTML += response.responseText;
    }
});





ui.hub.load();
    /* DO NOT REMOVE THE CODE ABOVE */

    window.RacerUI = ui;
})();