ui.views.history = {};

// Load default game view
ui.views.history.load = () => {
    ui.view.loadComponent(`History/history`, (html) => {
        ui.nav.select('history');   
        ui.view.inject(html, 'history');
    });
};
