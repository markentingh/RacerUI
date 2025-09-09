ui.notFound = () => {
    ui.view.load(`Errors/404`, (response) => {
        document.querySelector('.content').innerHTML = response;
        console.warn('Route not found - 404 page displayed');
    });
};
