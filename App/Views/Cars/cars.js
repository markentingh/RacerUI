//#region "Cars"

ui.views.cars = {
    filter: {
        countries: ['all'], //ISO 3166-1 alpha-2 country codes
        makes: [],//makeId int   
        models: [],//modelId int
        years: [],//4-digit year
        types: [],//typeId int
        styles: [],//styleId int
        specializations: [],//specializationId int
        search: '',
        start: 0,
        length: 100,
        view: 'grid',
    },
    results: []
};

ui.views.cars.load = (e) => {
    //first, load filter settings from local storage
    console.log('ui.views.cars.load', e);
    if (localStorage.getItem('RacerUI:cars-filter')) {
        ui.views.cars.filter = {...ui.views.cars.filter, ...JSON.parse(localStorage.getItem('RacerUI:cars-filter'))};
    }
    if (document.querySelector('.cars-toolbar') == null) {
        //view not loaded yet
        console.log('loadComponent(Cars/cars)');
        ui.view.loadComponent(`Cars/cars`, (html) => {
            ui.nav.select('cars');
            ui.view.inject(html, 'cars');
            if (e && e.id) {
                ui.views.cars.updateNav(e.id);
            }
            ui.views.cars.getFilteredList();
        });
    } else {
        //view already loaded
        if (e && e.id) {
            ui.views.cars.updateNav(e.id);
        }
        ui.views.cars.getFilteredList();
    }
};

ui.views.cars.nav = (e, section) => {
    e.preventDefault();
    e.stopPropagation();
    var navItem = document.querySelector(`.cars-toolbar li.item-${section}`);
    if (navItem.classList.contains('selected')) {
        ui.views.cars.hideFilter();
        return false;
    }
    history.pushState(null, '', `/dashboard/cars/${section}` + window.location.search);
    return true;
};

ui.views.cars.updateNav = (section) => {
    ui.nav.select('cars')
    var navItem = document.querySelector(`.cars-toolbar li.item-${section}`);
    if (navItem.classList.contains('selected')) {
        ui.views.cars.hideFilter();
        return false;
    }
    document.querySelector('.cars-toolbar li').classList.remove('selected');
    navItem.classList.add('selected');
    ui.view.loadComponent(`Cars/filter-${section}`, (html) => {
        ui.view.injectComponent(html, '.cars-filter');
        switch (section) {
            case 'country':
                ui.views.cars.country.load();
                break;
            case 'manufacturer':
                ui.views.cars.manufacturer.load();
                break;
            case 'model':
                ui.views.cars.model.load();
                break;
            case 'year':
                ui.views.cars.year.load();
                break;
            case 'type':
                ui.views.cars.type.load();
                break;
            case 'style':
                ui.views.cars.style.load();
                break;
            case 'specialization':
                ui.views.cars.specialization.load();
                break;
        }
        //show close button
        document.querySelector('.cars-toolbar .close-btn').style.display = 'block';
    });
};

ui.views.cars.hideFilter = () => {
    document.querySelector('.cars-toolbar .close-btn').style.display = 'none';
    document.querySelector('.cars-filter').innerHTML = '';
    document.querySelectorAll('.cars-toolbar li').forEach((li) => {
        li.classList.remove('selected');
    });
    history.pushState(null, '', `/dashboard/cars` + window.location.search);
};

ui.views.cars.saveFilter = () => {
    localStorage.setItem('RacerUI:cars-filter', JSON.stringify(ui.views.cars.filter));
};

ui.views.cars.getFilteredList = () => {
    //get list of cars based on filter
    const start = Math.round(1 + (10000 * Math.random()));
    console.log('start', start);

    ui.views.cars.saveFilter();
    ui.ajax({
        url: `/api/cars/filter`,
        data: {...ui.views.cars.filter, start: start},
        complete: (response) => {
            if (response.status == 200) {
                ui.views.cars.views.load(JSON.parse(response.responseText));
            }
        }
    });
};

//#endregion

//#region "Views"

ui.views.cars.views = {};

