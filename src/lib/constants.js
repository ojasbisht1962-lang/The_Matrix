// ============================================
// AssetFlow Constants
// Enum values, status labels, color mappings
// ============================================

export const ROLES = {
  EMPLOYEE: 'employee',
  DEPARTMENT_HEAD: 'department_head',
  ASSET_MANAGER: 'asset_manager',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  employee: 'Employee',
  department_head: 'Department Head',
  asset_manager: 'Asset Manager',
  admin: 'Admin',
};

export const ASSET_STATUSES = {
  AVAILABLE: 'available',
  ALLOCATED: 'allocated',
  RESERVED: 'reserved',
  UNDER_MAINTENANCE: 'under_maintenance',
  LOST: 'lost',
  RETIRED: 'retired',
  DISPOSED: 'disposed',
};

export const ASSET_STATUS_LABELS = {
  available: 'Available',
  allocated: 'Allocated',
  reserved: 'Reserved',
  under_maintenance: 'Under Maintenance',
  lost: 'Lost',
  retired: 'Retired',
  disposed: 'Disposed',
};

export const TRANSFER_STATUSES = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};

export const BOOKING_STATUSES = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const MAINTENANCE_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  TECHNICIAN_ASSIGNED: 'technician_assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
};

export const MAINTENANCE_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  technician_assigned: 'Technician Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export const MAINTENANCE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const AUDIT_ITEM_STATUSES = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  MISSING: 'missing',
  DAMAGED: 'damaged',
};

export const AUDIT_CYCLE_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
};

export const ENTITY_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor'];

// Color mapping for status badges
export const STATUS_COLORS = {
  // Asset statuses
  available: 'success',
  allocated: 'info',
  reserved: 'warning',
  under_maintenance: 'warning',
  lost: 'danger',
  retired: 'neutral',
  disposed: 'neutral',

  // Transfer statuses
  requested: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'info',

  // Booking statuses
  upcoming: 'info',
  ongoing: 'success',
  cancelled: 'danger',

  // Maintenance statuses
  pending: 'warning',
  technician_assigned: 'info',
  in_progress: 'info',
  resolved: 'success',

  // Audit item statuses
  verified: 'success',
  missing: 'danger',
  damaged: 'warning',

  // Entity statuses
  active: 'success',
  inactive: 'neutral',
};

// Priority colors
export const PRIORITY_COLORS = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

// Notification type labels
export const NOTIFICATION_TYPE_LABELS = {
  asset_assigned: 'Asset Assigned',
  maintenance_approved: 'Maintenance Approved',
  maintenance_rejected: 'Maintenance Rejected',
  booking_confirmed: 'Booking Confirmed',
  booking_cancelled: 'Booking Cancelled',
  booking_reminder: 'Booking Reminder',
  transfer_approved: 'Transfer Approved',
  transfer_rejected: 'Transfer Rejected',
  overdue_return_alert: 'Overdue Return',
  audit_discrepancy_flagged: 'Audit Discrepancy',
  role_changed: 'Role Changed',
};
