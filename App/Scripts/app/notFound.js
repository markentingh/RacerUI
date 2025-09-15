ui.notFound = () => {
    ui.view.loadComponent(`errors/404`, (response) => {
        document.querySelector('.content').innerHTML = response.responseText;
        console.warn('Route not found - 404 page displayed');
    });
};
