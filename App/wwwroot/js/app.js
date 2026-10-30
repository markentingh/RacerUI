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
    // Collapse the expanded footer before switching views
    if (ui.views.footer && ui.views.footer.expanded) {
        ui.views.footer.collapseDetails();
    }

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
            ui.utils.scaleUI();
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
    const content = selector instanceof Element ? selector : document.querySelector(selector);
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
    console.error(e);
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
//#region "DropdownList"

// <dropdown-list> - a styled drop-in replacement for <select>.
// Reads its child <option> elements as the data source, so existing code that
// sets innerHTML/value/querySelector keeps working. The option list is hidden;
// the visible toggle + popup list are themed via colors.less.
class DropdownList extends HTMLElement {

    connectedCallback() {
        if (!this._toggle) {
            this._toggle = document.createElement('div');
            this._toggle.className = 'ddl-toggle';
            const label = document.createElement('span');
            label.className = 'ddl-label';
            const caret = document.createElement('span');
            caret.className = 'material-symbols-outlined ddl-caret';
            caret.textContent = 'keyboard_arrow_down';
            this._toggle.append(label, caret);
            this._toggle.addEventListener('click', () => this.toggle());
        }
        this.prepend(this._toggle);

        // Rebuild the item list whenever options are added/removed
        this._observer = new MutationObserver(() => this._syncOptions());
        this._observer.observe(this, { childList: true });

        this._onDocPointerDown = (e) => {
            if (!this.contains(e.target) && !(this._portal && this._portal.contains(e.target))) {
                this.close();
            }
        };
        document.addEventListener('pointerdown', this._onDocPointerDown, true);
        this._onClose = () => this.close();
        window.addEventListener('resize', this._onClose);
        document.addEventListener('scroll', this._onClose, true);

        this._syncOptions();
    }

    disconnectedCallback() {
        if (this._observer) this._observer.disconnect();
        document.removeEventListener('pointerdown', this._onDocPointerDown, true);
        window.removeEventListener('resize', this._onClose);
        document.removeEventListener('scroll', this._onClose, true);
        this.close();
    }

    // The raw <option> children are the data source (they're hidden by CSS).
    // NB: the .selected *property* doesn't stick on <option> elements that
    // aren't inside a real <select>, so selection is tracked on _selectedValue
    // and mirrored to the selected attribute.
    get options() {
        return Array.from(this.children).filter((c) => c.tagName === 'OPTION');
    }

    // A `placeholder` attribute makes the control start unselected and show the
    // placeholder text until an option is picked (e.g. the "More" race-mode
    // menu, where "More" itself is not a selectable item)
    get placeholder() {
        return this.getAttribute('placeholder');
    }

    get value() {
        const opt = this.options.find((o) => o.value === this._selectedValue)
            || this.options.find((o) => o.hasAttribute('selected'))
            || (this.placeholder == null ? this.options[0] : null);
        return opt ? opt.value : '';
    }

    set value(v) {
        v = String(v);
        const opt = this.options.find((o) => o.value === v);
        if (opt) {
            this._select(opt, false);
        } else {
            // Value set before options exist - apply it when they arrive
            this._pendingValue = v;
        }
    }

    _select(opt, fireEvent) {
        this._selectedValue = opt.value;
        this.options.forEach((o) => {
            o.toggleAttribute('selected', o === opt);
            o.selected = (o === opt);
        });
        if (this._toggle) {
            this._toggle.querySelector('.ddl-label').textContent = opt.textContent;
            this._toggle.classList.remove('ddl-placeholder');
        }
        if (this._portal) {
            this._portal.querySelectorAll('.ddl-item').forEach((item) => {
                item.classList.toggle('selected', item._option === opt);
            });
        }
        if (fireEvent) {
            this.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    _syncOptions() {
        // innerHTML assignment wipes our toggle (and serializes it into dead
        // clones when it was connected during `+=`) - restore the real toggle
        // first and remove any dead copies
        if (this._toggle && this._toggle.parentNode !== this) {
            this.prepend(this._toggle);
        }
        Array.from(this.children)
            .filter((c) => c.classList && c.classList.contains('ddl-toggle') && c !== this._toggle)
            .forEach((c) => c.remove());

        const pending = this._pendingValue;
        if (pending !== undefined && this.options.some((o) => o.value === pending)) {
            this._pendingValue = undefined;
        }

        const selected =
            this.options.find((o) => o.value === this._selectedValue)
            || this.options.find((o) => o.value === pending)
            || this.options.find((o) => o.hasAttribute('selected'))
            || (this.placeholder == null ? this.options[0] : null);

        if (selected) {
            this._select(selected, false);
        } else if (this._toggle) {
            this._showPlaceholder();
        }

        // Keep the open list in sync if options change while open
        if (this._portal) {
            this._buildItems();
        }
    }

    _showPlaceholder() {
        const label = this._toggle.querySelector('.ddl-label');
        label.textContent = this.placeholder || '';
        this._toggle.classList.toggle('ddl-placeholder', this.placeholder != null);
    }

    // Returns the control to its unselected state: the placeholder text when
    // one is set, otherwise the first option (matching initial render)
    clear() {
        this._selectedValue = undefined;
        this._pendingValue = undefined;
        this.options.forEach((o) => {
            o.removeAttribute('selected');
            o.selected = false;
        });
        if (this._portal) {
            this._portal.querySelectorAll('.ddl-item').forEach((item) => {
                item.classList.remove('selected');
            });
        }
        if (this._toggle) {
            if (this.placeholder != null) {
                this._showPlaceholder();
            } else if (this.options.length) {
                this._select(this.options[0], false);
            } else {
                this._toggle.querySelector('.ddl-label').textContent = '';
            }
        }
    }

    toggle() {
        if (this._portal) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (!this.options.length || this._portal) return;

        this._portal = document.createElement('div');
        this._portal.className = 'ddl-portal';
        this._buildItems();
        document.body.appendChild(this._portal);

        // The toggle may live inside a scaled .scale-ui container - measure the
        // effective scale and reproduce it on the portal so it matches visually
        const rect = this._toggle.getBoundingClientRect();
        const scale = this._toggle.offsetWidth ? rect.width / this._toggle.offsetWidth : 1;

        const portal = this._portal;
        portal.style.transform = `scale(${scale})`;
        portal.style.transformOrigin = 'top left';
        portal.style.width = `${this._toggle.offsetWidth}px`;

        // Open upward when there isn't room below
        const portalHeight = portal.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < portalHeight && rect.top > portalHeight) {
            portal.style.left = `${rect.left}px`;
            portal.style.top = `${rect.top - portalHeight}px`;
            portal.style.transformOrigin = 'bottom left';
        } else {
            portal.style.left = `${rect.left}px`;
            portal.style.top = `${rect.bottom}px`;
            portal.style.transformOrigin = 'top left';
        }
    }

    _buildItems() {
        this._portal.innerHTML = '';
        this.options.forEach((opt) => {
            const item = document.createElement('div');
            item.className = 'ddl-item' + (opt.selected ? ' selected' : '');
            item.textContent = opt.textContent;
            item._option = opt;
            item.addEventListener('click', () => {
                this._select(opt, true);
                this.close();
            });
            this._portal.appendChild(item);
        });
    }

    close() {
        if (this._portal) {
            this._portal.remove();
            this._portal = null;
        }
    }
}

customElements.define('dropdown-list', DropdownList);

//#endregion

//#region "RatingStars"

// <rating-stars> - five-star rating display + one-shot rater.
//
// Attributes:
//   rating      0-5. >0 renders locked (filled gold + grey outlines, no hover).
//   item-type   'car' | 'track' - enables saving when unrated.
//   item-id     database id for the save endpoint.
//   readonly    never interactive (display only).
//   filled-only render only the filled stars (preview badge mode).
//
// Behaviour: unrated shows grey outlines; hovering the component turns all
// stars gold outline and hovering star N fills 1..N gold; clicking saves
// rating N to /api/{type}s/{id}/rating and locks the component.
// Emits a bubbling 'rated' CustomEvent {itemType, itemId, rating} on save.
class RatingStars extends HTMLElement {

    static get observedAttributes() { return ['rating']; }

    connectedCallback() {
        this._build();
        if (this._interactive()) this._wire();
        this._paint();
    }

    attributeChangedCallback() {
        if (!this.isConnected) return;
        // filled-only badges render `rating` stars - a rating change needs a rebuild
        if (this.hasAttribute('filled-only')) this._build();
        this._paint();
    }

    get rating() {
        const r = parseInt(this.getAttribute('rating') || '0', 10);
        return Number.isFinite(r) ? Math.min(Math.max(r, 0), 5) : 0;
    }

    get locked() {
        return this.rating > 0 || this.hasAttribute('readonly');
    }

    _interactive() {
        return !this.locked
            && this.hasAttribute('item-type')
            && this.hasAttribute('item-id');
    }

    _build() {
        this.replaceChildren();
        this._stars = [];
        const count = this.hasAttribute('filled-only') ? this.rating : 5;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('span');
            star.className = 'rs-star';
            star.dataset.index = String(i + 1);
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#icon-star-outline');
            use.setAttribute('href', '#icon-star-outline');
            svg.appendChild(use);
            star.appendChild(svg);
            this.appendChild(star);
            this._stars.push(star);
        }
        this.classList.toggle('rs-badge', this.hasAttribute('filled-only'));
    }

