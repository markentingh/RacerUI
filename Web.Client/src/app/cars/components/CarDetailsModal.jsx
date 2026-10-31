import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import CarDetails from './CarDetails';
import { skinPreviewUrl } from '@/helpers/images';

// Car details rendered inside the candidate modal. Mirrors the original
// openDetailsModal: the body mounts a .cars-content > .grid-view structure
// with a fake (hidden) .car item so the .grid-details panel gets its
// normal in-grid styling. Save Changes appears once a different skin is
// selected and writes the skin back to the caller via onSaveSkin.
export default function CarDetailsModal({ car, skinPath, onSelectCar, onSaveSkin, onClose }) {
  const [currentSkin, setCurrentSkin] = useState(skinPath);
  if (!car) return null;
  if (skinPath && car.skins) {
    const skin = car.skins.find((x) => x.path === skinPath);
    car.preview = skinPreviewUrl(car.path, (skin || car.skins[0])?.path);
  }
  const skinChanged = currentSkin && currentSkin !== skinPath;

  return (
    <div className="car-details-backdrop" id="car-details-modal"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="car-details-modal">
        <button className="car-details-close" id="car-details-close" onClick={onClose}>
          <Icon name="close" className="dark" />
        </button>
        <div className="car-details-body">
          <div className="cars-content">
            <div className="grid-view">
              <div className="car" data-path={car.path} style={{ display: 'none' }}></div>
              <CarDetails
                car={car}
                selectedSkin={skinPath}
                onSkinChange={(p) => setCurrentSkin(p)}
                onSelectCar={(c, skin) => { if (onSelectCar) onSelectCar(c, skin); if (onClose) onClose(); }}
              />
            </div>
          </div>
        </div>
        <button className="car-details-save" id="car-details-save"
          style={{ display: skinChanged ? '' : 'none' }}
          onClick={() => { if (onSaveSkin) onSaveSkin(currentSkin); if (onClose) onClose(); }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
