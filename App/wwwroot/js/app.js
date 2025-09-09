(() => {
    const ui = {
        utils: {}
    };


    /* DO NOT REMOVE THE CODE BELOW */
    ui.ajax = function ({ url, data, complete, error, json, async, contentType, method, username, password }) {
    var opt = {
        method: method ?? 'GET',
        data: JSON.stringify(data),
        url: url,
        async: async,
        username: username,
        password: password,
        contentType: contentType ?? 'text/plain; charset=utf-8',
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

let dashHub = null;
ui.hub = {};

ui.hub.load = () => {
    var consl = document.querySelector('.console');
    if (consl.className.indexOf('show') >= 0) {
        //hide console
        consl.classList.remove('show');
        consl.classList.add('hide');
        //dashHub.stop();
    } else {
        //show console and load SignalR hub
        consl.classList.remove('hide');
        consl.classList.add('show');
        if (dashHub == null) {
            dashHub = new signalR.HubConnectionBuilder().withUrl('/dashboardhub').build();
            dashHub.on('update', ui.hub.log);
            dashHub.start().catch(ui.hub.error);
            setTimeout(() => { dashHub.invoke('handshake'); }, 500);
        }
    }
};

ui.hub.error = (e) => {
    console.log(e);
};

ui.hub.log = (msg) => {
    var div = document.createElement("div");
    div.innerHTML = msg;
    document.querySelectorAll('.console .scrollable')[0].appendChild(div);
}
ui.game = {};

// Load default game view
ui.game.load = () => {
    ui.view.load(`Game/index`, (response) => {
        ui.nav.select('game');
        ui.view.inject(response.responseText, 'game');
    });
};

// Check game assets (referenced in the HTML component)
ui.game.checkAssets = () => {
    console.log('Checking game assets...');
    
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

ui.nav.gameName('Assetto Corsa');

ui.notFound = () => {
    ui.view.load(`Errors/404`, (response) => {
        document.querySelector('.content').innerHTML = response;
        console.warn('Route not found - 404 page displayed');
    });
};

ui.profile = {};

// Load profile view with optional username
ui.profile.load = (username) => {
    ui.view.load(`Profile/index`, (response) => {
        document.querySelector('.content').innerHTML = response;

    });
};
ui.routes = [
    { path: 'dashboard', action: ui.game.load },
    { path: 'dashboard/game', action: ui.game.load },
    { path: 'dashboard/game/:id', action: ui.game.load },
    { path: 'dashboard/profile', action: ui.profile.load },
    { path: 'dashboard/*', action: () => ui.notFound() } // Wildcard route for 404
];

ui.routing = {};

// Parse path parameters according to route pattern
ui.routing.parseParams = (pattern, path) => {
    // Convert route pattern to regex
    const optionalParamRegex = /:([^\/?]+)\?/g;
    const requiredParamRegex = /:([^\/?]+)/g;
    const wildcardRegex = /\*/g;
    
    // Handle optional parameters first
    let regexPattern = pattern
        .replace(optionalParamRegex, '(?:\/([^/]+))?')
        .replace(requiredParamRegex, '\/([^/]+)')
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
        result.route.action(result.params);
        return true;
    }
    
    return false;
};

// Extract path from URL
ui.routing.getPathFromUrl = () => {
    // Get the current URL path
    const fullPath = window.location.pathname;
    
    // Check if the path starts with /dashboard/
    if (fullPath.startsWith('/dashboard/')) {
        // Extract the part after /dashboard/
        return fullPath.substring('/dashboard/'.length);
    }
    
    // If not in dashboard, return the path as is (without leading slash)
    return fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
};

// Initialize routing
ui.routing.init = () => {
    // Handle initial route
    const initialPath = ui.routing.getPathFromUrl();
    if (initialPath) {
        ui.routing.execute(initialPath);
    }
    
    // Listen for popstate events (back/forward browser buttons)
    window.addEventListener('popstate', (event) => {
        const path = ui.routing.getPathFromUrl();
        ui.routing.execute(path);
    });
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        const path = ui.routing.getPathFromUrl();
        ui.routing.execute(path);
    });
    
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
    
    // Listen for our custom locationchange event
    window.addEventListener('locationchange', () => {
        const path = ui.routing.getPathFromUrl();
        ui.routing.execute(path);
    });
};

// Call init when the DOM is loaded
document.addEventListener('DOMContentLoaded', ui.routing.init);
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
ui.view = {};
ui.view.load = (path, callback) => {
    ui.ajax({
        url: `/views/${path}`,
        complete: (response) => {
            if (callback) callback(response);
        }
    });
}

ui.view.inject = (html, name) => {
    const content = document.querySelector(`div.content`);
    content.innerHTML = html;
    content.className = 'content ' + name;
}

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
console.log('initializing app');

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

//load dark mode setting from local storage
ui.darkmode.load();

const toggle = document.querySelector('.toggle.for-darkmode');
if (toggle) {
    toggle.addEventListener('click', () => ui.toggle.flip(toggle, (on) => {
        ui.darkmode.toggle(on);
    }));
}

//window resize to scale UI
ui.utils.scaleUI = () => {
    let scale = window.innerWidth / 1920;
    if (scale < 1) scale = 1;
    
    // Create or update CSS variable for scale factor
    let styleEl = document.getElementById('scale-factor-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'scale-factor-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `:root { --scale-factor: ${scale}; }`;
    
    // Apply scale to elements with scale-ui class
    const scalable = document.querySelectorAll('.scale-ui');
    scalable.forEach(el => el.style.transform = `scale(${scale})`);
}
    
window.addEventListener('resize', () => {
    ui.utils.scaleUI();
});

ui.utils.scaleUI();

setTimeout(() => {
    const init = document.querySelector('.init');
    init.classList.add('fade');
    setTimeout(() => init.remove(), 1000);
}, 500);
    /* DO NOT REMOVE THE CODE ABOVE */

    window.RacerUI = ui;

})();