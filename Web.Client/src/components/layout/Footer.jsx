import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFooter, settingsSummary, modeSummary, MORE_MODES, OPPONENT_MODES } from '@/context/footer';
import { useScale, ScaleUI } from '@/context/scale';
import { skinPreviewUrl, trackPreviewUrl, trackOutlineUrl } from '@/helpers/images';
import Icon from '@/components/ui/Icon';
import DropdownList from '@/components/ui/DropdownList';
import HoverButton from '@/components/ui/HoverButton';
import EnvironmentSettings from './footer/EnvironmentSettings';
import RaceSettings from './footer/RaceSettings';
import FavoriteModal from './footer/FavoriteModal';
import CarPicker from './footer/CarPicker';
import TrackPicker from './footer/TrackPicker';

const SESSION_MODES = {
  practice: 'Practice', hotlap: 'Hotlap', race: 'Race', trackday: 'Track Day',
  weekend: 'Weekend', drift: 'Drift', timeattack: 'Time Attack', drag: 'Drag'
};

export default function Footer() {
  const location = useLocation();
  const footer = useFooter();
  const factor = useScale();
  const {
    selectedCar, selectedSkin, selectedTrack, selectedLayout,
    expanded, collapsing, editingFavorite, raceSettings,
    toggleDetails, play, playEnabled, hasSelection, gameLaunchState
  } = footer;

  const show = /^\/dashboard\/(cars|tracks)/.test(location.pathname) || !!editingFavorite;

  // Sync body class + footer height like the original resize/toggle flow
  useEffect(() => {
    document.body.classList.toggle('footer-expanded', expanded);
  }, [expanded]);
  useEffect(() => () => {
    document.body.classList.remove('footer-expanded');
  }, []);

  if (!show) return null;

  const effectiveTrack = footer.getEffectiveTrack();
  const carPreview = selectedCar
    ? skinPreviewUrl(selectedCar.path, selectedSkin || (selectedCar.skins && selectedCar.skins[0] && selectedCar.skins[0].path))
    : '';
  const trackPrev = effectiveTrack ? trackPreviewUrl(effectiveTrack.path, effectiveTrack.subPath) : '';
  const outline = effectiveTrack ? trackOutlineUrl(effectiveTrack.path, effectiveTrack.subPath) : '';

  const layoutName = selectedLayout ? (selectedLayout.layoutName || selectedLayout.name) : null;
  const showLayout = selectedLayout && selectedTrack && layoutName &&
    (selectedLayout.id !== selectedTrack.id || selectedLayout.name !== selectedTrack.name);

  return (
    <>
      <ScaleUI className={`footer-container${expanded ? ' expanded' : ''}${collapsing ? ' collapsing' : ''}${editingFavorite ? ' editing-fav' : ''}`}
        style={{ height: expanded ? `${(window.innerHeight - (document.querySelector('.dash > nav')?.getBoundingClientRect().bottom || 0)) / factor}px` : undefined }}>
        <div className="footer-content">
          <div className={`footer-car-preview${selectedCar ? ' has-preview' : ''}`}
            style={{ backgroundImage: carPreview ? `url('${carPreview}')` : '' }}
            onClick={() => footer.openCarPicker('Select Your Car', (car, skin) => { footer.selectCar(car, skin); footer.closeCarPicker(); })}>
            <div className="preview-placeholder" data-type="car">
              <Icon name="car" className="dark" />
              <span>Select a car</span>
            </div>
          </div>
          <div className={`footer-track-preview${effectiveTrack ? ' has-preview' : ''}`}
            style={{ backgroundImage: trackPrev ? `url('${trackPrev}')` : '' }}
            onClick={() => footer.openTrackPicker('Select Your Track')}>
            <div className="preview-placeholder" data-type="track">
              <Icon name="track" className="dark" />
              <span>Select a track</span>
            </div>
          </div>
          {effectiveTrack && (
            <img className="footer-track-outline" src={outline} alt="track outline"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
          <div className="footer-session-info">
            <div className="session-text">
              {selectedCar && selectedTrack ? (
                <>
                  <span className="car-name">{selectedCar.name}</span> at{' '}
                  <span className="track-name">{selectedTrack.name}{showLayout && <span className="layout-name"> ({layoutName})</span>}</span>
                </>
              ) : selectedCar ? (
                <>
                  <span className="car-name">{selectedCar.name}</span> <span className="no-selection">- Select a track</span>
                </>
              ) : selectedTrack ? (
                <>
                  <span className="no-selection">Select a car - </span>
                  <span className="track-name">{selectedTrack.name}{showLayout && <span className="layout-name"> ({layoutName})</span>}</span>
                </>
              ) : (
                <span className="no-selection">Select a car and track to play</span>
              )}
            </div>
            {editingFavorite && (
              <>
                <input type="text" id="ftr-fav-title-input" className="fav-title-input" maxLength="120"
                  value={editingFavorite.title !== undefined ? editingFavorite.title : (editingFavorite.fav.title || '')}
                  onChange={(e) => footer.setFavoriteTitle(e.target.value)} />
                <div className="fav-edit-subtitle" id="ftr-fav-subtitle">
                  {`${editingFavorite.fav.carName || ''} at ${editingFavorite.fav.trackName || ''}`}
                </div>
              </>
            )}
            <div className="session-settings">{settingsSummary(raceSettings, footer.weatherControllers)}</div>
            <div className="session-mode">{modeSummary(raceSettings)}</div>
          </div>
          <div className="footer-settings">
            <div className="settings-tabs">
              <button className={`settings-tab${raceSettings.tab === 'environment' ? ' selected' : ''}`}
                onClick={() => footer.updateRaceSettings({ tab: 'environment' })}><span>Environment</span></button>
              <button className={`settings-tab${raceSettings.tab === 'race' ? ' selected' : ''}`}
                onClick={() => footer.updateRaceSettings({ tab: 'race' })}><span>Rules</span></button>
            </div>
            <div className="settings-panels">
              <div className="tab-panel" data-panel="environment" style={{ display: raceSettings.tab === 'environment' ? '' : 'none' }}>
                <EnvironmentSettings />
              </div>
              <div className="tab-panel" data-panel="race" style={{ display: raceSettings.tab === 'race' ? '' : 'none' }}>
                <RaceSettings />
              </div>
            </div>
            <div className="setting-actions">
              <button className="add-fav-btn" id="ftr-add-favorite" disabled={!hasSelection}
                onClick={() => footer.setFavModalOpen(true)}>
                <Icon name="add" className="dark" />
                <span>Add To Favorites</span>
              </button>
            </div>
          </div>
          <div className="footer-play-button">
            <button className="details-btn" onClick={toggleDetails}><span>Details</span></button>
            <button className="hide-details-btn" onClick={toggleDetails}>
              <Icon name="close" className="dark" /><span>Hide Details</span>
            </button>
            <HoverButton
              className={`play-btn${gameLaunchState === 'starting' ? ' launching' : ''}${gameLaunchState === 'running' ? ' running' : ''}`}
              disabled={!playEnabled}
              onClick={play}>
              <Icon name="play" className="dark play-icon" />
              <svg viewBox="0 0 24 24" className="play-spinner">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
                  strokeWidth="3" strokeLinecap="round" strokeDasharray="42" strokeDashoffset="14"></circle>
              </svg>
              <span>{gameLaunchState === 'running' ? 'Session Running' : gameLaunchState === 'starting' ? 'Starting...' : 'Start Race'}</span>
            </HoverButton>
            {editingFavorite && (
              <div className="fav-edit-actions">
                <button className="fav-edit-cancel" onClick={() => footer.closeFavoriteEdit(false)}><span>Cancel</span></button>
                <button className="fav-edit-update" onClick={() => footer.closeFavoriteEdit(true)}><span>Update Favorite</span></button>
              </div>
            )}
          </div>
        </div>
      </ScaleUI>
      <FavoriteModal />
      <CarPicker />
      <TrackPicker />
    </>
  );
}
