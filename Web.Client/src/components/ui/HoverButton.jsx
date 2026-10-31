import React, { useState } from 'react';

// Reproduces the original button hover-clone effect: .button-wrapper with a
// .button-hovered-clone that grows/shrinks over the real button
export default function HoverButton({ className = '', children, onClick, disabled, title }) {
  const [state, setState] = useState(''); // '' | 'growing' | 'shrinking'

  return (
    <div className="button-wrapper">
      <button
        className={className}
        disabled={disabled}
        title={title}
        onClick={onClick}
        onMouseEnter={() => { if (!disabled) setState('growing'); }}
        onMouseLeave={() => {
          setState('shrinking');
          setTimeout(() => setState(''), 300);
        }}
      >
        {children}
      </button>
      <button
        className={`${className} button-hovered-clone ${state}`}
        style={{ display: state ? 'flex' : 'none' }}
        onClick={onClick}
        tabIndex={-1}
        aria-hidden="true"
      >
        {children}
      </button>
    </div>
  );
}
