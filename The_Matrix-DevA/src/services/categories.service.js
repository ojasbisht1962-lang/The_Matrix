// ============================================
// Categories Service
// CRUD for asset_categories table
// ============================================

import { supabase } from '../supabase';

/**
 * List all categories.
 */
export async function listCategories() {
  const { data, error } = await supabase
    .from('asset_categories')
    .select('id, name, description, custom_fields, created_at')
    .order('name');
  if (error) throw error;
  return data;
}

/**
 * Fetch a single category.
 * @param {string} id
 */
export async function getCategory(id) {
  const { data, error } = await supabase
    .from('asset_categories')
    .select('id, name, description, custom_fields')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a category.
 * @param {{ name: string, description?: string, custom_fields?: Array }} payload
 */
export async function createCategory(payload) {
  const { data, error } = await supabase
    .from('asset_categories')
    .insert(payload)
    .select('id, name, description, custom_fields')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update a category.
 * @param {string} id
 * @param {Partial<{ name: string, description: string, custom_fields: Array }>} patch
 */
export async function updateCategory(id, patch) {
  const { data, error } = await supabase
    .from('asset_categories')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name, description, custom_fields')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a category.
 * Will be blocked by DB if assets reference this category (RESTRICT FK).
 * @param {string} id
 */
export async function deleteCategory(id) {
  const { error } = await supabase.from('asset_categories').delete().eq('id', id);
  if (error) throw error;
}
