// ============================================
// ActivityLogsPage — System Audit Logs
// Displays system actions chronological records
// ============================================

import { useState, useEffect } from 'react';
import { listActivityLogs } from '../../services/activityLogs.service';
import {
  Card,
  CardBody,
  Spinner,
  PageHeader,
  Button,
  Table,
  Badge
} from '../../components/ui';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import styles from './ActivityLogsPage.module.css';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchLogs() {
    try {
      setLoading(true);
      const offset = page * limit;
      const data = await listActivityLogs({ limit, offset });
      setLogs(data || []);
    } catch (err) {
      toast.error('Failed to load system activity logs');
    } finally {
      setLoading(false);
    }
  }

  const formatAction = (act) => {
    return act.replace('.', ' ').toUpperCase();
  };

  return (
    <div className={styles.activityPage}>
      <PageHeader
        title="System Activity Logs"
        subtitle="Chronological system-wide audit logs of all asset events and actions."
      />

      <Card>
        <CardBody>
          {loading ? (
            <div className={styles.spinnerWrapper}>
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <Table
                columns={[
                  { key: 'timestamp', label: 'Timestamp' },
                  { key: 'actor', label: 'Actor' },
                  { key: 'action', label: 'Action' },
                  { key: 'entity', label: 'Entity Scope' },
                  { key: 'meta', label: 'Transaction Details' }
                ]}
                data={logs}
                emptyState={<p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>No activity records found.</p>}
                renderRow={(log) => (
                  <tr key={log.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', padding: '12px 16px' }}>
                      <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div>
                        <strong>{log.profiles?.full_name || 'System'}</strong>
                        <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {log.profiles?.email || 'automated'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant={
                          log.action.includes('create') || log.action.includes('register') || log.action.includes('allocate')
                            ? 'success'
                            : log.action.includes('resolve') || log.action.includes('return')
                            ? 'info'
                            : log.action.includes('update') || log.action.includes('approve')
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {formatAction(log.action)}
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                        {log.entity_type} ({log.entity_id.slice(0, 8)})
                      </span>
                    </td>
                    <td>
                      <div className={styles.metaText} title={JSON.stringify(log.metadata, null, 2)}>
                        {JSON.stringify(log.metadata)}
                      </div>
                    </td>
                  </tr>
                )}
              />

              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                  Showing page {page + 1}
                </span>
                <div className={styles.paginationBtns}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    iconLeft={<ChevronLeft size={16} />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={logs.length < limit}
                    onClick={() => setPage((p) => p + 1)}
                    iconRight={<ChevronRight size={16} />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
