import React, { useCallback, useEffect, useRef, useState } from 'react';
import { favorites as favoritesApi } from '@/api/user/favorites';
import { useFooter } from '@/context/footer';
import { ScaleUI } from '@/context/scale';
import FavoriteItem from './FavoriteItem';
import DeleteFavoriteModal from './DeleteFavoriteModal';
import { layoutName } from './favoritesHelpers';

const EMPTY_MSG = 'No favorites saved yet. Expand the footer and use "Add To Favorites" to save your current racing configuration.';
const PAGE = 50;

// History > Favorites section - paged favorite list with infinite scroll
export default function Favorites({ scrollRef }) {
  const footer = useFooter();
  const [favorites, setFavorites] = useState([]);
  const [page, setPage] = useState({ start: 0, hasMore: true, loading: false });
  const [deleteTarget, setDeleteTarget] = useState(null); // {fav, index}
  const [status, setStatus] = useState(null); // 'loading' | 'empty' | 'error'
  const pageRef = useRef(page);
  pageRef.current = page;

  const loadMore = useCallback(() => {
    const p = pageRef.current;
    if (p.loading || !p.hasMore) return;
    setPage((prev) => ({ ...prev, loading: true }));
    favoritesApi.list(p.start, PAGE).then((res) => {
      const data = res.data || {};
      const batch = data.favorites || [];
      if (!batch.length) {
        setPage((prev) => ({ ...prev, loading: false, hasMore: false }));
        setStatus(p.start === 0 ? 'empty' : null);
        return;
      }
      setFavorites((prev) => {
        const next = prev.concat(batch);
        setPage({ start: next.length, hasMore: next.length < (data.total || 0), loading: false });
        setStatus(null);
        return next;
      });
    }).catch(() => {
      setPage((prev) => ({ ...prev, loading: false }));
      setStatus(p.start === 0 ? 'error' : null);
    });
  }, []);

  // Initial load on mount
  useEffect(() => {
    setStatus('loading');
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll on the shared .history-content container
  useEffect(() => {
    const el = scrollRef && scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.8) loadMore();
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, loadMore]);

  // Play: load the favorite's car/track/settings into the footer and launch
  const playFavorite = (index) => {
    const fav = favorites[index];
    if (!fav || !fav.carPath || !fav.trackPath) return;

    footer.selectCar({ id: fav.carId, name: fav.carName, path: fav.carPath }, fav.skinPath || null);
    if (fav.trackParentId) {
      footer.selectTrack(
        { id: fav.trackParentId, name: fav.parentTrackName, path: fav.trackPath },
        {
          id: fav.trackId, name: fav.trackName, layoutName: layoutName(fav),
          path: fav.trackPath, subPath: fav.trackSubPath
        });
    } else {
      footer.selectTrack({ id: fav.trackId, name: fav.trackName, path: fav.trackPath, subPath: fav.trackSubPath }, null);
    }

    let cfg = {};
    try { cfg = JSON.parse(fav.configJson) || {}; } catch { /* empty */ }
    const saved = { ...(cfg.settings || cfg) };
    const savedModes = saved.modes;
    delete saved.modes;
    footer.updateRaceSettings((prev) => {
      const next = { ...prev, ...saved };
      if (savedModes) {
        const modes = { ...(next.modes || {}) };
        Object.keys(savedModes).forEach((mode) => {
          modes[mode] = { ...modes[mode], ...savedModes[mode] };
        });
        next.modes = modes;
      }
      return next;
    });
    setTimeout(() => footer.play(), 50);
  };

  const deleteFavorite = () => {
    if (!deleteTarget) return;
    const { fav, index } = deleteTarget;
    favoritesApi.remove(fav.id).then(() => {
      setDeleteTarget(null);
      setFavorites((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        if (!next.length) setStatus('empty');
        return next;
      });
    }).catch(() => setDeleteTarget(null));
  };

  return (
    <>
      {status === 'loading' ? (
        <ScaleUI className="coming-soon"><p>Loading favorites...</p></ScaleUI>
      ) : status === 'empty' ? (
        <ScaleUI className="coming-soon"><p dangerouslySetInnerHTML={{ __html: EMPTY_MSG.replace('. Expand', '.<br/>Expand') }} /></ScaleUI>
      ) : status === 'error' ? (
        <ScaleUI className="coming-soon"><p>Failed to load favorites.</p></ScaleUI>
      ) : (
        <ScaleUI className="favorites-list">
          {favorites.map((fav, i) => (
            <FavoriteItem key={fav.id} fav={fav} index={i}
              controllers={footer.weatherControllers}
              onPlay={() => playFavorite(i)}
              onEdit={() => footer.openFavoriteEdit(fav)}
              onDelete={() => setDeleteTarget({ fav, index: i })} />
          ))}
        </ScaleUI>
      )}
      <DeleteFavoriteModal
        favorite={deleteTarget && deleteTarget.fav}
        onConfirm={deleteFavorite}
        onCancel={() => setDeleteTarget(null)} />
    </>
  );
}
