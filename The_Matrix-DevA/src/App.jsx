// ============================================
// App.jsx — Root component
// Bootstraps auth listener, router, toaster
// ============================================

import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthBootstrap } from './hooks/useAuth';
import { routes } from './routes';

const router = createBrowserRouter(routes);

function AppCore() {
  // Wire Supabase auth listener once at the root
  useAuthBootstrap();

  return (
    <>
      <Suspense fallback={<PageSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f1f5f9',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      />
    </>
  );
}

function PageSpinner() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080b12',
      }}
      aria-label="Loading…"
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(255,255,255,0.08)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default AppCore;
