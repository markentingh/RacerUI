ui.profile = {};

// Load profile view with optional username
ui.profile.load = () => {
    ui.view.loadComponent(`pages/profile`, (response) => {
        document.querySelector('.content').innerHTML = response;

    });
};