// ============================================
// AssetFlow Auth Service
// Wraps Supabase auth + profile DB calls
// All functions throw on error (caller handles)
// ============================================

import { supabase } from '../supabase';

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * Fetch a user's profile row from public.profiles.
 * @param {string} userId
 * @returns {Promise<import('../stores/authStore').Profile|null>}
 */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, role, department_id, avatar_url, status'
    )
    .eq('id', userId)
    .single();

  if (error) {
    // Profile row may not exist yet if trigger is slow
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Update a profile row.
 * @param {string} userId
 * @param {Partial<import('../stores/authStore').Profile>} patch
 */
export async function updateProfile(userId, patch) {
  // Disallow role elevation via frontend
  const { role: _stripped, ...safePatch } = patch;
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...safePatch, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, full_name, email, role, department_id, avatar_url, status')
    .single();

  if (error) throw error;
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Sign up with email + password. Returns { user, session }.
 * Supabase trigger creates profile row automatically.
 * @param {string} email
 * @param {string} password
 * @param {{ full_name: string }} metadata
 */
export async function signUp(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign in with email + password.
 * @param {string} email
 * @param {string} password
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Send password reset email.
 * @param {string} email
 */
export async function forgotPassword(email) {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/reset-password`
      : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
}

/**
 * Update password after reset flow.
 * @param {string} newPassword
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Sign out and clear local session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Upload avatar to Supabase Storage and update profile.
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<string>} public URL
 */
export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `avatars/${userId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('asset-photos')
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('asset-photos').getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  await updateProfile(userId, { avatar_url: avatarUrl });
  return avatarUrl;
}
