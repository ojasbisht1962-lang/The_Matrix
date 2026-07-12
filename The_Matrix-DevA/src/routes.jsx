// ============================================
// AssetFlow Route Config — Developer A routes
// Additive pattern: DevB will append their routes
// ============================================

import { lazy } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGate } from './components/auth/RoleGate';
import { Navigate } from 'react-router-dom';

// ── Lazy-loaded pages ─────────────────────────────────────────
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage         = lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OrgSetupPage       = lazy(() => import('./pages/org-setup/OrgSetupPage'));

// ── Placeholder for DevB's dashboard (avoids broken routes) ───
const DashboardPlaceholder = () => (
  <div style={{
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#080b12',
    color: '#94a3b8',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '0.9375rem',
  }}>
    Dashboard — coming in DevB branch
  </div>
);

/**
 * Route configuration array for use with createBrowserRouter.
 * DevB should append their routes to this array.
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
        path: '/dashboard',
        element: <DashboardPlaceholder />,
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
