//initialize the app after all scripts are defined
console.log('initializing RacerUI web app...');

document.addEventListener('DOMContentLoaded', function() {
    //load dark mode setting from local storage
    ui.darkmode.load();
    ui.utils.scaleUI();

    //set up dark mode toggle
    const toggle = document.querySelector('.toggle.for-darkmode');
    if (toggle) {
        toggle.addEventListener('click', () => ui.toggle.flip(toggle, (on) => {
            ui.darkmode.toggle(on);
        }));
    }

    setTimeout(() => {
        const init = document.querySelector('.init');
        init.classList.add('fade');
        setTimeout(() => init.remove(), 1000);
        ui.utils.scaleUI();
    }, 500);
});

//load SVG files for logo & icons
var svg = document.createElement('div');
svg.classList.add('svg-assets');
document.body.append(svg);
ui.ajax({
    url: '/images/racerui-logo.svg',
    complete: (response) => {
        svg.innerHTML += response.responseText;
    }
});
ui.ajax({
    url: '/images/icons.svg',
    complete: (response) => {
        svg.innerHTML += response.responseText;
    }
});