ui.views.cars.views.load = (list) => {
    if (list) {
        ui.views.cars.results = list;
    }else{
        list = ui.views.cars.results;
    }
    ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-view`, (htmlView) => {
        ui.view.loadComponent(`Cars/${ui.views.cars.filter.view}-item`, (htmlItem) => {
            var output = '';
            list.cars.forEach((car) => {
                const skin = car.skins.length > 0 ? car.skins[0] : null;
                var preview = skin ? '/image/' + encodeURIComponent(ui.game.name) + '/skin/' + encodeURIComponent(car.path) + '/' + encodeURIComponent(skin.path) : '';
                output += htmlItem.replace('{{preview}}', preview || 'no-preview.jpg')
                    .replace('{{name}}', car.name ?? car.path.replace(/_/g, ' '))
                    .replace('{{description}}', car.description ?? '')
                    ;
            });
            ui.view.injectComponent(htmlView.replace('{{items}}', output), '.cars-content');
        });
    });
}

ui.views.cars.views.changeView = (view) => {
    ui.views.cars.filter.view = view;
    ui.views.cars.views.load()
    ui.views.cars.saveFilter();
};


//#endregion

//#region "View Filter"

ui.views.cars.view = {};

ui.views.cars.view.load = () => {
    //load selected countries
    if (ui.views.cars.filter.countries.length > 0) {
        document.querySelectorAll('.filter-country li').forEach((li) => {
            if (ui.views.cars.filter.countries.includes(li.getAttribute('data-country'))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-view li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.view.select(li.getAttribute('data-view'));
        }
    });
};

ui.views.cars.view.select = (view) => {
    ui.views.cars.filter.view = view;
    document.querySelectorAll('.filter-view li').forEach((li) => {
        li.classList.remove('selected');
    });
    document.querySelectorAll('.filter-view li[data-view="' + view + '"]').forEach((li) => {
        li.classList.add('selected');
    });
};

//#endregion

//#region "Country Filter"

ui.views.cars.country = {};

ui.views.cars.country.load = () => {
    //load selected countries
    if (ui.views.cars.filter.countries.length > 0) {
        document.querySelectorAll('.filter-country li').forEach((li) => {
            if (ui.views.cars.filter.countries.includes(li.getAttribute('data-country'))) {
                li.classList.add('selected');
            } else {
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
};

ui.views.cars.country.select = (country) => {
    if (country == 'all') {
        ui.views.cars.filter.countries = ['all'];
        document.querySelectorAll('.filter-country li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.countries.includes(country)) {
            ui.views.cars.filter.countries.splice(ui.views.cars.filter.countries.indexOf(country), 1);
        } else {
            ui.views.cars.filter.countries.push(country);
        }
        if (ui.views.cars.filter.countries.indexOf('all') > -1) {
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
};

//#endregion

//#region "Manufacturer Filter"

ui.views.cars.manufacturer = {};

ui.views.cars.manufacturer.load = () => {
    //load selected manufacturers
    if (ui.views.cars.filter.makes.length > 0) {
        document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
            if (ui.views.cars.filter.makes.includes(parseInt(li.getAttribute('data-make')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.manufacturer.select(parseInt(li.getAttribute('data-make')));
        }
    });
};

ui.views.cars.manufacturer.select = (makeId) => {
    if (makeId == 0) { // Assuming 0 is the 'all' value for manufacturers
        ui.views.cars.filter.makes = [];
        document.querySelectorAll('.filter-manufacturer li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.makes.includes(makeId)) {
            ui.views.cars.filter.makes.splice(ui.views.cars.filter.makes.indexOf(makeId), 1);
        } else {
            ui.views.cars.filter.makes.push(makeId);
        }
        document.querySelectorAll('.filter-manufacturer li[data-make="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-manufacturer li[data-make="' + makeId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Model Filter"

ui.views.cars.model = {};

ui.views.cars.model.load = () => {
    //load selected models
    if (ui.views.cars.filter.models.length > 0) {
        document.querySelectorAll('.filter-model li').forEach((li) => {
            if (ui.views.cars.filter.models.includes(parseInt(li.getAttribute('data-model')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-model li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.model.select(parseInt(li.getAttribute('data-model')));
        }
    });
};

ui.views.cars.model.select = (modelId) => {
    if (modelId == 0) { // Assuming 0 is the 'all' value for models
        ui.views.cars.filter.models = [];
        document.querySelectorAll('.filter-model li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.models.includes(modelId)) {
            ui.views.cars.filter.models.splice(ui.views.cars.filter.models.indexOf(modelId), 1);
        } else {
            ui.views.cars.filter.models.push(modelId);
        }
        document.querySelectorAll('.filter-model li[data-model="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-model li[data-model="' + modelId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Year Filter"

ui.views.cars.year = {};

ui.views.cars.year.load = () => {
    //load selected years
    if (ui.views.cars.filter.years.length > 0) {
        document.querySelectorAll('.filter-year li').forEach((li) => {
            if (ui.views.cars.filter.years.includes(parseInt(li.getAttribute('data-year')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-year li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.year.select(parseInt(li.getAttribute('data-year')));
        }
    });
};

ui.views.cars.year.select = (year) => {
    if (year == 0) { // Assuming 0 is the 'all' value for years
        ui.views.cars.filter.years = [];
        document.querySelectorAll('.filter-year li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.years.includes(year)) {
            ui.views.cars.filter.years.splice(ui.views.cars.filter.years.indexOf(year), 1);
        } else {
            ui.views.cars.filter.years.push(year);
        }
        document.querySelectorAll('.filter-year li[data-year="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-year li[data-year="' + year + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Type Filter"

ui.views.cars.type = {};

ui.views.cars.type.load = () => {
    //load selected types
    if (ui.views.cars.filter.types.length > 0) {
        document.querySelectorAll('.filter-type li').forEach((li) => {
            if (ui.views.cars.filter.types.includes(parseInt(li.getAttribute('data-type')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-type li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.type.select(parseInt(li.getAttribute('data-type')));
        }
    });
};

ui.views.cars.type.select = (typeId) => {
    if (typeId == 0) { // Assuming 0 is the 'all' value for types
        ui.views.cars.filter.types = [];
        document.querySelectorAll('.filter-type li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.types.includes(typeId)) {
            ui.views.cars.filter.types.splice(ui.views.cars.filter.types.indexOf(typeId), 1);
        } else {
            ui.views.cars.filter.types.push(typeId);
        }
        document.querySelectorAll('.filter-type li[data-type="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-type li[data-type="' + typeId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Style Filter"

ui.views.cars.style = {};

ui.views.cars.style.load = () => {
    //load selected styles
    if (ui.views.cars.filter.styles.length > 0) {
        document.querySelectorAll('.filter-style li').forEach((li) => {
            if (ui.views.cars.filter.styles.includes(parseInt(li.getAttribute('data-style')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-style li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.style.select(parseInt(li.getAttribute('data-style')));
        }
    });
};

ui.views.cars.style.select = (styleId) => {
    if (styleId == 0) { // Assuming 0 is the 'all' value for styles
        ui.views.cars.filter.styles = [];
        document.querySelectorAll('.filter-style li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.styles.includes(styleId)) {
            ui.views.cars.filter.styles.splice(ui.views.cars.filter.styles.indexOf(styleId), 1);
        } else {
            ui.views.cars.filter.styles.push(styleId);
        }
        document.querySelectorAll('.filter-style li[data-style="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-style li[data-style="' + styleId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion

//#region "Specialization Filter"

ui.views.cars.specialization = {};

ui.views.cars.specialization.load = () => {
    //load selected specializations
    if (ui.views.cars.filter.specializations.length > 0) {
        document.querySelectorAll('.filter-specialization li').forEach((li) => {
            if (ui.views.cars.filter.specializations.includes(parseInt(li.getAttribute('data-specialization')))) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });
    }
    document.querySelectorAll('.filter-specialization li').forEach((li) => {
        li.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            ui.views.cars.specialization.select(parseInt(li.getAttribute('data-specialization')));
        }
    });
};

ui.views.cars.specialization.select = (specializationId) => {
    if (specializationId == 0) { // Assuming 0 is the 'all' value for specializations
        ui.views.cars.filter.specializations = [];
        document.querySelectorAll('.filter-specialization li').forEach((li) => {
            li.classList.remove('selected');
        });
    } else {
        if (ui.views.cars.filter.specializations.includes(specializationId)) {
            ui.views.cars.filter.specializations.splice(ui.views.cars.filter.specializations.indexOf(specializationId), 1);
        } else {
            ui.views.cars.filter.specializations.push(specializationId);
        }
        document.querySelectorAll('.filter-specialization li[data-specialization="0"]').forEach((li) => {
            li.classList.remove('selected');
        });
    }
    document.querySelectorAll('.filter-specialization li[data-specialization="' + specializationId + '"]').forEach((li) => {
        li.classList.toggle('selected');
    });
    ui.views.cars.getFilteredList();
};

//#endregion
