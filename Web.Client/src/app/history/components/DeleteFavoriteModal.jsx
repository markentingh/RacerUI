import React from 'react';
import { ScaleUI } from '@/context/scale';
import Icon from '@/components/ui/Icon';

export default function DeleteFavoriteModal({ favorite, onConfirm, onCancel }) {
  if (!favorite) return null;
  return (
    <ScaleUI className="fav-modal-backdrop" id="fav-delete-modal" style={{ display: 'flex' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="fav-modal fav-delete-modal">
        <div className="fav-modal-message fav-delete-message">
          Do you really want to remove the favorite racing configuration "{favorite.title}"? This cannot be undone.
        </div>
        <div className="fav-modal-actions">
          <button className="fav-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="fav-delete-confirm-btn" onClick={onConfirm}>
            <Icon name="trash" className="dark" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </ScaleUI>
  );
}
