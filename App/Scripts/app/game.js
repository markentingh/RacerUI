ui.game = {};

// Load default game view
ui.game.load = () => {
    ui.view.load(`Game/index`, (response) => {
        ui.nav.select('game');
        ui.view.inject(response.responseText, 'game');
    });
};

// Check game assets (referenced in the HTML component)
ui.game.checkAssets = () => {
    console.log('Checking game assets...');
    
};
