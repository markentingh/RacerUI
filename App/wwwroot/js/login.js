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
const toggle = document.querySelector('.toggle.for-darkmode');
if (toggle) {
    toggle.addEventListener('click', () => ui.toggle.flip(toggle, (on) => {
        ui.darkmode.toggle(on);
    }));
}

window.RacerUI = ui;
})();