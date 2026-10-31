import React, { useEffect, useState } from 'react';
import { useFooter } from '@/context/footer';
import { ScaleUI } from '@/context/scale';

export default function FavoriteModal() {
  const { favModalOpen, setFavModalOpen, saveFavorite, selectedCar, getEffectiveTrack } = useFooter();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (favModalOpen) {
      const effective = getEffectiveTrack();
      const carName = (selectedCar && (selectedCar.name || selectedCar.path)) || '';
      const trackName = effective ? (effective.layoutName || effective.name || '') : '';
      setName(`${carName} at ${trackName}`.trim());
      setSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favModalOpen]);

  if (!favModalOpen) return null;
  const close = () => setFavModalOpen(false);

  const save = () => {
    const title = name.trim();
    if (!title) return;
    saveFavorite(title).then(() => setSaved(true)).catch(() => { });
  };

  return (
    <ScaleUI className="fav-modal-backdrop" id="ftr-fav-modal" style={{ display: 'flex' }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="fav-modal">
        <div className="fav-modal-body" id="ftr-fav-form" style={{ display: saved ? 'none' : '' }}>
          <label htmlFor="ftr-fav-name">Racing Configuration Name</label>
          <input type="text" id="ftr-fav-name" maxLength="120" value={name} autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
        </div>
        <div className="fav-modal-message" id="ftr-fav-message" style={{ display: saved ? '' : 'none' }}>Saved to favorites!</div>
        <div className={`fav-modal-actions${saved ? ' saved' : ''}`}>
          <button className="fav-cancel-btn" style={{ display: saved ? 'none' : '' }} onClick={close}>Cancel</button>
          <button className="fav-save-btn" style={{ display: saved ? 'none' : '' }} onClick={save}>Save To Favorites</button>
          <button className="fav-ok-btn" style={{ display: saved ? '' : 'none' }} onClick={close}>OK</button>
        </div>
      </div>
    </ScaleUI>
  );
}
