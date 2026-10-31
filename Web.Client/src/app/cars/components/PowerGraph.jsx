import React, { useEffect, useRef, useState } from 'react';
import { cars as carsApi } from '@/api/user/cars';

// SVG torque/power chart from /api/cars/{id}/powercurve - same .pt-* classes
export default function PowerGraph({ carId }) {
  const [svg, setSvg] = useState(null);

  useEffect(() => {
    if (!carId) return;
    let cancelled = false;
    carsApi.powerCurve(carId).then((res) => {
      if (cancelled) return;
      const data = res.data || {};
      const rpm = data.rpm || data.Rpm || [];
      const torque = data.torque || data.Torque || [];
      const power = data.power || data.Power || [];
      if (rpm.length < 2) return;

      const W = 640, H = 248;
      const m = { left: 56, right: 56, top: 14, bottom: 40 };
      const pw = W - m.left - m.right;
      const ph = H - m.top - m.bottom;

      const rpmMin = Math.max(0, Math.min(...rpm));
      const rpmMax = Math.max(...rpm);

      const niceScale = (v) => {
        const raw = (v || 1) / 5;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const norm = raw / mag;
        const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
        return { step, max: step * 5 };
      };
      const t = niceScale(Math.max(...torque));
      const p = niceScale(Math.max(...power));

      const x = (r) => m.left + (r - rpmMin) / (rpmMax - rpmMin || 1) * pw;
      const yT = (v) => m.top + ph - v / t.max * ph;
      const yP = (v) => m.top + ph - v / p.max * ph;
      const f = (n) => Math.round(n * 100) / 100;

      const els = [];
      for (let i = 0; i <= 5; i++) {
        const y = f(m.top + ph - i / 5 * ph);
        els.push(<line key={`gl${i}`} className="pt-grid" x1={m.left} y1={y} x2={m.left + pw} y2={y} />);
        els.push(<text key={`tl${i}`} className="pt-label pt-tick-torque" x={m.left - 6} y={f(y + 4)} textAnchor="end">{Math.round(t.step * i)}</text>);
        els.push(<text key={`pl${i}`} className="pt-label pt-tick-power" x={m.left + pw + 6} y={f(y + 4)} textAnchor="start">{Math.round(p.step * i)}</text>);
      }
      els.push(<line key="ax1" className="pt-axis" x1={m.left} y1={m.top + ph} x2={m.left + pw} y2={m.top + ph} />);
      els.push(<line key="ax2" className="pt-axis" x1={m.left} y1={m.top} x2={m.left} y2={m.top + ph} />);
      els.push(<line key="ax3" className="pt-axis" x1={m.left + pw} y1={m.top} x2={m.left + pw} y2={m.top + ph} />);

      const rpmStep = niceScale(rpmMax - rpmMin).step;
      for (let r = Math.ceil(rpmMin / rpmStep) * rpmStep; r <= rpmMax; r += rpmStep) {
        els.push(<line key={`rg${r}`} className="pt-grid" x1={f(x(r))} y1={m.top} x2={f(x(r))} y2={m.top + ph} />);
        els.push(<text key={`rt${r}`} className="pt-label" x={f(x(r))} y={m.top + ph + 16} textAnchor="middle">{r}</text>);
      }
      const legendY = H - 10;
      const e = m.left + pw;
      els.push(<text key="rpm" className="pt-label" x={f(m.left + pw / 2)} y={legendY} textAnchor="middle">rpm</text>);
      els.push(<text key="lt" className="pt-label pt-legend-torque" x={f(e)} y={legendY} textAnchor="end">torque</text>);
      els.push(<line key="llt" className="pt-line pt-line-torque" x1={f(e - 68)} y1={legendY - 4} x2={f(e - 44)} y2={legendY - 4} />);
      els.push(<text key="lp" className="pt-label pt-legend-power" x={f(e - 84)} y={legendY} textAnchor="end">power</text>);
      els.push(<line key="llp" className="pt-line pt-line-power" x1={f(e - 150)} y1={legendY - 4} x2={f(e - 124)} y2={legendY - 4} />);

      // unit labels rotated 90deg, centered on their axes
      const cy = m.top + ph / 2;
      els.push(<text key="un-t" className="pt-label pt-legend-torque" x="14" y={f(cy)} textAnchor="middle" transform={`rotate(-90 14 ${f(cy)})`}>Nm</text>);
      els.push(<text key="un-p" className="pt-label pt-legend-power" x={W - 14} y={f(cy)} textAnchor="middle" transform={`rotate(-90 ${W - 14} ${f(cy)})`}>bhp</text>);

      const torquePts = rpm.map((r, i) => `${f(x(r))},${f(yT(torque[i]))}`).join(' ');
      const powerPts = rpm.map((r, i) => `${f(x(r))},${f(yP(power[i]))}`).join(' ');

      setSvg(
        <svg className="pt-graph" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {els}
          <defs><clipPath id="pt-clip"><rect x={m.left} y={m.top} width={pw} height={ph} /></clipPath></defs>
          <g clipPath="url(#pt-clip)">
            <polyline className="pt-line pt-line-torque" points={torquePts} />
            <polyline className="pt-line pt-line-power" points={powerPts} />
          </g>
        </svg>
      );
    }).catch(() => { });
    return () => { cancelled = true; };
  }, [carId]);

  return <div className="car-graph">{svg}</div>;
}
