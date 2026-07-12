// ============================================
// MaintenancePage — DevC  (Screen 7)
// Kanban board: pending → approved → in_progress → resolved
// Managers can approve/reject/assign; technicians can start/resolve
// ============================================

import { useState, useEffect, useCallback } from 'react';
import {
  listMaintenanceRequests,
  createMaintenanceRequest,
  approveMaintenance,
  rejectMaintenance,
  assignTechnician,
  startMaintenance,
  resolveMaintenance,
} from '../../services/maintenance.service';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { canApproveMaintenance, canRaiseMaintenance } from '../../lib/permissions';
import {
  MAINTENANCE_STATUS_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from '../../lib/constants';
import {
  PageHeader,
  Button,
  Badge,
  Modal,
  EmptyState,
  Spinner,
  Select,
  Input,
} from '../../components/ui';
import { MaintenanceForm } from '../../components/forms/MaintenanceForm';
import {
  Plus,
  Wrench,
  CheckCircle,
  XCircle,
  Play,
  UserCheck,
  CheckSquare,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './MaintenancePage.module.css';

// ─── Kanban column definition ────────────────────────────────
const COLUMNS = [
  {
    key:   'pending',
    label: 'Pending',
    color: 'var(--color-warning)',
    bg:    'rgba(251, 191, 36, 0.06)',
  },
  {
    key:   'approved',
    label: 'Approved',
    color: 'var(--color-info)',
    bg:    'rgba(129, 140, 248, 0.06)',
  },
  {
    key:   'technician_assigned',
    label: 'Assigned',
    color: 'var(--color-secondary)',
    bg:    'rgba(139, 92, 246, 0.06)',
  },
  {
    key:   'in_progress',
    label: 'In Progress',
    color: 'var(--color-primary)',
    bg:    'rgba(99, 102, 241, 0.06)',
  },
  {
    key:   'resolved',
    label: 'Resolved',
    color: 'var(--color-success)',
    bg:    'rgba(74, 222, 128, 0.06)',
  },
];

// ─── component ──────────────────────────────────────────────
export default function MaintenancePage() {
  const { role, profile } = useAuth();
  const isManager    = canApproveMaintenance(role);
  const canRaise     = canRaiseMaintenance(role);

  const [requests,      setRequests]      = useState([]);
  const [profiles,      setProfilesList]  = useState([]);
  const [loading,       setLoading]       = useState(true);

  // Modals
  const [isNewOpen,     setIsNewOpen]     = useState(false);
  const [resolveTarget, setResolveTarget] = useState(null); // { id }
  const [resolveNotes,  setResolveNotes]  = useState('');
  const [resolving,     setResolving]     = useState(false);
  const [assignTarget,  setAssignTarget]  = useState(null); // { id }
  const [technicianId,  setTechnicianId]  = useState('');
  const [assigning,     setAssigning]     = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listMaintenanceRequests({});
      setRequests(data || []);
    } catch (err) {
      toast.error('Failed to load maintenance requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profiles once (for technician assignment dropdown)
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('status', 'active')
      .order('full_name')
      .then(({ data }) => setProfilesList(data || []));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Action handlers ──────────────────────────────────────
  const handleCreate = async (payload) => {
    try {
      await createMaintenanceRequest(payload);
      toast.success('Maintenance request submitted');
      setIsNewOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveMaintenance(id);
      toast.success('Request approved — asset is under maintenance');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this maintenance request?')) return;
    try {
      await rejectMaintenance(id);
      toast.success('Request rejected');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignTarget || !technicianId) return;
    try {
      setAssigning(true);
      await assignTechnician(assignTarget.id, technicianId);
      toast.success('Technician assigned');
      setAssignTarget(null);
      setTechnicianId('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign technician');
    } finally {
      setAssigning(false);
    }
  };

  const handleStart = async (id) => {
    try {
      await startMaintenance(id);
      toast.success('Maintenance started');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to start maintenance');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveTarget) return;
    try {
      setResolving(true);
      await resolveMaintenance(resolveTarget.id, resolveNotes);
      toast.success('Maintenance resolved — asset restored to inventory');
      setResolveTarget(null);
      setResolveNotes('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to resolve');
    } finally {
      setResolving(false);
    }
  };

  // ── Partition requests into columns ──────────────────────
  const byColumn = COLUMNS.reduce((acc, col) => {
    acc[col.key] = requests.filter((r) => r.status === col.key);
    return acc;
  }, {});

  // Show rejected separately at bottom if manager
  const rejected = requests.filter((r) => r.status === 'rejected');

  return (
    <div className={styles.container}>
      <PageHeader
        title="Maintenance Requests"
        subtitle="Track and manage asset repair and service workflows"
        actions={
          canRaise && (
            <Button
              variant="primary"
              iconLeft={<Plus size={18} />}
              onClick={() => setIsNewOpen(true)}
            >
              Raise Request
            </Button>
          )
        }
      />

      {loading ? (
        <div className={styles.spinnerWrapper}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.kanban}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              requests={byColumn[col.key] || []}
              isManager={isManager}
              currentUserId={profile?.id}
              profiles={profiles}
              onApprove={handleApprove}
              onReject={handleReject}
              onAssign={(req) => setAssignTarget(req)}
              onStart={handleStart}
              onResolve={(req) => setResolveTarget(req)}
            />
          ))}
        </div>
      )}

      {/* Rejected banner (manager only) */}
      {isManager && rejected.length > 0 && (
        <div className={styles.rejectedSection}>
          <h3 className={styles.rejectedTitle}>
            <XCircle size={16} /> Rejected ({rejected.length})
          </h3>
          <div className={styles.rejectedGrid}>
            {rejected.map((req) => (
              <MiniRequestCard key={req.id} req={req} />
            ))}
          </div>
        </div>
      )}

      {/* ── New Request Modal ── */}
      <Modal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        title="Raise Maintenance Request"
        size="md"
      >
        <MaintenanceForm
          onSubmit={handleCreate}
          onCancel={() => setIsNewOpen(false)}
        />
      </Modal>

      {/* ── Assign Technician Modal ── */}
      <Modal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title="Assign Technician"
        size="sm"
      >
        <form onSubmit={handleAssignSubmit} className={styles.modalForm}>
          <p className={styles.modalDesc}>
            Select a technician for: <strong>{assignTarget?.asset?.name}</strong>
          </p>
          <Select
            label="Technician"
            placeholder="Select profile"
            required
            options={profiles.map((p) => ({
              value: p.id,
              label: `${p.full_name} (${p.role.replace('_', ' ')})`,
            }))}
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
          />
          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={() => setAssignTarget(null)} disabled={assigning}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={assigning}>
              Assign
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Resolve Modal ── */}
      <Modal
        isOpen={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        title={`Resolve: ${resolveTarget?.asset?.name}`}
        size="sm"
      >
        <form onSubmit={handleResolveSubmit} className={styles.modalForm}>
          <Input
            label="Resolution Notes"
            placeholder="Describe what was repaired or replaced…"
            required
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
          />
          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={() => setResolveTarget(null)} disabled={resolving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={resolving}>
              Mark Resolved
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── KanbanColumn ────────────────────────────────────────────
function KanbanColumn({
  column,
  requests,
  isManager,
  currentUserId,
  profiles,
  onApprove,
  onReject,
  onAssign,
  onStart,
  onResolve,
}) {
  return (
    <div
      className={styles.column}
      style={{ '--col-accent': column.color, '--col-bg': column.bg }}
    >
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>{column.label}</span>
        <span className={styles.columnCount}>{requests.length}</span>
      </div>

      <div className={styles.columnBody}>
        {requests.length === 0 ? (
          <div className={styles.emptyColumn}>
            <Wrench size={20} />
            <span>No requests</span>
          </div>
        ) : (
          requests.map((req) => (
            <MaintenanceCard
              key={req.id}
              req={req}
              isManager={isManager}
              currentUserId={currentUserId}
              onApprove={() => onApprove(req.id)}
              onReject={() => onReject(req.id)}
              onAssign={() => onAssign(req)}
              onStart={() => onStart(req.id)}
              onResolve={() => onResolve(req)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── MaintenanceCard ─────────────────────────────────────────
function MaintenanceCard({
  req,
  isManager,
  currentUserId,
  onApprove,
  onReject,
  onAssign,
  onStart,
  onResolve,
}) {
  const priorityVariant = PRIORITY_COLORS[req.priority] || 'neutral';
  const isTechnician    = req.technician_id === currentUserId;

  return (
    <div className={styles.card}>
      {/* Priority badge + asset name */}
      <div className={styles.cardTop}>
        <Badge variant={priorityVariant} dot>
          {req.priority}
        </Badge>
        {req.photo_url && (
          <img src={req.photo_url} alt="Issue" className={styles.cardPhoto} />
        )}
      </div>

      <h4 className={styles.cardAsset}>{req.asset?.name}</h4>
      <p className={styles.cardTag}>{req.asset?.asset_tag}</p>

      <p className={styles.cardDesc}>{req.description}</p>

      <div className={styles.cardMeta}>
        <span>By {req.requester?.full_name}</span>
        <span>{new Date(req.created_at).toLocaleDateString()}</span>
      </div>

      {req.technician && (
        <div className={styles.techLine}>
          <UserCheck size={12} />
          <span>{req.technician.full_name}</span>
        </div>
      )}

      {/* Action buttons by status + role */}
      <div className={styles.cardActions}>
        {req.status === 'pending' && isManager && (
          <>
            <Button
              size="sm"
              variant="ghost"
              iconLeft={<CheckCircle size={13} />}
              onClick={onApprove}
              className={styles.approveBtn}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              iconLeft={<XCircle size={13} />}
              onClick={onReject}
              className={styles.rejectBtn}
            >
              Reject
            </Button>
          </>
        )}

        {req.status === 'approved' && isManager && (
          <Button
            size="sm"
            variant="ghost"
            iconLeft={<UserCheck size={13} />}
            onClick={onAssign}
            className={styles.assignBtn}
          >
            Assign Tech
          </Button>
        )}

        {req.status === 'technician_assigned' && (isTechnician || isManager) && (
          <Button
            size="sm"
            variant="ghost"
            iconLeft={<Play size={13} />}
            onClick={onStart}
            className={styles.startBtn}
          >
            Start Work
          </Button>
        )}

        {req.status === 'in_progress' && (isTechnician || isManager) && (
          <Button
            size="sm"
            variant="ghost"
            iconLeft={<CheckSquare size={13} />}
            onClick={onResolve}
            className={styles.resolveBtn}
          >
            Mark Resolved
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── MiniRequestCard ─────────────────────────────────────────
function MiniRequestCard({ req }) {
  return (
    <div className={styles.miniCard}>
      <span className={styles.miniAsset}>{req.asset?.name}</span>
      <span className={styles.miniDesc}>{req.description}</span>
      <span className={styles.miniBy}>by {req.requester?.full_name}</span>
    </div>
  );
}