    _paint() {
        const r = this.rating;
        const hover = !!(this._hovering && this._interactive());
        const preview = hover && this._preview ? this._preview : 0;
        this.classList.toggle('rs-interactive', this._interactive());
        this._stars.forEach((star, idx) => {
            const n = idx + 1;
            const filled = n <= r || (preview > 0 && n <= preview);
            // NB: toggle() with an undefined force flips the class - keep gold boolean
            const gold = !!(n <= r || hover);
            star.classList.toggle('gold', this.hasAttribute('filled-only') ? true : gold);
            const use = star.querySelector('use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', filled ? '#icon-star' : '#icon-star-outline');
            use.setAttribute('href', filled ? '#icon-star' : '#icon-star-outline');
        });
    }

    _wire() {
        // pointermove only fires on real pointer movement - mouseover/enter can
        // fire when the details panel animates open under a stationary cursor,
        // which would wrongly show the gold hover state on first render
        this.addEventListener('pointermove', (e) => {
            this._hovering = true;
            const star = e.target.closest('.rs-star');
            this._preview = star && this.contains(star) ? parseInt(star.dataset.index, 10) : 0;
            this._paint();
        });
        this.addEventListener('pointerleave', () => {
            this._hovering = false;
            this._preview = 0;
            this._paint();
        });
        this._stars.forEach((star) => {
            star.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this._interactive()) return;
                this._rate(parseInt(star.dataset.index, 10));
            });
        });
    }

    _rate(n) {
        const type = this.getAttribute('item-type');
        const id = this.getAttribute('item-id');
        const el = this;
        el.classList.add('rs-saving');
        ui.ajax({
            url: `/api/${type}s/${id}/rating`,
            method: 'POST',
            data: { rating: n },
            complete: () => {
                el.classList.remove('rs-saving');
                el.setAttribute('rating', String(n));
                el.dispatchEvent(new CustomEvent('rated', {
                    bubbles: true,
                    detail: { itemType: type, itemId: id, rating: n }
                }));
            },
            error: () => {
                el.classList.remove('rs-saving');
                el._hovering = false;
                el._preview = 0;
                el._paint();
            }
        });
    }
}

customElements.define('rating-stars', RatingStars);

//#endregion

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
        const tabContents = ui.views.cars.qsa('.car-tab-content');
        
        tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
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

//#region "Footer"

ui.views.footer = {
    selectedCar: null,
    selectedTrack: null,
    selectedLayout: null,
    selectedSkin: null,
    footerHeight: 8, // Footer height in em
    expanded: false
};

// Static weather types from AC's WeatherType enum (as written to
// race.ini [LIGHTING] __CM_WEATHER_TYPE by Content Manager / CSP)
ui.views.footer.staticWeatherTypes = [
    { value: 15, label: 'Clear' },
    { value: 16, label: 'Few Clouds' },
    { value: 17, label: 'Scattered Clouds' },
    { value: 18, label: 'Broken Clouds' },
    { value: 19, label: 'Overcast Clouds' },
    { value: 20, label: 'Fog' },
    { value: 21, label: 'Mist' },
    { value: 22, label: 'Smoke' },
    { value: 23, label: 'Haze' },
    { value: 24, label: 'Sand' },
    { value: 25, label: 'Dust' },
    { value: 3,  label: 'Light Drizzle' },
    { value: 4,  label: 'Drizzle' },
    { value: 5,  label: 'Heavy Drizzle' },
    { value: 6,  label: 'Light Rain' },
    { value: 7,  label: 'Rain' },
    { value: 8,  label: 'Heavy Rain' },
    { value: 0,  label: 'Light Thunderstorm' },
    { value: 1,  label: 'Thunderstorm' },
    { value: 2,  label: 'Heavy Thunderstorm' },
    { value: 12, label: 'Light Sleet' },
    { value: 13, label: 'Sleet' },
    { value: 14, label: 'Heavy Sleet' },
    { value: 9,  label: 'Light Snow' },
    { value: 10, label: 'Snow' },
    { value: 11, label: 'Heavy Snow' },
    { value: 26, label: 'Squalls' },
    { value: 27, label: 'Tornado' },
    { value: 28, label: 'Hurricane' },
    { value: 29, label: 'Cold' },
    { value: 30, label: 'Hot' },
    { value: 31, label: 'Windy' },
    { value: 32, label: 'Hail' }
];

// ACTools quick-drive modes reachable through the "More" dropdown (Practice,
// Hotlap and Race get their own toggle buttons)
ui.views.footer.MORE_MODES = ['trackday', 'weekend', 'drift', 'timeattack', 'drag'];

// Modes that race against AI opponents - they get the Candidates section
ui.views.footer.OPPONENT_MODES = ['race', 'trackday', 'weekend', 'drag'];

// Per-mode field defaults, mirroring the SaveableData of ACTools' QuickDrive_*
// pages (penalties on, AI level 95, aggression 0, 7 opponents, grid spot 7)
ui.views.footer.MODE_DEFAULTS = {
    practice:   { penalties: true, startType: 'PIT', ballast: 0, restrictor: 0 },
    hotlap:     { penalties: true, ghostCar: true, ghostCarRecord: true, ghostCarAdvantage: 0, ballast: 0, restrictor: 0 },
    race:       { penalties: true, jumpStartPenalty: 0, laps: 2, opponents: 7, aiLevel: 95, aiAggression: 0, startingPosition: 7 },
    trackday:   { penalties: true, opponents: 7, aiLevel: 95, aiAggression: 0, speedLimit: 0 },
    weekend:    { penalties: true, jumpStartPenalty: 0, laps: 2, practiceDuration: 15, qualificationDuration: 30, opponents: 7, aiLevel: 95, aiAggression: 0 },
    drift:      { penalties: true, startType: 'PIT', ballast: 0, restrictor: 0 },
    timeattack: { penalties: true, ballast: 0, restrictor: 0 },
    drag:       { penalties: true, matches: 10, aiLevel: 100 }
};

ui.views.footer.defaultModeSettings = () =>
    JSON.parse(JSON.stringify(ui.views.footer.MODE_DEFAULTS));

// Launch settings shown in the expanded footer (defaults mirror Content Manager)
ui.views.footer.raceSettings = {
    tab: 'environment',          // settings panel tab: 'environment' | 'race'
    mode: 'hotlap',              // quick-drive mode: practice|hotlap|race|trackday|weekend|drift|timeattack|drag
    modes: ui.views.footer.defaultModeSettings(),
    candidates: [],              // opponent car pool: [{id, name, carPath, skinPath}]
    timeMinutes: 840,            // 14:00 -> SUN_ANGLE 16
    weatherMode: 'static',       // 'static' or 'dynamic:<controllerId>'
    weatherController: 'base',
    staticWeatherType: 15,       // Clear
    dynamicControllerId: null,
    dynamicControllerName: null,
    controllerSettings: {},      // section -> {key: value} for the dynamic controller
    temperature: 26,             // deg C
    windSpeed: 10,               // km/h
    windDirection: 0,            // degrees
    trackPreset: -1              // -1 Auto, 0-5 Dusty..Optimum
};

ui.views.footer.weatherControllers = null; // loaded once from the server

ui.views.footer.load = () => {
    ui.view.loadComponent('Footer/footer', (html) => {
        const footerContainer = document.querySelector('.footer-container');
        if (footerContainer) {
            footerContainer.remove();
        }
        document.body.insertAdjacentHTML('beforeend', html);

        // Restore expanded state after re-inserting the footer
        const newFooterContainer = document.querySelector('.footer-container');
        if (newFooterContainer) {
            newFooterContainer.classList.toggle('expanded', ui.views.footer.expanded);
        }
        document.body.classList.toggle('footer-expanded', ui.views.footer.expanded);

        // Re-apply the scale-ui transform to the re-inserted footer
        if (ui.utils.scaleUI) {
            ui.utils.scaleUI();
        }
        
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
                const trackData = JSON.parse(savedTrack);
                if (trackData.track) {
                    ui.views.footer.selectedTrack = trackData.track;
                    ui.views.footer.selectedLayout = trackData.layout || null;
                } else {
                    // Legacy format - the saved value was the track object itself
                    ui.views.footer.selectedTrack = trackData;
                    ui.views.footer.selectedLayout = null;
                }
            } catch (e) {
                console.error('Error parsing saved track data:', e);
            }
        }
        
        ui.views.footer.updateDisplay();
        ui.views.footer.resize();
        ui.views.footer.setupButtonHoverEffects();
        ui.views.footer.initRaceSettings();
        ui.views.footer.syncGameState();
        
        // Add resize listener
        window.addEventListener('resize', ui.views.footer.resize);
    });
};

// Removes the footer on views that don't show it (everything except Cars and
// Tracks). Selection/expanded state is kept so the next load restores it.
ui.views.footer.unload = () => {
    const container = document.querySelector('.footer-container');
    if (container) container.remove();
    const modal = document.getElementById('ftr-fav-modal');
    if (modal) modal.remove();
    document.body.classList.remove('footer-expanded');
    window.removeEventListener('resize', ui.views.footer.resize);
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

    if (ui.views.footer.expanded) {
        // Fill the viewport up to the dash nav's rendered bottom edge (the
        // cars/tracks toolbar sits right below it). getBoundingClientRect
        // already includes the scale transform, so this is the true bottom
        // at any resolution.
        const nav = document.querySelector('.dash > nav');
        const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
        const actualScale = el.offsetHeight ? (el.getBoundingClientRect().height / el.offsetHeight) : 1;
        el.style.height = `${(window.innerHeight - navBottom) / (actualScale || 1)}px`;
    } else {
        // The scale-ui transform already scales the footer, so the
        // unscaled height stays at footerHeight em (anchored bottom left)
        el.style.height = `${ui.views.footer.footerHeight}em`;
    }
};

