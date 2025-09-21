ui.views.history = {};

// Load default game view
ui.views.history.load = () => {
    ui.view.loadComponent(`History/history`, (response) => {
        ui.nav.select('history');
        ui.view.inject(response.responseText, 'history');
    });
};
