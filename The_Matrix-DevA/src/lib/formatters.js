// ============================================
// AssetFlow Formatters
// Date, currency, status formatting utilities
// ============================================

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format ISO date string to readable format
 */
export function formatDate(dateStr, fmt = 'MMM dd, yyyy') {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return isValid(date) ? format(date, fmt) : '—';
}

/**
 * Format ISO datetime to readable format
 */
export function formatDateTime(dateStr) {
  return formatDate(dateStr, 'MMM dd, yyyy HH:mm');
}

/**
 * Relative time (e.g., "3 hours ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : '—';
}

/**
 * Format currency (for reports only, not accounting)
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Capitalize first letter, replace underscores with spaces
 */
export function formatStatus(status) {
  if (!status) return '—';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}