ui.views.footer.toggleDetails = () => {
    ui.views.footer.expanded = !ui.views.footer.expanded;

    const container = document.querySelector('.footer-container');
    if (container) {
        if (ui.views.footer.expanded) {
            container.classList.remove('collapsing');
            container.classList.add('expanded');
        } else {
            // Keep the expanded geometry while the bar shrinks so the grid
            // placements don't teleport; drop it when the transition ends
            container.classList.add('collapsing');
            container.classList.remove('expanded');
            setTimeout(() => {
                container.classList.remove('collapsing');
            }, 450);
        }
    }
    document.body.classList.toggle('footer-expanded', ui.views.footer.expanded);

    // Refresh the collapsed summary so it always reflects the latest settings
    ui.views.footer.updateSettingsSummary();

    // Sync the footer height the cars/tracks views subtract from their content
    const footerHeight = ui.views.footer.expanded
        ? (window.innerHeight / 16)
        : ui.views.footer.footerHeight;
    if (ui.views.cars) {
        ui.views.cars.footerHeight = footerHeight;
        if (ui.views.cars.resize) ui.views.cars.resize();
    }
    if (ui.views.tracks) {
        ui.views.tracks.footerHeight = footerHeight;
        if (ui.views.tracks.resize) ui.views.tracks.resize();
    }

    ui.views.footer.resize();
};

// Collapses the footer when expanded (e.g. on dash nav clicks) - no-op otherwise
ui.views.footer.collapseDetails = () => {
    if (ui.views.footer.expanded) {
        ui.views.footer.toggleDetails();
    }
};

ui.views.footer.selectCar = (car, skin) => {
    ui.views.footer.selectedCar = car;
    ui.views.footer.selectedSkin = skin || null;
    
    // Save to localStorage - editing a favorite never touches the user's data
    if (!ui.views.footer.editingFavorite) {
        localStorage.setItem('RacerUI:footer-selected-car', JSON.stringify({
            car: car,
            skin: skin
        }));
    }
    
    ui.views.footer.updateDisplay();
};

ui.views.footer.selectTrack = (track, layout) => {
    ui.views.footer.selectedTrack = track;
    ui.views.footer.selectedLayout = layout || null;
    
    // Save to localStorage - editing a favorite never touches the user's data
    if (!ui.views.footer.editingFavorite) {
        localStorage.setItem('RacerUI:footer-selected-track', JSON.stringify({
            track: track,
            layout: layout || null
        }));
    }
    
    ui.views.footer.updateDisplay();
};

// Measure a preview image's aspect ratio so the expanded preview can show
// the full background-image instead of cropping it with cover
ui.views.footer.setPreviewRatio = (url, varName) => {
    const container = document.querySelector('.footer-container');
    if (!container) return;

    if (!url) {
        container.style.removeProperty(varName);
        return;
    }

    const img = new Image();
    img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
            container.style.setProperty(varName, img.naturalWidth / img.naturalHeight);
        }
    };
    img.src = url;
};

//#region "Race Settings"

// "under water" -> "Under Water"
ui.views.footer.toTitleCase = (text) =>
    text.split(' ').map((w) => w ? w[0].toUpperCase() + w.substring(1) : w).join(' ');

ui.views.footer.formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Parses "14", "14:30", "1430", "2:30 pm" etc. into minutes since midnight
ui.views.footer.parseTime = (text) => {
    if (!text) return null;
    const match = text.trim().toLowerCase().match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = match[2] ? parseInt(match[2], 10) : 0;
    if (match[3] === 'pm' && h < 12) h += 12;
    if (match[3] === 'am' && h === 12) h = 0;
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
};

ui.views.footer.saveRaceSettings = () => {
    // Editing a favorite updates the in-memory config only - the user's own
    // settings must stay untouched in localStorage
    if (!ui.views.footer.editingFavorite) {
        localStorage.setItem('RacerUI:footer-race-settings', JSON.stringify(ui.views.footer.raceSettings));
    }
    ui.views.footer.updateSettingsSummary();
};

