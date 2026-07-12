// ============================================
// Input — text/number/email/password field
// ============================================

import { forwardRef } from 'react';
import styles from './Input.module.css';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    iconLeft,
    iconRight,
    className = '',
    id,
    required,
    ...rest
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={styles.inputRow}>
        {iconLeft && (
          <span className={styles.iconLeft} aria-hidden="true">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            styles.input,
            iconLeft ? styles.hasIconLeft : '',
            iconRight ? styles.hasIconRight : '',
            error ? styles.hasError : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...rest}
        />
        {iconRight && (
          <span className={styles.iconRight} aria-hidden="true">
            {iconRight}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
});
