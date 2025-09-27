ui.views.settings = {};

// Load default game view
ui.views.settings.load = () => {
    ui.view.loadComponent(`Settings/settings`, (html) => {
        ui.nav.select('settings');
        ui.view.inject(html, 'settings');
    });
};
