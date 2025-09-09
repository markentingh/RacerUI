ui.nav = {};

ui.nav.select = (id) => {
    document.querySelectorAll('.dash nav ul.menu li').forEach(li => {
        li.classList.remove('selected');
    });
    document.querySelector(`.dash nav ul.menu li.item-${id}`).classList.add('selected');
}

ui.nav.navigate = (path) => {
    console.log('navigate', path);
    ui.nav.select(path);
    history.pushState(null, '', `/dashboard/${path}`);
}

ui.nav.gameName = (name) => {
    document.getElementById('gameName').textContent = name;
}


ui.nav.select('game');
ui.nav.gameName('Assetto Corsa');
