import React from 'react';

const VIEWBOXES = {
  'race-car': '0 0 1850 705',
  'game': '0 0 657 657',
  'track': '0 0 800 657',
  'star': '0 0 24 24',
  'star-outline': '0 0 24 24'
};

// <svg><use> icon referencing the inline icons.svg sprite injected by
// <SvgAssets/> - external file refs (file.svg#id) don't resolve in Chrome
export default function Icon({ name, viewBox, className = 'dark', ...rest }) {
  return (
    <svg viewBox={viewBox || VIEWBOXES[name] || '0 0 64 64'} className={className} {...rest}>
      <use href={`#icon-${name}`} xlinkHref={`#icon-${name}`} />
    </svg>
  );
}

export function Logo({ className = 'light', dark = false }) {
  const id = dark ? 'racerui-logo-light' : 'racerui-logo';
  return (
    <svg viewBox="0 0 1850 705" className={className}>
      <use href={`#${id}`} xlinkHref={`#${id}`} className="svg-nocolor" />
    </svg>
  );
}
