ui.views.profile = {};

// Load default game view
ui.views.profile.load = () => {
    ui.view.loadComponent(`Profile/profile`, (response) => {
        ui.nav.select('profile');
        ui.view.inject(response.responseText, 'profile');
    });
};
