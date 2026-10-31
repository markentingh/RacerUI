import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cars as carsApi } from '@/api/user/cars';
import { useFooter } from '@/context/footer';
import { useScale, ScaleUI } from '@/context/scale';
import { flagUrl, skinPreviewUrl } from '@/helpers/images';
import scrollTo from '@/helpers/scrollTo';
import Icon from '@/components/ui/Icon';
import DropdownList from '@/components/ui/DropdownList';
import RatingStars from '@/components/ui/RatingStars';
import CarDetails from './CarDetails';
import CarDetailsModal from './CarDetailsModal';

const DEFAULT_FILTER = () => ({
  countries: ['all'], makes: [], models: [], years: [], classes: [],
  types: [], styles: [], specializations: [],
  search: '', sort: 'year', start: 0, length: 20, view: 'grid'
});

const SORTS = [
  { value: 'year', label: 'Year (Newest)' },
  { value: 'yearasc', label: 'Year (Oldest)' },
  { value: 'country', label: 'Country' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'model', label: 'Model' },
  { value: 'rating', label: 'Rating' },
  { value: 'maxspeed', label: 'Max Speed' }
];

const CAR_VIEWS = [
  { id: 'grid', label: 'Grid' },
  { id: 'gridsm', label: 'Small Grid' },
  { id: 'gridxl', label: 'Large Grid' },
  { id: 'gallery', label: 'Gallery' }
];

const FACETS = [
  { id: 'view', label: 'View' },
  { id: 'country', label: 'Country' },
  { id: 'manufacturer', label: 'Manufacturer' },
  { id: 'model', label: 'Model' },
  { id: 'year', label: 'Year' },
  { id: 'class', label: 'Class' },
  { id: 'type', label: 'Type' },
  { id: 'style', label: 'Style' },
  { id: 'specialization', label: 'Specialization' }
];

const getCarDetails = (car, skin) => {
  if (skin == null) skin = car.skins?.length > 0 ? car.skins[0] : null;
  car.preview = skin ? `/image/assetto corsa/skin/${encodeURIComponent(car.path)}/${encodeURIComponent(skin.path)}` : '';
  car.name = car.name ?? (car.path || '').replace(/_/g, ' ');
  return car;
};

export const carDisplayName = (car) => ((car.year ?? '') + ' ' + (car.name || '').replace(car.year ?? '', '')).trim();

