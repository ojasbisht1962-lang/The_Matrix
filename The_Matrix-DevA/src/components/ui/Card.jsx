// ============================================
// Card — elevated surface container
// ============================================

import styles from './Card.module.css';

export function Card({ children, className = '', noPadding = false }) {
  return (
    <div
      className={[styles.card, noPadding ? styles.noPadding : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={[styles.body, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={[styles.footer, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
