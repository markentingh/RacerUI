import React, { useEffect, useState } from 'react';

// Fetches the SVG sprites and injects them into the DOM (same as the
// original init.js) so <use href="#id"> resolves same-document
export default function SvgAssets() {
  const [html, setHtml] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/images/racerui-logo.svg').then((r) => r.text()),
      fetch('/images/icons.svg').then((r) => r.text())
    ])
      .then(([logo, icons]) => setHtml(logo + icons))
      .catch(() => { });
  }, []);

  return <div className="svg-assets" dangerouslySetInnerHTML={{ __html: html }} />;
}
