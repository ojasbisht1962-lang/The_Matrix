// ============================================
// CategoriesTab — list + create/edit/delete
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categories.service';
import { CategoryForm } from '../../components/forms/CategoryForm';
import styles from './orgSetup.module.css';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCategories(await listCategories());
    } catch (err) {
      toast.error(err.message ?? 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(payload) {
    try {
      if (editing) {
        await updateCategory(editing.id, payload);
        toast.success('Category updated');
      } else {
        await createCategory(payload);
        toast.success('Category created');
      }
      setFormOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message ?? 'Save failed');
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete "${cat.name}"? Assets referencing this category cannot be deleted.`)) return;
    try {
      await deleteCategory(cat.id);
      toast.success('Category deleted');
      load();
    } catch (err) {
      // FK RESTRICT error from Supabase
      toast.error(
        err.code === '23503'
          ? 'Cannot delete: assets are using this category.'
          : (err.message ?? 'Delete failed')
      );
    }
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Asset Categories</h2>
        <button
          id="cat-add-btn"
          className={styles.btnPrimary}
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          <Plus size={15} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.loadingSpinner} /></div>
      ) : categories.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><Tag size={40} /></div>
          <p className={styles.emptyText}>No categories yet</p>
          <p className={styles.emptySub}>Categories group your assets by type.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Description</th>
                <th className={styles.th}>Custom fields</th>
                <th className={styles.th} style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 500, color: '#e2e8f0' }}>
                    {cat.name}
                  </td>
                  <td className={styles.td} style={{ color: '#64748b', maxWidth: 260 }}>
                    {cat.description || <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles.badgeInfo}`}>
                      {(cat.custom_fields ?? []).length}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button
                        id={`cat-edit-${cat.id}`}
                        className={styles.btnGhost}
                        onClick={() => { setEditing(cat); setFormOpen(true); }}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        id={`cat-delete-${cat.id}`}
                        className={styles.btnDanger}
                        onClick={() => handleDelete(cat)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <CategoryForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </>
  );
}
