ui.views.history = {};

// Load default game view
ui.views.history.load = () => {
    ui.view.loadComponent(`pages/history`, (response) => {
        ui.nav.select('history');
        ui.view.inject(response.responseText, 'history');
    });
};
