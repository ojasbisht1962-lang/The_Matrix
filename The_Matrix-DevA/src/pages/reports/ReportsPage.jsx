// ============================================
// ReportsPage — Compliance & System Analytics
// Displays visual system KPI reports, maintenance trends,
// asset activity metrics and reservation heatmaps.
// ============================================

import { useState, useEffect } from 'react';
import {
  getUtilizationByDepartment,
  getDepartmentAllocationSummary,
  getMaintenanceFrequency,
  getMostUsedAssets,
  getIdleAssets,
  getBookingHeatmap
} from '../../services/analytics.service';
import {
  Card,
  CardHeader,
  CardBody,
  Spinner,
  PageHeader,
  Button,
  Table,
  Badge,
  Tabs,
  Input,
  Select
} from '../../components/ui';
import {
  Building,
  Wrench,
  Activity,
  CalendarRange,
  RefreshCw,
  Clock,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './ReportsPage.module.css';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('alloc');
  const [loading, setLoading] = useState(true);

  // Data States
  const [utilization, setUtilization] = useState([]);
  const [allocationSummary, setAllocationSummary] = useState([]);
  const [maintenanceFreq, setMaintenanceFreq] = useState([]);
  const [maintGroupBy, setMaintGroupBy] = useState('category');
  const [mostUsed, setMostUsed] = useState([]);
  const [idleAssets, setIdleAssets] = useState([]);
  const [idleDays, setIdleDays] = useState(30);
  const [heatmapData, setHeatmapData] = useState([]);

  const tabs = [
    { key: 'alloc', label: 'Department Allocation', icon: <Building size={16} /> },
    { key: 'maint', label: 'Maintenance Trends', icon: <Wrench size={16} /> },
    { key: 'activity', label: 'Asset Activity', icon: <Activity size={16} /> },
    { key: 'heatmap', label: 'Booking Heatmap', icon: <CalendarRange size={16} /> }
  ];

  useEffect(() => {
    loadTabData();
  }, [activeTab, maintGroupBy]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTabData() {
    setLoading(true);
    try {
      if (activeTab === 'alloc') {
        const [utilData, allocSummaryData] = await Promise.all([
          getUtilizationByDepartment(),
          getDepartmentAllocationSummary()
        ]);
        setUtilization(utilData || []);
        setAllocationSummary(allocSummaryData || []);
      } else if (activeTab === 'maint') {
        const data = await getMaintenanceFrequency(maintGroupBy);
        setMaintenanceFreq(data || []);
      } else if (activeTab === 'activity') {
        const [usedData, idleData] = await Promise.all([
          getMostUsedAssets(10),
          getIdleAssets(idleDays)
        ]);
        setMostUsed(usedData || []);
        setIdleAssets(idleData || []);
      } else if (activeTab === 'heatmap') {
        const data = await getBookingHeatmap();
        setHeatmapData(data || []);
      }
    } catch (err) {
      toast.error('Failed to load report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Refetch idle assets specifically on filter change
  async function handleRefreshIdle() {
    try {
      setLoading(true);
      const data = await getIdleAssets(idleDays);
      setIdleAssets(data || []);
      toast.success(`Updated idle assets for past ${idleDays} days`);
    } catch (err) {
      toast.error('Failed to load idle assets');
    } finally {
      setLoading(false);
    }
  }

  // HEATMAP PROCESSING
  // bookingHeatmap returns TABLE(day_of_week INT, hour_of_day INT, booking_count BIGINT)
  const getHeatmapGrid = () => {
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxVal = 1; // avoid division by zero
    heatmapData.forEach((row) => {
      const dow = row.day_of_week;
      const hour = row.hour_of_day;
      const count = Number(row.booking_count);
      if (dow >= 0 && dow < 7 && hour >= 0 && hour < 24) {
        grid[dow][hour] = count;
        if (count > maxVal) maxVal = count;
      }
    });
    return { grid, maxVal };
  };

  const getHeatmapColorClass = (val, maxVal) => {
    if (val === 0) return styles.shade0;
    const ratio = val / maxVal;
    if (ratio <= 0.25) return styles.shade1;
    if (ratio <= 0.5) return styles.shade2;
    if (ratio <= 0.75) return styles.shade3;
    return styles.shade4;
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className={styles.reportsPage}>
      <PageHeader
        title="Compliance & Analytics Reports"
        subtitle="Review resource utilization, check maintenance trends, and schedule reports."
        action={
          <Button variant="secondary" iconLeft={<RefreshCw size={16} />} onClick={loadTabData} isLoading={loading}>
            Refresh Report
          </Button>
        }
      />

      <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab}>
        {loading ? (
          <div className={styles.spinnerWrapper}>
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* TABS CONTAINER */}
            {activeTab === 'alloc' && (
              <div className={styles.grid}>
                <Card>
                  <CardHeader>Utilization Summary by Department</CardHeader>
                  <CardBody>
                    <Table
                      columns={[
                        { key: 'department', label: 'Department' },
                        { key: 'allocated', label: 'Allocated' },
                        { key: 'total', label: 'Total Assets' },
                        { key: 'pct', label: 'Utilization' }
                      ]}
                      data={allocationSummary}
                      renderRow={(row, idx) => (
                        <tr key={idx}>
                          <td>{row.department_name}</td>
                          <td>{row.total_allocated}</td>
                          <td>{row.total_assets}</td>
                          <td>
                            <div style={{ width: 150 }}>
                              <div className={styles.progressLabel}>
                                <span>{row.utilization_pct}%</span>
                              </div>
                              <div className={styles.progressBarOuter}>
                                <div
                                  className={styles.progressBarInner}
                                  style={{ width: `${row.utilization_pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>Asset Availability Status</CardHeader>
                  <CardBody>
                    <Table
                      columns={[
                        { key: 'dept', label: 'Department' },
                        { key: 'available', label: 'Available' },
                        { key: 'allocated', label: 'Allocated' },
                        { key: 'maintenance', label: 'Under Maintenance' }
                      ]}
                      data={utilization}
                      renderRow={(row, idx) => (
                        <tr key={idx}>
                          <td>{row.department_name}</td>
                          <td>
                            <Badge variant="success">{row.available}</Badge>
                          </td>
                          <td>
                            <Badge variant="info">{row.allocated}</Badge>
                          </td>
                          <td>
                            <Badge variant="warning">{row.maintenance}</Badge>
                          </td>
                        </tr>
                      )}
                    />
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'maint' && (
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                    Maintenance Frequency
                  </h3>
                  <div className={styles.cardHeaderRight}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Group by:</span>
                    <Select
                      options={[
                        { value: 'category', label: 'Category' },
                        { value: 'asset', label: 'Asset Name' }
                      ]}
                      value={maintGroupBy}
                      onChange={(e) => setMaintGroupBy(e.target.value)}
                      style={{ width: 150 }}
                    />
                  </div>
                </div>
                <CardBody>
                  <Table
                    columns={[
                      { key: 'name', label: maintGroupBy === 'category' ? 'Category Name' : 'Asset Name' },
                      { key: 'count', label: 'Maintenance Requests Raised' }
                    ]}
                    data={maintenanceFreq}
                    renderRow={(row, idx) => (
                      <tr key={idx}>
                        <td>{row.group_name}</td>
                        <td>
                          <strong>{row.request_count}</strong> times
                        </td>
                      </tr>
                    )}
                  />
                </CardBody>
              </Card>
            )}

            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className={styles.grid}>
                  <Card>
                    <CardHeader>Most Booked Assets (Top 10)</CardHeader>
                    <CardBody>
                      <Table
                        columns={[
                          { key: 'tag', label: 'Asset Tag' },
                          { key: 'name', label: 'Asset Name' },
                          { key: 'bookings', label: 'Reservations Count' }
                        ]}
                        data={mostUsed}
                        renderRow={(row, idx) => (
                          <tr key={idx}>
                            <td>{row.asset_tag}</td>
                            <td>{row.asset_name}</td>
                            <td>
                              <Badge variant="info">{row.booking_count} bookings</Badge>
                            </td>
                          </tr>
                        )}
                      />
                    </CardBody>
                  </Card>

                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                      <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                        Idle Inventory Report
                      </h3>
                      <HelpCircle size={16} style={{ color: 'var(--color-text-muted)' }} title="Assets with no allocations or bookings for specified days." />
                    </div>
                    <CardBody>
                      <div className={styles.idleFilters}>
                        <Input
                          type="number"
                          label="Threshold (Days)"
                          value={idleDays}
                          onChange={(e) => setIdleDays(Number(e.target.value))}
                          style={{ width: 120 }}
                        />
                        <Button onClick={handleRefreshIdle}>Apply Filter</Button>
                      </div>
                      <Table
                        columns={[
                          { key: 'tag', label: 'Asset Tag' },
                          { key: 'name', label: 'Asset Name' },
                          { key: 'category', label: 'Category' },
                          { key: 'last_active', label: 'Last Activity' }
                        ]}
                        data={idleAssets}
                        renderRow={(row, idx) => (
                          <tr key={idx}>
                            <td>{row.asset_tag}</td>
                            <td>{row.asset_name}</td>
                            <td>{row.category}</td>
                            <td>
                              {row.last_activity ? new Date(row.last_activity).toLocaleDateString() : 'Never'}
                            </td>
                          </tr>
                        )}
                      />
                    </CardBody>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'heatmap' && (
              <Card>
                <CardHeader>Resource Reservation Heatmap (Hours vs Weekday)</CardHeader>
                <CardBody>
                  <div className={styles.heatmapWrapper}>
                    <div className={styles.heatmapGrid}>
                      {/* Grid Header Hours 0 - 23 */}
                      <div className={styles.heatmapHeaderCell}>Day \ Hour</div>
                      {Array.from({ length: 24 }).map((_, h) => (
                        <div key={h} className={styles.heatmapHeaderCell}>
                          {h.toString().padStart(2, '0')}
                        </div>
                      ))}

                      {/* Grid Rows */}
                      {daysOfWeek.map((dayName, dIndex) => {
                        const { grid, maxVal } = getHeatmapGrid();
                        return (
                          <>
                            <div key={`day-${dIndex}`} className={styles.heatmapRowLabel}>
                              {dayName.slice(0, 3)}
                            </div>
                            {Array.from({ length: 24 }).map((_, hIndex) => {
                              const value = grid[dIndex][hIndex];
                              return (
                                <div
                                  key={`cell-${dIndex}-${hIndex}`}
                                  className={[
                                    styles.heatmapCell,
                                    getHeatmapColorClass(value, maxVal)
                                  ].join(' ')}
                                  title={`${dayName} at ${hIndex.toString().padStart(2, '0')}:00 — ${value} bookings`}
                                >
                                  {value}
                                </div>
                              );
                            })}
                          </>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.heatmapLegend}>
                    <div className={styles.legendItem}>
                      <div className={[styles.legendBox, styles.shade0].join(' ')} />
                      <span>No Bookings</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={[styles.legendBox, styles.shade1].join(' ')} />
                      <span>Low Density</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={[styles.legendBox, styles.shade2].join(' ')} />
                      <span>Medium Density</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={[styles.legendBox, styles.shade3].join(' ')} />
                      <span>High Density</span>
                    </div>
                    <div className={styles.legendItem}>
                      <div className={[styles.legendBox, styles.shade4].join(' ')} />
                      <span>Peak Bookings</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