// Collapsed-footer summary line, e.g. "2:30 PM, Dynamic Pure, Wind at 7MPH NNE"
ui.views.footer.updateSettingsSummary = () => {
    const el = document.querySelector('.footer-container .session-settings');
    if (!el) return;
    const s = ui.views.footer.raceSettings;

    // Time in 12h format
    let h = Math.floor(s.timeMinutes / 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const time = `${h}:${(s.timeMinutes % 60).toString().padStart(2, '0')} ${ampm}`;

    // Weather - static shows the weather type, dynamic shows the controller name
    let weather;
    if (s.weatherMode === 'static') {
        const w = ui.views.footer.staticWeatherTypes.find((w) => w.value === s.staticWeatherType);
        weather = w ? w.label : 'Clear';
    } else {
        const id = s.weatherMode.substring('dynamic:'.length);
        const c = (ui.views.footer.weatherControllers || []).find((c) => c.id === id);
        weather = `Dynamic ${c ? c.name : id}`;
    }

    // Wind - speed in km/h + 16-point compass direction
    const kmh = Math.round(s.windSpeed);
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const dir = dirs[Math.round(s.windDirection / 22.5) % 16];

    el.textContent = `${time}, ${weather}, ${s.temperature}\u00B0C, Wind at ${kmh}KM/H ${dir}`;

    const modeEl = document.querySelector('.footer-container .session-mode');
    if (modeEl) {
        modeEl.textContent = ui.views.footer.modeSummary();
    }
};

const MODE_LABELS = {
    practice: 'Practice', hotlap: 'Hotlap', race: 'Race', trackday: 'Track Day',
    weekend: 'Weekend', drift: 'Drift', timeattack: 'Time Attack', drag: 'Drag'
};

const ordinal = (n) => {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    return n + (['th', 'st', 'nd', 'rd'][n % 10] || 'th');
};

// Collapsed-footer third row - the selected race mode + its key settings
// (e.g. "Race - 10 Laps, 7 Opponents, 7th Starting Position")
ui.views.footer.modeSummary = (settings) => {
    let s = settings || ui.views.footer.raceSettings;
    if (s && s.settings) s = s.settings; // legacy blobs wrapped settings
    s = s || {};
    if (!s.mode) return ''; // legacy saves predate race modes
    const mode = s.mode;
    const ms = (s.modes && s.modes[mode]) || {};
    const parts = [];
    switch (mode) {
        case 'race':
            parts.push(`${ms.laps} Laps`, `${ms.opponents} Opponents`,
                `${ordinal(ms.startingPosition)} Starting Position`);
            break;
        case 'weekend':
            parts.push(`${ms.practiceDuration} min Practice`, `${ms.qualificationDuration} min Qualifying`,
                `${ms.laps} Laps`, `${ms.opponents} Opponents`);
            break;
        case 'trackday':
            parts.push(`${ms.opponents} Opponents`);
            break;
        case 'drag':
            parts.push(`${ms.matches} Matches`);
            break;
        case 'hotlap':
            if (ms.ghostCar) parts.push('Ghost Car');
            break;
    }
    if (ms.ballast) parts.push(`Ballast ${ms.ballast} kg`);
    if (ms.restrictor) parts.push(`Restrictor ${ms.restrictor} %`);
    return parts.length ? `${MODE_LABELS[mode] || mode} - ${parts.join(', ')}` : (MODE_LABELS[mode] || mode);
};

// Favorite-edit mode - while set, the footer edits a saved favorite's config
// instead of the user's own settings; nothing is written to localStorage
ui.views.footer.editingFavorite = null;

// Re-applies the current raceSettings to every bound control - used when the
// settings change outside the form (e.g. loading a favorite for editing)
ui.views.footer.refreshSettingsControls = () => {
    const s = ui.views.footer.raceSettings;
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const qs = (sel) => container.querySelector(sel);

    const setVal = (el, v) => { if (el) el.value = v; };
    setVal(qs('#ftr-static-weather'), s.staticWeatherType);
    setVal(qs('#ftr-weather-mode'), s.weatherMode);
    setVal(qs('#ftr-weather-controller'), s.weatherController);
    setVal(qs('#ftr-track-state'), s.trackPreset);
    setVal(qs('#ftr-time-slider'), s.timeMinutes);
    setVal(qs('#ftr-time-input'), ui.views.footer.formatTime(s.timeMinutes));
    setVal(qs('#ftr-temp-slider'), s.temperature);
    setVal(qs('#ftr-wind-slider'), s.windSpeed);
    const tempValue = qs('#ftr-temp-value');
    if (tempValue) tempValue.textContent = `${s.temperature}°C`;
    const windValue = qs('#ftr-wind-value');
    if (windValue) windValue.textContent = `${s.windSpeed} km/h`;
    ui.views.footer.setWindDirection(s.windDirection);
    ui.views.footer.applyWeatherMode();
    ui.views.footer.selectSettingsTab(s.tab || 'environment', false);
    ui.views.footer.refreshModePanels();
    ui.views.footer.updateSettingsSummary();
};

// Opens the favorite's settings in the expanded footer for editing. The
// user's own settings are stashed and nothing is persisted to localStorage
// while the edit is open
ui.views.footer.openFavoriteEdit = (fav) => {
    ui.views.footer.editingFavorite = {
        fav: fav,
        stash: JSON.parse(JSON.stringify(ui.views.footer.raceSettings))
    };

    const mount = () => {
        const edit = ui.views.footer.editingFavorite;
        if (!edit) return;

        // Load the favorite's car/track/config into the live state
        ui.views.footer.selectedCar = { id: fav.carId, name: fav.carName, path: fav.carPath };
        ui.views.footer.selectedSkin = fav.skinPath || null;
        if (fav.trackParentId) {
            ui.views.footer.selectedTrack = { id: fav.trackParentId, name: fav.parentTrackName, path: fav.trackPath };
            ui.views.footer.selectedLayout = {
                id: fav.trackId, name: fav.trackName,
                layoutName: fav.layoutName || null,
                path: fav.trackPath, subPath: fav.trackSubPath
            };
        } else {
            ui.views.footer.selectedTrack = {
                id: fav.trackId, name: fav.trackName,
                path: fav.trackPath, subPath: fav.trackSubPath
            };
            ui.views.footer.selectedLayout = null;
        }

        let cfg = {};
        try { cfg = JSON.parse(fav.configJson) || {}; } catch (e) { }
        const saved = cfg.settings || cfg;
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

        const footerEl = document.querySelector('.footer-container');
        footerEl.classList.add('editing-fav');
        if (!ui.views.footer.expanded) ui.views.footer.toggleDetails();
        // unload() strips these while the expanded flag stays set - force them
        // so the page content hides regardless of which path got us here
        footerEl.classList.add('expanded');
        document.body.classList.add('footer-expanded');
        ui.views.footer.refreshSettingsControls();
        ui.views.footer.updateDisplay();
    };

    // The footer is unloaded on the history view - mount it first, then open
    if (document.querySelector('.footer-container')) {
        mount();
    } else {
        ui.views.footer.load();
        const poll = setInterval(() => {
            if (document.querySelector('.footer-container')) {
                clearInterval(poll);
                mount();
            }
        }, 50);
    }
};

// Closes favorite-edit mode. update=true PUTs the edited configJson first.
// Either way the user's stashed settings are restored and the footer unloads
ui.views.footer.closeFavoriteEdit = (update) => {
    const edit = ui.views.footer.editingFavorite;
    if (!edit) return;

    const finish = () => {
        ui.views.footer.raceSettings = edit.stash;
        ui.views.footer.editingFavorite = null;
        const container = document.querySelector('.footer-container');
        if (container) {
            container.classList.remove('editing-fav');
            // Fades out alongside the collapse animation (see footer.less)
            container.classList.add('fav-edit-closing');
        }
        // Collapse the footer (body class comes off immediately so the
        // favorites list fades in alongside the collapse animation), then
        // unload once the transition has played out
        if (ui.views.footer.expanded) {
            ui.views.footer.toggleDetails();
        }
        setTimeout(() => ui.views.footer.unload(), 450);
        // Refresh the favorites list with the updated config - the list
        // renders inside .history-content, not .content
        const content = document.querySelector('.history-content');
        if (ui.views.history && content) {
            ui.views.history.loadFavorites(content);
        }
    };

    if (update) {
        ui.ajax({
            url: `/api/favorites/${edit.fav.id}`,
            method: 'PUT',
            data: { configJson: JSON.stringify(ui.views.footer.raceSettings) },
            complete: finish,
            error: finish
        });
    } else {
        finish();
    }
};

ui.views.footer.restoreRaceSettings = () => {
    try {
        const saved = localStorage.getItem('RacerUI:footer-race-settings');
        if (saved) {
            Object.assign(ui.views.footer.raceSettings, JSON.parse(saved));
        }
    } catch (e) {
        console.error('Error restoring race settings:', e);
    }
    // Merge per-mode settings over the defaults so modes or fields added
    // after a save still get their defaults
    const modes = ui.views.footer.defaultModeSettings();
    const savedModes = ui.views.footer.raceSettings.modes || {};
    Object.keys(savedModes).forEach((m) => {
        modes[m] = Object.assign({}, modes[m] || {}, savedModes[m]);
    });
    ui.views.footer.raceSettings.modes = modes;
};

ui.views.footer.initRaceSettings = () => {
    ui.views.footer.restoreRaceSettings();

    const settings = ui.views.footer.raceSettings;
    const container = document.querySelector('.footer-container');
    if (!container) return;

    // Static weather types
    const staticSelect = container.querySelector('#ftr-static-weather');
    staticSelect.innerHTML = '';
    ui.views.footer.staticWeatherTypes.forEach((w) => {
        staticSelect.appendChild(new Option(w.label, w.value));
    });
    staticSelect.value = settings.staticWeatherType;
    staticSelect.onchange = () => {
        settings.staticWeatherType = parseInt(staticSelect.value, 10);
        ui.views.footer.saveRaceSettings();
    };

    // Weather system mode (Static / Dynamic: <controller>) + controller dropdown
    const modeSelect = container.querySelector('#ftr-weather-mode');
    const controllerSelect = container.querySelector('#ftr-weather-controller');
    modeSelect.onchange = () => {
        settings.weatherMode = modeSelect.value;
        ui.views.footer.applyWeatherMode();
        ui.views.footer.saveRaceSettings();
    };
    controllerSelect.onchange = () => {
        settings.weatherController = controllerSelect.value;
        ui.views.footer.saveRaceSettings();
    };
    ui.views.footer.loadWeatherControllers();

    // Track state preset
    const trackState = container.querySelector('#ftr-track-state');
    trackState.value = settings.trackPreset;
    trackState.onchange = () => {
        settings.trackPreset = parseInt(trackState.value, 10);
        ui.views.footer.saveRaceSettings();
    };

    // Time of day - slider and manual input stay in sync
    const timeSlider = container.querySelector('#ftr-time-slider');
    const timeInput = container.querySelector('#ftr-time-input');
    const setTime = (minutes) => {
        settings.timeMinutes = Math.max(0, Math.min(1439, minutes));
        timeSlider.value = settings.timeMinutes;
        timeInput.value = ui.views.footer.formatTime(settings.timeMinutes);
    };
    timeSlider.oninput = () => {
        setTime(parseInt(timeSlider.value, 10));
        ui.views.footer.saveRaceSettings();
    };
    timeInput.onchange = () => {
        const parsed = ui.views.footer.parseTime(timeInput.value);
        setTime(parsed !== null ? parsed : settings.timeMinutes);
        ui.views.footer.saveRaceSettings();
    };
    setTime(settings.timeMinutes);

    // Temperature slider
    const tempSlider = container.querySelector('#ftr-temp-slider');
    const tempValue = container.querySelector('#ftr-temp-value');
    const setTemp = (v) => {
        settings.temperature = v;
        tempSlider.value = v;
        tempValue.textContent = `${v}\u00B0C`;
    };
    tempSlider.oninput = () => {
        setTemp(parseInt(tempSlider.value, 10));
        ui.views.footer.saveRaceSettings();
    };
    setTemp(settings.temperature);

    // Wind slider + compass direction
    const windSlider = container.querySelector('#ftr-wind-slider');
    const windValue = container.querySelector('#ftr-wind-value');
    const setWind = (v) => {
        settings.windSpeed = v;
        windSlider.value = v;
        windValue.textContent = `${v} km/h`;
    };
    windSlider.oninput = () => {
        setWind(parseInt(windSlider.value, 10));
        ui.views.footer.saveRaceSettings();
    };
    setWind(settings.windSpeed);

    ui.views.footer.setupWindCompass();
    ui.views.footer.setWindDirection(settings.windDirection);
    ui.views.footer.applyWeatherMode();
    ui.views.footer.initRaceTabs();
    ui.views.footer.updateSettingsSummary();
};

//#region "Race tab"

// The settings object for one quick-drive mode, with defaults applied.
// Fills missing defaults IN PLACE - event handlers capture this object, so
// its identity must stay stable (never swap it for a new merged object)
ui.views.footer.modeSettings = (mode) => {
    const s = ui.views.footer.raceSettings;
    if (!s.modes) s.modes = ui.views.footer.defaultModeSettings();
    const ms = s.modes[mode] || (s.modes[mode] = {});
    const defaults = ui.views.footer.MODE_DEFAULTS[mode] || {};
    Object.keys(defaults).forEach((k) => {
        if (ms[k] === undefined) ms[k] = defaults[k];
    });
    return ms;
};

ui.views.footer.initRaceTabs = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const settings = ui.views.footer.raceSettings;

    container.querySelectorAll('.settings-tab').forEach((tab) => {
        tab.addEventListener('click', () => ui.views.footer.selectSettingsTab(tab.dataset.tab));
    });
    ui.views.footer.selectSettingsTab(settings.tab || 'environment', false);

    container.querySelectorAll('.mode-toggle[data-mode]').forEach((btn) => {
        btn.addEventListener('click', () => ui.views.footer.selectRaceMode(btn.dataset.mode));
    });

    const moreDdl = container.querySelector('#ftr-mode-more');
    if (moreDdl) {
        moreDdl.addEventListener('change', () => {
            if (moreDdl.value) ui.views.footer.selectRaceMode(moreDdl.value);
        });
        if (ui.views.footer.MORE_MODES.includes(settings.mode)) {
            moreDdl.value = settings.mode;
        }
    }

    container.querySelectorAll('.mode-panel').forEach((panel) => {
        ui.views.footer.bindModePanel(panel);
    });

    const addBtn = container.querySelector('#ftr-candidates-add');
    if (addBtn) addBtn.addEventListener('click', () => ui.views.footer.openCandidatePicker());
    const pickerClose = document.getElementById('ftr-car-picker-close');
    if (pickerClose) pickerClose.addEventListener('click', () => ui.views.footer.closeCandidatePicker());
    const pickerBackdrop = document.getElementById('ftr-car-picker');
    if (pickerBackdrop) {
        pickerBackdrop.addEventListener('click', (e) => {
            if (e.target === pickerBackdrop) ui.views.footer.closeCandidatePicker();
        });
    }

    // Favorite-edit buttons (visible only while .editing-fav is set)
    const favEditCancel = document.getElementById('ftr-fav-edit-cancel');
    const favEditUpdate = document.getElementById('ftr-fav-edit-update');
    if (favEditCancel) favEditCancel.onclick = () => ui.views.footer.closeFavoriteEdit(false);
    if (favEditUpdate) favEditUpdate.onclick = () => ui.views.footer.closeFavoriteEdit(true);

    ui.views.footer.syncOpponentLimits();
    ui.views.footer.syncModeToggles();
    ui.views.footer.showModePanel();
    ui.views.footer.renderCandidates();
};

