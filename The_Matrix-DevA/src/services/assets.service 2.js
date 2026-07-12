// ============================================
// AssetFlow Assets Service
// Wrapper for assets CRUD, enrichment view queries, photo upload
// ============================================

import { supabase } from '../supabase';

/**
 * Fetch list of assets from the assets_enriched view with optional filters.
 * @param {Object} filters
 * @param {string} [filters.status]
 * @param {string} [filters.categoryId]
 * @param {string} [filters.departmentId]
 * @param {string} [filters.search]
 * @returns {Promise<Array<Object>>}
 */
export async function listAssets(filters = {}) {
  const { status, categoryId, departmentId, search } = filters;

  let query = supabase.from('assets_enriched').select('*');

  if (status) {
    query = query.eq('status', status);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }
  if (search) {
    // Search across name, asset_tag, serial_number, current_holder_name
    query = query.or(
      `name.ilike.%${search}%,asset_tag.ilike.%${search}%,serial_number.ilike.%${search}%,current_holder_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch a single asset with full enriched data by its ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getAsset(id) {
  const { data, error } = await supabase
    .from('assets_enriched')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new asset row in assets table.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createAsset(data) {
  // Get active session user to populate registered_by
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data: asset, error } = await supabase
    .from('assets')
    .insert({
      ...data,
      registered_by: session.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return asset;
}

/**
 * Update an existing asset row.
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function updateAsset(id, data) {
  const { data: asset, error } = await supabase
    .from('assets')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return asset;
}

/**
 * Delete an asset.
 * @param {string} id
 */
export async function deleteAsset(id) {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Upload an asset photo to the 'asset-photos' storage bucket and return the public URL.
 * @param {File} file
 * @returns {Promise<string>} publicUrl
 */
export async function uploadAssetPhoto(file) {
  const ext = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${ext}`;
  const path = `assets/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('asset-photos')
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('asset-photos').getPublicUrl(path);
  return data.publicUrl;
}
