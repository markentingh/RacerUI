import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ScaleUI } from '@/context/scale';
import Favorites from './components/Favorites';
import ComingSoon from './components/ComingSoon';

const SECTIONS = [
  { id: 'results', label: 'Results' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'lap-times', label: 'Lap Times' },
  { id: 'stats', label: 'Stats' },
  { id: 'most-used', label: 'Most Used' },
  { id: 'top-speed', label: 'Top Speed' }
];

const SECTION_COMPONENTS = {
  favorites: Favorites
};

const sectionTitle = (s) =>
  s.split('-').map((w) => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');

export default function HistoryPage() {
  const navigate = useNavigate();
  const { section: routeSection } = useParams();
  const section = routeSection || 'results';
  const contentRef = useRef(null);
  const Section = SECTION_COMPONENTS[section];

  const nav = (s) => navigate(`/dashboard/history/${s}`);

  return (
    <>
      <ScaleUI className="history-toolbar sub-menu">
        <nav>
          <ul className="menu">
            {SECTIONS.map((s) => (
              <li key={s.id} className={`item-${s.id}${section === s.id ? ' selected' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(s.id); }}>
                <a href={`/dashboard/history/${s.id}`} onClick={(e) => e.preventDefault()}>{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </ScaleUI>
      <div className="history-content" ref={contentRef}>
        {Section ? <Section scrollRef={contentRef} /> : <ComingSoon title={sectionTitle(section)} />}
      </div>
    </>
  );
}
