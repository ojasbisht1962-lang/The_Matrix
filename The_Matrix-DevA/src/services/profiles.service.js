// ============================================
// Profiles Service
// Employee directory + role management
// ============================================

import { supabase } from '../supabase';

/**
 * List all profiles (employee directory).
 * @param {{ departmentId?: string, role?: string, status?: string }} filters
 */
export async function listProfiles({ departmentId, role, status } = {}) {
  let query = supabase
    .from('profiles')
    .select(
      'id, full_name, email, role, department_id, avatar_url, status, created_at, departments:department_id(id, name)'
    )
    .order('full_name');

  if (departmentId) query = query.eq('department_id', departmentId);
  if (role)         query = query.eq('role', role);
  if (status)       query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get a single profile.
 * @param {string} id
 */
export async function getProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, role, department_id, avatar_url, status, departments:department_id(id, name)'
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Admin: update a user's role.
 * Frontend-only guard — the real guard is DB RLS (only admin can write role).
 * @param {string} userId
 * @param {'employee'|'department_head'|'asset_manager'|'admin'} newRole
 */
export async function updateUserRole(userId, newRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, full_name, role')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Admin: assign a user to a department.
 * @param {string} userId
 * @param {string|null} departmentId
 */
export async function assignDepartment(userId, departmentId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ department_id: departmentId, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, full_name, department_id')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Deactivate a profile.
 * @param {string} userId
 */
export async function deactivateProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, status')
    .single();
  if (error) throw error;
  return data;
}
