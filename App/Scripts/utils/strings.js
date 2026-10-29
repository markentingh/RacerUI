ui.utils.strings = {
    capitalize: (val) => { return String(val).charAt(0).toUpperCase() + String(val).slice(1) },

    // Escapes text for safe insertion into {{token}} HTML templates
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }
};
