ui.notFound = () => {
    ui.view.loadComponent(`Errors/404`, (html) => {
        document.querySelector('.content').innerHTML = html;
        console.warn('Route not found - 404 page displayed');
    });
};
