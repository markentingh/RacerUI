ui.nav = {};

ui.nav.select = (id) => {
    document.querySelectorAll('.dash nav ul.menu li').forEach(li => {
        li.classList.remove('selected');
    });
    document.querySelector(`.dash nav ul.menu li.item-${id}`).classList.add('selected');
}

ui.nav.navigate = (path) => {
    // Update the URL first, which will trigger the route execution via our location change listener
    history.pushState({path: path}, '', `/dashboard/${path}`);
    
    // The route execution will be handled by the event listener in routes.js
    // But we'll also update the UI here for immediate feedback
    const baseId = path.split('/')[0];
    ui.nav.select(baseId);
}

ui.nav.gameName = (name) => {
    document.getElementById('gameName').textContent = name;
}

ui.nav.gameName('Assetto Corsa');
