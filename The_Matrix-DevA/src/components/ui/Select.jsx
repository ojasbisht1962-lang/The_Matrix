// ============================================
// Select — native select styled to design system
// ============================================

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    options = [],   // [{ value, label }] or [{ value, label, disabled }]
    placeholder,
    className = '',
    id,
    required,
    ...rest
  },
  ref
) {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.selectRow}>
        <select
          ref={ref}
          id={selectId}
          className={[styles.select, error ? styles.hasError : '']
            .filter(Boolean)
            .join(' ')}
          aria-invalid={!!error}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronDown size={16} />
        </span>
      </div>
      {error && (
        <p id={`${selectId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${selectId}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
});
