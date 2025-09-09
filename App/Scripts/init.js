//initialize the app after all scripts are defined
console.log('initializing app');

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

//load dark mode setting from local storage
ui.darkmode.load();

const toggle = document.querySelector('.toggle.for-darkmode');
if (toggle) {
    toggle.addEventListener('click', () => ui.toggle.flip(toggle, (on) => {
        ui.darkmode.toggle(on);
    }));
}

//window resize to scale UI
ui.utils.scaleUI = () => {
    let scale = window.innerWidth / 1920;
    if (scale < 1) scale = 1;
    
    // Create or update CSS variable for scale factor
    let styleEl = document.getElementById('scale-factor-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'scale-factor-style';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = `:root { --scale-factor: ${scale}; }`;
    
    // Apply scale to elements with scale-ui class
    const scalable = document.querySelectorAll('.scale-ui');
    scalable.forEach(el => el.style.transform = `scale(${scale})`);
}
    
window.addEventListener('resize', () => {
    ui.utils.scaleUI();
});

ui.utils.scaleUI();

setTimeout(() => {
    const init = document.querySelector('.init');
    init.classList.add('fade');
    setTimeout(() => init.remove(), 1000);
}, 500);