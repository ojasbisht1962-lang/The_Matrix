// ============================================
// useAuth — bootstraps Supabase auth listener,
// syncs session/profile into authStore
// ============================================

import { useEffect } from 'react';
import { supabase } from '../supabase';
import {
  useAuthStore,
  selectSession,
  selectProfile,
  selectIsInitializing,
  selectIsAuthenticated,
  selectRole,
  selectError,
  selectIsLoading,
} from '../stores/authStore';
import { fetchProfile } from '../services/auth.service';

/**
 * Must be mounted once near the app root (in App.jsx).
 * Sets up onAuthStateChange and hydrates profile.
 */
export function useAuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitializing = useAuthStore((s) => s.setInitializing);
  const reset = useAuthStore((s) => s.reset);

  useEffect(() => {
    let mounted = true;

    async function handleSession(session) {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) setProfile(profile);
      } else {
        setProfile(null);
      }
      if (mounted) setInitializing(false);
    }

    // Fire once for initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Subscribe to future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        reset();
      } else {
        handleSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Consumer hook — returns all auth state slices.
 * Use individual selectors for perf where possible.
 */
export function useAuth() {
  const session = useAuthStore(selectSession);
  const profile = useAuthStore(selectProfile);
  const isInitializing = useAuthStore(selectIsInitializing);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const role = useAuthStore(selectRole);
  const error = useAuthStore(selectError);
  const isLoading = useAuthStore(selectIsLoading);

  return {
    session,
    profile,
    isInitializing,
    isAuthenticated,
    role,
    error,
    isLoading,
  };
}
