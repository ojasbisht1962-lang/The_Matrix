// ============================================
// AuditPage — Compliance Audits
// Manages inventory audit cycles, assignments, and verification
// ============================================

import { useState, useEffect } from 'react';
import { useAuthStore, selectRole, selectProfile } from '../../stores/authStore';
import {
  listAuditCycles,
  getAuditItems,
  getAuditAssignments,
  createAuditCycle,
  closeAuditCycle,
  updateAuditItem,
} from '../../services/audits.service';
import { listDepartments } from '../../services/departments.service';
import { listProfiles } from '../../services/profiles.service';
import {
  Plus,
  Check,
  XCircle,
  Calendar,
  Building,
  MapPin,
  Lock
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Spinner,
  PageHeader,
  Button,
  Table,
  Badge,
  Modal,
  Input,
  Select
} from '../../components/ui';
import { toast } from 'sonner';
import styles from './AuditPage.module.css';

export default function AuditPage() {
  const currentRole = useAuthStore(selectRole);
  const currentProfile = useAuthStore(selectProfile);
  const isAdmin = currentRole === 'admin';

  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [items, setItems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [verifyingItem, setVerifyingItem] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('verified'); // verified or missing

  // Create Cycle form state
  const [departments, setDepartments] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [newCycle, setNewCycle] = useState({
    name: '',
    scope_type: 'department',
    scope_value: '',
    start_date: '',
    end_date: '',
    auditor_ids: [],
  });

  useEffect(() => {
    fetchCycles();
    if (isCreateOpen) {
      loadFormDependencies();
    }
  }, [isCreateOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCycles() {
    try {
      setLoadingCycles(true);
      const data = await listAuditCycles();
      setCycles(data || []);
      if (data && data.length > 0 && !selectedCycle) {
        handleSelectCycle(data[0]);
      }
    } catch (err) {
      toast.error('Failed to load audit cycles');
    } finally {
      setLoadingCycles(false);
    }
  }

  async function loadFormDependencies() {
    try {
      const [deptData, profileData] = await Promise.all([
        listDepartments(),
        listProfiles()
      ]);
      setDepartments(deptData || []);
      setProfiles(profileData || []);
      
      // Default department if available
      if (deptData && deptData.length > 0) {
        setNewCycle(prev => ({ ...prev, scope_value: deptData[0].id }));
      }
    } catch (err) {
      toast.error('Failed to load form parameters');
    }
  }

  async function handleSelectCycle(cycle) {
    setSelectedCycle(cycle);
    setLoadingItems(true);
    try {
      const [itemsData, assignmentsData] = await Promise.all([
        getAuditItems(cycle.id),
        getAuditAssignments(cycle.id)
      ]);
      setItems(itemsData || []);
      setAssignments(assignmentsData || []);
    } catch (err) {
      toast.error('Failed to load audit details');
    } finally {
      setLoadingItems(false);
    }
  }

  // Verify Single Item trigger
  function handleOpenVerify(item, status) {
    setVerifyingItem(item);
    setVerificationStatus(status);
    setVerificationNotes('');
    setIsVerifyOpen(true);
  }

  async function handleSaveVerification() {
    if (!verifyingItem) return;
    setActionLoading(true);
    try {
      await updateAuditItem(verifyingItem.id, {
        status: verificationStatus,
        notes: verificationNotes,
        auditor_id: currentProfile.id
      });
      toast.success(`Asset marked as ${verificationStatus}`);
      setIsVerifyOpen(false);
      // Refresh current items
      if (selectedCycle) {
        handleSelectCycle(selectedCycle);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update audit item');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCloseCycle() {
    if (!selectedCycle) return;
    if (!confirm('Are you sure you want to close this audit cycle? All unverified items will be marked as missing.')) return;
    
    setActionLoading(true);
    try {
      const data = await closeAuditCycle(selectedCycle.id);
      const discrepancyCount = data?.[0]?.discrepancy_count ?? 0;
      toast.success(`Audit cycle closed successfully. Discrepancies found: ${discrepancyCount}`);
      // Refresh
      const updatedCycles = await listAuditCycles();
      setCycles(updatedCycles || []);
      const matched = updatedCycles.find(c => c.id === selectedCycle.id);
      if (matched) {
        handleSelectCycle(matched);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to close audit cycle');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (newCycle.auditor_ids.length === 0) {
      toast.error('Please assign at least one auditor');
      return;
    }
    
    setActionLoading(true);
    try {
      await createAuditCycle(newCycle);
      toast.success('Audit cycle created successfully');
      setIsCreateOpen(false);
      // Reset form
      setNewCycle({
        name: '',
        scope_type: 'department',
        scope_value: '',
        start_date: '',
        end_date: '',
        auditor_ids: [],
      });
      fetchCycles();
    } catch (err) {
      toast.error(err.message || 'Failed to create audit cycle');
    } finally {
      setActionLoading(false);
    }
  }

  const handleAuditorCheckbox = (profileId) => {
    setNewCycle(prev => {
      const idx = prev.auditor_ids.indexOf(profileId);
      let updated = [];
      if (idx > -1) {
        updated = prev.auditor_ids.filter(id => id !== profileId);
      } else {
        updated = [...prev.auditor_ids, profileId];
      }
      return { ...prev, auditor_ids: updated };
    });
  };

  // Determine if the current user can verify items in the selected cycle
  const isAssignedAuditor = assignments.some(a => a.auditor_id === currentProfile?.id);
  const canVerify = selectedCycle?.status === 'open' && (isAssignedAuditor || isAdmin || currentRole === 'asset_manager');

  const columns = [
    { key: 'asset_tag', label: 'Asset Tag' },
    { key: 'asset_name', label: 'Asset Name' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Audit Status' },
    { key: 'verified_at', label: 'Verified At' },
    { key: 'auditor', label: 'Auditor' },
    { key: 'notes', label: 'Notes' },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className={styles.auditPage}>
      <PageHeader
        title="Compliance & Audits"
        subtitle="Manage inventory audit cycles, verify asset locations, and audit logs."
        action={
          isAdmin && (
            <Button variant="primary" iconLeft={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
              Start New Cycle
            </Button>
          )
        }
      />

      {loadingCycles ? (
        <div className={styles.spinnerWrapper}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Sidebar list of cycles */}
          <Card className={styles.cyclesCard}>
            <CardHeader>Audit Cycles</CardHeader>
            <CardBody>
              {cycles.length === 0 ? (
                <p className={styles.emptyText}>No audit cycles created yet.</p>
              ) : (
                <div className={styles.cycleList}>
                  {cycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className={[
                        styles.cycleItem,
                        selectedCycle?.id === cycle.id ? styles.cycleItemActive : ''
                      ].join(' ')}
                      onClick={() => handleSelectCycle(cycle)}
                    >
                      <div className={styles.cycleHeader}>
                        <h4 className={styles.cycleName}>{cycle.name}</h4>
                        <Badge variant={cycle.status === 'open' ? 'success' : 'neutral'} size="sm">
                          {cycle.status}
                        </Badge>
                      </div>
                      <p className={styles.cycleMeta}>
                        Scope: {cycle.scope_type === 'department' ? 'Department' : 'Location'} ({cycle.scope_value})
                      </p>
                      <p className={styles.cycleDates}>
                        {cycle.start_date} to {cycle.end_date}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Details & Items list */}
          <div>
            {selectedCycle ? (
              <Card className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <div>
                    <h3 className={styles.detailTitle}>{selectedCycle.name}</h3>
                    <p className={styles.cycleDates}>
                      Created by {selectedCycle.profiles?.full_name || 'System'}
                    </p>
                  </div>
                  {selectedCycle.status === 'open' && (isAdmin || currentRole === 'asset_manager') && (
                    <Button variant="danger" size="sm" onClick={handleCloseCycle} isLoading={actionLoading}>
                      Close Audit Cycle
                    </Button>
                  )}
                </div>

                <div className={styles.detailGrid}>
                  <div>
                    <span className={styles.detailLabel}>Scope Type</span>
                    <p className={styles.detailValue}>
                      {selectedCycle.scope_type === 'department' ? (
                        <><Building size={14} style={{ marginRight: 4, display: 'inline' }} /> Department</>
                      ) : (
                        <><MapPin size={14} style={{ marginRight: 4, display: 'inline' }} /> Location</>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Scope Value</span>
                    <p className={styles.detailValue}>{selectedCycle.scope_value}</p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Schedule</span>
                    <p className={styles.detailValue}>
                      <Calendar size={14} style={{ marginRight: 4, display: 'inline' }} /> {selectedCycle.start_date} to {selectedCycle.end_date}
                    </p>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Status</span>
                    <div>
                      <Badge variant={selectedCycle.status === 'open' ? 'success' : 'neutral'}>
                        {selectedCycle.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <span className={styles.detailLabel}>Assigned Auditors</span>
                  <div className={styles.auditorList}>
                    {assignments.length === 0 ? (
                      <span className={styles.emptyText}>No auditors assigned.</span>
                    ) : (
                      assignments.map(a => (
                        <span key={a.id} className={styles.auditorTag}>
                          {a.profiles?.full_name} ({a.profiles?.email})
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <CardHeader style={{ paddingLeft: 0, paddingRight: 0 }}>Audit Inventory Items</CardHeader>
                  <Table
                    columns={columns}
                    data={items}
                    isLoading={loadingItems}
                    emptyState={<p className={styles.emptyText}>No assets match the scope of this audit.</p>}
                    renderRow={(item) => (
                      <tr key={item.id}>
                        <td>{item.assets?.asset_tag}</td>
                        <td>{item.assets?.name}</td>
                        <td>{item.assets?.location || 'Unspecified'}</td>
                        <td>
                          <Badge
                            variant={
                              item.status === 'verified'
                                ? 'success'
                                : item.status === 'missing'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td>{item.verified_at ? new Date(item.verified_at).toLocaleDateString() : '-'}</td>
                        <td>{item.profiles?.full_name || '-'}</td>
                        <td>{item.notes || '-'}</td>
                        <td>
                          <div className={styles.actionCell}>
                            {canVerify && item.status === 'pending' ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  iconLeft={<Check size={14} />}
                                  onClick={() => handleOpenVerify(item, 'verified')}
                                >
                                  Verify
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  iconLeft={<XCircle size={14} />}
                                  onClick={() => handleOpenVerify(item, 'missing')}
                                >
                                  Flag Missing
                                </Button>
                              </>
                            ) : (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                {selectedCycle.status === 'closed' ? (
                                  <><Lock size={12} style={{ display: 'inline', marginRight: 2 }} /> Cycle Closed</>
                                ) : item.status !== 'pending' ? (
                                  'Completed'
                                ) : (
                                  'Not Assigned'
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  />
                </div>
              </Card>
            ) : (
              <Card>
                <CardBody>
                  <p className={styles.emptyText}>Select an audit cycle from the list or create a new one.</p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* CREATE AUDIT CYCLE MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Audit Cycle" size="lg">
        <form onSubmit={handleCreateSubmit} className={styles.form}>
          <Input
            label="Audit Cycle Name"
            placeholder="e.g. Q3 Hardware Inventory"
            required
            value={newCycle.name}
            onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
          />

          <div className={styles.formRow}>
            <Select
              label="Scope Type"
              options={[
                { value: 'department', label: 'Department' },
                { value: 'location', label: 'Location' },
              ]}
              value={newCycle.scope_type}
              onChange={(e) => {
                setNewCycle({
                  ...newCycle,
                  scope_type: e.target.value,
                  scope_value: e.target.value === 'department' ? (departments[0]?.id || '') : ''
                });
              }}
            />

            {newCycle.scope_type === 'department' ? (
              <Select
                label="Scope Department"
                options={departments.map(d => ({ value: d.id, label: d.name }))}
                value={newCycle.scope_value}
                onChange={(e) => setNewCycle({ ...newCycle, scope_value: e.target.value })}
              />
            ) : (
              <Input
                label="Scope Location Match"
                placeholder="e.g. Building A or Head Office"
                required
                value={newCycle.scope_value}
                onChange={(e) => setNewCycle({ ...newCycle, scope_value: e.target.value })}
              />
            )}
          </div>

          <div className={styles.formRow}>
            <Input
              type="date"
              label="Start Date"
              required
              value={newCycle.start_date}
              onChange={(e) => setNewCycle({ ...newCycle, start_date: e.target.value })}
            />
            <Input
              type="date"
              label="End Date"
              required
              value={newCycle.end_date}
              onChange={(e) => setNewCycle({ ...newCycle, end_date: e.target.value })}
            />
          </div>

          <div>
            <label className={styles.multiselectLabel}>Assign Auditors</label>
            <div className={styles.multiselect}>
              {profiles.map(p => (
                <label key={p.id} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={newCycle.auditor_ids.includes(p.id)}
                    onChange={() => handleAuditorCheckbox(p.id)}
                  />
                  <span>{p.full_name} ({p.role.replace('_', ' ')})</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Create Audit Cycle
            </Button>
          </div>
        </form>
      </Modal>

      {/* VERIFY ITEM MODAL */}
      <Modal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        title={verificationStatus === 'verified' ? 'Verify Asset Location' : 'Flag Asset as Missing'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            You are verifying asset <strong>{verifyingItem?.assets?.name} ({verifyingItem?.assets?.asset_tag})</strong>.
          </p>
          <Input
            label="Verification Notes"
            placeholder="Add comments on condition, location, or missing context..."
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="ghost" onClick={() => setIsVerifyOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveVerification} isLoading={actionLoading}>
              Save Verification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
