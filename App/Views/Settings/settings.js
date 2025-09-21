ui.views.settings = {};

// Load default game view
ui.views.settings.load = () => {
    ui.view.loadComponent(`Settings/settings`, (response) => {
        ui.nav.select('settings');
        ui.view.inject(response.responseText, 'settings');
    });
};
