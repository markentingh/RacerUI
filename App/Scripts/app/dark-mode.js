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