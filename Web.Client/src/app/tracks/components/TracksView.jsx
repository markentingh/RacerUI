import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tracks as tracksApi } from '@/api/user/tracks';
import { useFooter } from '@/context/footer';
import { useScale, ScaleUI } from '@/context/scale';
import { flagUrl, trackOutlineUrl, trackPreviewUrl } from '@/helpers/images';
import scrollTo from '@/helpers/scrollTo';
import Icon from '@/components/ui/Icon';
import DropdownList from '@/components/ui/DropdownList';
import RatingStars from '@/components/ui/RatingStars';
import TrackDetails from './TrackDetails';

const DEFAULT_FILTER = () => ({
  countries: ['all'], types: [], search: '', sort: 'name', start: 0, length: 20, view: 'grid'
});

const SORTS = [
  { value: 'name', label: 'Name' },
  { value: 'country', label: 'Country' },
  { value: 'distance', label: 'Distance' },
  { value: 'year', label: 'Year' },
  { value: 'rating', label: 'Rating' }
];

const TRACK_VIEWS = [
  { id: 'grid', label: 'Grid' },
  { id: 'gridsm', label: 'Small Grid' },
  { id: 'gridxl', label: 'Large Grid' }
];

const FACETS = [
  { id: 'view', label: 'View' },
  { id: 'country', label: 'Country' },
  { id: 'type', label: 'Type' }
];

const previewUrl = (t) => trackPreviewUrl(t.path, t.subPath);
const outlineUrl = (t) => trackOutlineUrl(t.path, t.subPath);

