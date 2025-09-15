ui.views.cars = {};

// Load default game view
ui.views.cars.load = () => {
    ui.view.loadComponent(`pages/cars`, (response) => {
        ui.nav.select('cars');
        ui.view.inject(response.responseText, 'cars');
    });
};
