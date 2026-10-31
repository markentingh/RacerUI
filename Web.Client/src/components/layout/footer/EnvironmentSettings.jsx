import React, { useEffect, useRef, useState } from 'react';
import { useFooter, STATIC_WEATHER_TYPES } from '@/context/footer';
import DropdownList from '@/components/ui/DropdownList';
import { titleCase } from '@/helpers/strings';

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// "14", "14:30", "1430", "2:30 pm" -> minutes since midnight
const parseTime = (text) => {
  if (!text) return null;
  const match = text.trim().toLowerCase().match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  if (match[3] === 'pm' && h < 12) h += 12;
  if (match[3] === 'am' && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
};

export default function EnvironmentSettings() {
  const {
    raceSettings, updateRaceSettings,
    weatherControllers, loadWeatherControllers, loadControllerSettings
  } = useFooter();
  const s = raceSettings;
  const [timeText, setTimeText] = useState(formatTime(s.timeMinutes));
  const [dynFields, setDynFields] = useState([]);
  const compassRef = useRef(null);

  useEffect(() => { loadWeatherControllers(); }, [loadWeatherControllers]);
  useEffect(() => { setTimeText(formatTime(s.timeMinutes)); }, [s.timeMinutes]);

  const controllers = weatherControllers || [];
  const modeOptions = [
    { value: 'static', label: 'Static' },
    ...controllers.filter((c) => !c.followsWeather).map((c) => ({ value: `dynamic:${c.id}`, label: `Dynamic: ${c.name}` }))
  ];
  const controllerOptions = controllers.filter((c) => c.followsWeather).map((c) => ({ value: c.id, label: c.name }));

  const isStatic = s.weatherMode === 'static';
  const dynamicControllerId = !isStatic ? s.weatherMode.substring('dynamic:'.length) : null;

  // Load the dynamic controller's settings fields when the mode changes
  useEffect(() => {
    if (!dynamicControllerId) { setDynFields([]); return; }
    if (s.dynamicControllerId !== dynamicControllerId) {
      updateRaceSettings({ dynamicControllerId, controllerSettings: {} });
    }
    let cancelled = false;
    loadControllerSettings(dynamicControllerId).then((fields) => {
      if (cancelled) return;
      // checkbox fields first, then the rest (same packing as the original)
      setDynFields([...fields.filter((f) => f.type === 'bool'), ...fields.filter((f) => f.type !== 'bool')]);
      // Seed saved values from ini defaults
      const cs = { ...(s.controllerSettings || {}) };
      let changed = false;
      fields.forEach((f) => {
        const sec = cs[f.section] || (cs[f.section] = {});
        if (sec[f.key] === undefined) {
          sec[f.key] = f.type === 'bool' ? (f.value === '1' || String(f.value).toLowerCase() === 'true' ? '1' : '0') : f.value;
          changed = true;
        }
      });
      if (changed) updateRaceSettings({ controllerSettings: cs });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicControllerId]);

  const setDynValue = (f, v) => {
    const cs = { ...(s.controllerSettings || {}) };
    const sec = { ...(cs[f.section] || {}), [f.key]: v };
    updateRaceSettings({ controllerSettings: { ...cs, [f.section]: sec } });
  };

  const setWindDirection = (deg) => updateRaceSettings({ windDirection: ((deg % 360) + 360) % 360 });

  const onCompassPointer = (e) => {
    const rect = compassRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const deg = Math.round(Math.atan2(dx, -dy) * 180 / Math.PI);
    setWindDirection(deg);
  };

  return (
    <>
      <div className="setting-row">
        <label className="setting-label" htmlFor="ftr-time-input">Time of Day</label>
        <input type="text" id="ftr-time-input" className="setting-input setting-time-input" maxLength="5"
          value={timeText}
          onChange={(e) => setTimeText(e.target.value)}
          onBlur={() => {
            const parsed = parseTime(timeText);
            if (parsed !== null) updateRaceSettings({ timeMinutes: parsed });
            else setTimeText(formatTime(s.timeMinutes));
          }} />
        <input type="range" id="ftr-time-slider" className="setting-slider time-slider" min="0" max="1439" step="1"
          value={s.timeMinutes}
          onChange={(e) => updateRaceSettings({ timeMinutes: parseInt(e.target.value, 10) })} />
      </div>
      <div className="setting-section">
        <div className="setting-label">Weather System</div>
        <div className="setting-dropdowns">
          <div className="setting-dropdown">
            <label htmlFor="ftr-weather-mode">Type</label>
            <DropdownList id="ftr-weather-mode" value={s.weatherMode} options={modeOptions}
              onChange={(v) => updateRaceSettings({ weatherMode: v })} />
          </div>
          <div className="setting-dropdown">
            <label htmlFor="ftr-weather-controller">Controller</label>
            <DropdownList id="ftr-weather-controller" value={s.weatherController} options={controllerOptions}
              onChange={(v) => updateRaceSettings({ weatherController: v })} />
          </div>
          <div className="setting-dropdown" id="ftr-static-weather-group" style={{ display: isStatic ? '' : 'none' }}>
            <label htmlFor="ftr-static-weather">Static Weather</label>
            <DropdownList id="ftr-static-weather" value={String(s.staticWeatherType)}
              options={STATIC_WEATHER_TYPES.map((w) => ({ value: String(w.value), label: w.label }))}
              onChange={(v) => updateRaceSettings({ staticWeatherType: parseInt(v, 10) })} />
          </div>
        </div>
        <div className="dynamic-weather-settings" id="ftr-dynamic-weather" style={{ display: isStatic ? 'none' : '' }}>
          {dynFields.map((f) => {
            const current = ((s.controllerSettings || {})[f.section] || {})[f.key];
            const id = `ftr-dyn-${f.key}`;
            if (f.type === 'bool') {
              const checked = current === '1' || String(current).toLowerCase() === 'true';
              return (
                <label key={`${f.section}.${f.key}`} className="dynamic-field bool-field" title={f.hint || ''}>
                  <input type="checkbox" id={id} checked={!!checked}
                    onChange={(e) => setDynValue(f, e.target.checked ? '1' : '0')} />
                  <span>{f.label}</span>
                </label>
              );
            }
            if (f.type === 'select') {
              return (
                <label key={`${f.section}.${f.key}`} className="dynamic-field" title={f.hint || ''}>
                  <span>{f.label}</span>
                  <DropdownList id={id} value={current}
                    options={(f.options || []).map((o) => ({ value: o.value, label: titleCase(o.label) }))}
                    onChange={(v) => setDynValue(f, v)} />
                </label>
              );
            }
            return (
              <label key={`${f.section}.${f.key}`} className="dynamic-field" title={f.hint || ''}>
                <span>{f.label}</span>
                <input type={f.type === 'number' ? 'number' : 'text'} id={id} value={current ?? ''}
                  onChange={(e) => setDynValue(f, e.target.value)} />
              </label>
            );
          })}
        </div>
      </div>
      <div className="setting-row">
        <label className="setting-label" htmlFor="ftr-temp-slider">Temperature</label>
        <input type="range" id="ftr-temp-slider" className="setting-slider" min="-10" max="45" step="1"
          value={s.temperature}
          onChange={(e) => updateRaceSettings({ temperature: parseInt(e.target.value, 10) })} />
        <span className="setting-value" id="ftr-temp-value">{s.temperature}°C</span>
      </div>
      <div className="setting-row">
        <label className="setting-label" htmlFor="ftr-wind-slider">Wind</label>
        <input type="range" id="ftr-wind-slider" className="setting-slider" min="0" max="35" step="1"
          value={s.windSpeed}
          onChange={(e) => updateRaceSettings({ windSpeed: parseInt(e.target.value, 10) })} />
        <span className="setting-value" id="ftr-wind-value">{s.windSpeed} km/h</span>
        <div className="wind-compass" id="ftr-wind-compass" ref={compassRef}
          title={`Wind direction: ${s.windDirection}°`}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onCompassPointer(e); }}
          onPointerMove={(e) => { if (e.buttons === 1) onCompassPointer(e); }}>
          <svg viewBox="0 0 100 100">
            <circle className="compass-ring" cx="50" cy="50" r="44"></circle>
            <text className="compass-label" x="50" y="26" textAnchor="middle">N</text>
            <text className="compass-label" x="74" y="54" textAnchor="middle">E</text>
            <text className="compass-label" x="50" y="84" textAnchor="middle">S</text>
            <text className="compass-label" x="26" y="54" textAnchor="middle">W</text>
            <g id="ftr-wind-needle" transform={`rotate(${s.windDirection} 50 50)`}>
              <line className="compass-needle" x1="50" y1="50" x2="50" y2="22"></line>
              <polygon className="compass-arrow" points="50,10 44,24 56,24"></polygon>
              <circle className="compass-center" cx="50" cy="50" r="4"></circle>
            </g>
          </svg>
        </div>
      </div>
      <div className="setting-row">
        <label className="setting-label" htmlFor="ftr-track-state">Track State</label>
        <DropdownList id="ftr-track-state" value={String(s.trackPreset)} numeric
          options={[
            { value: '-1', label: 'Auto' }, { value: '0', label: 'Dusty' },
            { value: '1', label: 'Old' }, { value: '3', label: 'Green' },
            { value: '2', label: 'Slow' }, { value: '4', label: 'Fast' },
            { value: '5', label: 'Optimum' }
          ]}
          onChange={(v) => updateRaceSettings({ trackPreset: v })} />
      </div>
    </>
  );
}
