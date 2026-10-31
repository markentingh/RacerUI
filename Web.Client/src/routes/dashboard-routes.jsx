import { lazy } from 'react';

const routes = [
  { path: '/dashboard',                    Element: lazy(() => import('@/app/game/page')) },
  { path: '/dashboard/game',               Element: lazy(() => import('@/app/game/page')) },
  { path: '/dashboard/cars/:section?',     Element: lazy(() => import('@/app/cars/page')) },
  { path: '/dashboard/tracks/:section?',   Element: lazy(() => import('@/app/tracks/page')) },
  { path: '/dashboard/history/:section?',  Element: lazy(() => import('@/app/history/page')) },
  { path: '/dashboard/settings',           Element: lazy(() => import('@/app/settings/page')) },
  { path: '/dashboard/profile',            Element: lazy(() => import('@/app/profile/page')) },
  { path: '/dashboard/*',                  Element: lazy(() => import('@/app/notfound/page')) }
];

export default routes;
