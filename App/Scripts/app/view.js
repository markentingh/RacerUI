ui.view = {cache:{}};
ui.views = {}; //contains all loaded views

ui.view.loadComponent = (path, callback) => {
    if(ui.view.cache[path]){
        if (callback) callback(ui.view.cache[path]);
        return;
    }
    ui.ajax({
        url: `/views/${path}`,
        complete: (response) => {
            ui.view.cache[path] = response.responseText;
            if (callback) callback(response.responseText);
        }
    });
}

ui.view.inject = (html, name) => {
    const content = document.querySelector(`div.content`);
    content.innerHTML = html;
    content.className = 'content ' + name;
    ui.utils.scaleUI();
}

ui.view.injectComponent = (html, selector) => {
    const content = document.querySelector(selector);
    content.innerHTML = html;
    ui.utils.scaleUI();
}
