// ============================================
// AssetFlow Validators — Zod schemas
// ============================================

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  head_id: z.string().uuid().nullable().optional(),
  parent_department_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  custom_fields: z.array(z.object({
    field_name: z.string().min(1),
    field_type: z.enum(['text', 'number', 'date']),
    unit: z.string().optional(),
  })).default([]),
});

export const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  category_id: z.string().uuid('Select a category'),
  serial_number: z.string().optional(),
  acquisition_date: z.string().optional(),
  acquisition_cost: z.number().positive().optional().nullable(),
  condition: z.enum(['new', 'good', 'fair', 'poor']).default('new'),
  location: z.string().optional(),
  department_id: z.string().uuid().nullable().optional(),
  is_bookable: z.boolean().default(false),
  custom_field_values: z.record(z.any()).default({}),
});

export const allocationSchema = z.object({
  asset_id: z.string().uuid('Select an asset'),
  to_user_id: z.string().uuid('Select an employee'),
  expected_return: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const transferSchema = z.object({
  asset_id: z.string().uuid(),
  from_holder_id: z.string().uuid(),
  to_holder_id: z.string().uuid('Select transfer recipient'),
  reason: z.string().min(1, 'Reason is required'),
});

export const bookingSchema = z.object({
  asset_id: z.string().uuid('Select a resource'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
});

export const maintenanceSchema = z.object({
  asset_id: z.string().uuid('Select an asset'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export const auditCycleSchema = z.object({
  name: z.string().min(1, 'Audit name is required'),
  scope_type: z.enum(['department', 'location']),
  scope_value: z.string().min(1, 'Scope value is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  auditor_ids: z.array(z.string().uuid()).min(1, 'Select at least one auditor'),
});
