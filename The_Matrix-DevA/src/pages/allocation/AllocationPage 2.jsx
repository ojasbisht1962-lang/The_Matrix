// ============================================
// AllocationPage — Allocation & Transfer operations page
// Tabs: Active Allocations | Overdue Allocations | Transfer Requests
// ============================================

import { useState, useEffect } from 'react';
import {
  listAllocations,
  allocateAsset,
  returnAsset,
  getOverdueAllocations,
} from '../../services/allocations.service';
import { listTransfers, approveTransfer, rejectTransfer } from '../../services/transfers.service';
import { useAuth } from '../../hooks/useAuth';
import { canAllocateAsset, canApproveTransfer } from '../../lib/permissions';
import {
  Table,
  Button,
  Badge,
  Tabs,
  Modal,
  PageHeader,
  EmptyState,
  Select,
  Input,
} from '../../components/ui';
import { AllocationForm } from '../../components/forms/AllocationForm';
import { ArrowLeftRight, Check, X, Clipboard, AlertOctagon, RotateCcw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import styles from './AllocationPage.module.css';

export default function AllocationPage() {
  const { role, profile } = useAuth();

  const [activeTab, setActiveTab] = useState('active');
  const [activeAllocs, setActiveAllocs] = useState([]);
  const [overdueAllocs, setOverdueAllocs] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null); // Allocation object to return
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnNotes, setReturnNotes] = useState('');
  const [returning, setReturning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'active') {
        const data = await listAllocations({ isActive: true });
        setActiveAllocs(data || []);
      } else if (activeTab === 'overdue') {
        const data = await getOverdueAllocations();
        setOverdueAllocs(data || []);
      } else if (activeTab === 'transfers') {
        const data = await listTransfers();
        setTransfers(data || []);
      }
    } catch (err) {
      toast.error('Failed to load allocation details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleAllocateSubmit = async (payload) => {
    try {
      await allocateAsset(payload);
      toast.success('Asset allocated successfully');
      setIsAllocateOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to allocate asset');
      console.error(err);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnTarget) return;

    try {
      setReturning(true);
      await returnAsset({
        allocationId: returnTarget.id,
        condition: returnCondition,
        notes: returnNotes,
      });
      toast.success('Asset returned and restored to inventory');
      setReturnTarget(null);
      setReturnNotes('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to process return');
      console.error(err);
    } finally {
      setReturning(false);
    }
  };

  const handleApproveTransfer = async (transferId) => {
    try {
      await approveTransfer(transferId);
      toast.success('Transfer approved and allocation updated');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to approve transfer');
      console.error(err);
    }
  };

  const handleRejectTransfer = async (transferId) => {
    try {
      await rejectTransfer(transferId);
      toast.success('Transfer request rejected');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to reject transfer');
      console.error(err);
    }
  };

  // Check if current user has transfer approval rights for a transfer row
  const userCanApprove = (transfer) => {
    return canApproveTransfer(role, profile?.department_id, transfer.asset?.department_id);
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Allocation & Transfer"
        subtitle="Manage hardware checkout distributions and inter-departmental transfers"
        actions={
          canAllocateAsset(role) && (
            <Button
              variant="primary"
              iconLeft={<Plus size={18} />}
              onClick={() => setIsAllocateOpen(true)}
            >
              Allocate Asset
            </Button>
          )
        }
      />

      <Tabs
        tabs={[
          { key: 'active', label: 'Active Checkout Allocations', icon: <Clipboard size={16} /> },
          { key: 'overdue', label: 'Overdue Returns', icon: <AlertOctagon size={16} /> },
          { key: 'transfers', label: 'Transfer Requests', icon: <ArrowLeftRight size={16} /> },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      >
        {activeTab === 'active' && (
          <Table
            columns={[
              { key: 'asset_tag', label: 'Asset Tag', width: '15%' },
              { key: 'asset_name', label: 'Asset Name', width: '25%' },
              { key: 'holder', label: 'Employee Holder', width: '20%' },
              { key: 'allocated_at', label: 'Allocated At', width: '15%' },
              { key: 'expected_return', label: 'Expected Return', width: '15%' },
              { key: 'actions', label: 'Actions', width: '10%', align: 'right' },
            ]}
            data={activeAllocs}
            isLoading={loading}
            emptyState={
              <EmptyState
                icon={<Clipboard size={36} />}
                title="No active allocations"
                description="Currently no assets are checked out to employees. Click Allocate Asset to assign one."
              />
            }
            renderRow={(alloc) => (
              <tr key={alloc.id}>
                <td className={styles.monoCell}>{alloc.asset?.asset_tag}</td>
                <td className={styles.boldCell}>{alloc.asset?.name}</td>
                <td>{alloc.holder?.full_name}</td>
                <td>{new Date(alloc.allocated_at).toLocaleDateString()}</td>
                <td>
                  {alloc.expected_return
                    ? new Date(alloc.expected_return).toLocaleDateString()
                    : <span className={styles.mutedText}>Indefinite</span>}
                </td>
                <td align="right">
                  {canAllocateAsset(role) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<RotateCcw size={14} />}
                      onClick={() => setReturnTarget(alloc)}
                    >
                      Return
                    </Button>
                  )}
                </td>
              </tr>
            )}
          />
        )}

        {activeTab === 'overdue' && (
          <Table
            columns={[
              { key: 'asset_tag', label: 'Asset Tag', width: '15%' },
              { key: 'asset_name', label: 'Asset Name', width: '30%' },
              { key: 'holder', label: 'Holder', width: '25%' },
              { key: 'expected_return', label: 'Expected Return', width: '15%' },
              { key: 'days_overdue', label: 'Days Overdue', width: '15%' },
            ]}
            data={overdueAllocs}
            isLoading={loading}
            emptyState={
              <EmptyState
                icon={<AlertOctagon size={36} />}
                title="No overdue returns"
                description="Hooray! All active checked out assets are within their expected return timelines."
              />
            }
            renderRow={(row) => (
              <tr key={row.allocation_id}>
                <td className={styles.monoCell}>{row.asset_tag}</td>
                <td className={styles.boldCell}>{row.asset_name}</td>
                <td>{row.holder_name}</td>
                <td>{new Date(row.expected_return).toLocaleDateString()}</td>
                <td className={styles.dangerText}>{row.days_overdue} days</td>
              </tr>
            )}
          />
        )}

        {activeTab === 'transfers' && (
          <Table
            columns={[
              { key: 'asset', label: 'Asset Name', width: '25%' },
              { key: 'from', label: 'From Holder', width: '18%' },
              { key: 'to', label: 'Proposed Holder', width: '18%' },
              { key: 'status', label: 'Status', width: '15%' },
              { key: 'actions', label: 'Actions', width: '24%', align: 'right' },
            ]}
            data={transfers}
            isLoading={loading}
            emptyState={
              <EmptyState
                icon={<ArrowLeftRight size={36} />}
                title="No transfer requests"
                description="There are currently no inter-holder or departmental transfer proposals."
              />
            }
            renderRow={(row) => (
              <tr key={row.id}>
                <td className={styles.boldCell}>{row.asset?.name}</td>
                <td>{row.from_holder?.full_name}</td>
                <td>{row.to_holder?.full_name}</td>
                <td>
                  <Badge
                    variant={
                      row.status === 'approved' || row.status === 'completed'
                        ? 'success'
                        : row.status === 'requested'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {row.status}
                  </Badge>
                </td>
                <td align="right">
                  {row.status === 'requested' && userCanApprove(row) ? (
                    <div className={styles.actionGroup}>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<Check size={14} />}
                        onClick={() => handleApproveTransfer(row.id)}
                        className={styles.approveBtn}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<X size={14} />}
                        onClick={() => handleRejectTransfer(row.id)}
                        className={styles.rejectBtn}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : row.status === 'requested' ? (
                    <span className={styles.mutedText}>Awaiting Manager</span>
                  ) : (
                    <span className={styles.mutedText}>Handled</span>
                  )}
                </td>
              </tr>
            )}
          />
        )}
      </Tabs>

      {/* Allocate Asset Modal */}
      <Modal
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title="Allocate Asset to Employee"
        size="md"
      >
        <AllocationForm
          onSubmit={handleAllocateSubmit}
          onCancel={() => setIsAllocateOpen(false)}
        />
      </Modal>

      {/* Return Asset Modal */}
      <Modal
        isOpen={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        title={`Return Asset: ${returnTarget?.asset?.name}`}
        size="md"
      >
        <form onSubmit={handleReturnSubmit} className={styles.modalForm}>
          <Select
            label="Return Condition"
            options={[
              { value: 'new', label: 'New' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Poor' },
            ]}
            value={returnCondition}
            onChange={(e) => setReturnCondition(e.target.value)}
          />
          <Input
            label="Notes"
            placeholder="Condition details, issues or storage notes"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
          />
          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={() => setReturnTarget(null)} disabled={returning}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={returning}>
              Confirm Return
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
