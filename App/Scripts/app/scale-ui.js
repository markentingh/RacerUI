//window resize to scale UI
ui.utils.scaleFactor = 0;
ui.utils.scaleUI = () => {
    let scale = (1.0 / 1920) * window.innerWidth;
    if (scale < 1) scale = 1;
    if(scale != ui.utils.scaleFactor){
        ui.utils.scaleFactor = scale;
        // Create or update CSS variable for scale factor
        let styleEl = document.getElementById('scale-factor-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'scale-factor-style';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `:root { --scale-factor: ${scale}; }`;
    }
    
    // Apply scale to elements with scale-ui class
    const scalable = document.querySelectorAll('.scale-ui');
    scalable.forEach(el => el.style.transform = `scale(${scale})`);
}
    
window.addEventListener('resize', ui.utils.scaleUI);