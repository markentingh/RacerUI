import { lazy } from 'react';

const routes = [
  { path: '/',       Element: lazy(() => import('@/app/login/page')) },
  { path: '/login',  Element: lazy(() => import('@/app/login/page')) }
];

export default routes;
