ui.views.tracks = {};

// Load default game view
ui.views.tracks.load = () => {
    ui.view.loadComponent(`Tracks/tracks`, (html) => {
        ui.nav.select('tracks');
        ui.view.inject(html, 'tracks');
    });
};
