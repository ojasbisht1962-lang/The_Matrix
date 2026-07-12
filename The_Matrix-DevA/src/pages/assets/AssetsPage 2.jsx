// ============================================
// AssetsPage — catalog list of enterprise assets
// Handles sorting, filtering, searching, and registration modal
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAssets, createAsset } from '../../services/assets.service';
import { listCategories } from '../../services/categories.service';
import { listDepartments } from '../../services/departments.service';
import { useAuth } from '../../hooks/useAuth';
import { canRegisterAsset } from '../../lib/permissions';
import { ASSET_STATUSES, ASSET_STATUS_LABELS } from '../../lib/constants';
import {
  Table,
  Button,
  Badge,
  SearchBar,
  Select,
  Modal,
  PageHeader,
  EmptyState,
} from '../../components/ui';
import { AssetForm } from '../../components/forms/AssetForm';
import { Plus, Package, Info, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
// Let's import from CSS Modules
import pageStyles from './AssetsPage.module.css';

export default function AssetsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();

  // Catalog state
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filter/search state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Sorting state
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch lookups and assets
  useEffect(() => {
    async function loadLookups() {
      try {
        const [cats, depts] = await Promise.all([listCategories(), listDepartments()]);
        setCategories(cats || []);
        setDepartments(depts || []);
      } catch (err) {
        console.error('Failed loading lookups:', err);
      }
    }
    loadLookups();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await listAssets({
        status: statusFilter,
        categoryId: categoryFilter,
        departmentId: departmentFilter,
        search,
      });
      setAssets(data || []);
    } catch (err) {
      toast.error('Failed to load assets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [search, statusFilter, categoryFilter, departmentFilter]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Sort logic on front-end (or query-level sorting, front-end is fine for active lists)
  const sortedAssets = [...assets].sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];

    if (valA == null) return 1;
    if (valB == null) return -1;

    if (typeof valA === 'string') {
      return sortDir === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const handleRegisterSubmit = async (payload) => {
    try {
      await createAsset(payload);
      toast.success('Asset registered successfully!');
      setIsModalOpen(false);
      loadAssets();
    } catch (err) {
      toast.error(err.message || 'Failed to register asset');
      console.error(err);
    }
  };

  const columns = [
    { key: 'asset_tag', label: 'Tag', sortable: true, width: '12%' },
    { key: 'name', label: 'Asset Name', sortable: true, width: '25%' },
    { key: 'category_name', label: 'Category', sortable: true, width: '15%' },
    { key: 'department_name', label: 'Department', sortable: true, width: '18%' },
    { key: 'location', label: 'Location', sortable: true, width: '15%' },
    { key: 'status', label: 'Status', sortable: true, width: '15%' },
  ];

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
    <div className={pageStyles.container}>
      <PageHeader
        title="Assets Catalog"
        subtitle="Browse and register hardware, office resources, or equipment"
        actions={
          canRegisterAsset(role) && (
            <Button
              variant="primary"
              iconLeft={<Plus size={18} />}
              onClick={() => setIsModalOpen(true)}
            >
              Register Asset
            </Button>
          )
        }
      />

      {/* Filters row */}
      <div className={pageStyles.filtersBar}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search tag, name, user..."
          className={pageStyles.search}
        />
        <div className={pageStyles.selectFilters}>
          <Select
            placeholder="All Statuses"
            options={Object.entries(ASSET_STATUS_LABELS).map(([k, v]) => ({
              value: k,
              label: v,
            }))}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={pageStyles.filterSelect}
          />
          <Select
            placeholder="All Categories"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={pageStyles.filterSelect}
          />
          <Select
            placeholder="All Departments"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className={pageStyles.filterSelect}
          />
        </div>
      </div>

      {/* Catalog Table */}
      <Table
        columns={columns}
        data={sortedAssets}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        isLoading={loading}
        emptyState={
          <EmptyState
            icon={<Package size={36} />}
            title="No assets found"
            description="Try modifying your search or filter values to discover existing records."
          />
        }
        renderRow={(asset) => (
          <tr
            key={asset.id}
            onClick={() => navigate(`/assets/${asset.id}`)}
            className={pageStyles.tableRow}
          >
            <td className={pageStyles.tagCell}>{asset.asset_tag}</td>
            <td className={pageStyles.nameCell}>
              <div className={pageStyles.assetInfo}>
                {asset.photo_url ? (
                  <img
                    src={asset.photo_url}
                    alt={asset.name}
                    className={pageStyles.assetThumb}
                  />
                ) : (
                  <div className={pageStyles.assetThumbPlaceholder}>
                    <Package size={14} />
                  </div>
                )}
                <span>{asset.name}</span>
              </div>
            </td>
            <td>{asset.category_name}</td>
            <td>{asset.department_name || <span className={pageStyles.unassigned}>Unassigned</span>}</td>
            <td>{asset.location || '-'}</td>
            <td>
              <Badge variant={getStatusBadgeVariant(asset.status)} dot>
                {ASSET_STATUS_LABELS[asset.status] || asset.status}
              </Badge>
            </td>
          </tr>
        )}
      />

      {/* Register Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Asset"
        size="lg"
      >
        <AssetForm onSubmit={handleRegisterSubmit} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
