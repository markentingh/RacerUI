ui.profile = {};

// Load profile view with optional username
ui.profile.load = () => {
    ui.view.loadComponent(`Profile/profile`, (html) => {
        document.querySelector('.content').innerHTML = html;

    });
};