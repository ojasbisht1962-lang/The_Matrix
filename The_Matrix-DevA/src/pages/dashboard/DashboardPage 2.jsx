// ============================================
// DashboardPage — Enterprise KPI dashboard
// Displays high-level metrics, active indicators, and recent logs
// ============================================

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Wrench,
  ArrowLeftRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardBody, Spinner, PageHeader } from '../../components/ui';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch KPIs
        const { data: kpiData, error: kpiError } = await supabase
          .from('dashboard_kpis')
          .select('*')
          .single();

        if (kpiError) throw kpiError;
        setKpis(kpiData);

        // Fetch recent activities
        const { data: actData, error: actError } = await supabase
          .from('activity_logs')
          .select('*, actor:profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(5);

        if (actError) throw actError;
        setActivities(actData || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className={styles.spinnerWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <AlertTriangle size={32} className={styles.errorIcon} />
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  const kpiItems = [
    {
      title: 'Available Assets',
      value: kpis?.assets_available ?? 0,
      icon: CheckCircle,
      colorClass: styles.available,
      desc: 'Ready for allocation',
    },
    {
      title: 'Allocated Assets',
      value: kpis?.assets_allocated ?? 0,
      icon: Package,
      colorClass: styles.allocated,
      desc: 'Currently in use',
    },
    {
      title: 'Active Bookings',
      value: kpis?.active_bookings ?? 0,
      icon: Calendar,
      colorClass: styles.bookings,
      desc: 'Upcoming & ongoing',
    },
    {
      title: 'Maintenance Today',
      value: kpis?.maintenance_today ?? 0,
      icon: Wrench,
      colorClass: styles.maintenance,
      desc: 'Active requests today',
    },
    {
      title: 'Pending Transfers',
      value: kpis?.pending_transfers ?? 0,
      icon: ArrowLeftRight,
      colorClass: styles.transfers,
      desc: 'Awaiting approvals',
    },
    {
      title: 'Overdue Returns',
      value: kpis?.overdue_returns ?? 0,
      icon: AlertTriangle,
      colorClass: styles.overdue,
      desc: 'Require attention',
    },
  ];

  return (
    <div className={styles.dashboard}>
      <PageHeader
        title="Dashboard"
        subtitle="System metrics and recent activity overview"
      />

      <div className={styles.metricsGrid}>
        {kpiItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className={styles.kpiCard}>
              <div className={styles.kpiInner}>
                <div className={styles.kpiInfo}>
                  <p className={styles.kpiTitle}>{item.title}</p>
                  <p className={styles.kpiValue}>{item.value}</p>
                  <p className={styles.kpiDesc}>{item.desc}</p>
                </div>
                <div className={[styles.kpiIconWrapper, item.colorClass].join(' ')}>
                  <Icon size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className={styles.contentLayout}>
        {/* Recent Activity */}
        <Card className={styles.activityCard}>
          <CardHeader>Recent System Activity</CardHeader>
          <CardBody>
            {activities.length === 0 ? (
              <p className={styles.emptyText}>No recent activity logs found.</p>
            ) : (
              <ul className={styles.activityList}>
                {activities.map((act) => (
                  <li key={act.id} className={styles.activityItem}>
                    <div className={styles.actIcon}>
                      <Clock size={16} />
                    </div>
                    <div className={styles.actDetails}>
                      <p className={styles.actText}>
                        <span className={styles.actorName}>
                          {act.actor?.full_name || 'System'}
                        </span>{' '}
                        performed <strong>{act.action}</strong> on{' '}
                        {act.entity_type}
                      </p>
                      <p className={styles.actTime}>
                        {new Date(act.created_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Quick Actions Panel */}
        <Card className={styles.quickActionsCard}>
          <CardHeader>Enterprise Utilities</CardHeader>
          <CardBody className={styles.quickActionsBody}>
            <div className={styles.actionItem}>
              <TrendingUp size={18} className={styles.actionIcon} />
              <div>
                <h4>System Optimization</h4>
                <p>Ensure resources are balanced and allocations conform to organizational rules.</p>
              </div>
            </div>
            <div className={styles.actionItem}>
              <CheckCircle size={18} className={styles.actionIcon} />
              <div>
                <h4>Audit Cycles</h4>
                <p>Auditors can verify compliance and review hardware inventories dynamically.</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
