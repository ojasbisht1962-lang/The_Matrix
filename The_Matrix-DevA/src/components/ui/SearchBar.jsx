// ============================================
// SearchBar — debounced search input
// ============================================

import { useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(val: string) => void} props.onChange
 * @param {string} props.placeholder
 * @param {number} props.debounceMs — default 300
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  className = '',
}) {
  const timerRef = useRef(null);

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onChange(val), debounceMs);
    },
    [onChange, debounceMs]
  );

  const handleClear = () => {
    clearTimeout(timerRef.current);
    onChange('');
  };

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <span className={styles.icon} aria-hidden="true">
        <Search size={16} />
      </span>
      <input
        type="search"
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={styles.input}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
