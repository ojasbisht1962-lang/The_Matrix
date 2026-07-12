// ============================================
// ProtectedRoute — redirects unauthenticated users
// Usage: <ProtectedRoute /> wraps <Route> children
// ============================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * @param {{ redirectTo?: string }} props
 */
export function ProtectedRoute({ redirectTo = '/auth/login' }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // Hold render until Supabase resolves the session on mount
  if (isInitializing) {
    return <AuthSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to={redirectTo} state={{ from: location }} replace />
    );
  }

  return <Outlet />;
}

function AuthSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        background: 'var(--color-bg, #0f1117)',
      }}
      aria-label="Authenticating…"
    >
      <span
        style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(255,255,255,.12)',
          borderTopColor: 'var(--color-primary, #6366f1)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
