// ============================================
// AssetFlow Transfers Service
// Handles transfer request listing, creation, approval, and rejection
// ============================================

import { supabase } from '../supabase';

/**
 * List transfer requests with optional filters.
 * @param {Object} [filters]
 * @param {string} [filters.status] - 'requested' | 'approved' | 'rejected' | 'completed'
 * @param {string} [filters.assetId]
 * @returns {Promise<Array<Object>>}
 */
export async function listTransfers(filters = {}) {
  const { status, assetId } = filters;

  let query = supabase.from('transfer_requests').select(`
    *,
    asset:assets (id, name, asset_tag),
    from_holder:profiles!transfer_requests_from_holder_id_fkey (id, full_name, email),
    to_holder:profiles!transfer_requests_to_holder_id_fkey (id, full_name, email),
    requester:profiles!transfer_requests_requested_by_fkey (id, full_name)
  `);

  if (status) {
    query = query.eq('status', status);
  }
  if (assetId) {
    query = query.eq('asset_id', assetId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Request an asset transfer.
 * @param {Object} params
 * @param {string} params.assetId
 * @param {string} params.toUserId
 * @param {string} [params.reason]
 * @returns {Promise<Object>} transferRequest
 */
export async function requestTransfer({ assetId, toUserId, reason }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  // Find the active allocation to discover who is the from_holder_id
  const { data: allocations, error: allocError } = await supabase
    .from('allocations')
    .select('allocated_to')
    .eq('asset_id', assetId)
    .eq('is_active', true)
    .maybeSingle();

  if (allocError) throw allocError;
  if (!allocations) throw new Error('Asset is not currently allocated to anyone.');

  const fromHolderId = allocations.allocated_to;

  const { data, error } = await supabase
    .from('transfer_requests')
    .insert({
      asset_id: assetId,
      from_holder_id: fromHolderId,
      to_holder_id: toUserId,
      requested_by: session.user.id,
      reason: reason || null,
      status: 'requested',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Approve a transfer request using the approve_transfer RPC.
 * @param {string} transferRequestId
 */
export async function approveTransfer(transferRequestId) {
  const { error } = await supabase.rpc('approve_transfer', {
    p_transfer_id: transferRequestId,
  });

  if (error) throw error;
}

/**
 * Reject a transfer request.
 * @param {string} transferRequestId
 */
export async function rejectTransfer(transferRequestId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('transfer_requests')
    .update({
      status: 'rejected',
      approved_by: session.user.id, // Set as the one who handled it
      updated_at: new Date().toISOString(),
    })
    .eq('id', transferRequestId);

  if (error) throw error;
}