// Reusable cars view - mounted on the cars page and inside the footer's
// picker modals. onPick replaces the Select Car action in picker mode.
export default function CarsView({ picker = false, filterKey = 'RacerUI:cars-filter', onPick, onOpenDetails }) {
  const api = carsApi;
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
  const [cars, setCars] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [section, setSection] = useState(null);
  const [facet, setFacet] = useState(null);      // data for open filter panel
  const cloneItemRef = useRef(null);             // item element currently hosting a hover clone
  const [selected, setSelected] = useState(null); // selected car object
  const [gridKey, setGridKey] = useState(0);
  const [win, setWin] = useState({ first: 0, last: 12, padTop: 0, padBottom: 0 });
  const contentRef = useRef(null);
  const gridRef = useRef(null);
  const selectedItemRef = useRef(null);
  const carsRef = useRef(cars);
  carsRef.current = cars;
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

  const hasNonModelFilters = (f = filterRef.current) => {
    const hasCountry = f.countries.length > 0 && !f.countries.includes('all');
    return hasCountry || f.makes.length > 0 || f.years.length > 0 ||
      (f.classes && f.classes.length > 0) || f.types.length > 0 ||
      f.styles.length > 0 || f.specializations.length > 0 ||
      (f.search && f.search.length > 0);
  };
  const hasActiveFilters = () => hasNonModelFilters() || filterRef.current.models.length > 0;

  const getFilterData = (exclude) => {
    const f = filterRef.current;
    return {
      Countries: exclude === 'countries' ? [] : (f.countries.includes('all') ? [] : f.countries),
      Makes: exclude === 'makes' ? [] : f.makes,
      Years: exclude === 'years' ? [] : f.years,
      Classes: exclude === 'classes' ? [] : (f.classes || []),
      Models: exclude === 'models' ? [] : f.models,
      Types: exclude === 'types' ? [] : f.types,
      Styles: exclude === 'styles' ? [] : f.styles,
      Specializations: exclude === 'specializations' ? [] : f.specializations,
      Search: f.search || ''
    };
  };

  const getFilteredList = useCallback((reset = true) => {
    const f = { ...filterRef.current };
    if (reset) {
      f.start = 0;
      filterRef.current = f;
      setFilter(f);
      setCars([]);
      setHasMore(true);
      setWin({ first: 0, last: 12, padTop: 0, padBottom: 0 });
      setSelected(null);
    }
    const data = {
      Countries: f.countries.includes('all') ? [] : f.countries,
      Makes: f.makes, Models: f.models, Years: f.years,
      Classes: f.classes || [], Types: f.types, Styles: f.styles,
      Specializations: f.specializations,
      Search: f.search || '', Sort: f.sort,
      Start: f.start, Length: f.length
    };
    isLoadingRef.current = true;
    setIsLoading(true);
    api.filter(data).then((res) => {
      const list = res.data || {};
      const batch = list.cars || [];
      if (reset) {
        setCars(batch.map((c) => getCarDetails(c)));
      } else {
        setCars((prev) => prev.concat(batch.map((c) => getCarDetails(c))));
      }
      setHasMore(batch.length >= f.length);
      isLoadingRef.current = false;
      setIsLoading(false);
    }).catch(() => { isLoadingRef.current = false; setIsLoading(false); });
  }, [api]);
  const getFilteredListRef = useRef(getFilteredList);
  getFilteredListRef.current = getFilteredList;

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;
    const f = { ...filterRef.current, start: filterRef.current.start + filterRef.current.length };
    filterRef.current = f;
    getFilteredList(false);
  }, [hasMore, getFilteredList]);

  // Initial load + route section param (page mode only)
  // Initial load only - refetching happens via filter changes, not nav clicks
  useEffect(() => {
    getFilteredList(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker]);

  // Route section param -> open filter panel (no refetch)
  useEffect(() => {
    if (!picker) setSection(params.section || null);
  }, [picker, params.section]);

  // When no cars remain after a reset-less fetch (overflow load trigger)
  useEffect(() => {
    const el = contentRef.current;
    if (el && el.scrollHeight <= el.clientHeight && hasMore && !isLoading) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars]);

  // Content height - like cars.resize() in the original
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
    const filterEl = document.querySelector(picker ? '.car-picker-body .cars-filter' : '.cars-filter');
    if (filterEl) {
      const filterRect = filterEl.getBoundingClientRect();
      const footerEl = picker ? null : document.querySelector('.footer-container');
      const footerH = footerEl ? footerEl.getBoundingClientRect().height : 0;
      filterEl.style.maxHeight = `${(window.innerHeight - filterRect.top - footerH) / factor}px`;
    }
  }, [picker, footer.footerHeight, factor]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  // Virtual window rows - ports manageVirtualDOM
  const manageVirtualDOM = useCallback(() => {
    const container = contentRef.current;
    const grid = gridRef.current;
    if (!container || !grid) return;
    const items = grid.querySelectorAll('.car:not(.hovered-clone):not(.grid-details)');
    if (!items.length) return;
    const style = window.getComputedStyle(grid);
    const columns = Math.max(1, style.gridTemplateColumns.split(' ').length);
    const rowHeight = items[0].offsetHeight + parseFloat(style.gap || 0);
    if (!rowHeight) return;
    const effectiveScrollTop = container.scrollTop / factor;
    const effectiveViewport = container.clientHeight / factor;
    const buffer = 5;
    const totalRows = Math.ceil(carsRef.current.length / columns);
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

  useEffect(() => { manageVirtualDOM(); }, [cars, manageVirtualDOM]);

  // Facet panel -----------------------------------------------------------
  useEffect(() => {
    if (!section || section === 'view') { setFacet(null); return; }
    let cancelled = false;
    const load = (fn) => fn.then((res) => { if (!cancelled) setFacet(res.data); }).catch(() => { });
    switch (section) {
      case 'country': load(api.countries(getFilterData('countries'))); break;
      case 'manufacturer': load(api.manufacturers(getFilterData('makes'))); break;
      case 'model':
        if (!hasNonModelFilters()) { setFacet({ hint: 'Select a manufacturer, class or year to list models' }); break; }
        load(api.models(getFilterData('models'))); break;
      case 'year': load(api.years(getFilterData('years'))); break;
      case 'class': load(api.classes(getFilterData('classes'))); break;
      case 'type': load(api.types(getFilterData('types'))); break;
      case 'style': load(api.styles(getFilterData('styles'))); break;
      case 'specialization': load(api.specializations(getFilterData('specializations'))); break;
      default: setFacet(null);
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const nav = (s) => {
    if (section === s) { hideFilter(); return; }
    setSection(s);
    if (!picker) navigate(`/dashboard/cars/${s}`, { replace: false });
  };

  const hideFilter = () => {
    setSection(null);
    if (!picker) navigate('/dashboard/cars');
  };

  const clearFilters = () => {
    updateFilter({
      countries: ['all'], makes: [], models: [], years: [], classes: [],
      types: [], styles: [], specializations: [], search: ''
    });
    if (section && section !== 'view') {
      // reload the open facet with cleared filters
      const s = section;
      setSection(null);
      setTimeout(() => setSection(s), 0);
    }
  };

  // Toggle a value in a filter array (multi-select facet semantics)
  const toggleFacetValue = (key, value, allValue) => {
    const f = filterRef.current;
    const arr = [...(f[key] || [])];
    if (value === allValue) {
      updateFilter({ [key]: key === 'countries' ? ['all'] : [] });
      return;
    }
    const idx = arr.indexOf(value);
    if (idx > -1) arr.splice(idx, 1); else arr.push(value);
    const ai = arr.indexOf('all');
    if (ai > -1) arr.splice(ai, 1);
    updateFilter({ [key]: arr });
  };

  // Grid interactions -----------------------------------------------------
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

  const itemHover = (itemEl, car) => {
    if (!itemEl || cloneItemRef.current === itemEl) return;
    if (cloneItemRef.current) itemHoverOff(cloneItemRef.current);
    const clone = itemEl.cloneNode(true);
    clone.classList.add('hovered-clone');
    clone.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDetailsRef.current(car, itemEl);
    };
    clone.onmouseleave = () => itemHoverOff(itemEl);
    itemEl.prepend(clone);
    cloneItemRef.current = itemEl;
  };

  const openDetails = (car, itemEl) => {
    if (selected && selected.path === car.path) { setSelected(null); return; }
    setSelected(car);
    selectedItemRef.current = itemEl;
    setTimeout(() => {
      if (itemEl && contentRef.current) scrollTo(contentRef.current, itemEl, 500, 'easeInOutQuad', 0, factor);
    }, 350);
  };
  const openDetailsRef = useRef(openDetails);
  openDetailsRef.current = openDetails;

  const selectCar = (car, skin) => {
    if (onPick) onPick(car, skin);
    else footer.selectCar(car, skin);
  };

  // Renderers -------------------------------------------------------------
  const carName = (car) => carDisplayName(car);
  const viewType = filter.view || 'grid';

  const renderItem = (car, i) => {
    const isSel = selected && selected.path === car.path;
    return (
      <React.Fragment key={car.path + '-' + i}>
        <div
          className={`car${isSel ? ' selected' : ''}`}
          data-path={car.path}
          onMouseEnter={(e) => itemHover(e.currentTarget, car)}
        >
          <ItemInner car={car} viewType={viewType} />
        </div>
        {isSel && (
          <CarDetails
            car={car}
            onSelectCar={selectCar}
            onFilterByCountry={(c) => updateFilter({ countries: [c] })}
            onFilterByClass={(c) => updateFilter({ classes: [c] })}
            onFilterByMake={(m) => updateFilter({ makes: [parseInt(m, 10)] })}
            onRated={() => setGridKey((k) => k + 1)}
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
            {CAR_VIEWS.map((v) => (
              <li key={v.id} data-view={v.id} className={viewType === v.id ? 'selected' : ''}
                onClick={() => updateFilter({ view: v.id })}>
                <img src={`/images/flags/80x60/${v.id === 'gallery' ? 'us' : 'all'}.png`} alt="" />{v.label}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (!section) return null;
    if (facet && facet.hint) {
      return <div className={`filter-${section}`}><ul className="select-list"><li className="filter-hint">{facet.hint}</li></ul></div>;
    }
    const list = Array.isArray(facet) ? facet : [];
    const sel = filter;
    const isSel = (key, v) => (sel[key] || []).includes(v);
    const li = (key, dataAttr, v, label, flagCode) => (
      <li key={String(v)} {...{ [dataAttr]: String(v) }} className={isSel(key, v) ? 'selected' : ''}
        onClick={() => toggleFacetValue(key, v, key === 'countries' ? 'all' : 0)}>
        {flagCode !== undefined && <img src={flagUrl(flagCode)} alt="" />}{label}
      </li>
    );
    switch (section) {
      case 'country':
        return (
          <div className="filter-country"><ul className="select-list">
            <li data-country="all" className={sel.countries.includes('all') ? 'selected' : ''}
              onClick={() => updateFilter({ countries: ['all'] })}>
              <img src="/images/flags/80x60/all.png" alt="" />All Countries
            </li>
            {list.map((c) => li('countries', 'data-country', c.code, c.name, c.code))}
          </ul></div>
        );
      case 'manufacturer':
        return (
          <div className="filter-manufacturer"><ul className="select-list">
            <li data-make="0" className={!sel.makes.length ? 'selected' : ''}
              onClick={() => updateFilter({ makes: [] })}>All Manufacturers</li>
            {list.map((m) => li('makes', 'data-make', m.id, m.name))}
          </ul></div>
        );
      case 'model':
        return (
          <div className="filter-model"><ul className="select-list">
            <li data-model="0" className={!sel.models.length ? 'selected' : ''}
              onClick={() => updateFilter({ models: [] })}>All Models</li>
            {list.map((m) => li('models', 'data-model', m.id, m.name))}
          </ul></div>
        );
      case 'year':
        return (
          <div className="filter-year"><ul className="select-list">
            <li data-year="0" className={!sel.years.length ? 'selected' : ''}
              onClick={() => updateFilter({ years: [] })}>All Years</li>
            {list.map((y) => li('years', 'data-year', y, y))}
          </ul></div>
        );
      case 'class':
        return (
          <div className="filter-class"><ul className="select-list">
            <li data-class="all" className={!(sel.classes && sel.classes.length) ? 'selected' : ''}
              onClick={() => updateFilter({ classes: [] })}>All Classes</li>
            {list.map((cat) => (
              <div className="class-category" key={cat.category}>
                <h4>{cat.category}</h4>
                <ul className="class-list">
                  {cat.classes.map((c) => li('classes', 'data-class', c.name, c.name))}
                </ul>
              </div>
            ))}
          </ul></div>
        );
      case 'type':
        return (
          <div className="filter-type"><ul className="select-list">
            <li data-type="0" className={!sel.types.length ? 'selected' : ''}
              onClick={() => updateFilter({ types: [] })}>All Types</li>
            {list.map((t) => li('types', 'data-type', t.id, t.name))}
          </ul></div>
        );
      case 'style':
        return (
          <div className="filter-style"><ul className="select-list">
            <li data-style="0" className={!sel.styles.length ? 'selected' : ''}
              onClick={() => updateFilter({ styles: [] })}>All Styles</li>
            {list.map((s) => li('styles', 'data-style', s.id, s.name))}
          </ul></div>
        );
      case 'specialization':
        return (
          <div className="filter-specialization"><ul className="select-list">
            <li data-specialization="0" className={!sel.specializations.length ? 'selected' : ''}
              onClick={() => updateFilter({ specializations: [] })}>All Specializations</li>
            {list.map((s) => li('specializations', 'data-specialization', s.id, s.name))}
          </ul></div>
        );
      default: return null;
    }
  };

  const first = win.first || 0;
  const last = win.last || 12;
  const cols = win.cols || 1;
  const startIdx = first * cols;
  const endIdx = Math.min((last + 1) * cols, cars.length);

  const gridClass = `grid-view${viewType === 'gridsm' ? ' sm' : viewType === 'gridxl' ? ' xl' : ''}`;

  return (
    <>
      <ScaleUI className="cars-toolbar sub-menu">
        <nav>
          <ul className="menu">
            {FACETS.map((f) => (
              <li key={f.id} className={`item-${f.id}${section === f.id ? ' selected' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(f.id); }}>
                <a href={`/dashboard/cars/${f.id}`} onClick={(e) => e.preventDefault()}>{f.label}</a>
              </li>
            ))}
            <li className="search-input">
              <input type="text" id="search_cars" placeholder="Search" value={filter.search}
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
            <DropdownList id="cars_sort" title="Sort" value={filter.sort}
              options={SORTS} onChange={(v) => updateFilter({ sort: v })} />
            <div className="close-btn" onClick={hideFilter} style={{ display: section ? 'block' : 'none' }}>
              <Icon name="close" className="dark" />
            </div>
          </div>
        </nav>
      </ScaleUI>
      <ScaleUI className="cars-filter">{facetList()}</ScaleUI>
      <div className="cars-content" ref={contentRef} onScroll={onScroll}>
        {cars.length === 0 && !isLoading ? (
          <div className="empty-results">
            <div className="empty-results-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h2>No Cars Found</h2>
            <p>No cars match your current filter criteria. Try adjusting your filters or clearing them to see more results.</p>
          </div>
        ) : viewType === 'gallery' ? (
          <GalleryView cars={cars} onSelect={openDetails} />
        ) : (
          <ScaleUI className={gridClass} ref={gridRef}
            style={{ paddingTop: `${win.padTop || 0}px`, paddingBottom: `${win.padBottom || 0}px` }} key={gridKey}>
            {cars.slice(startIdx, endIdx).map((car, i) => renderItem(car, startIdx + i))}
          </ScaleUI>
        )}
      </div>
    </>
  );
}

function ItemInner({ car, viewType }) {
  return (
    <>
      {(car.rating || 0) > 0 && (
        <RatingStars className="rating-badge" rating={car.rating} filledOnly readonly />
      )}
      {viewType === 'gridxl' && (
        <div className="info-top"><div className="car-class">{car.class || ''}</div></div>
      )}
      <img className="preview" src={car.preview || 'no-preview.jpg'} alt="" />
      <div className="info">
        <div className="flag">
          <img src={flagUrl(car.country)} alt={`${car.countryName || car.country} flag`} />
        </div>
        <h2>{carDisplayName(car)}</h2>
      </div>
    </>
  );
}

function GalleryView({ cars }) {
  const [current, setCurrent] = useState(0);
  const car = cars[current] || cars[0];
  if (!car) return null;
  return (
    <ScaleUI className="gallery-view">
      <div className="gallery-selected">
        <img className="preview" src={car.preview} alt="" />
        <div className="info"><h2>{carDisplayName(car)}</h2></div>
      </div>
      <div className="gallery-footer">
        <div className="gallery-target"></div>
        <div className="gallery-items">
          <div className="gallery-scroller">
            {cars.map((c, i) => (
              <div className="car" key={c.path + '-' + i} onClick={() => setCurrent(i)}>
                <img className="preview" src={c.preview} alt="" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScaleUI>
  );
}
