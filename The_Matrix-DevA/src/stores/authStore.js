// ============================================
// AssetFlow Auth Store (Zustand v5)
// Single source of truth for auth + profile state
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} full_name
 * @property {string} email
 * @property {'employee'|'department_head'|'asset_manager'|'admin'} role
 * @property {string|null} department_id
 * @property {string|null} avatar_url
 * @property {string} status
 */

const initialState = {
  /** @type {import('@supabase/supabase-js').Session|null} */
  session: null,
  /** @type {Profile|null} */
  profile: null,
  /** true while waiting for onAuthStateChange to fire on mount */
  isInitializing: true,
  isLoading: false,
  /** @type {string|null} */
  error: null,
};

export const useAuthStore = create(
  persist(
    (set) => ({
      ...initialState,

      // ── Setters ──────────────────────────────────────────────
      setSession: (session) => set({ session }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setInitializing: (isInitializing) => set({ isInitializing }),

      // ── Full reset on sign-out ────────────────────────────────
      reset: () =>
        set({
          session: null,
          profile: null,
          isInitializing: false,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'assetflow-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist session; profile is re-fetched on each mount
      partialize: (state) => ({ session: state.session }),
    }
  )
);

// ── Selector helpers (stable references, no re-render on unrelated changes) ──
export const selectSession = (s) => s.session;
export const selectProfile = (s) => s.profile;
export const selectRole = (s) => s.profile?.role ?? null;
export const selectIsInitializing = (s) => s.isInitializing;
export const selectIsLoading = (s) => s.isLoading;
export const selectError = (s) => s.error;
export const selectIsAuthenticated = (s) => !!s.session;
