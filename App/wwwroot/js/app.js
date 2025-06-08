(() => {
const ui = {
    utils: {}
};

ui.darkmode = { enabled: false };
ui.darkmode.load = () => {
    ui.darkmode.enabled = localStorage.getItem('darkmode') == 'true';
    if (ui.darkmode.enabled) ui.darkmode.toggle();
};
ui.darkmode.toggle = (on) => {
    if (document.body.classList.contains('dark-mode') || on === false) {
        document.body.classList.remove('dark-mode');
    } else {
        document.body.classList.add('dark-mode');
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
};
ui.nav.toggleDarkMode = (darkmode) => {
    if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
    } else {
        document.body.classList.add('dark-mode');
    }
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

window.RacerUI = ui;
})();