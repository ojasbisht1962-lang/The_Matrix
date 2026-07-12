// ============================================
// Button — shared UI primitive
// Variants: primary | secondary | ghost | danger
// Sizes: sm | md | lg
// ============================================

import { forwardRef } from 'react';
import styles from './Button.module.css';
import { Spinner } from './Spinner';

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    iconLeft,
    iconRight,
    className = '',
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        styles.btn,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        isLoading ? styles.loading : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
          {children}
          {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
        </>
      )}
    </button>
  );
});
