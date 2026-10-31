import React, { useState } from 'react';
import { useFooter, MORE_MODES, OPPONENT_MODES } from '@/context/footer';
import { cars as carsApi } from '@/api/user/cars';
import Icon from '@/components/ui/Icon';
import DropdownList from '@/components/ui/DropdownList';
import CarDetailsModal from '@/app/cars/components/CarDetailsModal';

const START_TYPES = [
  { value: 'PIT', label: 'Pits' },
  { value: 'START', label: 'Starting Line' },
  { value: 'HOTLAP_START', label: 'Hotlap Start' }
];
const JUMP_START = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Pits' },
  { value: '2', label: 'Drive Through' }
];

// One slider cell: labelled live value + range input bound to a mode setting
function SliderCell({ mode, setting, label, min, max, step, unit = '', ms, onChange, cap }) {
  const value = ms[setting] ?? 0;
  const m = cap !== undefined ? Math.min(max, cap) : max;
  return (
    <div className="slider-cell">
      <label className="slider-label">{label} <span className="slider-value">{value}{unit}</span></label>
      <input type="range" className="setting-slider" min={min} max={m} step={step}
        value={value} onChange={(e) => onChange(mode, setting, parseFloat(e.target.value))} />
    </div>
  );
}

function CheckField({ mode, setting, label, ms, onChange }) {
  return (
    <label className="check-field">
      <input type="checkbox" checked={!!ms[setting]} onChange={(e) => onChange(mode, setting, e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function RaceSettings() {
  const {
    raceSettings, updateRaceSettings, modeSettings, updateModeSetting,
    selectedCar, getEffectiveTrack, openCandidatePicker, removeCandidate,
    selectCar, skinDisplayName
  } = useFooter();
  const s = raceSettings;
  const mode = s.mode || 'hotlap';
  const ms = modeSettings(mode);
  const [detailsCar, setDetailsCar] = useState(null);

  const effectiveTrack = getEffectiveTrack();
  const pits = (effectiveTrack && effectiveTrack.pitBoxes) || 25;
  const maxOpponents = Math.max(1, pits - 1);
  const opponentsCap = maxOpponents;
  const startPosCap = (ms.opponents || 0) + 1;

  const change = (m, key, v) => updateModeSetting(m, key, v);
  const selectMode = (m) => updateRaceSettings({ mode: m });

  const candidates = s.candidates || [];
  // The player's own car seeds the list like ACTools
  if (!candidates.length && selectedCar) {
    const c = { ...selectedCar };
    candidates.push({
      id: c.id, year: c.year,
      name: c.name || c.carName || c.path,
      carPath: c.path, skinPath: null, skinName: ''
    });
  }

  const openCandidateDetails = (cand, index) => {
    carsApi.filter({ Search: cand.name || '', Start: 0, Length: 50 })
      .then((res) => {
        const found = (res.data.cars || []).find((x) => x.path === cand.carPath);
        if (found) setDetailsCar({ car: found, skinPath: cand.skinPath, index });
      }).catch(() => { });
  };

  const saveCandidateSkin = (skinPath) => {
    updateRaceSettings((prev) => {
      const candidates = [...(prev.candidates || [])];
      const cand = candidates[detailsCar.index];
      if (cand) {
        candidates[detailsCar.index] = {
          ...cand,
          skinPath,
          skinName: skinDisplayName(detailsCar.car, skinPath)
        };
      }
      return { ...prev, candidates };
    });
  };

  const moreOptions = MORE_MODES.map((m) => ({
    value: m, label: { trackday: 'Track Day', weekend: 'Weekend', drift: 'Drift', timeattack: 'Time Attack', drag: 'Drag' }[m]
  }));

  const ballastRestrictor = (
    <div className="slider-grid">
      <SliderCell mode={mode} setting="ballast" label="Ballast" min={0} max={200} step={1} unit=" kg" ms={ms} onChange={change} />
      <SliderCell mode={mode} setting="restrictor" label="Restrictor" min={0} max={100} step={1} unit=" %" ms={ms} onChange={change} />
    </div>
  );
  const startTypeRow = (
    <div className="setting-row">
      <label className="setting-label">Start From</label>
      <DropdownList data-setting="startType" value={ms.startType} options={START_TYPES}
        onChange={(v) => change(mode, 'startType', v)} />
    </div>
  );

  const aiFields = (
    <>
      <SliderCell mode={mode} setting="aiLevel" label="AI Level" min={0} max={100} step={1} unit=" %" ms={ms} onChange={change} />
      <SliderCell mode={mode} setting="aiAggression" label="AI Aggression" min={0} max={100} step={1} unit=" %" ms={ms} onChange={change} />
    </>
  );

  return (
    <>
      <div className="mode-toggles">
        {['practice', 'hotlap', 'race'].map((m) => (
          <button key={m} className={`mode-toggle${mode === m ? ' selected' : ''}`} data-mode={m}
            onClick={() => selectMode(m)}>
            <span>{{ practice: 'Practice', hotlap: 'Hotlap', race: 'Race' }[m]}</span>
          </button>
        ))}
        <DropdownList id="ftr-mode-more" className={`mode-toggle mode-more${MORE_MODES.includes(mode) ? ' selected' : ''}`}
          placeholder="More" options={moreOptions}
          value={MORE_MODES.includes(mode) ? mode : undefined}
          onChange={(v) => selectMode(v)} />
      </div>

      {mode === 'practice' && (
        <div className="mode-panel" data-mode="practice">
          <div className="checkbox-grid">
            <CheckField mode={mode} setting="penalties" label="Penalties" ms={ms} onChange={change} />
          </div>
          {startTypeRow}
          {ballastRestrictor}
        </div>
      )}
      {mode === 'hotlap' && (
        <div className="mode-panel" data-mode="hotlap">
          <div className="checkbox-grid">
            <CheckField mode={mode} setting="penalties" label="Penalties" ms={ms} onChange={change} />
            <CheckField mode={mode} setting="ghostCar" label="Ghost Car" ms={ms} onChange={change} />
            <CheckField mode={mode} setting="ghostCarRecord" label="Record Ghost Car" ms={ms} onChange={change} />
          </div>
          <div className="slider-grid">
            <SliderCell mode={mode} setting="ghostCarAdvantage" label="Ghost Advantage" min={0} max={5} step={0.5} unit=" s" ms={ms} onChange={change} />
            <SliderCell mode={mode} setting="ballast" label="Ballast" min={0} max={200} step={1} unit=" kg" ms={ms} onChange={change} />
            <SliderCell mode={mode} setting="restrictor" label="Restrictor" min={0} max={100} step={1} unit=" %" ms={ms} onChange={change} />
          </div>
        </div>
      )}
      {mode === 'race' && (
        <div className="mode-panel" data-mode="race">
          <div className="slider-grid">
            <SliderCell mode={mode} setting="laps" label="Laps" min={1} max={50} step={1} ms={ms} onChange={change} />
            <SliderCell mode={mode} setting="opponents" label="Opponents" min={0} max={24} step={1} ms={ms} onChange={change} cap={opponentsCap} />
            {aiFields}
            <SliderCell mode={mode} setting="startingPosition" label="Starting Position" min={0} max={24} step={1} ms={ms} onChange={change} cap={startPosCap} />
          </div>
          <div className="setting-row">
            <label className="setting-label">Jump Start Penalty</label>
            <DropdownList data-setting="jumpStartPenalty" numeric value={String(ms.jumpStartPenalty ?? 0)}
              options={JUMP_START} onChange={(v) => change(mode, 'jumpStartPenalty', v)} />
            <CheckField mode={mode} setting="penalties" label="Penalties" ms={ms} onChange={change} />
          </div>
        </div>
      )}
      {mode === 'trackday' && (
        <div className="mode-panel" data-mode="trackday">
          <div className="checkbox-grid">
            <CheckField mode={mode} setting="penalties" label="Penalties" ms={ms} onChange={change} />
          </div>
          <div className="slider-grid">
            <SliderCell mode={mode} setting="opponents" label="Opponents" min={0} max={24} step={1} ms={ms} onChange={change} cap={opponentsCap} />
            {aiFields}
            <SliderCell mode={mode} setting="speedLimit" label="Opponent Speed Limit" min={0} max={200} step={1} unit=" km/h" ms={ms} onChange={change} />
          </div>
        </div>
      )}
      {mode === 'weekend' && (
        <div className="mode-panel" data-mode="weekend">
          <div className="slider-grid">
            <SliderCell mode={mode} setting="laps" label="Race Laps" min={1} max={50} step={1} ms={ms} onChange={change} />
            <SliderCell mode={mode} setting="practiceDuration" label="Practice Duration" min={0} max={90} step={5} unit=" min" ms={ms} onChange={change} />
            <SliderCell mode={mode} setting="qualificationDuration" label="Qualifying Duration" min={5} max={90} step={5} unit=" min" ms={ms} onChange={change} />
            <SliderCell mode={mode} setting="opponents" label="Opponents" min={0} max={24} step={1} ms={ms} onChange={change} cap={opponentsCap} />
            {aiFields}
          </div>
          <div className="setting-row">
            <label className="setting-label">Jump Start Penalty</label>
            <DropdownList data-setting="jumpStartPenalty" numeric value={String(ms.jumpStartPenalty ?? 0)}
              options={JUMP_START} onChange={(v) => change(mode, 'jumpStartPenalty', v)} />
            <CheckField mode={mode} setting="penalties" label="Penalties" ms={ms} onChange={change} />
          </div>
        </div>
      )}
      {mode === 'drift' && (
        <div className="mode-panel" data-mode="drift">
          <div className="checkbox-grid">
            <CheckField mode={mode} setting="penalties" label="Penalties" ms={ms} onChange={change} />
          </div>
          {startTypeRow}
          {ballastRestrictor}
        </div>
      )}
      {mode === 'timeattack' && (
        <div className="mode-panel" data-mode="timeattack">
          <div className="checkbox-grid">
            <CheckField mode={mode} setting="penalties" label="Penalties" ms={ms} onChange={change} />
          </div>
          {ballastRestrictor}
        </div>
      )}
      {mode === 'drag' && (
        <div className="mode-panel" data-mode="drag">
          <div className="checkbox-grid">
            <CheckField mode={mode} setting="penalties" label="Penalties" ms={ms} onChange={change} />
          </div>
          <div className="slider-grid">
            <SliderCell mode={mode} setting="matches" label="Matches" min={1} max={20} step={1} ms={ms} onChange={change} />
            <SliderCell mode={mode} setting="aiLevel" label="Opponent Strength" min={0} max={100} step={1} unit=" %" ms={ms} onChange={change} />
          </div>
        </div>
      )}

      <div className="candidates-section" id="ftr-candidates" style={{ display: OPPONENT_MODES.includes(mode) ? '' : 'none' }}>
        <div className="candidates-header">
          <span className="setting-label">Candidates</span>
          <button className="candidates-add-btn" title="Add Candidate" onClick={() => openCandidatePicker()}>
            <Icon name="add" className="dark" />
          </button>
        </div>
        <div className="candidates-list" id="ftr-candidates-list">
          {candidates.map((c, i) => (
            <div className="candidate-item" key={i} onClick={() => openCandidateDetails(c, i)}>
              <span className="candidate-name">{`${c.year ? c.year + ' ' : ''}${c.name || c.carPath || ''}`}</span>
              <button className="candidate-remove" title="Remove Candidate"
                onClick={(e) => { e.stopPropagation(); removeCandidate(i); }}>
                <Icon name="close" className="dark" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {detailsCar && (
        <CarDetailsModal car={detailsCar.car} skinPath={detailsCar.skinPath}
          onSelectCar={(car, skin) => selectCar(car, skin)}
          onSaveSkin={saveCandidateSkin}
          onClose={() => setDetailsCar(null)} />
      )}
    </>
  );
}