ui.views.footer.selectSettingsTab = (tab, save = true) => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    container.querySelectorAll('.settings-tab').forEach((t) =>
        t.classList.toggle('selected', t.dataset.tab === tab));
    container.querySelectorAll('.settings-panels .tab-panel').forEach((p) => {
        p.style.display = p.dataset.panel === tab ? '' : 'none';
    });
    ui.views.footer.raceSettings.tab = tab;
    if (save) ui.views.footer.saveRaceSettings();
};

ui.views.footer.selectRaceMode = (mode) => {
    if (!mode) return;
    const settings = ui.views.footer.raceSettings;
    settings.mode = mode;

    const moreDdl = document.querySelector('#ftr-mode-more');
    if (moreDdl) {
        if (ui.views.footer.MORE_MODES.includes(mode)) {
            // Programmatic mode switch (e.g. a saved favorite) - reflect it
            if (moreDdl.value !== mode) moreDdl.value = mode;
        } else if (moreDdl.clear) {
            // A main mode was picked - the More menu drops back to placeholder
            moreDdl.clear();
        }
    }
    ui.views.footer.syncModeToggles();
    ui.views.footer.showModePanel();
    ui.views.footer.saveRaceSettings();
};

// The active mode's control gets the 3px underline - a .mode-toggle button or,
// for the extended modes, the More dropdown itself
ui.views.footer.syncModeToggles = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const mode = ui.views.footer.raceSettings.mode;
    container.querySelectorAll('.mode-toggle[data-mode]').forEach((b) =>
        b.classList.toggle('selected', b.dataset.mode === mode));
    const moreDdl = container.querySelector('#ftr-mode-more');
    if (moreDdl) {
        moreDdl.classList.toggle('selected', ui.views.footer.MORE_MODES.includes(mode));
    }
};

ui.views.footer.showModePanel = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const mode = ui.views.footer.raceSettings.mode;
    container.querySelectorAll('.mode-panel').forEach((p) => {
        p.style.display = p.dataset.mode === mode ? '' : 'none';
    });
    const candidates = container.querySelector('#ftr-candidates');
    if (candidates) {
        candidates.style.display = ui.views.footer.OPPONENT_MODES.includes(mode) ? '' : 'none';
    }
};

// Wires every [data-setting] control inside a mode panel to that mode's
// settings object: checkboxes, sliders (each with a labelled live value) and
// dropdowns (data-numeric coerces the option value to a number)
ui.views.footer.bindModePanel = (panel) => {
    const mode = panel.dataset.mode;
    const ms = ui.views.footer.modeSettings(mode);
    panel.querySelectorAll('[data-setting]').forEach((el) => {
        const key = el.dataset.setting;
        if (ms[key] === undefined) return;
        if (el.tagName === 'DROPDOWN-LIST') {
            el.value = String(ms[key]);
            el.addEventListener('change', () => {
                ui.views.footer.modeSettings(mode)[key] =
                    el.hasAttribute('data-numeric') ? parseInt(el.value, 10) : el.value;
                ui.views.footer.saveRaceSettings();
            });
        } else if (el.type === 'checkbox') {
            el.checked = !!ms[key];
            el.addEventListener('change', () => {
                ui.views.footer.modeSettings(mode)[key] = el.checked;
                ui.views.footer.saveRaceSettings();
            });
        } else if (el.type === 'range') {
            const cell = el.closest('.slider-cell');
            const out = cell ? cell.querySelector('.slider-value') : null;
            const unit = el.dataset.unit || '';
            el.value = ms[key];
            if (out) out.textContent = ms[key] + unit;
            // 'input' keeps the label + in-memory value live while dragging;
            // 'change' fires on release and is what persists to localStorage
            el.addEventListener('input', () => {
                ui.views.footer.modeSettings(mode)[key] = parseFloat(el.value);
                if (out) out.textContent = el.value + unit;
                if (key === 'opponents') ui.views.footer.syncStartingPositionLimit(panel);
            });
            el.addEventListener('change', () => {
                ui.views.footer.saveRaceSettings();
            });
        }
    });
};

// Re-applies the current mode settings to every bound control - used when the
// settings change outside the form (e.g. playing a favorite)
ui.views.footer.refreshModePanels = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    container.querySelectorAll('.mode-panel').forEach((panel) => {
        const ms = ui.views.footer.modeSettings(panel.dataset.mode);
        panel.querySelectorAll('[data-setting]').forEach((el) => {
            const key = el.dataset.setting;
            if (ms[key] === undefined) return;
            if (el.tagName === 'DROPDOWN-LIST') {
                el.value = String(ms[key]);
            } else if (el.type === 'checkbox') {
                el.checked = !!ms[key];
            } else if (el.type === 'range') {
                el.value = ms[key];
                const cell = el.closest('.slider-cell');
                const out = cell ? cell.querySelector('.slider-value') : null;
                if (out) out.textContent = ms[key] + (el.dataset.unit || '');
            }
        });
    });
    const moreDdl = document.querySelector('#ftr-mode-more');
    if (moreDdl) {
        const mode = ui.views.footer.raceSettings.mode;
        if (ui.views.footer.MORE_MODES.includes(mode)) moreDdl.value = mode;
        else if (moreDdl.clear) moreDdl.clear();
    }
    ui.views.footer.syncModeToggles();
    ui.views.footer.showModePanel();
    ui.views.footer.renderCandidates();
    ui.views.footer.syncOpponentLimits();
};

// Opponent sliders are capped by the selected track's pit boxes (one slot is
// the player) - the same limit ACTools applies to its race grid
ui.views.footer.syncOpponentLimits = () => {
    const t = ui.views.footer.getEffectiveTrack();
    const pits = (t && t.pitBoxes) || 0;
    const max = Math.max(1, (pits || 25) - 1);
    document.querySelectorAll('.mode-panel input[data-setting="opponents"]').forEach((el) => {
        el.max = max;
        const ms = ui.views.footer.modeSettings(el.closest('.mode-panel').dataset.mode);
        if (ms.opponents > max) {
            ms.opponents = max;
            el.value = max;
            const cell = el.closest('.slider-cell');
            const out = cell && cell.querySelector('.slider-value');
            if (out) out.textContent = max + (el.dataset.unit || '');
        }
        ui.views.footer.syncStartingPositionLimit(el.closest('.mode-panel'));
    });
};

// Resolves a skin's display name (ui_skin.json name) from its path, falling
// back to the path itself when the car's skin list isn't available
ui.views.footer.skinDisplayName = (car, skinPath) => {
    if (!skinPath) return '';
    const skin = car && car.skins && car.skins.find((sk) => sk.path === skinPath);
    return (skin && skin.name) || skinPath;
};

// A candidate entry for the currently selected car+skin (used to seed the
// list and as the shape for picker additions)
ui.views.footer.currentCandidate = () => {
    const car = ui.views.footer.selectedCar;
    if (!car) return null;
    const skinPath = ui.views.footer.selectedSkin || null;
    return {
        id: car.id,
        year: car.year,
        name: car.name || car.carName || car.path,
        carPath: car.path,
        skinPath,
        skinName: ui.views.footer.skinDisplayName(car, skinPath)
    };
};

ui.views.footer.renderCandidates = () => {
    const list = document.getElementById('ftr-candidates-list');
    if (!list) return;
    const s = ui.views.footer.raceSettings;
    if (!Array.isArray(s.candidates)) s.candidates = [];

    // With an empty list the player's own car is the first candidate - the
    // same thing ACTools does with its opponent candidates
    if (!s.candidates.length && ui.views.footer.selectedCar) {
        s.candidates.push(ui.views.footer.currentCandidate());
    }

    list.innerHTML = '';
    s.candidates.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'candidate-item';
        const name = document.createElement('span');
        name.className = 'candidate-name';
        name.textContent = ((c.year ? c.year + ' ' : '') + (c.name || c.carPath || ''));
        const rm = document.createElement('button');
        rm.className = 'candidate-remove';
        rm.title = 'Remove Candidate';
        rm.innerHTML = '<svg viewBox="0 0 64 64" class="dark"><use xlink:href="#icon-close" x="0" y="0" width="64" height="64"></use></svg>';
        rm.addEventListener('click', () => {
            s.candidates.splice(i, 1);
            ui.views.footer.renderCandidates();
            ui.views.footer.saveRaceSettings();
        });
        row.append(name, rm);
        list.appendChild(row);
    });
};

