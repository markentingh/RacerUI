ui.game = {
    name: 'assetto corsa',
    path: null,
    id: null
};

ui.games = [
    {
        name: 'assetto corsa',
        class: 'game-assetto-corsa',
        icon: 'icon-assetto-corsa'
    }
]

ui.game.load = () => {
    console.log('Loading initial game information...');
    ui.game.get().then((game) => {
        if(game?.id && game?.title){
            console.log('Game selected: ' + game.title);
            var gameInfo = ui.games.find(g => g.name == game.name);
            ui.nav.gameName(game.title);
            document.querySelectorAll('.game-loaded').forEach(el => { 
                el.classList.remove('game-loaded'); 
            });
            document.body.classList.add('game-loaded');
            document.body.classList.add(gameInfo.class);
        }
    });
};

ui.game.get = async () => {
    var game = localStorage.getItem('RacerUI:game');
    if(ui.game.id == null && game){
        game = JSON.parse(game);
        var loadedGame = await dashHub.invoke('GetGameDetails', game.name);
        if(loadedGame){
            ui.game = {
                ...ui.game, 
                ...loadedGame
            };
        }
    }
    if(ui.game.id == null){
        //if all else fails, try to load assetto corsa
        ui.game = {
            ...ui.game, 
            ...(await dashHub.invoke('GetGameDetails', 'assetto corsa'))
        };
    }
    return new Promise((resolve) => { resolve(ui.game); });
};

ui.game.set = (game) => {
    ui.game = {...ui.game, ...game};
    localStorage.setItem('RacerUI:game', JSON.stringify({
        name: ui.game.name,
        path: ui.game.path,
        id: ui.game.id,
        title: ui.game.title
    }));
};

ui.game.setPath = async (path) => {
    var game = await dashHub.invoke('SetGamePath', path, ui.game?.name);
    if(game){
        ui.game.set(game);
    }
    return new Promise((resolve) => { resolve(game); });
};
