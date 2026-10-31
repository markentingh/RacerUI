import React from 'react';
import { ScaleUI } from '@/context/scale';

export default function NotFoundPage() {
  return (
    <ScaleUI className="error-page not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist or has been moved.</p>
    </ScaleUI>
  );
}
