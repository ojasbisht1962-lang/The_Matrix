// ============================================
// Activity Logs Service
// Fetches audit trial events from the database
// ============================================

import { supabase } from '../supabase';

/**
 * List activity logs with pagination.
 * @param {{ limit?: number, offset?: number }} options
 */
export async function listActivityLogs({ limit = 50, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      id,
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at,
      profiles:actor_id (full_name, email)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}
