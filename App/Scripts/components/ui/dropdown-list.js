//#region "DropdownList"

// <dropdown-list> - a styled drop-in replacement for <select>.
// Reads its child <option> elements as the data source, so existing code that
// sets innerHTML/value/querySelector keeps working. The option list is hidden;
// the visible toggle + popup list are themed via colors.less.
class DropdownList extends HTMLElement {

    connectedCallback() {
        if (!this._toggle) {
            this._toggle = document.createElement('div');
            this._toggle.className = 'ddl-toggle';
            const label = document.createElement('span');
            label.className = 'ddl-label';
            const caret = document.createElement('span');
            caret.className = 'material-symbols-outlined ddl-caret';
            caret.textContent = 'keyboard_arrow_down';
            this._toggle.append(label, caret);
            this._toggle.addEventListener('click', () => this.toggle());
        }
        this.prepend(this._toggle);

        // Rebuild the item list whenever options are added/removed
        this._observer = new MutationObserver(() => this._syncOptions());
        this._observer.observe(this, { childList: true });

        this._onDocPointerDown = (e) => {
            if (!this.contains(e.target) && !(this._portal && this._portal.contains(e.target))) {
                this.close();
            }
        };
        document.addEventListener('pointerdown', this._onDocPointerDown, true);
        this._onClose = () => this.close();
        window.addEventListener('resize', this._onClose);
        document.addEventListener('scroll', this._onClose, true);

        this._syncOptions();
    }

    disconnectedCallback() {
        if (this._observer) this._observer.disconnect();
        document.removeEventListener('pointerdown', this._onDocPointerDown, true);
        window.removeEventListener('resize', this._onClose);
        document.removeEventListener('scroll', this._onClose, true);
        this.close();
    }

    // The raw <option> children are the data source (they're hidden by CSS).
    // NB: the .selected *property* doesn't stick on <option> elements that
    // aren't inside a real <select>, so selection is tracked on _selectedValue
    // and mirrored to the selected attribute.
    get options() {
        return Array.from(this.children).filter((c) => c.tagName === 'OPTION');
    }

    // A `placeholder` attribute makes the control start unselected and show the
    // placeholder text until an option is picked (e.g. the "More" race-mode
    // menu, where "More" itself is not a selectable item)
    get placeholder() {
        return this.getAttribute('placeholder');
    }

    get value() {
        const opt = this.options.find((o) => o.value === this._selectedValue)
            || this.options.find((o) => o.hasAttribute('selected'))
            || (this.placeholder == null ? this.options[0] : null);
        return opt ? opt.value : '';
    }

    set value(v) {
        v = String(v);
        const opt = this.options.find((o) => o.value === v);
        if (opt) {
            this._select(opt, false);
        } else {
            // Value set before options exist - apply it when they arrive
            this._pendingValue = v;
        }
    }

    _select(opt, fireEvent) {
        this._selectedValue = opt.value;
        this.options.forEach((o) => {
            o.toggleAttribute('selected', o === opt);
            o.selected = (o === opt);
        });
        if (this._toggle) {
            this._toggle.querySelector('.ddl-label').textContent = opt.textContent;
            this._toggle.classList.remove('ddl-placeholder');
        }
        if (this._portal) {
            this._portal.querySelectorAll('.ddl-item').forEach((item) => {
                item.classList.toggle('selected', item._option === opt);
            });
        }
        if (fireEvent) {
            this.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    _syncOptions() {
        // innerHTML assignment wipes our toggle (and serializes it into dead
        // clones when it was connected during `+=`) - restore the real toggle
        // first and remove any dead copies
        if (this._toggle && this._toggle.parentNode !== this) {
            this.prepend(this._toggle);
        }
        Array.from(this.children)
            .filter((c) => c.classList && c.classList.contains('ddl-toggle') && c !== this._toggle)
            .forEach((c) => c.remove());

        const pending = this._pendingValue;
        if (pending !== undefined && this.options.some((o) => o.value === pending)) {
            this._pendingValue = undefined;
        }

        const selected =
            this.options.find((o) => o.value === this._selectedValue)
            || this.options.find((o) => o.value === pending)
            || this.options.find((o) => o.hasAttribute('selected'))
            || (this.placeholder == null ? this.options[0] : null);

        if (selected) {
            this._select(selected, false);
        } else if (this._toggle) {
            this._showPlaceholder();
        }

        // Keep the open list in sync if options change while open
        if (this._portal) {
            this._buildItems();
        }
    }

    _showPlaceholder() {
        const label = this._toggle.querySelector('.ddl-label');
        label.textContent = this.placeholder || '';
        this._toggle.classList.toggle('ddl-placeholder', this.placeholder != null);
    }

    // Returns the control to its unselected state: the placeholder text when
    // one is set, otherwise the first option (matching initial render)
    clear() {
        this._selectedValue = undefined;
        this._pendingValue = undefined;
        this.options.forEach((o) => {
            o.removeAttribute('selected');
            o.selected = false;
        });
        if (this._portal) {
            this._portal.querySelectorAll('.ddl-item').forEach((item) => {
                item.classList.remove('selected');
            });
        }
        if (this._toggle) {
            if (this.placeholder != null) {
                this._showPlaceholder();
            } else if (this.options.length) {
                this._select(this.options[0], false);
            } else {
                this._toggle.querySelector('.ddl-label').textContent = '';
            }
        }
    }

    toggle() {
        if (this._portal) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (!this.options.length || this._portal) return;

        this._portal = document.createElement('div');
        this._portal.className = 'ddl-portal';
        this._buildItems();
        document.body.appendChild(this._portal);

        // The toggle may live inside a scaled .scale-ui container - measure the
        // effective scale and reproduce it on the portal so it matches visually
        const rect = this._toggle.getBoundingClientRect();
        const scale = this._toggle.offsetWidth ? rect.width / this._toggle.offsetWidth : 1;

        const portal = this._portal;
        portal.style.transform = `scale(${scale})`;
        portal.style.transformOrigin = 'top left';
        portal.style.width = `${this._toggle.offsetWidth}px`;

        // Open upward when there isn't room below
        const portalHeight = portal.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < portalHeight && rect.top > portalHeight) {
            portal.style.left = `${rect.left}px`;
            portal.style.top = `${rect.top - portalHeight}px`;
            portal.style.transformOrigin = 'bottom left';
        } else {
            portal.style.left = `${rect.left}px`;
            portal.style.top = `${rect.bottom}px`;
            portal.style.transformOrigin = 'top left';
        }
    }

    _buildItems() {
        this._portal.innerHTML = '';
        this.options.forEach((opt) => {
            const item = document.createElement('div');
            item.className = 'ddl-item' + (opt.selected ? ' selected' : '');
            item.textContent = opt.textContent;
            item._option = opt;
            item.addEventListener('click', () => {
                this._select(opt, true);
                this.close();
            });
            this._portal.appendChild(item);
        });
    }

    close() {
        if (this._portal) {
            this._portal.remove();
            this._portal = null;
        }
    }
}

customElements.define('dropdown-list', DropdownList);

//#endregion
