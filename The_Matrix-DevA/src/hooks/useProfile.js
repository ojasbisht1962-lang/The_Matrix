// ============================================
// useProfile — profile CRUD helpers on top of
// authStore + auth.service
// ============================================

import { useCallback } from 'react';
import { useAuthStore, selectProfile } from '../stores/authStore';
import { updateProfile as updateProfileService } from '../services/auth.service';

/**
 * Returns the current profile and a mutate helper.
 * updateProfile(patch) → optimistic update + server sync.
 */
export function useProfile() {
  const profile = useAuthStore(selectProfile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setError = useAuthStore((s) => s.setError);
  const setLoading = useAuthStore((s) => s.setLoading);

  const updateProfile = useCallback(
    async (patch) => {
      if (!profile?.id) return;
      // Optimistic update
      setProfile({ ...profile, ...patch });
      setLoading(true);
      setError(null);
      try {
        const updated = await updateProfileService(profile.id, patch);
        setProfile(updated);
      } catch (err) {
        // Rollback
        setProfile(profile);
        setError(err.message ?? 'Failed to update profile');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [profile, setProfile, setError, setLoading]
  );

  return { profile, updateProfile };
}
