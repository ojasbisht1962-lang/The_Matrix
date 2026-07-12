// ============================================
// DepartmentForm — modal form for create/edit
// ============================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save } from 'lucide-react';
import { departmentSchema } from '../../lib/validators';
import styles from './modal.module.css';

/**
 * @param {{
 *   initial?: { id: string, name: string, head_id?: string, parent_department_id?: string, status: string }|null,
 *   departments: Array<{ id: string, name: string }>,
 *   onSave: (payload: object) => Promise<void>,
 *   onClose: () => void,
 * }} props
 */
export function DepartmentForm({ initial, departments, onSave, onClose }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initial?.name ?? '',
      head_id: initial?.head_id ?? '',
      parent_department_id: initial?.parent_department_id ?? '',
      status: initial?.status ?? 'active',
    },
  });

  async function onSubmit(data) {
    await onSave({
      ...data,
      head_id: data.head_id || null,
      parent_department_id: data.parent_department_id || null,
    });
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="dept-form-title">
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <h2 id="dept-form-title" className={styles.dialogTitle}>
            {initial ? 'Edit Department' : 'New Department'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="dept-name" className={styles.label}>Department name *</label>
            <input
              id="dept-name"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="e.g. Engineering"
              {...register('name')}
            />
            {errors.name && <p className={styles.errorMsg}>{errors.name.message}</p>}
          </div>

          {/* Parent department */}
          <div className={styles.field}>
            <label htmlFor="dept-parent" className={styles.label}>Parent department</label>
            <select id="dept-parent" className={styles.select} {...register('parent_department_id')}>
              <option value="">— None (top-level) —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className={styles.field}>
            <label htmlFor="dept-status" className={styles.label}>Status</label>
            <select id="dept-status" className={styles.select} {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
            <button id="dept-save-btn" type="submit" className={styles.btnSave} disabled={isSubmitting}>
              {isSubmitting ? '…' : <Save size={14} />}
              {isSubmitting ? 'Saving' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
