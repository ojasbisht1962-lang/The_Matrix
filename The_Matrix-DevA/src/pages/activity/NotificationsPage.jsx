// ============================================
// NotificationsPage — User Notifications
// Reviews personal alerts and logs
// ============================================

import { useState } from 'react';
import { useAuthStore, selectProfile } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import {
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification
} from '../../services/notifications.service';
import {
  Card,
  CardBody,
  PageHeader,
  Button
} from '../../components/ui';
import {
  Bell,
  Check,
  Trash2,
  CheckSquare,
  Package,
  Wrench,
  Calendar,
  AlertTriangle,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './NotificationsPage.module.css';

export default function NotificationsPage() {
  const profile = useAuthStore(selectProfile);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);

  const handleMarkAsRead = async (id) => {
    try {
      await apiMarkAsRead(id);
      markAsRead(id);
      toast.success('Notification marked as read');
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      await apiMarkAllAsRead(profile.id);
      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to update all notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiDeleteNotification(id);
      removeNotification(id);
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'asset_assigned':
        return <Package size={18} />;
      case 'maintenance_approved':
      case 'maintenance_assigned':
      case 'maintenance_resolved':
        return <Wrench size={18} />;
      case 'booking_confirmed':
        return <Calendar size={18} />;
      case 'audit_discrepancy_flagged':
        return <AlertTriangle size={18} />;
      case 'transfer_approved':
      case 'transfer_requested':
        return <Building size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  return (
    <div className={styles.notificationsPage}>
      <PageHeader
        title="Notifications & Alerts"
        subtitle="Manage your personal updates, system messages, and event allocations."
        action={
          unreadCount > 0 && (
            <Button
              variant="secondary"
              iconLeft={<CheckSquare size={16} />}
              onClick={handleMarkAllRead}
              isLoading={loading}
            >
              Mark All as Read
            </Button>
          )
        }
      />

      <Card>
        <CardBody>
          {notifications.length === 0 ? (
            <div className={styles.emptyText}>
              <Bell size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
              <p>You have no notifications yet.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={[
                    styles.item,
                    !notif.is_read ? styles.itemUnread : ''
                  ].join(' ')}
                >
                  <div
                    className={[
                      styles.iconWrapper,
                      !notif.is_read ? styles.iconWrapperUnread : ''
                    ].join(' ')}
                  >
                    {getIcon(notif.type)}
                  </div>
                  <div className={styles.content}>
                    <div className={styles.titleRow}>
                      <h4 className={styles.title}>{notif.title}</h4>
                      <span className={styles.time}>
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className={styles.message}>{notif.message}</p>
                    <div className={styles.actions}>
                      {!notif.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<Check size={14} />}
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<Trash2 size={14} />}
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(notif.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
