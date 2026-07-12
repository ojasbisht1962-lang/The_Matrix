// ============================================
// Audits Service
// Manages audit cycles, items, and assignments
// ============================================

import { supabase } from '../supabase';

/**
 * List all audit cycles.
 */
export async function listAuditCycles() {
  const { data, error } = await supabase
    .from('audit_cycles')
    .select(`
      id,
      name,
      scope_type,
      scope_value,
      start_date,
      end_date,
      status,
      closed_at,
      created_at,
      created_by,
      profiles:created_by (full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch a single audit cycle.
 */
export async function getAuditCycle(id) {
  const { data, error } = await supabase
    .from('audit_cycles')
    .select(`
      id,
      name,
      scope_type,
      scope_value,
      start_date,
      end_date,
      status,
      closed_at,
      created_at,
      created_by
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch audit items for a cycle.
 */
export async function getAuditItems(cycleId) {
  const { data, error } = await supabase
    .from('audit_items')
    .select(`
      id,
      audit_cycle_id,
      asset_id,
      auditor_id,
      status,
      notes,
      verified_at,
      assets (id, asset_tag, name, status, location, condition),
      profiles:auditor_id (full_name)
    `)
    .eq('audit_cycle_id', cycleId);

  if (error) throw error;
  return data;
}

/**
 * Fetch audit assignments for a cycle.
 */
export async function getAuditAssignments(cycleId) {
  const { data, error } = await supabase
    .from('audit_assignments')
    .select(`
      id,
      audit_cycle_id,
      auditor_id,
      assigned_at,
      profiles:auditor_id (id, full_name, email)
    `)
    .eq('audit_cycle_id', cycleId);
  if (error) throw error;
  return data;
}

/**
 * Create a new audit cycle.
 * Calls RPC `create_audit_cycle`
 */
export async function createAuditCycle(payload) {
  // payload: { name, scope_type, scope_value, start_date, end_date, auditor_ids }
  const { data, error } = await supabase.rpc('create_audit_cycle', {
    p_name: payload.name,
    p_scope_type: payload.scope_type,
    p_scope_value: payload.scope_value,
    p_start_date: payload.start_date,
    p_end_date: payload.end_date,
    p_auditor_ids: payload.auditor_ids
  });
  if (error) throw error;
  return data;
}

/**
 * Close an audit cycle.
 * Calls RPC `close_audit_cycle`
 */
export async function closeAuditCycle(cycleId) {
  const { data, error } = await supabase.rpc('close_audit_cycle', {
    p_cycle_id: cycleId
  });
  if (error) throw error;
  return data; // returns discrepancy_count
}

/**
 * Update a specific audit item (verify it)
 */
export async function updateAuditItem(itemId, patch) {
  // patch contains status, notes, auditor_id (usually auth.uid())
  const { data, error } = await supabase
    .from('audit_items')
    .update({
      ...patch,
      verified_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
