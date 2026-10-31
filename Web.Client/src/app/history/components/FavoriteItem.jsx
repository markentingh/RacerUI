import React from 'react';
import { modeSummary, settingsSummary } from '@/context/footer';
import { skinPreviewUrl, trackPreviewUrl, trackOutlineUrl } from '@/helpers/images';
import Icon from '@/components/ui/Icon';
import { layoutName } from './favoritesHelpers';

export default function FavoriteItem({ fav, index, controllers, onPlay, onEdit, onDelete }) {
  let cfg = {};
  try { cfg = JSON.parse(fav.configJson) || {}; } catch { /* empty */ }
  const s = cfg.settings || cfg;
  const layout = layoutName(fav);

  return (
    <div className="favorite-item" data-fav-index={index}>
      <div className="fav-preview fav-car-preview"
        style={{ backgroundImage: fav.carPath ? `url('${skinPreviewUrl(fav.carPath, fav.skinPath)}')` : 'none' }}></div>
      <div className="fav-preview fav-track-preview"
        style={{ backgroundImage: fav.trackPath ? `url('${trackPreviewUrl(fav.trackPath, fav.trackSubPath)}')` : 'none' }}>
        {fav.trackPath && (
          <img className="fav-track-outline" src={trackOutlineUrl(fav.trackPath, fav.trackSubPath)}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} alt="" />
        )}
      </div>
      <div className="fav-info">
        <h4>{fav.title}</h4>
        <div className="fav-names">
          {fav.carName}<span className="fav-at"> at </span>
          {fav.trackParentId ? fav.parentTrackName : fav.trackName}
          {layout && ` (${layout})`}
        </div>
        <div className="fav-settings">{settingsSummary(s, controllers)}</div>
        <div className="fav-mode">{modeSummary(s)}</div>
        <input type="range" className="time-slider fav-time-slider" min="0" max="1439" step="1"
          value={s.timeMinutes != null ? s.timeMinutes : 840} disabled readOnly />
      </div>
      <div className="fav-actions">
        <button className="fav-play-btn" onClick={onPlay}>
          <Icon name="play" className="dark" />
          <span>Start Race</span>
        </button>
        <button className="fav-edit-btn" title="Edit favorite" onClick={onEdit}>
          <Icon name="pencil" className="dark" />
        </button>
        <button className="fav-delete-btn" title="Delete favorite" onClick={onDelete}>
          <Icon name="trash" className="dark" />
        </button>
      </div>
    </div>
  );
}
