// ============================================
// Notifications Service
// Manages notification read/write queries
// ============================================

import { supabase } from '../supabase';

/**
 * List all notifications for the authenticated user.
 */
export async function listNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, message, reference_id, reference_type, is_read, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Mark a single notification as read.
 * @param {string} id
 */
export async function markAsRead(id) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications for the specified user as read.
 * @param {string} userId
 */
export async function markAllAsRead(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Delete a notification.
 * @param {string} id
 */
export async function deleteNotification(id) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
