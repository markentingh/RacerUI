ui.routes = [
    { path: 'dashboard', action: ui.game.load },
    { path: 'dashboard/game', action: ui.game.load },
    { path: 'dashboard/game/:id', action: ui.game.load },
    { path: 'dashboard/profile', action: ui.profile.load },
    { path: 'dashboard/*', action: () => ui.notFound() } // Wildcard route for 404
];
