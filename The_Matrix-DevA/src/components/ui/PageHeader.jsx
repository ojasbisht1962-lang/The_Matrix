// ============================================
// PageHeader — page title + subtitle + action slot
// ============================================

import styles from './PageHeader.module.css';

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className = '',
}) {
  return (
    <header className={[styles.header, className].filter(Boolean).join(' ')}>
      <div className={styles.left}>
        {breadcrumb && (
          <div className={styles.breadcrumb}>{breadcrumb}</div>
        )}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
