ui.views.tracks = {};

// Load default game view
ui.views.tracks.load = () => {
    ui.view.loadComponent(`Tracks/tracks`, (response) => {
        ui.nav.select('tracks');
        ui.view.inject(response.responseText, 'tracks');
    });
};
