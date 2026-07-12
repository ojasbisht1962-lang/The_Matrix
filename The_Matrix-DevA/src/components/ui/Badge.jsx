// ============================================
// Badge — status / label chip
// Reads from STATUS_COLORS in constants.js
// ============================================

import styles from './Badge.module.css';

/**
 * @param {Object} props
 * @param {'success'|'warning'|'danger'|'info'|'neutral'} props.variant
 * @param {'sm'|'md'} props.size
 * @param {boolean} props.dot — show colored dot prefix
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) {
  return (
    <span
      className={[
        styles.badge,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
