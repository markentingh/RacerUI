import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from '@/context/session';
import appRoutes from './app-routes';
import dashboardRoutes from './dashboard-routes';
const RootLayout = lazy(() => import('@/app/layout'));
const DashboardLayout = lazy(() => import('@/app/dashboard-layout'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, isReady } = useSession();
  if (!isReady) return null;
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

const RouteElement = ({ path, Element, layout: Layout }) => {
  if (!Element) return null;
  const isDashboard = path.startsWith('/dashboard');
  const WrappedElement = isDashboard
    ? () => (
        <ProtectedRoute>
          <Element />
        </ProtectedRoute>
      )
    : Element;

  return (
    <Route
      key={path}
      path={path}
      element={
        <Suspense fallback={<div className="init"></div>}>
          <Layout>
            <WrappedElement />
          </Layout>
        </Suspense>
      }
    />
  );
};

export default function Routing() {
  return (
    <Routes>
      {appRoutes.map((route) => RouteElement({ ...route, layout: RootLayout }))}
      {dashboardRoutes.map((route) => RouteElement({ ...route, layout: DashboardLayout }))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
