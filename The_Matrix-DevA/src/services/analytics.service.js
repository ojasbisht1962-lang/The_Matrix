// ============================================
// Analytics Service
// Wraps the database functions for reports and KPIs
// ============================================

import { supabase } from '../supabase';

/**
 * Get utilization status (available, allocated, under_maintenance) grouped by department.
 */
export async function getUtilizationByDepartment() {
  const { data, error } = await supabase.rpc('get_utilization_by_department');
  if (error) throw error;
  return data;
}

/**
 * Get count of maintenance requests grouped by category or asset name.
 * @param {'category' | 'asset'} groupBy
 */
export async function getMaintenanceFrequency(groupBy = 'category') {
  const { data, error } = await supabase.rpc('get_maintenance_frequency', {
    group_by: groupBy
  });
  if (error) throw error;
  return data;
}

/**
 * Get list of the most booked assets.
 * @param {number} limit
 */
export async function getMostUsedAssets(limit = 10) {
  const { data, error } = await supabase.rpc('get_most_used_assets', {
    result_limit: limit
  });
  if (error) throw error;
  return data;
}

/**
 * Get assets that have not been allocated or booked for a given number of days.
 * @param {number} days
 */
export async function getIdleAssets(days = 30) {
  const { data, error } = await supabase.rpc('get_idle_assets', {
    days: days
  });
  if (error) throw error;
  return data;
}

/**
 * Get heatmap data (day of week, hour of day) of bookings.
 */
export async function getBookingHeatmap() {
  const { data, error } = await supabase.rpc('get_booking_heatmap');
  if (error) throw error;
  return data;
}

/**
 * Get allocation summary by department.
 */
export async function getDepartmentAllocationSummary() {
  const { data, error } = await supabase.rpc('get_department_allocation_summary');
  if (error) throw error;
  return data;
}
