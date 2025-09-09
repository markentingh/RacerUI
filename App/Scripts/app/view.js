ui.view = {};
ui.view.load = (path, callback) => {
    ui.ajax({
        url: `/views/${path}`,
        complete: (response) => {
            if (callback) callback(response);
        }
    });
}

ui.view.inject = (html, name) => {
    const content = document.querySelector(`div.content`);
    content.innerHTML = html;
    content.className = 'content ' + name;
}
