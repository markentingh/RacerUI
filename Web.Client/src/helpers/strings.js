export const capitalize = (val) => String(val).charAt(0).toUpperCase() + String(val).slice(1);

export const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
};

export const titleCase = (text) =>
    String(text || '').split(' ').map((w) => w ? w[0].toUpperCase() + w.substring(1) : w).join(' ');
