// ============================================
// Tabs — controlled or uncontrolled tab panel
// ============================================

import { useState } from 'react';
import styles from './Tabs.module.css';

/**
 * @param {Object} props
 * @param {Array<{key, label, icon?, badge?}>} props.tabs
 * @param {string} props.activeKey — controlled mode
 * @param {string} props.defaultKey — uncontrolled mode
 * @param {(key: string) => void} props.onChange
 * @param {React.ReactNode} props.children
 */
export function Tabs({
  tabs = [],
  activeKey: controlledKey,
  defaultKey,
  onChange,
  children,
  className = '',
}) {
  const [internalKey, setInternalKey] = useState(defaultKey ?? tabs[0]?.key);

  const activeKey = controlledKey ?? internalKey;

  function handleClick(key) {
    if (!controlledKey) setInternalKey(key);
    onChange?.(key);
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.tabList} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeKey === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            id={`tab-${tab.key}`}
            className={[
              styles.tab,
              activeKey === tab.key ? styles.active : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleClick(tab.key)}
          >
            {tab.icon && (
              <span className={styles.tabIcon}>{tab.icon}</span>
            )}
            {tab.label}
            {tab.badge != null && (
              <span className={styles.tabBadge}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeKey}`}
        aria-labelledby={`tab-${activeKey}`}
        className={styles.panel}
      >
        {children}
      </div>
    </div>
  );
}
