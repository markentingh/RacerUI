ui.views.cars = {
    filter:{
        countries:['all'], //ISO 3166-1 alpha-2 country codes
        makes:[],//makeId int   
        models:[],//modelId int
        years:[],//4-digit year
        types:[],//typeId int
        styles:[],//styleId int
        specializations:[],//specializationId int
        search:'',
        start:0,
        length:20,
    }
};

// Load default game view
ui.views.cars.load = (e) => {
    //first, load filter settings from local storage
    if(localStorage.getItem('RacerUI:cars-filter')){
        ui.views.cars.filter = JSON.parse(localStorage.getItem('RacerUI:cars-filter'));
    }
    if(!document.querySelector('.cars-toolbar')){
        ui.view.loadComponent(`Cars/cars`, (response) => {
            ui.nav.select('cars');
            ui.view.inject(response.responseText, 'cars');
            if(e && e.id){
                ui.views.cars.updateNav(e.id);
            }
        });
    }else{
        //view already loaded
        if(e && e.id){
            ui.views.cars.updateNav(e.id);
        }
    }
};

ui.views.cars.nav = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    history.pushState(null, '', `/dashboard/cars/${item}` + window.location.search);
}

ui.views.cars.updateNav = (item) => {
    console.log('views.cars.nav', item);
    ui.nav.select('cars');
    document.querySelector('.cars-toolbar li').classList.remove('selected');
    document.querySelector(`.cars-toolbar li.item-${item}`).classList.add('selected');
    ui.view.loadComponent(`Cars/filter-${item}`, (response) => {
        ui.view.injectComponent(response.responseText, '.cars-content');
        switch(item){
            case 'country':
                //load selected countries
                if(ui.views.cars.filter.countries.length > 0){
                    document.querySelectorAll('.filter-country li').forEach((li) => {
                        if(ui.views.cars.filter.countries.includes(li.getAttribute('data-country'))){
                            li.classList.add('selected');
                        }else{
                            li.classList.remove('selected');
                        }
                    });
                }
                document.querySelectorAll('.filter-country li').forEach((li) => {
                    li.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        ui.views.cars.country.select(li.getAttribute('data-country'));
                    }
                });
                break;
        }
    });
}

ui.views.cars.getFilteredList = () => {
    //save filter to local storage
    localStorage.setItem('RacerUI:cars-filter', JSON.stringify(ui.views.cars.filter));
    //get list of cars based on filter
    ui.ajax({
        url: `/api/cars/filter`,
        data: ui.views.cars.filter,
        complete: (response) => {
            console.log(response);
        }
    });
}

ui.views.cars.country = {}; 
ui.views.cars.country.select = (country) => {
    console.log('views.cars.country.select', country);
    if(country == 'all'){
        ui.views.cars.filter.countries = ['all'];
        document.querySelectorAll('.filter-country li').forEach((li) => {
            li.classList.remove('selected');
        });
    }else{
        if(ui.views.cars.filter.countries.includes(country)){
            ui.views.cars.filter.countries.splice(ui.views.cars.filter.countries.indexOf(country), 1);
        }else{
            ui.views.cars.filter.countries.push(country); 
        }
        if(ui.views.cars.filter.countries.indexOf('all') > -1){
            ui.views.cars.filter.countries.splice(ui.views.cars.filter.countries.indexOf('all'), 1);
        }
        document.querySelectorAll('.filter-country li[data-country="all"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-country li[data-country="' + country + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
}
    

