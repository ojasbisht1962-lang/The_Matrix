// ============================================
// useRealtime Hook
// Subscribes to real-time database changes
// ============================================

import { useEffect } from 'react';
import { supabase } from '../supabase';
import { useNotificationStore } from '../stores/notificationStore';
import { listNotifications } from '../services/notifications.service';

/**
 * Custom hook to initialize notification list and subscribe to real-time notification inserts.
 * @param {string|null} userId
 */
export function useRealtime(userId) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  useEffect(() => {
    if (!userId) return;

    // Load initial notifications
    async function loadNotifications() {
      try {
        const data = await listNotifications();
        setNotifications(data || []);
      } catch (err) {
        console.error('Error loading initial notifications:', err);
      }
    }

    loadNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            addNotification(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addNotification, setNotifications]);
}
