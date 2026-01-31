ui.views.game = {
    isCheckingAssets:false,
    checkingProgress:0
};

// Load default game view
ui.views.game.load = () => {
    ui.view.loadComponent(`Game/game`, (html) => {
        ui.nav.select('game');
        ui.view.inject(html, 'game');
        ui.views.game.checkingAssetsShowUI();
        ui.game.get().then((game) => {
            if (game == null || game.id == null || game.id == 0) {
                document.querySelector('.set-game-path').style.display = 'block';
                document.querySelector('.check-assets').style.display = 'none';
                document.querySelector('.set-game-path input').value = game.path;
            } else {
                document.querySelector('.set-game-path').style.display = 'none';
                document.querySelector('.check-assets').style.display = 'block';
            }
        });
    });
};
    

// Check game assets (referenced in the HTML component)
ui.views.game.checkAssets = () => {
    console.log('Checking game assets...');
    ui.views.game.isCheckingAssets = true;
    ui.views.game.checkingProgress = 0;
    ui.views.game.checkingAssetsShowUI();
    var checkNewCars = document.querySelector('#checkNewCars').checked;
    var findChildCars = document.querySelector('#findChildCars').checked;
    var getCarDetails = document.querySelector('#getCarDetails').checked;
    var verifyCarDetails = document.querySelector('#verifyCarDetails').checked;
    var checkNewTracks = document.querySelector('#checkNewTracks').checked;
    dashHub.on('progress', ui.views.game.updateProgress);
    dashHub.on('progress-title', ui.views.game.updateProgressTitle);
    dashHub.on('progress-text', ui.views.game.updateProgressText);
    dashHub.on('progress-complete', ui.views.game.updateProgressComplete);
    dashHub.send('CheckGameAssets', ui.game.name, checkNewCars, findChildCars, getCarDetails, verifyCarDetails, checkNewTracks);
};

ui.views.game.skipCheckAssets = () => {
    ui.views.game.updateProgressComplete();
};

ui.views.game.updateProgressTitle = (title) => {
    document.querySelector('.checking-assets .progress-title').textContent = title;
}

ui.views.game.updateProgressText = (text) => {
    document.querySelector('.checking-assets .progress-text').textContent = text;
}

ui.views.game.updateProgress = (progress) => {
    var el = document.querySelector('.checking-assets .progress .bar');
    if(el != null) el.style.width = progress + '%';
    ui.views.game.checkingProgress = progress;
}

ui.views.game.updateProgressComplete = () => {
    ui.views.game.isCheckingAssets = false;
    dashHub.off('progress', ui.views.game.updateProgress);
    dashHub.off('progress-title', ui.views.game.updateProgressTitle);
    dashHub.off('progress-text', ui.views.game.updateProgressText);
    dashHub.off('progress-complete', ui.views.game.updateProgressComplete);
    ui.views.game.checkingAssetsShowUI();
}

ui.views.game.checkingAssetsShowUI = () => {
    if(ui.views.game.isCheckingAssets && document.querySelector('.check-assets')){
        document.querySelector('.check-assets > button').style.display = 'none';
        document.querySelector('.checking-assets').style.display = 'block';
        document.querySelector('.checking-assets .bar').style.width = ui.views.game.checkingProgress + '%';
    }else if(!ui.views.game.isCheckingAssets && document.querySelector('.checking-assets')){
        document.querySelector('.check-assets > button').style.display = '';
        document.querySelector('.checking-assets').style.display = 'none';
    }
};

ui.views.game.setPath = () => {
    var path = document.querySelector('#gamePath').value;
    RacerUI.game.setPath(path).then((game) => {
        if(game){
            document.querySelector('.set-game-path').style.display = 'none';
            document.querySelector('.check-assets').style.display = 'block';
        }
    });
};