// Reusable tracks view - page and footer's track-picker modal
export default function TracksView({ picker = false, filterKey = 'RacerUI:tracks-filter', onPick }) {
  const api = tracksApi;
  const footer = useFooter();
  const factor = useScale();
  const navigate = useNavigate();
  const params = useParams();

  const [filter, setFilter] = useState(() => {
    const f = DEFAULT_FILTER();
    try {
      const saved = localStorage.getItem(filterKey);
      if (saved) Object.assign(f, JSON.parse(saved));
    } catch { /* ignore */ }
    return f;
  });
  const filterRef = useRef(filter);
  const [tracks, setTracks] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [section, setSection] = useState(null);
  const [facet, setFacet] = useState(null);
  const cloneItemRef = useRef(null);             // item element currently hosting a hover clone
  const [selected, setSelected] = useState(null);
  const [win, setWin] = useState({ first: 0, last: 12, padTop: 0, padBottom: 0 });
  const contentRef = useRef(null);
  const gridRef = useRef(null);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const isLoadingRef = useRef(false);

  const saveFilter = (f) => localStorage.setItem(filterKey, JSON.stringify(f));

  const updateFilter = useCallback((patch, reload = true) => {
    setFilter((prev) => {
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
      filterRef.current = next;
      saveFilter(next);
      return next;
    });
    if (reload) setTimeout(() => getFilteredListRef.current(true), 0);
  }, []);

  const hasActiveFilters = () => {
    const f = filterRef.current;
    return (f.countries.length > 0 && !f.countries.includes('all')) || f.types.length > 0 || (f.search && f.search.length > 0);
  };

  const getFilteredList = useCallback((reset = true) => {
    const f = { ...filterRef.current };
    if (reset) {
      f.start = 0;
      filterRef.current = f;
      setFilter(f);
      setTracks([]);
      setHasMore(true);
      setWin({ first: 0, last: 12, padTop: 0, padBottom: 0 });
      setSelected(null);
    }
    const data = {
      Countries: f.countries.includes('all') ? [] : f.countries,
      Types: f.types, Search: f.search || '', Sort: f.sort,
      Start: f.start, Length: f.length
    };
    isLoadingRef.current = true;
    setIsLoading(true);
    api.filter(data).then((res) => {
      const d = res.data || {};
      const batch = d.tracks || [];
      setTracks((prev) => (reset ? batch : prev.concat(batch)));
      setHasMore(batch.length >= f.length);
      isLoadingRef.current = false;
      setIsLoading(false);
    }).catch(() => { isLoadingRef.current = false; setIsLoading(false); });
  }, [api]);
  const getFilteredListRef = useRef(getFilteredList);
  getFilteredListRef.current = getFilteredList;

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;
    filterRef.current = { ...filterRef.current, start: filterRef.current.start + filterRef.current.length };
    getFilteredList(false);
  }, [hasMore, getFilteredList]);

  // Initial load only - refetching happens via filter changes, not nav clicks
  useEffect(() => {
    getFilteredList(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker]);

  // Route section param -> open filter panel (no refetch)
  useEffect(() => {
    if (!picker) setSection(params.section || null);
  }, [picker, params.section]);

  useEffect(() => {
    const el = contentRef.current;
    if (el && el.scrollHeight <= el.clientHeight && hasMore && !isLoading) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  const resize = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    if (picker) {
      el.style.height = '';
    } else {
      const rect = el.getBoundingClientRect();
      const fh = window.innerWidth <= 1920 ? footer.footerHeight : (footer.footerHeight / 1920) * window.innerWidth;
      el.style.height = `calc(${window.innerHeight - rect.top}px - ${fh}em)`;
    }
    const filterEl = document.querySelector(picker ? '.track-picker-body .tracks-filter' : '.tracks-filter');
    if (filterEl) {
      const filterRect = filterEl.getBoundingClientRect();
      filterEl.style.maxHeight = `${(window.innerHeight - filterRect.top) / factor}px`;
    }
  }, [picker, footer.footerHeight, factor]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  const manageVirtualDOM = useCallback(() => {
    const container = contentRef.current;
    const grid = gridRef.current;
    if (!container || !grid) return;
    const items = grid.querySelectorAll('.track:not(.hovered-clone):not(.grid-details)');
    if (!items.length) return;
    const style = window.getComputedStyle(grid);
    const columns = Math.max(1, style.gridTemplateColumns.split(' ').length);
    const rowHeight = items[0].offsetHeight + parseFloat(style.gap || 0);
    if (!rowHeight) return;
    const effectiveScrollTop = container.scrollTop / factor;
    const effectiveViewport = container.clientHeight / factor;
    const buffer = 5;
    const totalRows = Math.ceil(tracksRef.current.length / columns);
    const first = Math.max(0, Math.floor(effectiveScrollTop / rowHeight) - buffer);
    const last = Math.min(totalRows - 1, Math.ceil((effectiveScrollTop + effectiveViewport) / rowHeight) + buffer);
    setWin((prev) => {
      if (prev.first === first && prev.last === last && prev.cols === columns) return prev;
      return { first, last, cols: columns, padTop: first * rowHeight, padBottom: Math.max(0, totalRows - last - 1) * rowHeight };
    });
  }, [factor]);

  const onScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.8) loadMore();
    manageVirtualDOM();
  };

  useEffect(() => { manageVirtualDOM(); }, [tracks, manageVirtualDOM]);

  useEffect(() => {
    if (!section || section === 'view') { setFacet(null); return; }
    let cancelled = false;
    if (section === 'country') {
      api.countries({ Countries: [], Types: filterRef.current.types, Search: filterRef.current.search || '' })
        .then((r) => { if (!cancelled) setFacet(r.data); }).catch(() => { });
    } else if (section === 'type') {
      api.types({ Countries: [], Types: [], Search: filterRef.current.search || '' })
        .then((r) => { if (!cancelled) setFacet(r.data); }).catch(() => { });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const nav = (s) => {
    if (section === s) { hideFilter(); return; }
    setSection(s);
    if (!picker) navigate(`/dashboard/tracks/${s}`);
  };

  const hideFilter = () => {
    setSection(null);
    if (!picker) navigate('/dashboard/tracks');
  };

  const clearFilters = () => {
    updateFilter({ countries: ['all'], types: [], search: '' });
    if (section && section !== 'view') {
      const s = section;
      setSection(null);
      setTimeout(() => setSection(s), 0);
    }
  };

  // Direct DOM clone injection like the original itemHover/itemHoverOff -
  // keeps the overlay out of React's reconciliation so it can't be stomped
  // mid-animation or unmounted by virtual scrolling
  const itemHoverOff = (itemEl) => {
    if (!itemEl) return;
    const clone = itemEl.querySelector('.hovered-clone');
    if (clone) {
      clone.classList.add('hiding');
      setTimeout(() => clone.remove(), 250);
    }
    if (cloneItemRef.current === itemEl) cloneItemRef.current = null;
  };

  const itemHover = (itemEl, track) => {
    if (!itemEl || cloneItemRef.current === itemEl) return;
    if (cloneItemRef.current) itemHoverOff(cloneItemRef.current);
    const clone = itemEl.cloneNode(true);
    clone.classList.add('hovered-clone');
    clone.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDetailsRef.current(track, itemEl);
    };
    clone.onmouseleave = () => itemHoverOff(itemEl);
    itemEl.prepend(clone);
    cloneItemRef.current = itemEl;
  };

  const openDetails = (track, itemEl) => {
    if (selected && selected.path === track.path) { setSelected(null); return; }
    setSelected(track);
    setTimeout(() => {
      if (itemEl && contentRef.current) scrollTo(contentRef.current, itemEl, 500, 'easeInOutQuad', 0, factor);
    }, 350);
  };
  const openDetailsRef = useRef(openDetails);
  openDetailsRef.current = openDetails;

  const selectTrack = (track, layout) => {
    if (onPick) onPick(track, layout);
    else footer.selectTrack(track, layout);
  };

  const viewType = filter.view || 'grid';
  const gridClass = `grid-view${viewType === 'gridsm' ? ' sm' : viewType === 'gridxl' ? ' xl' : ''}`;

  const renderItem = (track, i) => {
    const isSel = selected && selected.path === track.path;
    return (
      <React.Fragment key={track.path + '-' + i}>
        <div className={`track${isSel ? ' selected' : ''}`} data-id={track.id} data-path={track.path}
          style={{ backgroundImage: `url('${previewUrl(track)}')` }}
          onMouseEnter={(e) => itemHover(e.currentTarget, track)}>
          <ItemInner track={track} viewType={viewType} />
        </div>
        {isSel && (
          <TrackDetails
            track={track}
            onSelectTrack={selectTrack}
            onFilterByCountry={(c) => updateFilter({ countries: [c] })}
            onFilterByCity={(c) => updateFilter({ search: c })}
            onFilterByYear={(y) => updateFilter({ search: String(y) })}
            onFilterByType={(t) => updateFilter({ types: [parseInt(t, 10)] })}
            onRated={() => setTracks((t) => [...t])}
          />
        )}
      </React.Fragment>
    );
  };

  const facetList = () => {
    if (section === 'view') {
      return (
        <div className="filter-view">
          <ul className="select-list">
            {TRACK_VIEWS.map((v) => (
              <li key={v.id} data-view={v.id} className={viewType === v.id ? 'selected' : ''}
                onClick={() => updateFilter({ view: v.id })}>{v.label}</li>
            ))}
          </ul>
        </div>
      );
    }
    if (!section) return null;
    const list = Array.isArray(facet) ? facet : [];
    if (section === 'country') {
      return (
        <div className="filter-country"><ul className="select-list">
          <li data-country="all" className={filter.countries.includes('all') ? 'selected' : ''}
            onClick={() => updateFilter({ countries: ['all'] })}>
            <img src="/images/flags/80x60/all.png" alt="" />All Countries
          </li>
          {list.map((c) => (
            <li key={c.code} data-country={c.code} className={filter.countries.includes(c.code) ? 'selected' : ''}
              onClick={() => {
                const arr = [...filter.countries];
                const idx = arr.indexOf(c.code);
                if (idx > -1) arr.splice(idx, 1); else arr.push(c.code);
                const ai = arr.indexOf('all');
                if (ai > -1) arr.splice(ai, 1);
                updateFilter({ countries: arr });
              }}>
              <img src={flagUrl(c.code)} alt="" />{c.name}
            </li>
          ))}
        </ul></div>
      );
    }
    if (section === 'type') {
      return (
        <div className="filter-type"><ul className="select-list">
          <li data-type="0" className={!filter.types.length ? 'selected' : ''}
            onClick={() => updateFilter({ types: [] })}>All Types</li>
          {list.map((t) => (
            <li key={t.id} data-type={t.id} className={filter.types.includes(t.id) ? 'selected' : ''}
              onClick={() => {
                const arr = [...filter.types];
                const idx = arr.indexOf(t.id);
                if (idx > -1) arr.splice(idx, 1); else arr.push(t.id);
                updateFilter({ types: arr });
              }}>{t.name}</li>
          ))}
        </ul></div>
      );
    }
    return null;
  };

  const cols = win.cols || 1;
  const startIdx = (win.first || 0) * cols;
  const endIdx = Math.min(((win.last || 12) + 1) * cols, tracks.length);

  return (
    <>
      <ScaleUI className="tracks-toolbar sub-menu">
        <nav>
          <ul className="menu">
            {FACETS.map((f) => (
              <li key={f.id} className={`item-${f.id}${section === f.id ? ' selected' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(f.id); }}>
                <a href={`/dashboard/tracks/${f.id}`} onClick={(e) => e.preventDefault()}>{f.label}</a>
              </li>
            ))}
            <li className="search-input">
              <input type="text" id="search_tracks" placeholder="Search" value={filter.search}
                onChange={(e) => updateFilter({ search: e.target.value }, false)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); getFilteredList(true); } }} />
              <Icon name="arrow-right" className="dark search-arrow" />
              <Icon name="close" className="dark search-clear" id="search_clear"
                style={{ display: filter.search ? 'inline-block' : 'none' }}
                onClick={() => updateFilter({ search: '' })} />
            </li>
            <li className="clear-filter-btn" style={{ display: hasActiveFilters() ? 'inline-block' : 'none' }}>
              <button id="clear_filter_btn" title="Clear All Filters" onClick={clearFilters}>
                <Icon name="close" className="dark" />Clear Filters
              </button>
            </li>
          </ul>
          <div className="right">
            <DropdownList id="tracks_sort" title="Sort" value={filter.sort}
              options={SORTS} onChange={(v) => updateFilter({ sort: v })} />
            <div className="close-btn" onClick={hideFilter} style={{ display: section ? 'block' : 'none' }}>
              <Icon name="close" className="dark" />
            </div>
          </div>
        </nav>
      </ScaleUI>
      <ScaleUI className="tracks-filter">{facetList()}</ScaleUI>
      <div className="tracks-content" ref={contentRef} onScroll={onScroll}>
        {tracks.length === 0 && !isLoading ? (
          <div className="empty-results scale-ui">
            <div className="message">
              <Icon name="search" className="dark" />
              <h2>No Tracks Found</h2>
              <p>Try adjusting your filters or search criteria</p>
            </div>
          </div>
        ) : (
          <ScaleUI className={gridClass} ref={gridRef}
            style={{ paddingTop: `${win.padTop || 0}px`, paddingBottom: `${win.padBottom || 0}px` }}>
            {tracks.slice(startIdx, endIdx).map((t, i) => renderItem(t, startIdx + i))}
          </ScaleUI>
        )}
      </div>
    </>
  );
}

function ItemInner({ track, viewType }) {
  const city = track.city && track.city !== 'null' ? track.city : '';
  return (
    <>
      {(track.rating || 0) > 0 && (
        <RatingStars className="rating-badge" rating={track.rating} filledOnly readonly />
      )}
      {viewType === 'gridxl' && (
        <div className="info-top">
          <div className="track-length">{track.length ? (track.length / 1000).toFixed(1) + ' km' : ''}</div>
          <div className="track-type">{track.typeName || ''}</div>
        </div>
      )}
      <img className="track-outline" src={outlineUrl(track)}
        onError={(e) => { e.currentTarget.style.display = 'none'; }} alt="" />
      <div className="info">
        <div className="flag">
          <img src={flagUrl(track.country)} alt={track.countryName || ''} title={track.countryName || ''} />
        </div>
        <span className="track-name">{track.name}</span>
        {city && <span className="city">{city}</span>}
      </div>
    </>
  );
}
