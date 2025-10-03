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
            dashHub.invoke('Handshake'); 
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
    dashHub.invoke('KeepAlive');
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
            ui.views.cars.getFilteredList();
        });
    } else {
        //view already loaded
        if (e && e.id) {
            ui.views.cars.updateNav(e.id);
        }
        if (ui.views.cars.results == null) {
            ui.views.cars.getFilteredList();
        }
    }
    window.addEventListener('resize', ui.views.cars.resize);
    ui.views.cars.resize();
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

ui.views.cars.getFilteredList = () => {
    //get list of cars based on filter
    const start = Math.round(1 + (10000 * Math.random()));
    console.log('start', start);

    ui.views.cars.saveFilter();
    ui.ajax({
        url: `/api/cars/filter`,
        data: {...ui.views.cars.filter, start: start},
        complete: (response) => {
            if (response.status == 200) {
                ui.views.cars.views.load(JSON.parse(response.responseText));
            }
        }
    });
};

//#endregion

//#region "Views"

ui.views.cars.views = {};

ui.views.cars.views.load = (list) => {
    console.log('list', list);
    if (list) {
        ui.views.cars.results = list;
    }else{
        list = ui.views.cars.results;
    }
    //check if a grid view is already loaded, if so, just update the class list
    const gridview = document.querySelector('.grid-view');
    console.log('grid-view', gridview, ui.views.cars.filter.view.indexOf('grid') > -1, ui.views.cars.filter.prevView.indexOf('grid') > -1);
    if(gridview != null && ui.views.cars.filter.view.indexOf('grid') > -1 && ui.views.cars.filter.prevView.indexOf('grid') > -1){
        var classname = ui.views.cars.filter.view.replace('grid', '');
        gridview.classList.remove('xl', 'sm');
        if(classname != '') gridview.classList.add(classname);
        return;
    }
    //load view
    ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-view`, (htmlView) => {
        ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-item`, (htmlItem) => {
            var output = '';
            list.cars.forEach((car) => {
                const skin = car.skins.length > 0 ? car.skins[0] : null;
                var preview = skin ? '/image/' + encodeURIComponent(ui.game.name) + '/skin/' + encodeURIComponent(car.path) + '/' + encodeURIComponent(skin.path) : '';
                output += htmlItem.replace('{{preview}}', preview || 'no-preview.jpg')
                    .replace('{{name}}', car.name ?? car.path.replace(/_/g, ' '))
                    .replace('{{description}}', car.description ?? '');
            });

            //set up view
            const car = list.cars.length > 0 ? list.cars[0] : null;
            if(car == null) return;
            const skin = car ? car.skins.length > 0 ? car.skins[0] : null : null;
            var preview = skin ? '/image/' + encodeURIComponent(ui.game.name) + '/skin/' + encodeURIComponent(car.path) + '/' + encodeURIComponent(skin.path) : '';
            switch(ui.views.cars.filter.view){
                case 'gallery':
                    ui.view.injectComponent(htmlView
                        .replace('{{name}}', car.name ?? car.path.replace(/_/g, ' '))
                        .replace('{{items}}', output)
                        .replace('{{preview}}', preview)
                        , '.cars-content');
                    ui.views.cars.views.gallery.setup();
                    break;
                case 'grid': case 'gridxl': case 'gridsm':
                    ui.view.injectComponent(htmlView.replace('{{items}}', output), '.cars-content');
                    ui.views.cars.views.grid.setup();
                    break;
                default:
                    ui.view.injectComponent(htmlView.replace('{{items}}', output), '.cars-content');
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
    setup: () => {
        console.log('grid setup');
        document.querySelectorAll('.grid-view > .car').forEach((item) => {
            item.onmouseenter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                //duplicate item and place it on top of the original
                if(item.querySelector('.hovered-clone')) return;
                if(ui.views.cars.hovered != null){
                    const hovered = ui.views.cars.hovered;
                    hovered.classList.add('hiding');
                    setTimeout(() => {
                        if(hovered != null){
                            hovered.remove();
                        }
                    }, 250);
                }

                const clone = item.cloneNode(true);
                clone.className += ' hovered-clone';
                clone.onmouseover = null;
                clone.style.zIndex = 1;
                item.prepend(clone);
                ui.views.cars.hovered = clone;
                clone.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    ui.views.cars.views.grid.details(item);
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
    details: (car, item) => {
        ui.view.loadComponent(`Cars/grid-details`, (html) => {

            ui.view.injectComponent(html
                .replace('{{preview}}', car.preview)
                .replace('{{name}}', car.name)
                .replace('{{description}}', car.description), '.cars-content');
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
    document.querySelectorAll('.filter-country li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.country.select(li.getAttribute('data-country'));
        }
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
    //load selected manufacturers
    if (ui.views.cars.filter.makes.length > 0) {
        document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
            if (ui.views.cars.filter.makes.includes(parseInt(li.getAttribute('data-make')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.manufacturer.select(parseInt(li.getAttribute('data-make')));
        }
    });
};

ui.views.cars.manufacturer.select = (makeId) => {
    if (makeId == 0) { // Assuming 0 is the 'all' value for manufacturers
        ui.views.cars.filter.makes = [];
        document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.makes.includes(makeId)) {
            ui.views.cars.filter.makes.splice(ui.views.cars.filter.makes.indexOf(makeId), 1);
        } else {
            ui.views.cars.filter.makes.push(makeId);
        }
        document.querySelectorAll('.filter-manufacturer li[data-make="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-manufacturer li[data-make="' + makeId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
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
    //load selected years
    if (ui.views.cars.filter.years.length > 0) {
        document.querySelectorAll('.filter-year li').forEach((li) => {
            if (ui.views.cars.filter.years.includes(parseInt(li.getAttribute('data-year')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-year li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.year.select(parseInt(li.getAttribute('data-year')));
        }
    });
};

ui.views.cars.year.select = (year) => {
    if (year == 0) { // Assuming 0 is the 'all' value for years
        ui.views.cars.filter.years = [];
        document.querySelectorAll('.filter-year li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.years.includes(year)) {
            ui.views.cars.filter.years.splice(ui.views.cars.filter.years.indexOf(year), 1);
        } else {
            ui.views.cars.filter.years.push(year);
        }
        document.querySelectorAll('.filter-year li[data-year="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-year li[data-year="' + year + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Type Filter"

ui.views.cars.type = {};

ui.views.cars.type.load = () => {
    //load selected types
    if (ui.views.cars.filter.types.length > 0) {
        document.querySelectorAll('.filter-type li').forEach((li) => {
            if (ui.views.cars.filter.types.includes(parseInt(li.getAttribute('data-type')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-type li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.type.select(parseInt(li.getAttribute('data-type')));
        }
    });
};

ui.views.cars.type.select = (typeId) => {
    if (typeId == 0) { // Assuming 0 is the 'all' value for types
        ui.views.cars.filter.types = [];
        document.querySelectorAll('.filter-type li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.types.includes(typeId)) {
            ui.views.cars.filter.types.splice(ui.views.cars.filter.types.indexOf(typeId), 1);
        } else {
            ui.views.cars.filter.types.push(typeId);
        }
        document.querySelectorAll('.filter-type li[data-type="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-type li[data-type="' + typeId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Style Filter"

ui.views.cars.style = {};

ui.views.cars.style.load = () => {
    //load selected styles
    if (ui.views.cars.filter.styles.length > 0) {
        document.querySelectorAll('.filter-style li').forEach((li) => {
            if (ui.views.cars.filter.styles.includes(parseInt(li.getAttribute('data-style')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-style li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.style.select(parseInt(li.getAttribute('data-style')));
        }
    });
};

ui.views.cars.style.select = (styleId) => {
    if (styleId == 0) { // Assuming 0 is the 'all' value for styles
        ui.views.cars.filter.styles = [];
        document.querySelectorAll('.filter-style li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.styles.includes(styleId)) {
            ui.views.cars.filter.styles.splice(ui.views.cars.filter.styles.indexOf(styleId), 1);
        } else {
            ui.views.cars.filter.styles.push(styleId);
        }
        document.querySelectorAll('.filter-style li[data-style="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-style li[data-style="' + styleId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Specialization Filter"

ui.views.cars.specialization = {};

ui.views.cars.specialization.load = () => {
    //load selected specializations
    if (ui.views.cars.filter.specializations.length > 0) {
        document.querySelectorAll('.filter-specialization li').forEach((li) => {
            if (ui.views.cars.filter.specializations.includes(parseInt(li.getAttribute('data-specialization')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-specialization li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.specialization.select(parseInt(li.getAttribute('data-specialization')));
        }
    });
};

ui.views.cars.specialization.select = (specializationId) => {
    if (specializationId == 0) { // Assuming 0 is the 'all' value for specializations
        ui.views.cars.filter.specializations = [];
        document.querySelectorAll('.filter-specialization li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.specializations.includes(specializationId)) {
            ui.views.cars.filter.specializations.splice(ui.views.cars.filter.specializations.indexOf(specializationId), 1);
        } else {
            ui.views.cars.filter.specializations.push(specializationId);
        }
        document.querySelectorAll('.filter-specialization li[data-specialization="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-specialization li[data-specialization="' + specializationId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
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
    dashHub.on('progress', ui.views.game.updateProgress);
    dashHub.on('progress-title', ui.views.game.updateProgressTitle);
    dashHub.on('progress-text', ui.views.game.updateProgressText);
    dashHub.invoke('CheckGameAssets', ui.game.name).then(() => {
        //finished checking assets
        ui.views.game.isCheckingAssets = false;
        ui.views.game.checkingAssetsShowUI();
        dashHub.off('progress', ui.views.game.updateProgress);
        dashHub.off('progress-title', ui.views.game.updateProgressTitle);
        dashHub.off('progress-text', ui.views.game.updateProgressText);
    });
};

ui.views.game.skipCheckAssets = () => {
    ui.views.game.isCheckingAssets = false;
    ui.views.game.checkingAssetsShowUI();
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

ui.views.tracks = {};

// Load default game view
ui.views.tracks.load = () => {
    ui.view.loadComponent(`Tracks/tracks`, (html) => {
        ui.nav.select('tracks');
        ui.view.inject(html, 'tracks');
    });
};

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