// Opens the car picker modal - the full cars view (filters, grid, details)
// mounted inside it; the Select Car button adds the car to the candidate
// list. The title is configurable so the modal can be reused elsewhere
ui.views.footer.openCandidatePicker = (title) => {
    const backdrop = document.getElementById('ftr-car-picker');
    const body = document.getElementById('ftr-car-picker-body');
    if (!backdrop || !body) return;
    const titleEl = document.getElementById('ftr-car-picker-title');
    if (titleEl) titleEl.textContent = title || 'Select Your Vehicle Candidate';
    backdrop.style.display = '';
    ui.views.cars.loadInto(body, {
        onPick: (car, skinName) => {
            const s = ui.views.footer.raceSettings;
            s.candidates.push({
                id: car.id,
                year: car.year,
                name: car.name || car.carName || car.path,
                carPath: car.path,
                skinPath: skinName || null,
                skinName: ui.views.footer.skinDisplayName(car, skinName)
            });
            ui.views.footer.renderCandidates();
            ui.views.footer.saveRaceSettings();
            ui.views.footer.closeCandidatePicker();
        }
    });
};

ui.views.footer.closeCandidatePicker = () => {
    ui.views.cars.unloadFrom();
    const backdrop = document.getElementById('ftr-car-picker');
    if (backdrop) backdrop.style.display = 'none';
    const body = document.getElementById('ftr-car-picker-body');
    if (body) body.innerHTML = '';
};

// The grid can't have more starting positions than cars (opponents + player)
ui.views.footer.syncStartingPositionLimit = (panel) => {
    if (!panel) return;
    const startPos = panel.querySelector('input[data-setting="startingPosition"]');
    if (!startPos) return;
    const ms = ui.views.footer.modeSettings(panel.dataset.mode);
    const limit = (ms.opponents || 0) + 1;
    startPos.max = limit;
    if (ms.startingPosition > limit) {
        ms.startingPosition = limit;
        startPos.value = limit;
        const cell = startPos.closest('.slider-cell');
        const out = cell && cell.querySelector('.slider-value');
        if (out) out.textContent = limit + (startPos.dataset.unit || '');
    }
};

//#endregion

// Enumerates CSP weather controllers (extension/weather-controllers/*) from the
// server, splitting them the way Content Manager does: controllers that follow
// the selected weather go in the "Controller" dropdown, the rest become
// "Dynamic: <name>" entries in the "Type" dropdown
ui.views.footer.loadWeatherControllers = () => {
    const render = (controllers) => {
        const container = document.querySelector('.footer-container');
        if (!container) return;
        const settings = ui.views.footer.raceSettings;
        const modeSelect = container.querySelector('#ftr-weather-mode');
        const controllerSelect = container.querySelector('#ftr-weather-controller');

        modeSelect.innerHTML = '';
        modeSelect.appendChild(new Option('Static', 'static'));
        controllerSelect.innerHTML = '';

        controllers.forEach((c) => {
            if (c.followsWeather) {
                controllerSelect.appendChild(new Option(c.name, c.id));
            } else {
                modeSelect.appendChild(new Option(`Dynamic: ${c.name}`, `dynamic:${c.id}`));
            }
        });

        // Restore selections (fall back to first option when the saved id no longer exists)
        const savedMode = settings.weatherMode;
        if (savedMode !== 'static' && !modeSelect.querySelector(`option[value="${savedMode}"]`)) {
            settings.weatherMode = 'static';
        }
        modeSelect.value = settings.weatherMode;
        if (controllerSelect.querySelector(`option[value="${settings.weatherController}"]`)) {
            controllerSelect.value = settings.weatherController;
        } else {
            settings.weatherController = controllerSelect.value || 'base';
        }
        ui.views.footer.applyWeatherMode();
        ui.views.footer.updateSettingsSummary();
    };

    if (ui.views.footer.weatherControllers) {
        render(ui.views.footer.weatherControllers);
        return;
    }

    ui.ajax({
        url: '/api/ac/weather-controllers',
        method: 'GET',
        complete: (response) => {
            try {
                ui.views.footer.weatherControllers = JSON.parse(response.responseText);
            } catch (e) {
                ui.views.footer.weatherControllers = [];
            }
            render(ui.views.footer.weatherControllers);
        },
        error: () => {
            // No CSP/controllers installed - static weather only
            ui.views.footer.weatherControllers = [];
            render([]);
        }
    });
};

// Shows/hides the Static Weather dropdown vs the dynamic controller settings
// form based on the selected weather mode
ui.views.footer.applyWeatherMode = () => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const settings = ui.views.footer.raceSettings;
    const isStatic = settings.weatherMode === 'static';

    container.querySelector('#ftr-static-weather-group').style.display = isStatic ? '' : 'none';
    const dynamicArea = container.querySelector('#ftr-dynamic-weather');
    dynamicArea.style.display = isStatic ? 'none' : '';

    if (!isStatic) {
        const controllerId = settings.weatherMode.substring('dynamic:'.length);
        if (settings.dynamicControllerId !== controllerId) {
            settings.dynamicControllerId = controllerId;
            settings.controllerSettings = {};
            ui.views.footer.loadDynamicSettings(controllerId);
        } else if (!dynamicArea.hasChildNodes()) {
            // Settings already loaded for this controller (e.g. restored from
            // localStorage) but the DOM was rebuilt - re-render the fields
            ui.views.footer.loadDynamicSettings(controllerId);
        }
    }
};

// Parses the selected dynamic controller's settings.ini server-side and renders
// a field per setting (the same generic mechanism Content Manager uses)
ui.views.footer.loadDynamicSettings = (controllerId) => {
    const container = document.querySelector('.footer-container');
    if (!container) return;
    const area = container.querySelector('#ftr-dynamic-weather');
    const settings = ui.views.footer.raceSettings;

    ui.ajax({
        url: `/api/ac/weather-controllers/${encodeURIComponent(controllerId)}/settings`,
        method: 'GET',
        complete: (response) => {
            let fields = [];
            try {
                fields = JSON.parse(response.responseText);
            } catch (e) { /* no settings */ }

            area.innerHTML = '';

            ui.view.loadComponent('Footer/dynamic-field', (fieldHtml) => {

            // Render checkbox fields first so they pack onto shared grid rows;
            // full-width text/select fields come after
            const ordered = [...fields.filter((f) => f.type === 'bool'),
                             ...fields.filter((f) => f.type !== 'bool')];

            ordered.forEach((f) => {
                const section = settings.controllerSettings[f.section] ||
                    (settings.controllerSettings[f.section] = {});
                // Keep a previously saved value; fall back to the ini default
                const current = section[f.key] !== undefined ? section[f.key] : f.value;
                section[f.key] = current;

                const row = document.createElement('label');
                row.className = 'dynamic-field';
                const inputId = `ftr-dyn-${f.key}`;

                row.innerHTML = fieldHtml
                    .split('{{inputId}}').join(inputId)
                    .split('{{inputType}}').join(f.type === 'number' ? 'number' : 'text')
                    .hasBlock('is-bool', f.type === 'bool')
                    .hasBlock('is-select', f.type === 'select')
                    .hasBlock('is-input', f.type !== 'bool' && f.type !== 'select');
                row.querySelector('span').textContent = f.label;

                if (f.type === 'bool') {
                    const checked = current === '1' || String(current).toLowerCase() === 'true';
                    row.classList.add('bool-field');
                    row.querySelector('input').checked = checked;
                    section[f.key] = checked ? '1' : '0';
                    row.querySelector('input').onchange = (e) => {
                        section[f.key] = e.target.checked ? '1' : '0';
                        ui.views.footer.saveRaceSettings();
                    };
                } else if (f.type === 'select') {
                    const ddl = row.querySelector('dropdown-list');
                    f.options.forEach((o) => {
                        const sel = o.value === current;
                        ddl.appendChild(new Option(ui.views.footer.toTitleCase(o.label),
                            o.value, sel, sel));
                    });
                    ddl.addEventListener('change', (e) => {
                        section[f.key] = e.target.value;
                        ui.views.footer.saveRaceSettings();
                    });
                } else {
                    const input = row.querySelector('input');
                    input.value = current;
                    input.onchange = (e) => {
                        section[f.key] = e.target.value;
                        ui.views.footer.saveRaceSettings();
                    };
                }

                // Long descriptions become tooltips on the control itself
                if (f.hint) {
                    const control = row.querySelector('input, select, dropdown-list');
                    if (control) control.title = f.hint;
                }

                area.appendChild(row);
            });

            ui.views.footer.saveRaceSettings();
            });
        },
        error: () => {
            area.innerHTML = '';
        }
    });
};

