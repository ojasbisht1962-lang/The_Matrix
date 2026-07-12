// ============================================
// AssetFlow Allocations Service
// Wrapper for allocations list, allocate, return, and overdue allocations
// ============================================

import { supabase } from '../supabase';

/**
 * Fetch list of allocations with optional filters.
 * @param {Object} [filters]
 * @param {string} [filters.assetId]
 * @param {string} [filters.userId]
 * @param {boolean} [filters.isActive]
 * @returns {Promise<Array<Object>>}
 */
export async function listAllocations(filters = {}) {
  const { assetId, userId, isActive } = filters;

  let query = supabase.from('allocations').select(`
    *,
    asset:assets (id, name, asset_tag),
    holder:profiles!allocations_allocated_to_fkey (id, full_name, email),
    creator:profiles!allocations_allocated_by_fkey (id, full_name)
  `);

  if (assetId) {
    query = query.eq('asset_id', assetId);
  }
  if (userId) {
    query = query.eq('allocated_to', userId);
  }
  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  const { data, error } = await query.order('allocated_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Allocate an asset using the allocate_asset RPC.
 * @param {Object} params
 * @param {string} params.assetId
 * @param {string} params.toUserId
 * @param {string} [params.expectedReturn] - ISO date string YYYY-MM-DD
 * @param {string} [params.notes]
 * @returns {Promise<string>} allocationId
 */
export async function allocateAsset({ assetId, toUserId, expectedReturn, notes }) {
  const { data, error } = await supabase.rpc('allocate_asset', {
    p_asset_id: assetId,
    p_to_user_id: toUserId,
    p_expected_return: expectedReturn || null,
    p_notes: notes || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Return an allocated asset using the return_asset RPC.
 * @param {Object} params
 * @param {string} params.allocationId
 * @param {string} params.condition - 'new' | 'good' | 'fair' | 'poor'
 * @param {string} [params.notes]
 */
export async function returnAsset({ allocationId, condition, notes }) {
  const { error } = await supabase.rpc('return_asset', {
    p_allocation_id: allocationId,
    p_return_condition: condition,
    p_return_notes: notes || null,
  });

  if (error) throw error;
}

/**
 * Fetch all overdue allocations from overdue_allocations view.
 * @returns {Promise<Array<Object>>}
 */
export async function getOverdueAllocations() {
  const { data, error } = await supabase
    .from('overdue_allocations')
    .select('*')
    .order('expected_return', { ascending: true });

  if (error) throw error;
  return data;
}
