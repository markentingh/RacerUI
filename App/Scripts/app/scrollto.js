ui.scrollTo = (scrollingElement, targetElement, duration, ease, offset = 0) => {
    const startTime = performance.now();
    const startY = scrollingElement.scrollTop;
    const easingFunction = ui.easing[ease] || ui.easing.linear;

    function animateScroll(currentTime) {
        const elapsedTime = currentTime - startTime;
        const rawProgress = Math.min(elapsedTime / duration, 1);
        const easedProgress = easingFunction(rawProgress);

        // The destination is the target's offsetTop, adjusted for scale and the user offset.
        const destinationScrollTop = (targetElement.offsetTop + offset) * ui.utils.scaleFactor;

        // Interpolate from the original startY to the calculated destination
        const newY = startY + ((destinationScrollTop - startY) * easedProgress);
        scrollingElement.scrollTo(0, newY);

        if (rawProgress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }

    requestAnimationFrame(animateScroll);
};