// Wind compass - click/drag on the dial sets the wind direction
ui.views.footer.setupWindCompass = () => {
    const compass = document.querySelector('#ftr-wind-compass');
    if (!compass) return;

    const updateFromEvent = (e) => {
        const rect = compass.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        let deg = Math.round(Math.atan2(dx, -dy) * 180 / Math.PI);
        ui.views.footer.setWindDirection(((deg % 360) + 360) % 360);
        ui.views.footer.saveRaceSettings();
    };

    compass.addEventListener('pointerdown', (e) => {
        compass.setPointerCapture(e.pointerId);
        updateFromEvent(e);
    });
    compass.addEventListener('pointermove', (e) => {
        if (e.buttons === 1) updateFromEvent(e);
    });
};

ui.views.footer.setWindDirection = (deg) => {
    ui.views.footer.raceSettings.windDirection = deg;
    const needle = document.querySelector('#ftr-wind-needle');
    if (needle) {
        needle.setAttribute('transform', `rotate(${deg} 50 50)`);
    }
    const compass = document.querySelector('#ftr-wind-compass');
    if (compass) {
        compass.title = `Wind direction: ${deg}\u00B0`;
    }
};

// Serializes the race settings into the settingsJson argument for PlayGame.
// A dynamic controller launch uses weather type 15 (Clear) and its own id as
// the controller, like Content Manager; static mode passes the chosen type.
ui.views.footer.buildLaunchSettings = () => {
    const s = ui.views.footer.raceSettings;
    const isStatic = s.weatherMode === 'static';
    const mode = s.mode || 'hotlap';
    const m = (s.modes && s.modes[mode]) || {};
    const launch = {
        WeatherType: isStatic ? s.staticWeatherType : 15,
        WeatherController: isStatic ? s.weatherController : s.dynamicControllerId,
        ControllerSettings: isStatic ? null : s.controllerSettings,
        WindSpeedKmh: s.windSpeed,
        WindDirectionDeg: s.windDirection,
        TrackPreset: s.trackPreset,
        Mode: mode
    };
    // Only the fields the active mode's form exposes are sent
    if (m.penalties !== undefined) launch.Penalties = m.penalties;
    if (m.jumpStartPenalty !== undefined) launch.JumpStartPenalty = m.jumpStartPenalty;
    if (m.startType !== undefined) launch.StartType = m.startType;
    if (m.ballast !== undefined) launch.BallastKg = m.ballast;
    if (m.restrictor !== undefined) launch.RestrictorPct = m.restrictor;
    if (m.ghostCar !== undefined) launch.GhostCar = m.ghostCar;
    if (m.ghostCarRecord !== undefined) launch.RecordGhostCar = m.ghostCarRecord;
    if (m.ghostCarAdvantage !== undefined) launch.GhostCarAdvantage = m.ghostCarAdvantage;
    if (m.opponents !== undefined) launch.Opponents = m.opponents;
    if (m.aiLevel !== undefined) launch.AiLevel = m.aiLevel;
    if (m.aiAggression !== undefined) launch.AiAggression = m.aiAggression;
    if (m.startingPosition !== undefined) launch.StartingPosition = m.startingPosition;
    if (m.laps !== undefined) launch.RaceLaps = m.laps;
    if (m.speedLimit !== undefined) launch.SpeedLimitKmh = m.speedLimit;
    if (m.practiceDuration !== undefined) launch.PracticeDurationMinutes = m.practiceDuration;
    if (m.qualificationDuration !== undefined) launch.QualificationDurationMinutes = m.qualificationDuration;
    if (m.matches !== undefined) launch.MatchesCount = m.matches;
    if (ui.views.footer.OPPONENT_MODES.includes(mode) && s.candidates && s.candidates.length) {
        launch.Candidates = s.candidates.map((c) => ({ CarPath: c.carPath, SkinPath: c.skinPath }));
    }
    return launch;
};

//#endregion

// Returns the track the game should launch with - the chosen layout when it
// belongs to the selected track, otherwise the selected track itself
ui.views.footer.getEffectiveTrack = () => {
    const track = ui.views.footer.selectedTrack;
    const layout = ui.views.footer.selectedLayout;
    return (layout && track && layout.path === track.path) ? layout : track;
};

ui.views.footer.updateDisplay = () => {
    const carPreview = document.querySelector('.footer-car-preview');
    const trackPreview = document.querySelector('.footer-track-preview');
    const trackOutline = document.querySelector('.footer-track-outline');
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
        ui.views.footer.setPreviewRatio(carPreviewUrl, '--car-preview-ratio');
    } else {
        carPreview.style.backgroundImage = '';
        carPreview.classList.remove('has-preview');
        ui.views.footer.setPreviewRatio(null, '--car-preview-ratio');
    }

    // Update track preview (uses the selected layout's subPath when set)
    if (ui.views.footer.selectedTrack) {
        const effectiveTrack = ui.views.footer.getEffectiveTrack();
        let trackPreviewUrl = `/image/assetto corsa/track/${effectiveTrack.path}`;
        if (effectiveTrack.subPath) {
            trackPreviewUrl += `/${effectiveTrack.subPath}`;
        }
        trackPreview.style.backgroundImage = `url('${trackPreviewUrl}')`;
        trackPreview.classList.add('has-preview');
        ui.views.footer.setPreviewRatio(trackPreviewUrl, '--track-preview-ratio');

        if (trackOutline) {
            let outlineUrl = `/image/assetto corsa/track-outline/${effectiveTrack.path}`;
            if (effectiveTrack.subPath) {
                outlineUrl += `/${effectiveTrack.subPath}`;
            }
            trackOutline.style.display = '';
            trackOutline.src = outlineUrl;
        }
    } else {
        trackPreview.style.backgroundImage = '';
        trackPreview.classList.remove('has-preview');
        ui.views.footer.setPreviewRatio(null, '--track-preview-ratio');

        if (trackOutline) {
            trackOutline.removeAttribute('src');
        }
    }

    // The opponents sliders' maximum follows the selected track's pit boxes
    ui.views.footer.syncOpponentLimits();
    // Re-render candidates - an empty list reseeds from the selected car
    ui.views.footer.renderCandidates();

    // Update session info text - show the layout name next to the track name
    // when a layout different from the selected track is chosen
    const layout = ui.views.footer.selectedLayout;
    const track = ui.views.footer.selectedTrack;
    const layoutName = layout ? (layout.layoutName || layout.name) : null;
    const showLayout = layout && track && layoutName &&
        (layout.id !== track.id || layout.name !== track.name);
    const car = ui.views.footer.selectedCar;
    const esc = ui.utils.strings.escapeHtml;

    ui.view.loadComponent('Footer/session-info', (html) => {
        sessionInfo.innerHTML = html
            .split('{{carName}}').join(esc(car && car.name))
            .split('{{trackName}}').join(esc(track && track.name))
            .split('{{layoutName}}').join(esc(layoutName))
            .hasBlock('has-layout', showLayout)
            .hasBlock('has-car-and-track', car && track)
            .hasBlock('has-car-only', car && !track)
            .hasBlock('has-track-only', !car && track)
            .hasBlock('has-none', !car && !track);
    });
    ui.views.footer.updatePlayButtonEnabled();
};

// Play button state machine: idle -> starting -> running (driven by the
// server's acs.exe process watch, broadcast as 'gameState')
ui.views.footer.gameLaunchState = 'idle';
ui.views.footer._startTimeout = null;

ui.views.footer.setPlayButtonState = (state) => {
    ui.views.footer.gameLaunchState = state;
    const btn = document.querySelector('.footer-play-button .play-btn');
    if (!btn) return;

    btn.classList.toggle('launching', state === 'starting');
    btn.classList.toggle('running', state === 'running');

    const label = btn.querySelector('span');
    if (label) {
        label.textContent = state === 'running' ? 'Session Running'
            : state === 'starting' ? 'Starting...' : 'Start Race';
    }
    ui.views.footer.updatePlayButtonEnabled();
};

ui.views.footer.updatePlayButtonEnabled = () => {
    const btn = document.querySelector('.footer-play-button .play-btn');
    if (!btn) return;
    const hasSelection = !!(ui.views.footer.selectedCar && ui.views.footer.selectedTrack);
    btn.disabled = ui.views.footer.gameLaunchState !== 'idle' || !hasSelection;

    const favBtn = document.querySelector('#ftr-add-favorite');
    if (favBtn) favBtn.disabled = !hasSelection;
};

// Called by the server broadcast whenever acs.exe starts or exits
ui.views.footer.onGameState = (running) => {
    if (ui.views.footer._startTimeout) {
        clearTimeout(ui.views.footer._startTimeout);
        ui.views.footer._startTimeout = null;
    }
    ui.views.footer.setPlayButtonState(running ? 'running' : 'idle');
};

// Registers the gameState listener and syncs the button with the current
// acs.exe state (covers page reloads mid-session and externally launched games)
ui.views.footer.syncGameState = () => {
    if (!dashHub) return;
    dashHub.off('gameState', ui.views.footer.onGameState);
    dashHub.on('gameState', ui.views.footer.onGameState);
    dashHub.invoke('GetGameState')
        .then((running) => {
            if (ui.views.footer.gameLaunchState === 'idle') {
                ui.views.footer.setPlayButtonState(running ? 'running' : 'idle');
            }
        })
        .catch(() => { });
};

//#region "Favorites"

