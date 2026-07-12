// ============================================
// Modal — portal-based overlay
// Closes on: backdrop click, ESC key, explicit close
// ============================================

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.title
 * @param {'sm'|'md'|'lg'|'xl'} props.size
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} props.footer
 */
export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}) {
  const handleEsc = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={[styles.panel, styles[`size-${size}`]].join(' ')}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>{children}</div>

        {/* Footer */}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
