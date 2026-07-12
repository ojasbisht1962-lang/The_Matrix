// ============================================
// EmployeeDirectoryTab — list + role/dept assignment
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Users, ChevronDown } from 'lucide-react';
import { listProfiles, updateUserRole, assignDepartment, deactivateProfile } from '../../services/profiles.service';
import { listDepartments } from '../../services/departments.service';
import { ROLES, ROLE_LABELS } from '../../lib/constants';
import styles from './orgSetup.module.css';

const ROLE_STYLE = {
  employee:       styles.roleEmployee,
  department_head: styles.roleDeptHead,
  asset_manager:  styles.roleAssetManager,
  admin:          styles.roleAdmin,
};

export default function EmployeeDirectoryTab() {
  const [profiles, setProfiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [p, d] = await Promise.all([listProfiles(), listDepartments()]);
      setProfiles(p);
      setDepartments(d);
    } catch (err) {
      toast.error(err.message ?? 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRoleChange(userId, newRole) {
    try {
      await updateUserRole(userId, newRole);
      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error(err.message ?? 'Failed to update role');
    }
  }

  async function handleDeptChange(userId, deptId) {
    try {
      await assignDepartment(userId, deptId || null);
      toast.success('Department updated');
      load();
    } catch (err) {
      toast.error(err.message ?? 'Failed to assign department');
    }
  }

  async function handleDeactivate(user) {
    if (!window.confirm(`Deactivate ${user.full_name}?`)) return;
    try {
      await deactivateProfile(user.id);
      toast.success('User deactivated');
      load();
    } catch (err) {
      toast.error(err.message ?? 'Failed to deactivate');
    }
  }

  function getInitials(name = '') {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Employee Directory</h2>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.loadingSpinner} /></div>
      ) : profiles.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><Users size={40} /></div>
          <p className={styles.emptyText}>No employees yet</p>
          <p className={styles.emptySub}>Users appear here after they sign up.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((user) => (
                <tr key={user.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.profileCell}>
                      <div className={styles.avatar}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt={user.full_name} />
                          : getInitials(user.full_name)}
                      </div>
                      <div>
                        <div className={styles.profileName}>{user.full_name}</div>
                        <div className={styles.profileEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {/* Inline role selector */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select
                        id={`role-select-${user.id}`}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{
                          appearance: 'none',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 6,
                          padding: '0.25rem 1.75rem 0.25rem 0.5rem',
                          fontSize: '0.8125rem',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {Object.values(ROLES).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select
                        id={`dept-select-${user.id}`}
                        value={user.department_id ?? ''}
                        onChange={(e) => handleDeptChange(user.id, e.target.value)}
                        style={{
                          appearance: 'none',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 6,
                          padding: '0.25rem 1.75rem 0.25rem 0.5rem',
                          fontSize: '0.8125rem',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          maxWidth: 180,
                        }}
                      >
                        <option value="">— None —</option>
                        {departments.filter((d) => d.status === 'active').map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${user.status === 'active' ? styles.badgeSuccess : styles.badgeNeutral}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {user.status === 'active' && (
                      <button
                        id={`deactivate-${user.id}`}
                        className={styles.btnDanger}
                        onClick={() => handleDeactivate(user)}
                        title="Deactivate"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
