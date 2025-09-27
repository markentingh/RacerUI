ui.views.profile = {};

// Load default game view
ui.views.profile.load = () => {
    ui.view.loadComponent(`Profile/profile`, (html) => {
        ui.nav.select('profile');
        ui.view.inject(html, 'profile');
    });
};