ui.views.footer.openFavoriteModal = () => {
    if (!ui.views.footer.selectedCar || !ui.views.footer.selectedTrack) return;

    const modal = document.getElementById('ftr-fav-modal');
    if (!modal) return;

    // Reset back to the input form
    modal.querySelector('#ftr-fav-form').style.display = '';
    modal.querySelector('#ftr-fav-message').style.display = 'none';
    modal.querySelector('#ftr-fav-name').value = '';
    modal.querySelector('#ftr-fav-cancel').style.display = '';
    modal.querySelector('#ftr-fav-save').style.display = '';
    modal.querySelector('#ftr-fav-ok').style.display = 'none';
    modal.querySelector('.fav-modal-actions').classList.remove('saved');
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('ftr-fav-name').focus(), 0);
};

ui.views.footer.closeFavoriteModal = () => {
    const modal = document.getElementById('ftr-fav-modal');
    if (modal) modal.style.display = 'none';
};

ui.views.footer.saveFavorite = () => {
    const nameInput = document.getElementById('ftr-fav-name');
    const title = nameInput.value.trim();
    if (!title) {
        nameInput.focus();
        return;
    }

    const effectiveTrack = ui.views.footer.getEffectiveTrack();

    ui.ajax({
        url: '/api/favorites',
        method: 'POST',
        data: {
            title: title,
            configJson: JSON.stringify(ui.views.footer.raceSettings),
            carId: ui.views.footer.selectedCar.id,
            skin: ui.views.footer.selectedSkin,
            trackId: effectiveTrack && effectiveTrack.id
        },
        complete: () => {
            const modal = document.getElementById('ftr-fav-modal');
            if (!modal) return;
            modal.querySelector('#ftr-fav-form').style.display = 'none';
            modal.querySelector('#ftr-fav-message').style.display = '';
            modal.querySelector('#ftr-fav-cancel').style.display = 'none';
            modal.querySelector('#ftr-fav-save').style.display = 'none';
            modal.querySelector('#ftr-fav-ok').style.display = '';
            modal.querySelector('.fav-modal-actions').classList.add('saved');
        },
        error: () => {
            nameInput.focus();
        }
    });
};

//#endregion

ui.views.footer.play = () => {
    if (!ui.views.footer.selectedCar || !ui.views.footer.selectedTrack) {
        console.warn('Cannot play: Car or track not selected');
        return;
    }
    if (ui.views.footer.gameLaunchState !== 'idle') return;

    // Prepare parameters for game launch
    const carPath = ui.views.footer.selectedCar.path;
    const skinPath = ui.views.footer.selectedSkin || '';
    const effectiveTrack = ui.views.footer.getEffectiveTrack();
    const trackPath = effectiveTrack.path;
    const trackSubPath = effectiveTrack.subPath || '';
    
    // Combine track path with subPath if it exists
    const fullTrackPath = trackSubPath ? `${trackPath}/${trackSubPath}` : trackPath;
    
    const gameName = 'assetto corsa';
    const settings = ui.views.footer.raceSettings;

    // Time of day -> sun angle (AC's formula: 0 at 13:00, +16 deg per hour)
    const sunAngle = Math.round(16.0 * (settings.timeMinutes * 60 - 46800) / 3600);

    // Race configuration parameters (with default values for now)
    const config = {
        driverName: 'Player',
        sessionType: 4,              // 1=Practice, 2=Qualification, 3=Race, 4=Hotlap
        sessionName: 'Hotlap',
        spawnSet: 'HOTLAP_START',    // PIT, START, HOTLAP_START
        sunAngle: sunAngle,          // -80 to 80, where 0 = 13:00, 16 = 14:00
        ambientTemp: settings.temperature,
        roadTemp: settings.temperature,
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

    ui.views.footer.setPlayButtonState('starting');

    // Safety net: if acs.exe never shows up (failed launch, launcher cancelled),
    // fall back to idle so the button doesn't stay stuck on "Starting..."
    ui.views.footer._startTimeout = setTimeout(() => {
        ui.views.footer._startTimeout = null;
        if (ui.views.footer.gameLaunchState === 'starting') {
            ui.views.footer.setPlayButtonState('idle');
        }
    }, 60000);

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
        config.launcherType,
        JSON.stringify(ui.views.footer.buildLaunchSettings()))
        .then((success) => {
            if (success) {
                console.log('Game launched successfully');
            } else {
                console.error('Failed to launch game');
                if (ui.views.footer._startTimeout) {
                    clearTimeout(ui.views.footer._startTimeout);
                    ui.views.footer._startTimeout = null;
                }
                ui.views.footer.setPlayButtonState('idle');
            }
        })
        .catch((error) => {
            console.error('Error launching game:', error);
            if (ui.views.footer._startTimeout) {
                clearTimeout(ui.views.footer._startTimeout);
                ui.views.footer._startTimeout = null;
            }
            ui.views.footer.setPlayButtonState('idle');
        });
};

// Setup play button click handler when footer is loaded
document.addEventListener('click', (e) => {
    if (e.target.closest('.footer-play-button .play-btn')) {
        ui.views.footer.play();
    }
    if (e.target.closest('.footer-container .details-btn') || e.target.closest('.hide-details-btn')) {
        ui.views.footer.toggleDetails();
    }
    if (e.target.closest('#ftr-add-favorite')) {
        ui.views.footer.openFavoriteModal();
    }
    if (e.target.closest('#ftr-fav-save')) {
        ui.views.footer.saveFavorite();
    }
    if (e.target.closest('#ftr-fav-cancel') || e.target.closest('#ftr-fav-ok')) {
        ui.views.footer.closeFavoriteModal();
    }
    if (e.target.classList && e.target.classList.contains('fav-modal-backdrop')) {
        ui.views.footer.closeFavoriteModal();
    }
});

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
    var getTrackDetails = document.querySelector('#getTrackDetails').checked;
    var verifyTrackDetails = document.querySelector('#verifyTrackDetails').checked;
    dashHub.on('progress', ui.views.game.updateProgress);
    dashHub.on('progress-title', ui.views.game.updateProgressTitle);
    dashHub.on('progress-text', ui.views.game.updateProgressText);
    dashHub.on('progress-complete', ui.views.game.updateProgressComplete);
    dashHub.send('CheckGameAssets', ui.game.name, checkNewCars, findChildCars, getCarDetails, verifyCarDetails, checkNewTracks, getTrackDetails, verifyTrackDetails);
};

ui.views.game.skipCheckAssets = () => {
    ui.views.game.updateProgressComplete();
};

ui.views.game.updateProgressTitle = (title) => {
    var elem = document.querySelector('.checking-assets .progress-title');
    if(elem) elem.textContent = title;
}

ui.views.game.updateProgressText = (text) => {
    var elem = document.querySelector('.checking-assets .progress-text');
    if(elem) elem.textContent = text;
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
            
            // Reload currently open filter view if any
            const selectedNavItem = document.querySelector('.tracks-toolbar li.selected');
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
    const sortDdl = document.getElementById('tracks_sort');
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
    const container = document.querySelector('.tracks-content');
    if (container && ui.views.tracks.scrollListener) {
        container.removeEventListener('scroll', ui.views.tracks.scrollListener);
    }
}

ui.views.tracks.resize = () => {
    const el = document.querySelector('.tracks-content');
    if(!el) return;
    const rect = el.getBoundingClientRect();
    el.style.height = `calc(${window.innerHeight - rect.top}px - ${window.innerWidth <= 1920 ? ui.views.tracks.footerHeight : ((ui.views.tracks.footerHeight / 1920) * window.innerWidth)}em)`;
    
    // Set max-height for tracks-filter div accounting for scale factor
    const filterEl = document.querySelector('.tracks-filter');
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
        ui.utils.scaleUI();
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
                ui.scrollTo(document.querySelector('.tracks-content'), item, 500, 'easeInOutQuad', 0);
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
        const select = document.getElementById('track_layouts_select');
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
            const outlineImg = document.querySelector('.grid-details .track-outline-float');
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
        const selectTrackBtns = document.querySelectorAll('.select-track-btn');
        selectTrackBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                // Get track from ui.views.tracks.selected
                if (ui.views.tracks.selected && ui.views.tracks.selected.track) {
                    ui.views.footer.selectTrack(ui.views.tracks.selected.track, ui.views.tracks.selected.layout);
                }
            });
        });
    },
    setupButtonHoverEffects: () => {
        const buttons = document.querySelectorAll('.select-track-btn');
        
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

ui.routes = [
    { path: 'dashboard', action: ui.views.game.load, },
    { path: 'dashboard/game', action: ui.views.game.load },
    { path: 'dashboard/game/:id', action: ui.views.game.load }, 
    { path: 'dashboard/cars', action: ui.views.cars.load, unload: ui.views.cars.unload },
    { path: 'dashboard/cars/:id', action: ui.views.cars.load, unload: ui.views.cars.unload },
    { path: 'dashboard/tracks', action: ui.views.tracks.load, unload: ui.views.tracks.unload },
    { path: 'dashboard/tracks/:id', action: ui.views.tracks.load, unload: ui.views.tracks.unload },
    { path: 'dashboard/history', action: ui.views.history.load },
    { path: 'dashboard/history/:id', action: ui.views.history.load },
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

        // The footer only lives on the Cars and Tracks views
        if (ui.views.footer && !/^dashboard\/(cars|tracks)/.test(result.route.path)) {
            ui.views.footer.unload();
        }

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
    capitalize: (val) => { return String(val).charAt(0).toUpperCase() + String(val).slice(1) },

    // Escapes text for safe insertion into {{token}} HTML templates
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }
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