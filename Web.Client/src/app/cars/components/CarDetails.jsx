import React, { useEffect, useRef, useState } from 'react';
import { capitalize } from '@/helpers/strings';
import { skinPreviewUrl, skinLiveryUrl, flagUrl } from '@/helpers/images';
import Icon from '@/components/ui/Icon';
import RatingStars from '@/components/ui/RatingStars';
import HoverButton from '@/components/ui/HoverButton';
import PowerGraph from './PowerGraph';
import CarEdit from './CarEdit';

// The in-grid car details panel - preview, skins, tabs (stats/edit/info),
// rating, power graph, Select Car button
export default function CarDetails({ car, onSelectCar, onFilterByClass, onFilterByCountry, onFilterByMake, onRated, selectedSkin: skinProp, onSkinChange }) {
  const [activeTab, setActiveTab] = useState('stats');
  const [editing, setEditing] = useState(false);
  const [skin, setSkin] = useState(skinProp !== undefined ? skinProp : (car.skins && car.skins.length ? car.skins[0].path : null));
  const previewHostRef = useRef(null); // empty React-owned host for imperative .preview divs
  const previewElRef = useRef(null);   // current .preview element
  const [, forceUpdate] = useState(0);

  const carName = ((car.year ?? '') + ' ' + (car.name || '').replace(car.year ?? '', '')).trim();
  const carClass = car.class ? capitalize(car.class).replace('Gt', 'GT') : '';

  // Create the initial .preview element imperatively (React only owns the
  // empty host div) so skin swaps can clone/fade/remove previews the same
  // way the original did without fighting React's node tracking
  useEffect(() => {
    const host = previewHostRef.current;
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'preview';
    el.style.backgroundImage = `url('${skinPreviewUrl(car.path, skin || (car.skins && car.skins[0] && car.skins[0].path))}')`;
    host.appendChild(el);
    previewElRef.current = el;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same crossfade as the original: inject a new .preview.preview-fade-in
  // before the old one, fade it in, then remove the old preview and strip
  // the fade classes once the transition finishes
  const chooseSkin = (s) => {
    setSkin(s.path);
    if (onSkinChange) onSkinChange(s.path);
    const host = previewHostRef.current;
    const oldPreviewDiv = previewElRef.current;
    const previewPath = skinPreviewUrl(car.path, s.path);
    if (!host || !oldPreviewDiv || !previewPath) return;
    const newPreviewDiv = document.createElement('div');
    newPreviewDiv.className = 'preview preview-fade-in';
    newPreviewDiv.style.backgroundImage = `url('${previewPath}')`;
    host.insertBefore(newPreviewDiv, oldPreviewDiv);
    setTimeout(() => {
      newPreviewDiv.classList.add('visible');
    }, 10);
    setTimeout(() => {
      oldPreviewDiv.remove();
      newPreviewDiv.classList.remove('preview-fade-in', 'visible');
    }, 510); // 500ms fade + 10ms buffer
    previewElRef.current = newPreviewDiv;
  };

  const onSaved = () => forceUpdate((x) => x + 1);
  const closeEdit = () => { setEditing(false); setActiveTab('stats'); };

  return (
    <div className={`grid-details${editing ? ' car-editing' : ''}`}>
      <div className="preview-container">
        <div ref={previewHostRef} className="preview-host" style={{ display: 'contents' }}></div>
        <div className="skins-container">
          <div className="skins">
            {(car.skins || []).map((s) => (
              <img
                key={s.id ?? s.path}
                className={`skin-item${skin === s.path ? ' selected' : ''}`}
                src={skinLiveryUrl(car.path, s.path)}
                data-preview={skinPreviewUrl(car.path, s.path)}
                data-skin={s.path}
                data-skin-id={s.id}
                alt={s.name || ''}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                onClick={() => chooseSkin(s)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="info">
        <h4>
          {carName}
          <button className="edit-car-btn" title="Edit Car Details" onClick={() => { setEditing(true); setActiveTab('edit'); }}>
            <Icon name="pencil" className="dark" />
          </button>
        </h4>
        <div className="car-header">
          <HoverButton className="select-car-btn" onClick={() => onSelectCar && onSelectCar(car, skin)}>
            <Icon name="play" className="dark" />
            <span>Select Car</span>
          </HoverButton>
          <div className="car-tabs">
            {!editing && (
              <button className={`car-tab${activeTab === 'stats' ? ' active' : ''}`} data-tab="stats" onClick={() => setActiveTab('stats')}>
                <Icon name="settings" className="dark" /><span>Stats</span>
              </button>
            )}
            {editing && (
              <button className={`car-tab car-edit-tab${activeTab === 'edit' ? ' active' : ''}`} data-tab="edit" onClick={() => setActiveTab('edit')}>
                <Icon name="pencil" className="dark" /><span>Details</span>
              </button>
            )}
            <button className={`car-tab${activeTab === 'info' ? ' active' : ''}`} data-tab="info" onClick={() => setActiveTab('info')}>
              <Icon name="file" className="dark" /><span>Info</span>
            </button>
          </div>
          <div className="car-origin">
            {(car.countryName || car.country) && (
              <div className="car-country" onClick={() => onFilterByCountry && onFilterByCountry(car.country)}>
                <img className="flag" src={flagUrl(car.country)} alt={`${car.countryName || car.country} flag`} />
                <span>{car.countryName || car.country}</span>
              </div>
            )}
            {carClass && (
              <div className="car-class" onClick={() => onFilterByClass && onFilterByClass(car.class)}>
                <span>{carClass}</span>
              </div>
            )}
            {car.makeName && (
              <div className="car-class" onClick={() => onFilterByMake && onFilterByMake(car.makeId)}>
                <span>{car.makeName}</span>
              </div>
            )}
          </div>
        </div>
        {!editing && (
          <div className={`car-stats car-tab-content${activeTab === 'stats' ? ' active' : ''}`} data-content="stats">
            {car.maxSpeed && <div><strong>Max Speed:</strong> <span>{car.maxSpeed} km/h</span></div>}
            {car.maxBHP && <div><strong>BHP:</strong> <span>{car.maxBHP}</span></div>}
            {car.zeroTo60mph && <div><strong>0-60 mph:</strong> <span>{car.zeroTo60mph}s</span></div>}
            {car.shifter && (
              <div className="car-shifter" title="Gears">
                <Icon name="shifter" className="dark" />
                <span>{car.shifter}</span>
              </div>
            )}
            <RatingStars className="details-rating" itemType="car" itemId={car.id} rating={car.rating || 0}
              onRated={(n) => { car.rating = n; if (onRated) onRated(car); }} />
            <PowerGraph carId={car.id} />
          </div>
        )}
        {editing ? (
          <CarEdit car={car} onSaved={onSaved} onClose={closeEdit} />
        ) : (
          car.details && (
            <div className={`car-info car-tab-content${activeTab === 'info' ? ' active' : ''}`} data-content="info">
              <p dangerouslySetInnerHTML={{ __html: (car.details || '').replace(/\n/g, '<br/><br/>') }}></p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
