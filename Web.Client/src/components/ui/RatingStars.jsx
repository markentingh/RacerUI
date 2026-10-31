import React, { useState } from 'react';
import { cars } from '@/api/user/cars';
import { tracks } from '@/api/user/tracks';

// React port of <rating-stars> - same element name and .rs-star markup
export default function RatingStars({ rating = 0, itemType, itemId, readonly, filledOnly, className = '', onRated }) {
  const [value, setValue] = useState(Math.min(Math.max(rating || 0, 0), 5));
  const [preview, setPreview] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [saving, setSaving] = useState(false);

  const interactive = !readonly && value === 0 && itemType && itemId;
  const count = filledOnly ? value : 5;

  const rate = (n) => {
    if (!interactive) return;
    setSaving(true);
    const api = itemType === 'car' ? cars : tracks;
    api.updateRating(itemId, n)
      .then(() => {
        setSaving(false);
        setValue(n);
        if (onRated) onRated(n);
      })
      .catch(() => {
        setSaving(false);
        setHovering(false);
        setPreview(0);
      });
  };

  const stars = [];
  for (let i = 0; i < count; i++) {
    const n = i + 1;
    const filled = n <= value || (preview > 0 && n <= preview);
    const gold = filledOnly ? true : !!(n <= value || (hovering && interactive));
    stars.push(
      <span
        key={n}
        className={`rs-star${gold ? ' gold' : ''}`}
        data-index={n}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); rate(n); }}
      >
        <svg viewBox="0 0 24 24">
          <use href={`#icon-star${filled ? '' : '-outline'}`} xlinkHref={`#icon-star${filled ? '' : '-outline'}`} />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`rating-stars ${className}${interactive ? ' rs-interactive' : ''}${saving ? ' rs-saving' : ''}${filledOnly ? ' rs-badge' : ''}`}
      onPointerMove={(e) => {
        if (!interactive) return;
        setHovering(true);
        const star = e.target.closest('.rs-star');
        setPreview(star ? parseInt(star.dataset.index, 10) : 0);
      }}
      onPointerLeave={() => { setHovering(false); setPreview(0); }}
    >
      {stars}
    </span>
  );
}
