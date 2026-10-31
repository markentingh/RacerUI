import React, { createContext, useContext, useEffect, useState } from 'react';

const ScaleContext = createContext(1);

export function ScaleProvider({ children }) {
  const [factor, setFactor] = useState(() => Math.max(1, window.innerWidth / 1920));

  useEffect(() => {
    const update = () => {
      const s = Math.max(1, (1.0 / 1920) * window.innerWidth);
      setFactor(s);
      document.documentElement.style.setProperty('--scale-factor', s);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return <ScaleContext.Provider value={factor}>{children}</ScaleContext.Provider>;
}

export function useScale() {
  return useContext(ScaleContext);
}

// Applies the scale transform like the original .scale-ui elements
export function ScaleUI({ as: Tag = 'div', className = '', style, children, ...rest }) {
  const factor = useScale();
  return (
    <Tag className={`scale-ui ${className}`} style={{ transform: `scale(${factor})`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
