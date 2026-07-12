// ============================================
// CategoryForm — modal form for create/edit
// Supports dynamic custom_fields array
// ============================================

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { categorySchema } from '../../lib/validators';
import styles from './modal.module.css';

/**
 * @param {{
 *   initial?: { id: string, name: string, description?: string, custom_fields?: Array }|null,
 *   onSave: (payload: object) => Promise<void>,
 *   onClose: () => void,
 * }} props
 */
export function CategoryForm({ initial, onSave, onClose }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      custom_fields: initial?.custom_fields ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'custom_fields' });

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="cat-form-title">
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <h2 id="cat-form-title" className={styles.dialogTitle}>
            {initial ? 'Edit Category' : 'New Category'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className={styles.form} noValidate>
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="cat-name" className={styles.label}>Category name *</label>
            <input
              id="cat-name"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="e.g. Laptops"
              {...register('name')}
            />
            {errors.name && <p className={styles.errorMsg}>{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label htmlFor="cat-desc" className={styles.label}>Description</label>
            <textarea
              id="cat-desc"
              className={styles.textarea}
              placeholder="Optional description…"
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Custom fields */}
          <div className={styles.field}>
            <span className={styles.label}>Custom fields</span>
            <div className={styles.cfList}>
              {fields.map((field, index) => (
                <div key={field.id} className={styles.cfRow}>
                  <input
                    className={styles.input}
                    placeholder="Field name"
                    {...register(`custom_fields.${index}.field_name`)}
                  />
                  <select className={styles.select} {...register(`custom_fields.${index}.field_type`)}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                  </select>
                  <button
                    type="button"
                    className={styles.cfRemoveBtn}
                    onClick={() => remove(index)}
                    aria-label="Remove field"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={styles.cfAddBtn}
                onClick={() => append({ field_name: '', field_type: 'text' })}
              >
                <Plus size={13} /> Add field
              </button>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
            <button id="cat-save-btn" type="submit" className={styles.btnSave} disabled={isSubmitting}>
              {isSubmitting ? '…' : <Save size={14} />}
              {isSubmitting ? 'Saving' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
