// ============================================
// AssetFlow Maintenance Service — DevC
// Wraps maintenance_requests table and RPCs
// ============================================

import { supabase } from '../supabase';

/**
 * List maintenance requests with optional filters.
 * @param {Object} [filters]
 * @param {string} [filters.assetId]
 * @param {string} [filters.status]     - pending | approved | technician_assigned | in_progress | resolved | rejected
 * @param {string} [filters.requestedBy]
 * @returns {Promise<Array>}
 */
export async function listMaintenanceRequests(filters = {}) {
  const { assetId, status, requestedBy } = filters;

  let query = supabase.from('maintenance_requests').select(`
    *,
    asset:assets (id, name, asset_tag, location),
    requester:profiles!maintenance_requests_requested_by_fkey (id, full_name, email),
    approver:profiles!maintenance_requests_approved_by_fkey (id, full_name),
    technician:profiles!maintenance_requests_technician_id_fkey (id, full_name, email)
  `);

  if (assetId)     query = query.eq('asset_id', assetId);
  if (status)      query = query.eq('status', status);
  if (requestedBy) query = query.eq('requested_by', requestedBy);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Get a single maintenance request by ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getMaintenanceRequest(id) {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      asset:assets (id, name, asset_tag, location),
      requester:profiles!maintenance_requests_requested_by_fkey (id, full_name, email),
      approver:profiles!maintenance_requests_approved_by_fkey (id, full_name),
      technician:profiles!maintenance_requests_technician_id_fkey (id, full_name, email)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Raise a new maintenance request.
 * @param {Object} payload
 * @param {string} payload.assetId
 * @param {string} payload.description
 * @param {'low'|'medium'|'high'|'critical'} payload.priority
 * @param {string} [payload.photoUrl]
 * @returns {Promise<Object>}
 */
export async function createMaintenanceRequest({ assetId, description, priority, photoUrl }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('maintenance_requests')
    .insert({
      asset_id:     assetId,
      requested_by: session.user.id,
      description,
      priority,
      photo_url:    photoUrl || null,
      status:       'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Approve a maintenance request via RPC.
 * Sets status → 'approved' and marks asset 'under_maintenance'.
 * @param {string} requestId
 */
export async function approveMaintenance(requestId) {
  const { error } = await supabase.rpc('approve_maintenance', {
    p_request_id: requestId,
  });
  if (error) throw error;
}

/**
 * Reject a maintenance request (direct DB update — no RPC defined).
 * @param {string} requestId
 */
export async function rejectMaintenance(requestId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('maintenance_requests')
    .update({
      status:      'rejected',
      approved_by: session.user.id,
      approved_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Assign a technician to an approved maintenance request.
 * Moves status → 'technician_assigned'.
 * @param {string} requestId
 * @param {string} technicianId
 */
export async function assignTechnician(requestId, technicianId) {
  const { error } = await supabase
    .from('maintenance_requests')
    .update({
      technician_id: technicianId,
      status:        'technician_assigned',
      assigned_at:   new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Mark a maintenance request as in_progress.
 * @param {string} requestId
 */
export async function startMaintenance(requestId) {
  const { error } = await supabase
    .from('maintenance_requests')
    .update({
      status:     'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Resolve a maintenance request via RPC.
 * Sets status → 'resolved' and restores asset to 'available'.
 * @param {string} requestId
 * @param {string} resolutionNotes
 */
export async function resolveMaintenance(requestId, resolutionNotes) {
  const { error } = await supabase.rpc('resolve_maintenance', {
    p_request_id:       requestId,
    p_resolution_notes: resolutionNotes,
  });
  if (error) throw error;
}

/**
 * Upload maintenance photo and return public URL.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function uploadMaintenancePhoto(file) {
  const ext      = file.name.split('.').pop();
  const fileName = `maint_${Date.now()}.${ext}`;
  const path     = `maintenance/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('asset-photos')
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('asset-photos').getPublicUrl(path);
  return data.publicUrl;
}
