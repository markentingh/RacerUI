import React, { useState } from 'react';
import { flagUrl, trackOutlineUrl, trackPreviewUrl } from '@/helpers/images';
import Icon from '@/components/ui/Icon';
import RatingStars from '@/components/ui/RatingStars';
import HoverButton from '@/components/ui/HoverButton';

// Shared layout-name helper (ACTools' FindNameForMultiLayoutMode)
export const getCommonTrackName = (names) => {
  const baseName = names[0];
  if (!baseName) return null;
  const minLength = Math.min(...names.filter((n) => n).map((n) => n.length));
  for (let i = minLength; i > 2; i--) {
    let result = baseName.substring(0, i);
    if (names.slice(1).some((n) => !n || n.substring(0, i) !== result)) continue;
    result = result.trim();
    if (result.length > 2 && /[-—/(]$/.test(result)) {
      result = result.substring(0, result.length - 1).trim();
    }
    return result;
  }
  return null;
};

export const layoutNameFor = (track, commonName) => {
  let name = track.name;
  if (commonName && name && name.startsWith(commonName)) {
    const stripped = name.substring(commonName.length)
      .replace(/^[\s\-—/()]+|[\s)]+$/g, '').trim();
    if (stripped) return stripped;
  }
  if (track.subPath) {
    return track.subPath.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return name;
};

export default function TrackDetails({ track, onSelectTrack, onFilterByCountry, onFilterByCity, onFilterByYear, onFilterByType, onRated }) {
  const layouts = [track].concat(track.layouts || []);
  const commonName = layouts.length > 1 ? getCommonTrackName(layouts.map((t) => t.name)) : null;
  const named = layouts.map((t) => ({ ...t, layoutName: layoutNameFor(t, commonName) }));
  const [layoutIdx, setLayoutIdx] = useState(0);
  const layout = named[layoutIdx];

  let author = track.author && track.author !== 'null' ? track.author : null;
  if (author && author.length > 20) author = author.substring(0, 20) + '...';

  return (
    <div className="grid-details">
      <div className="preview" style={{ backgroundImage: `url('${trackPreview(track)}')` }}></div>
      <div className="info">
        <div className="title"><h4>{track.name}</h4></div>
        <div className="track-header">
          <HoverButton className="select-track-btn" onClick={() => onSelectTrack && onSelectTrack(track, layout)}>
            <Icon name="play" className="dark" />
            <span>Select Track</span>
          </HoverButton>
          <div className="track-origin">
            {(track.countryName || track.country) && (
              <div className="track-country" onClick={() => onFilterByCountry && onFilterByCountry(track.country)}>
                <img className="flag" src={flagUrl(track.country)} alt={`${track.countryName || track.country} flag`} />
                <span>{track.countryName || track.country}</span>
              </div>
            )}
            {track.city && (
              <div className="track-city" onClick={() => onFilterByCity && onFilterByCity(track.city)}>
                <span>{track.city}</span>
              </div>
            )}
            {track.year && (
              <div className="track-year" onClick={() => onFilterByYear && onFilterByYear(track.year)}>
                <span>{track.year}</span>
              </div>
            )}
            {track.typeName && (
              <div className="track-type" onClick={() => onFilterByType && onFilterByType(track.type)}>
                <span>{track.typeName}</span>
              </div>
            )}
          </div>
          <div className="track-layouts" style={{ display: layouts.length > 1 ? '' : 'none' }}>
            <select id="track_layouts_select" value={layoutIdx} onChange={(e) => setLayoutIdx(parseInt(e.target.value, 10))}>
              {named.map((t, i) => <option key={i} value={i}>{t.layoutName}</option>)}
            </select>
          </div>
        </div>
        <div className="track-stats">
          {track.length ? <div><strong>Length:</strong> <span>{(track.length / 1000).toFixed(1)} km</span></div> : null}
          {track.width ? <div><strong>Width:</strong> <span>{track.width} m</span></div> : null}
          {track.pitBoxes ? <div><strong>Pit Boxes:</strong> <span>{track.pitBoxes}</span></div> : null}
          {author && <div className="track-author"><strong>Author:</strong> <span>{author}</span></div>}
          <RatingStars className="details-rating" itemType="track" itemId={track.id} rating={track.rating || 0}
            onRated={(n) => { track.rating = n; if (onRated) onRated(track); }} />
        </div>
        {track.details && (
          <div className="track-description">
            <p>
              <img className="track-outline-float" src={trackOutlineUrl(layout.path, layout.subPath)}
                onError={(e) => { e.currentTarget.style.display = 'none'; }} alt={`${track.name} track outline`} />
              <span dangerouslySetInnerHTML={{ __html: track.details.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>') }} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const trackPreview = (track) => trackPreviewUrl(track.path, track.subPath);
