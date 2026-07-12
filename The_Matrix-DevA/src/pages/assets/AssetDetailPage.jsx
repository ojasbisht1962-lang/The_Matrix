// ============================================
// AssetDetailPage — detailed view of a single asset
// Shows specifications, allocation, transfer history, maintenance logs, and edit actions
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAsset, updateAsset, deleteAsset } from '../../services/assets.service';
import { listAllocations } from '../../services/allocations.service';
import { listTransfers } from '../../services/transfers.service';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { canRegisterAsset, canAllocateAsset } from '../../lib/permissions';
import { ASSET_STATUSES, ASSET_STATUS_LABELS } from '../../lib/constants';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Spinner,
  PageHeader,
  Modal,
} from '../../components/ui';
import { AssetForm } from '../../components/forms/AssetForm';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  User,
  MapPin,
  FileText,
  Wrench,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './AssetDetailPage.module.css';

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, profile: authProfile } = useAuth();

  const [asset, setAsset] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isManager = canRegisterAsset(role);

  const loadData = async () => {
    try {
      setLoading(true);
      const assetData = await getAsset(id);
      setAsset(assetData);

      // Fetch histories in parallel
      const [allocs, trans, maint] = await Promise.all([
        listAllocations({ assetId: id }),
        listTransfers({ assetId: id }),
        supabase
          .from('maintenance_requests')
          .select('*, requester:profiles!maintenance_requests_requested_by_fkey (full_name)')
          .eq('asset_id', id)
          .order('created_at', { ascending: false }),
      ]);

      setAllocations(allocs || []);
      setTransfers(trans || []);
      setMaintenance(maint.data || []);
    } catch (err) {
      toast.error('Failed to load asset details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleEditSubmit = async (payload) => {
    try {
      await updateAsset(id, payload);
      toast.success('Asset updated successfully');
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update asset');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this asset? This cannot be undone.')) return;
    try {
      await deleteAsset(id);
      toast.success('Asset deleted successfully');
      navigate('/assets');
    } catch (err) {
      toast.error(err.message || 'Failed to delete asset');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className={styles.spinnerWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={styles.errorWrapper}>
        <h3>Asset Not Found</h3>
        <Button variant="secondary" onClick={() => navigate('/assets')}>
          Back to Catalog
        </Button>
      </div>
    );
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case ASSET_STATUSES.AVAILABLE:
        return 'success';
      case ASSET_STATUSES.ALLOCATED:
        return 'info';
      case ASSET_STATUSES.UNDER_MAINTENANCE:
      case ASSET_STATUSES.RESERVED:
        return 'warning';
      case ASSET_STATUSES.LOST:
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className={styles.detailPage}>
      <Button
        variant="ghost"
        iconLeft={<ArrowLeft size={16} />}
        onClick={() => navigate('/assets')}
        className={styles.backBtn}
      >
        Back to Catalog
      </Button>

      <PageHeader
        title={asset.name}
        subtitle={`Asset Tag: ${asset.asset_tag}`}
        actions={
          isManager && (
            <div className={styles.actionGroup}>
              <Button
                variant="secondary"
                iconLeft={<Edit2 size={16} />}
                onClick={() => setIsEditOpen(true)}
              >
                Edit Asset
              </Button>
              <Button
                variant="danger"
                iconLeft={<Trash2 size={16} />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          )
        }
      />

      <div className={styles.grid}>
        {/* Main Details Panel */}
        <div className={styles.leftCol}>
          <Card className={styles.card}>
            <CardHeader>Specifications & Location</CardHeader>
            <CardBody className={styles.specBody}>
              <div className={styles.assetVisualRow}>
                {asset.photo_url ? (
                  <img src={asset.photo_url} alt={asset.name} className={styles.largePreview} />
                ) : (
                  <div className={styles.largePreviewPlaceholder}>
                    <Package size={48} />
                  </div>
                )}
                <div className={styles.taglineSpecs}>
                  <Badge variant={getStatusBadgeVariant(asset.status)} dot>
                    {ASSET_STATUS_LABELS[asset.status] || asset.status}
                  </Badge>
                  <p><strong>Serial Number:</strong> {asset.serial_number || 'N/A'}</p>
                  <p><strong>Category:</strong> {asset.category_name}</p>
                  <p><strong>Department:</strong> {asset.department_name || 'Unassigned'}</p>
                </div>
              </div>

              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <MapPin size={16} />
                  <div>
                    <span>Location</span>
                    <p>{asset.location || 'Not specified'}</p>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <Calendar size={16} />
                  <div>
                    <span>Acquisition Date</span>
                    <p>{asset.acquisition_date || 'N/A'}</p>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <FileText size={16} />
                  <div>
                    <span>Acquisition Cost</span>
                    <p>{asset.acquisition_cost ? `$${Number(asset.acquisition_cost).toFixed(2)}` : 'N/A'}</p>
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <CheckCircle size={16} />
                  <div>
                    <span>Bookable Checkout</span>
                    <p>{asset.is_bookable ? 'Allowed' : 'Prohibited'}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Allocation & Holder Information */}
          <Card className={styles.card}>
            <CardHeader>Current Holder & Allocation Status</CardHeader>
            <CardBody>
              {asset.current_holder_id ? (
                <div className={styles.holderInfo}>
                  <div className={styles.holderProfile}>
                    <div className={styles.holderIcon}>
                      <User size={24} />
                    </div>
                    <div>
                      <h4>{asset.current_holder_name}</h4>
                      <p>{asset.current_holder_email}</p>
                    </div>
                  </div>
                  <div className={styles.allocationDates}>
                    <p>
                      <strong>Allocated At:</strong>{' '}
                      {asset.current_allocation_date
                        ? new Date(asset.current_allocation_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p>
                      <strong>Expected Return:</strong>{' '}
                      {asset.expected_return_date
                        ? new Date(asset.expected_return_date).toLocaleDateString()
                        : 'No expected date set'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyHolder}>
                  <p>This asset is currently in inventory and available for checkout.</p>
                  {canAllocateAsset(role) && (
                    <Button variant="primary" onClick={() => navigate('/allocation')}>
                      Allocate Now
                    </Button>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* History Timelines / Tabs */}
        <div className={styles.rightCol}>
          {/* Allocation History */}
          <Card className={styles.historyCard}>
            <CardHeader>
              <div className={styles.cardHeaderFlex}>
                <Clock size={16} />
                <span>Allocation History</span>
              </div>
            </CardHeader>
            <CardBody className={styles.historyList}>
              {allocations.length === 0 ? (
                <p className={styles.emptyText}>No historical checkout records found.</p>
              ) : (
                allocations.map((alloc) => (
                  <div key={alloc.id} className={styles.historyItem}>
                    <div className={styles.historyIcon}>
                      <ArrowLeftRight size={14} />
                    </div>
                    <div className={styles.historyDetails}>
                      <p>
                        Allocated to <strong>{alloc.holder?.full_name}</strong>
                      </p>
                      <p className={styles.historySub}>
                        {new Date(alloc.allocated_at).toLocaleDateString()} —{' '}
                        {alloc.returned_at
                          ? `Returned on ${new Date(alloc.returned_at).toLocaleDateString()} (${alloc.return_condition})`
                          : 'Active'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {/* Maintenance Records */}
          <Card className={styles.historyCard}>
            <CardHeader>
              <div className={styles.cardHeaderFlex}>
                <Wrench size={16} />
                <span>Maintenance History</span>
              </div>
            </CardHeader>
            <CardBody className={styles.historyList}>
              {maintenance.length === 0 ? (
                <p className={styles.emptyText}>No maintenance records found.</p>
              ) : (
                maintenance.map((req) => (
                  <div key={req.id} className={styles.historyItem}>
                    <div className={styles.historyIcon}>
                      <Wrench size={14} />
                    </div>
                    <div className={styles.historyDetails}>
                      <p>
                        <strong>{req.priority.toUpperCase()}</strong>: {req.description}
                      </p>
                      <p className={styles.historySub}>
                        Requested by {req.requester?.full_name} — Status: {req.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Asset Specifications" size="lg">
        <AssetForm asset={asset} onSubmit={handleEditSubmit} onCancel={() => setIsEditOpen(false)} />
      </Modal>
    </div>
  );
}
