ui.profile = {};

// Load profile view with optional username
ui.profile.load = () => {
    ui.view.loadComponent(`Profile/profile`, (response) => {
        document.querySelector('.content').innerHTML = response;

    });
};