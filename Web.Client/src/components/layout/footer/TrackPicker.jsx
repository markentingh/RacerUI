import React from 'react';
import { useFooter } from '@/context/footer';
import { ScaleUI } from '@/context/scale';
import Icon from '@/components/ui/Icon';
import TracksView from '@/app/tracks/components/TracksView';

export default function TrackPicker() {
  const { trackPicker, closeTrackPicker, selectTrack } = useFooter();
  if (!trackPicker) return null;

  return (
    <ScaleUI className="car-picker-backdrop track-picker-backdrop" id="ftr-track-picker" style={{ display: '' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeTrackPicker(); }}>
      <div className="car-picker-modal">
        <div className="car-picker-header">
          <div className="car-picker-title">{trackPicker.title}</div>
          <button className="car-picker-close" onClick={closeTrackPicker}>
            <Icon name="close" className="dark" />
          </button>
        </div>
        <div className="car-picker-body track-picker-body">
          <TracksView picker filterKey="RacerUI:tracks-filter-picker"
            onPick={(track, layout) => { selectTrack(track, layout); closeTrackPicker(); }} />
        </div>
      </div>
    </ScaleUI>
  );
}
