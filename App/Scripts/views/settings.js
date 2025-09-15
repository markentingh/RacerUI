ui.views.settings = {};

// Load default game view
ui.views.settings.load = () => {
    ui.view.loadComponent(`pages/settings`, (response) => {
        ui.nav.select('settings');
        ui.view.inject(response.responseText, 'settings');
    });
};
