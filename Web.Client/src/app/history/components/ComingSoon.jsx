import React from 'react';
import { ScaleUI } from '@/context/scale';

export default function ComingSoon({ title }) {
  return (
    <ScaleUI className="coming-soon">
      <p>{title} Coming Soon!</p>
    </ScaleUI>
  );
}
