import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScale } from '@/context/scale';

// React port of the <dropdown-list> custom element - same DOM/classes so the
// existing LESS keeps working: <dropdown-list> > .ddl-toggle, portaled .ddl-portal
export default function DropdownList({ id, className = '', value, defaultValue, placeholder, options = [], numeric, onChange, ...rest }) {
  const factor = useScale();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [internal, setInternal] = useState(defaultValue !== undefined ? String(defaultValue) : undefined);
  const toggleRef = useRef(null);
  const portalRef = useRef(null);

  const selected = value !== undefined ? (value === null ? undefined : String(value)) : internal;
  const selectedOpt = options.find((o) => String(o.value) === selected);
  const showPlaceholder = !selectedOpt && placeholder != null;

  const open_ = () => {
    const rect = toggleRef.current.getBoundingClientRect();
    const width = toggleRef.current.offsetWidth;
    const portalHeight = Math.min(options.length * 44 + 16, 22 * 16 * factor);
    const spaceBelow = window.innerHeight - rect.bottom;
    const upward = spaceBelow < portalHeight && rect.top > portalHeight;
    setPos({
      left: rect.left,
      top: upward ? rect.top - portalHeight : rect.bottom,
      width,
      upward
    });
    setOpen(true);
  };

  const select = (opt) => {
    setInternal(String(opt.value));
    setOpen(false);
    if (onChange) onChange(numeric ? parseInt(opt.value, 10) : String(opt.value), opt);
  };

  const clear = () => { setInternal(undefined); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!toggleRef.current.contains(e.target) && !(portalRef.current && portalRef.current.contains(e.target))) {
        setOpen(false);
      }
    };
    const close = () => setOpen(false);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('resize', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  return (
    <div id={id} className={`dropdown-list ${className}${showPlaceholder ? ' ddl-placeholder' : ''}`} {...rest}>
      <div className="ddl-toggle" ref={toggleRef} onClick={() => (open ? setOpen(false) : open_())}>
        <span className="ddl-label">{selectedOpt ? selectedOpt.label : (placeholder || '')}</span>
        <span className="material-symbols-outlined ddl-caret">keyboard_arrow_down</span>
      </div>
      {open && pos && createPortal(
        <div
          ref={portalRef}
          className="ddl-portal"
          style={{
            position: 'fixed',
            left: `${pos.left}px`,
            top: `${pos.top}px`,
            width: `${pos.width}px`,
            transform: `scale(${factor})`,
            transformOrigin: pos.upward ? 'bottom left' : 'top left'
          }}
        >
          {options.map((opt) => (
            <div
              key={String(opt.value)}
              className={`ddl-item${String(opt.value) === selected ? ' selected' : ''}`}
              onClick={() => select(opt)}
            >
              {opt.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
