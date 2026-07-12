// ============================================
// Spinner — loading indicator
// ============================================

import styles from './Spinner.module.css';

export function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      className={[styles.spinner, styles[`size-${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label="Loading"
      role="status"
    />
  );
}
