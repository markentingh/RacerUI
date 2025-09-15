
let dashHub = null; //SignalR hub instance
ui.hub = {};

ui.hub.load = () => {
    if (dashHub == null) {
        dashHub = new signalR.HubConnectionBuilder().withUrl('/dashboardhub', { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets }).build();
        
        //event listeners
        dashHub.on('update', ui.hub.log);
        dashHub.on('handshake', ui.hub.handshake);
        dashHub.on('gameDetails', ui.hub.gameDetails);

        dashHub.start().catch(ui.hub.error);
        setTimeout(() => { 
            dashHub.invoke('Handshake'); 
            ui.hub.keepAliveAgain();
        }, 500);
    }
};

ui.hub.error = (e) => {
    console.log(e);
};

ui.hub.log = (msg) => {
    console.log(msg);
};

ui.hub.keepAlive = () => {
    dashHub.invoke('KeepAlive');
    ui.hub.keepAliveAgain();
}

ui.hub.keepAliveAgain = () => {
    setTimeout(() => { ui.hub.keepAlive(); }, 1000 * 10);
}

ui.hub.handshake = () => {
    //load current game
    ui.game.load();
    //finally, initialize routing
    ui.routing.init();
}

ui.hub.gameDetails = (game) => {
    if(game){
        ui.game.set(JSON.parse(game));
    }
};