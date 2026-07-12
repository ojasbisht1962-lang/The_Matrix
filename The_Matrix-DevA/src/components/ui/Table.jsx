// ============================================
// Table — data table with sortable headers + skeleton
// ============================================

import styles from './Table.module.css';
import { Spinner } from './Spinner';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array<{key, label, sortable?, width?, align?}>} props.columns
 * @param {Array<Object>} props.data
 * @param {string} props.sortKey
 * @param {'asc'|'desc'} props.sortDir
 * @param {(key: string) => void} props.onSort
 * @param {boolean} props.isLoading
 * @param {React.ReactNode} props.emptyState
 * @param {(row) => React.ReactNode} props.renderRow
 */
export function Table({
  columns = [],
  data = [],
  sortKey,
  sortDir = 'asc',
  onSort,
  isLoading = false,
  emptyState,
  renderRow,
  className = '',
}) {
  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key)
      return <ChevronsUpDown size={14} className={styles.sortIcon} />;
    return sortDir === 'asc' ? (
      <ChevronUp size={14} className={styles.sortIconActive} />
    ) : (
      <ChevronDown size={14} className={styles.sortIconActive} />
    );
  };

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  styles.th,
                  col.sortable ? styles.sortable : '',
                  col.align === 'right' ? styles.alignRight : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ width: col.width }}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className={styles.thInner}>
                  {col.label}
                  <SortIcon col={col} />
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className={styles.skeletonRow}>
                {columns.map((col) => (
                  <td key={col.key} className={styles.td}>
                    <span className={styles.skeleton} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                {emptyState}
              </td>
            </tr>
          ) : (
            data.map((row, i) => renderRow(row, i))
          )}
        </tbody>
      </table>
    </div>
  );
}
