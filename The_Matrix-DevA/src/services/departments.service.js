// ============================================
// Departments Service
// CRUD + hierarchy for departments table
// ============================================

import { supabase } from '../supabase';

/**
 * List all departments.
 * @returns {Promise<Array>}
 */
export async function listDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, status, parent_department_id, head_id, created_at')
    .order('name');
  if (error) throw error;
  return data;
}

/**
 * Fetch a single department with head profile.
 * @param {string} id
 */
export async function getDepartment(id) {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, status, parent_department_id, head_id, profiles:head_id(id, full_name, email, avatar_url)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a department.
 * @param {{ name: string, head_id?: string|null, parent_department_id?: string|null, status?: string }} payload
 */
export async function createDepartment(payload) {
  const { data, error } = await supabase
    .from('departments')
    .insert(payload)
    .select('id, name, status, parent_department_id, head_id')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update a department.
 * @param {string} id
 * @param {Partial<{ name: string, head_id: string|null, parent_department_id: string|null, status: string }>} patch
 */
export async function updateDepartment(id, patch) {
  const { data, error } = await supabase
    .from('departments')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, status, parent_department_id, head_id')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Soft-delete (deactivate) a department.
 * @param {string} id
 */
export async function deactivateDepartment(id) {
  return updateDepartment(id, { status: 'inactive' });
}

/**
 * Hard-delete a department (admin only, cascades to profiles.department_id = NULL via DB).
 * @param {string} id
 */
export async function deleteDepartment(id) {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;
}
