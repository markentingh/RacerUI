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





    /* DO NOT REMOVE THE CODE ABOVE */

    window.RacerUI = ui;
})();