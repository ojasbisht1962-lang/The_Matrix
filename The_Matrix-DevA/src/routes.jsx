// ============================================
// AssetFlow Route Config — DevB Updated
// Integrates AppShell layout and maps all routes
// ============================================

import { lazy } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGate } from './components/auth/RoleGate';
import { Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

// ── Lazy-loaded pages ─────────────────────────────────────────
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage         = lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OrgSetupPage       = lazy(() => import('./pages/org-setup/OrgSetupPage'));

// DevB Pages
const DashboardPage      = lazy(() => import('./pages/dashboard/DashboardPage'));
const AssetsPage         = lazy(() => import('./pages/assets/AssetsPage'));
const AssetDetailPage    = lazy(() => import('./pages/assets/AssetDetailPage'));
const AllocationPage     = lazy(() => import('./pages/allocation/AllocationPage'));

// DevC Pages (Stubs/Placeholders initially)
const BookingsPage       = lazy(() => import('./pages/bookings/BookingsPage'));
const MaintenancePage    = lazy(() => import('./pages/maintenance/MaintenancePage'));

// DevD Pages (Stubs/Placeholders initially)
const AuditPage          = lazy(() => import('./pages/audit/AuditPage'));
const ReportsPage        = lazy(() => import('./pages/reports/ReportsPage'));
const ActivityLogsPage   = lazy(() => import('./pages/activity/ActivityLogsPage'));
const NotificationsPage  = lazy(() => import('./pages/activity/NotificationsPage'));

/**
 * Route configuration array for use with createBrowserRouter.
 */
export const routes = [
  // ── Public (auth) routes ──────────────────────────────────
  {
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/signup',
    element: <SignupPage />,
  },
  {
    path: '/auth/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // ── Protected routes (authenticated users) ────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/assets',
            element: <AssetsPage />,
          },
          {
            path: '/assets/:id',
            element: <AssetDetailPage />,
          },
          {
            path: '/allocation',
            element: <AllocationPage />,
          },
          {
            path: '/bookings',
            element: <BookingsPage />,
          },
          {
            path: '/maintenance',
            element: <MaintenancePage />,
          },
          {
            path: '/audit',
            element: (
              <RoleGate requiredRole="asset_manager">
                <AuditPage />
              </RoleGate>
            ),
          },
          {
            path: '/reports',
            element: (
              <RoleGate requiredRole="asset_manager">
                <ReportsPage />
              </RoleGate>
            ),
          },
          {
            path: '/activity',
            element: (
              <RoleGate requiredRole="asset_manager">
                <ActivityLogsPage />
              </RoleGate>
            ),
          },
          {
            path: '/notifications',
            element: <NotificationsPage />,
          },
          // Admin-only: Org Setup
          {
            path: '/org-setup',
            element: (
              <RoleGate
                requiredRole="admin"
                fallback={<Navigate to="/dashboard" replace />}
              >
                <OrgSetupPage />
              </RoleGate>
            ),
          },
        ],
      },
    ],
  },

  // ── Root redirect ─────────────────────────────────────────
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },

  // ── 404 fallback ──────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
];
