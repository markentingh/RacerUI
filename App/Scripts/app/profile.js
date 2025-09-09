ui.profile = {};

// Load profile view with optional username
ui.profile.load = (username) => {
    ui.view.load(`Profile/index`, (response) => {
        document.querySelector('.content').innerHTML = response;

    });
};