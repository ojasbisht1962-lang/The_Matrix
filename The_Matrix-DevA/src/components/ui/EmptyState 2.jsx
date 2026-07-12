// ============================================
// EmptyState — no-data placeholder
// ============================================

import styles from './EmptyState.module.css';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {icon && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <p className={styles.title}>{title}</p>
      {description && (
        <p className={styles.description}>{description}</p>
      )}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
