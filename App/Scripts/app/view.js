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
            ui.utils.scaleUI();
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

ui.view.hasBlock = (html, name, visible) => {
    const template = typeof html === 'string' ? html : '';
    if (!name) {
        return template;
    }

    const blockName = String(name).trim();
    if (!blockName) {
        return template;
    }

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`{{${escapeRegex(blockName)}}}([\\s\\S]*?){{\/${escapeRegex(blockName)}}}`, 'g');
    return template.replace(pattern, (_match, content) => visible ? content : '');
}

if (!String.prototype.hasBlock) {
    String.prototype.hasBlock = function(name, visible) {
        return ui.view.hasBlock(String(this), name, visible);
    }
}
