ui.routes = [
    { path: 'dashboard', action: ui.views.game.load, },
    { path: 'dashboard/game', action: ui.views.game.load },
    { path: 'dashboard/game/:id', action: ui.views.game.load }, 
    { path: 'dashboard/cars', action: ui.views.cars.load, unload: ui.views.cars.unload },
    { path: 'dashboard/cars/:id', action: ui.views.cars.load, unload: ui.views.cars.unload },
    { path: 'dashboard/tracks', action: ui.views.tracks.load, unload: ui.views.tracks.unload },
    { path: 'dashboard/tracks/:id', action: ui.views.tracks.load, unload: ui.views.tracks.unload },
    { path: 'dashboard/history', action: ui.views.history.load },
    { path: 'dashboard/settings', action: ui.views.settings.load },
    { path: 'dashboard/profile', action: ui.views.profile.load },
    { path: 'dashboard/*', action: ui.notFound } // Wildcard route for 404
];
