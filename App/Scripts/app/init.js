setTimeout(() => {
    const init = document.querySelector('.init');
    init.classList.add('fade');
    setTimeout(() => init.remove(), 1000);
}, 500);