// ============================================
// AssetFlow Bookings Service — DevC
// Wraps bookings table and book_resource RPC
// ============================================

import { supabase } from '../supabase';

/**
 * List bookings with optional filters.
 * @param {Object} [filters]
 * @param {string} [filters.assetId]
 * @param {string} [filters.userId]        - Filter by booked_by
 * @param {string} [filters.status]        - 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
 * @returns {Promise<Array>}
 */
export async function listBookings(filters = {}) {
  const { assetId, userId, status } = filters;

  let query = supabase.from('bookings').select(`
    *,
    asset:assets (id, name, asset_tag, location),
    booker:profiles!bookings_booked_by_fkey (id, full_name, email)
  `);

  if (assetId) query = query.eq('asset_id', assetId);
  if (userId)  query = query.eq('booked_by', userId);
  if (status)  query = query.eq('status', status);

  const { data, error } = await query.order('start_time', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Get a single booking by ID.
 * @param {string} id
 */
export async function getBooking(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      asset:assets (id, name, asset_tag, location, is_bookable),
      booker:profiles!bookings_booked_by_fkey (id, full_name, email)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Book a resource using the book_resource RPC.
 * The RPC enforces:
 *  - asset must be is_bookable = true
 *  - no overlapping bookings (btree_gist exclusion constraint)
 * @param {Object} params
 * @param {string} params.assetId
 * @param {string} params.startTime  - ISO datetime string
 * @param {string} params.endTime    - ISO datetime string
 * @param {string} [params.notes]
 * @returns {Promise<string>} bookingId
 */
export async function bookResource({ assetId, startTime, endTime, notes }) {
  const { data, error } = await supabase.rpc('book_resource', {
    p_asset_id:   assetId,
    p_start_time: startTime,
    p_end_time:   endTime,
    p_notes:      notes || null,
  });

  if (error) {
    // Convert Postgres overlap error into a human-friendly message
    if (
      error.message?.includes('overlap') ||
      error.code === '23P01' ||
      error.message?.includes('exclusion')
    ) {
      throw new Error(
        'This time slot overlaps with an existing booking. Please choose a different time window.'
      );
    }
    throw error;
  }
  return data; // returns UUID of new booking
}

/**
 * Cancel a booking.
 * @param {string} bookingId
 */
export async function cancelBooking(bookingId) {
  const { error } = await supabase
    .from('bookings')
    .update({
      status:       'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) throw error;
}

/**
 * Fetch all bookable assets (is_bookable = true, status = 'available').
 * @returns {Promise<Array>}
 */
export async function listBookableAssets() {
  const { data, error } = await supabase
    .from('assets')
    .select('id, name, asset_tag, location, category_id')
    .eq('is_bookable', true)
    .in('status', ['available', 'reserved']) // reserved = already has a booking but still listable
    .order('name');

  if (error) throw error;
  return data;
}

/**
 * Get existing bookings for a specific asset (used to show conflict hints in UI).
 * @param {string} assetId
 * @returns {Promise<Array>}
 */
export async function getAssetBookings(assetId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, start_time, end_time, status')
    .eq('asset_id', assetId)
    .in('status', ['upcoming', 'ongoing'])
    .order('start_time');

  if (error) throw error;
  return data;
}
