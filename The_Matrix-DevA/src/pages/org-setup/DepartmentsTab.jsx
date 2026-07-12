// ============================================
// DepartmentsTab — list + create/edit/delete
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../services/departments.service';
import { DepartmentForm } from '../../components/forms/DepartmentForm';
import styles from './orgSetup.module.css';

export default function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // department object or null

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setDepartments(await listDepartments());
    } catch (err) {
      toast.error(err.message ?? 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(payload) {
    try {
      if (editing) {
        await updateDepartment(editing.id, payload);
        toast.success('Department updated');
      } else {
        await createDepartment(payload);
        toast.success('Department created');
      }
      setFormOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message ?? 'Save failed');
    }
  }

  async function handleDelete(dept) {
    if (!window.confirm(`Delete "${dept.name}"? This cannot be undone.`)) return;
    try {
      await deleteDepartment(dept.id);
      toast.success('Department deleted');
      load();
    } catch (err) {
      toast.error(err.message ?? 'Delete failed');
    }
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Departments</h2>
        <button
          id="dept-add-btn"
          className={styles.btnPrimary}
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          <Plus size={15} /> Add Department
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.loadingSpinner} /></div>
      ) : departments.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><Building2 size={40} /></div>
          <p className={styles.emptyText}>No departments yet</p>
          <p className={styles.emptySub}>Add your first department to get started.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Parent</th>
                <th className={styles.th} style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                const parent = departments.find((d) => d.id === dept.parent_department_id);
                return (
                  <tr key={dept.id} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: 500, color: '#e2e8f0' }}>
                      {dept.name}
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${dept.status === 'active' ? styles.badgeSuccess : styles.badgeNeutral}`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className={styles.td}>{parent ? parent.name : <span style={{ color: '#475569' }}>—</span>}</td>
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        <button
                          id={`dept-edit-${dept.id}`}
                          className={styles.btnGhost}
                          onClick={() => { setEditing(dept); setFormOpen(true); }}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          id={`dept-delete-${dept.id}`}
                          className={styles.btnDanger}
                          onClick={() => handleDelete(dept)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <DepartmentForm
          initial={editing}
          departments={departments.filter((d) => d.id !== editing?.id)}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </>
  );
}
