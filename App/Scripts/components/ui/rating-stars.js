//#region "RatingStars"

// <rating-stars> - five-star rating display + one-shot rater.
//
// Attributes:
//   rating      0-5. >0 renders locked (filled gold + grey outlines, no hover).
//   item-type   'car' | 'track' - enables saving when unrated.
//   item-id     database id for the save endpoint.
//   readonly    never interactive (display only).
//   filled-only render only the filled stars (preview badge mode).
//
// Behaviour: unrated shows grey outlines; hovering the component turns all
// stars gold outline and hovering star N fills 1..N gold; clicking saves
// rating N to /api/{type}s/{id}/rating and locks the component.
// Emits a bubbling 'rated' CustomEvent {itemType, itemId, rating} on save.
class RatingStars extends HTMLElement {

    static get observedAttributes() { return ['rating']; }

    connectedCallback() {
        this._build();
        if (this._interactive()) this._wire();
        this._paint();
    }

    attributeChangedCallback() {
        if (!this.isConnected) return;
        // filled-only badges render `rating` stars - a rating change needs a rebuild
        if (this.hasAttribute('filled-only')) this._build();
        this._paint();
    }

    get rating() {
        const r = parseInt(this.getAttribute('rating') || '0', 10);
        return Number.isFinite(r) ? Math.min(Math.max(r, 0), 5) : 0;
    }

    get locked() {
        return this.rating > 0 || this.hasAttribute('readonly');
    }

    _interactive() {
        return !this.locked
            && this.hasAttribute('item-type')
            && this.hasAttribute('item-id');
    }

    _build() {
        this.replaceChildren();
        this._stars = [];
        const count = this.hasAttribute('filled-only') ? this.rating : 5;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('span');
            star.className = 'rs-star';
            star.dataset.index = String(i + 1);
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#icon-star-outline');
            use.setAttribute('href', '#icon-star-outline');
            svg.appendChild(use);
            star.appendChild(svg);
            this.appendChild(star);
            this._stars.push(star);
        }
        this.classList.toggle('rs-badge', this.hasAttribute('filled-only'));
    }

    _paint() {
        const r = this.rating;
        const hover = !!(this._hovering && this._interactive());
        const preview = hover && this._preview ? this._preview : 0;
        this.classList.toggle('rs-interactive', this._interactive());
        this._stars.forEach((star, idx) => {
            const n = idx + 1;
            const filled = n <= r || (preview > 0 && n <= preview);
            // NB: toggle() with an undefined force flips the class - keep gold boolean
            const gold = !!(n <= r || hover);
            star.classList.toggle('gold', this.hasAttribute('filled-only') ? true : gold);
            const use = star.querySelector('use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', filled ? '#icon-star' : '#icon-star-outline');
            use.setAttribute('href', filled ? '#icon-star' : '#icon-star-outline');
        });
    }

    _wire() {
        // pointermove only fires on real pointer movement - mouseover/enter can
        // fire when the details panel animates open under a stationary cursor,
        // which would wrongly show the gold hover state on first render
        this.addEventListener('pointermove', (e) => {
            this._hovering = true;
            const star = e.target.closest('.rs-star');
            this._preview = star && this.contains(star) ? parseInt(star.dataset.index, 10) : 0;
            this._paint();
        });
        this.addEventListener('pointerleave', () => {
            this._hovering = false;
            this._preview = 0;
            this._paint();
        });
        this._stars.forEach((star) => {
            star.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this._interactive()) return;
                this._rate(parseInt(star.dataset.index, 10));
            });
        });
    }

    _rate(n) {
        const type = this.getAttribute('item-type');
        const id = this.getAttribute('item-id');
        const el = this;
        el.classList.add('rs-saving');
        ui.ajax({
            url: `/api/${type}s/${id}/rating`,
            method: 'POST',
            data: { rating: n },
            complete: () => {
                el.classList.remove('rs-saving');
                el.setAttribute('rating', String(n));
                el.dispatchEvent(new CustomEvent('rated', {
                    bubbles: true,
                    detail: { itemType: type, itemId: id, rating: n }
                }));
            },
            error: () => {
                el.classList.remove('rs-saving');
                el._hovering = false;
                el._preview = 0;
                el._paint();
            }
        });
    }
}

customElements.define('rating-stars', RatingStars);

//#endregion
