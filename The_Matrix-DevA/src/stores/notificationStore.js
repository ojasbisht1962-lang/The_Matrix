// ============================================
// Notification Store (Zustand v5)
// Tracks unread notifications and handles real-time updates
// ============================================

import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notification) => {
    const { notifications } = get();
    // Check if notification already exists to prevent duplicates
    if (notifications.some((n) => n.id === notification.id)) return;

    const updated = [notification, ...notifications];
    const unreadCount = updated.filter((n) => !n.is_read).length;
    set({ notifications: updated, unreadCount });
  },

  markAsRead: (id) => {
    const { notifications } = get();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    const unreadCount = updated.filter((n) => !n.is_read).length;
    set({ notifications: updated, unreadCount });
  },

  markAllAsRead: () => {
    const { notifications } = get();
    const updated = notifications.map((n) => ({ ...n, is_read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },

  removeNotification: (id) => {
    const { notifications } = get();
    const updated = notifications.filter((n) => n.id !== id);
    const unreadCount = updated.filter((n) => !n.is_read).length;
    set({ notifications: updated, unreadCount });
  }
}));
