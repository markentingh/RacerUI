import React from 'react';
import { useFooter } from '@/context/footer';
import { ScaleUI } from '@/context/scale';
import Icon from '@/components/ui/Icon';
import CarsView from '@/app/cars/components/CarsView';

export default function CarPicker() {
  const { carPicker, closeCarPicker } = useFooter();
  if (!carPicker) return null;

  return (
    <ScaleUI className="car-picker-backdrop" id="ftr-car-picker" style={{ display: '' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeCarPicker(); }}>
      <div className="car-picker-modal">
        <div className="car-picker-header">
          <div className="car-picker-title">{carPicker.title}</div>
          <button className="car-picker-close" onClick={closeCarPicker}>
            <Icon name="close" className="dark" />
          </button>
        </div>
        <div className="car-picker-body">
          <CarsView picker filterKey="RacerUI:cars-filter-picker" onPick={carPicker.onPick} />
        </div>
      </div>
    </ScaleUI>
  );
}
