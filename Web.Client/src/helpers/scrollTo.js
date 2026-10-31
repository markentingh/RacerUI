import easing from './easing';

// Animated vertical scroll - targetTop is the destination scrollTop
export function scrollTo(scrollingElement, targetElement, duration, ease, offset = 0, scaleFactor = 1) {
    if (!scrollingElement || !targetElement) return;
    const startTime = performance.now();
    const startY = scrollingElement.scrollTop;
    const easingFunction = easing[ease] || easing.linear;
    const destinationScrollTop = (targetElement.offsetTop + offset) * scaleFactor;

    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const raw = Math.min(elapsed / duration, 1);
        const eased = easingFunction(raw);
        scrollingElement.scrollTo(0, startY + ((destinationScrollTop - startY) * eased));
        if (raw < 1) requestAnimationFrame(animateScroll);
    }
    requestAnimationFrame(animateScroll);
}
export default scrollTo;
