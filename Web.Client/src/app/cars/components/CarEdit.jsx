import React, { useEffect, useState } from 'react';
import { cars as carsApi } from '@/api/user/cars';
import DropdownList from '@/components/ui/DropdownList';
import Icon from '@/components/ui/Icon';

// Car details editor: country/year/manufacturer/model + info textarea,
// plus the New Manufacturer / New Model submodal
export default function CarEdit({ car, onSaved, onClose }) {
  const api = carsApi;
  const [countries, setCountries] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState({
    country: (car.country || '').toLowerCase(),
    year: car.year || '',
    makeId: car.makeId ? String(car.makeId) : '',
    modelId: car.modelId ? String(car.modelId) : '',
    details: car.details || ''
  });
  const [subModal, setSubModal] = useState(null); // 'make' | 'model'
  const [subName, setSubName] = useState('');

  useEffect(() => {
    api.allCountries().then((r) => setCountries(r.data || [])).catch(() => { });
    api.allMakes().then((r) => setMakes(r.data || [])).catch(() => { });
    api.allModels().then((r) => setModels(r.data || [])).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredModels = models.filter((m) => !form.makeId || (m.makeId ?? m.MakeId) === parseInt(form.makeId, 10));
  const makeName = makes.find((m) => String(m.id ?? m.Id) === form.makeId)?.name || '';

  const save = () => {
    const payload = {
      Country: form.country || null,
      Year: parseInt(form.year, 10) || null,
      MakeId: parseInt(form.makeId, 10) || null,
      ModelId: parseInt(form.modelId, 10) || null,
      Details: form.details || null
    };
    api.updateDetails(car.id, payload).then(() => {
      const countryName = countries.find((c) => (c.code || c.Code || '').toLowerCase() === form.country)?.name
        || countries.find((c) => (c.code || c.Code || '').toLowerCase() === form.country)?.Name
        || car.countryName;
      Object.assign(car, {
        country: payload.Country, year: payload.Year, makeId: payload.MakeId,
        modelId: payload.ModelId, details: payload.Details,
        makeName, countryName
      });
      if (onSaved) onSaved(car);
      if (onClose) onClose();
    }).catch(() => { });
  };

  const createSub = () => {
    const name = subName.trim();
    if (!name) return;
    const req = subModal === 'model'
      ? api.createModel(name, parseInt(form.makeId, 10))
      : api.createMake(name);
    req.then((r) => {
      const id = r.data && r.data.id;
      setSubModal(null);
      setSubName('');
      if (subModal === 'make') {
        api.allMakes().then((res) => {
          const list = res.data || [];
          setMakes(list);
          if (id) setForm((f) => ({ ...f, makeId: String(id), modelId: '' }));
        });
      } else {
        api.allModels().then((res) => {
          setModels(res.data || []);
          if (id) setForm((f) => ({ ...f, modelId: String(id) }));
        });
      }
    }).catch(() => setSubModal(null));
  };

  const optList = (list, nameKey = 'name', idKey = 'id') =>
    list.map((x) => ({ value: String(x[idKey] ?? x[idKey[0].toUpperCase() + idKey.slice(1)]), label: x[nameKey] ?? x[nameKey[0].toUpperCase() + nameKey.slice(1)] }));

  return (
    <>
      <div className="car-edit-form car-tab-content active" data-content="edit">
        <div className="edit-field-row">
          <div className="edit-field">
            <label>Country</label>
            <DropdownList id="car-edit-country"
              value={form.country}
              options={countries.map((c) => ({ value: (c.code || c.Code || '').toLowerCase(), label: c.name || c.Name }))}
              onChange={(v) => setForm((f) => ({ ...f, country: v }))} />
          </div>
          <div className="edit-field">
            <label>Year</label>
            <input id="car-edit-year" type="number" min="0" step="1" value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
          </div>
          <div className="edit-field has-add">
            <label>Manufacturer</label>
            <div className="edit-field-input">
              <DropdownList id="car-edit-make"
                value={form.makeId}
                options={optList(makes)}
                onChange={(v) => setForm((f) => ({ ...f, makeId: v, modelId: '' }))} />
              <button className="edit-add-btn" id="car-edit-add-make" title="New Manufacturer" onClick={() => { setSubModal('make'); setSubName(''); }}>
                <Icon name="add" className="dark" />
              </button>
            </div>
          </div>
          <div className="edit-field has-add">
            <label>Model</label>
            <div className="edit-field-input">
              <DropdownList id="car-edit-model"
                value={form.modelId}
                options={optList(filteredModels)}
                onChange={(v) => setForm((f) => ({ ...f, modelId: v }))} />
              <button className="edit-add-btn" id="car-edit-add-model" title="New Model" onClick={() => { setSubModal('model'); setSubName(''); }}>
                <Icon name="add" className="dark" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="car-edit-info car-tab-content" data-content="info">
        <textarea id="car-edit-info-text" rows="8" value={form.details}
          onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}></textarea>
      </div>
      <div className="car-edit-actions">
        <button className="car-edit-cancel" onClick={onClose}>Cancel</button>
        <button className="car-edit-save" onClick={save}>Save Changes</button>
      </div>

      {subModal && (
        <div className="car-edit-submodal-backdrop" id="car-edit-submodal" style={{ display: 'flex' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSubModal(null); }}>
          <div className="car-edit-submodal">
            <h4 id="ces-title">{subModal === 'model' ? 'New Model' : 'New Manufacturer'}</h4>
            <div className="ces-make-label" style={{ display: subModal === 'model' ? '' : 'none' }}>
              {subModal === 'model' ? `Manufacturer: ${makeName}` : ''}
            </div>
            <input type="text" id="ces-name" maxLength="120" value={subName}
              autoFocus onChange={(e) => setSubName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createSub(); }} />
            <div className="ces-actions">
              <button className="ces-cancel" onClick={() => setSubModal(null)}>Cancel</button>
              <button className="ces-create" onClick={createSub}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
