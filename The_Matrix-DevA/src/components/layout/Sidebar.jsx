// ============================================
// Sidebar — main navigation
// Role-gated links, collapse support
// ============================================

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Calendar,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Activity,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { useUIStore, selectSidebarCollapsed } from '../../stores/uiStore';
import { useAuthStore, selectRole } from '../../stores/authStore';
import { hasRolePrivilege } from '../../lib/permissions';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    minRole: 'employee',
  },
  {
    key: 'assets',
    label: 'Assets',
    to: '/assets',
    icon: Package,
    minRole: 'employee',
  },
  {
    key: 'allocation',
    label: 'Allocation',
    to: '/allocation',
    icon: ArrowLeftRight,
    minRole: 'employee',
  },
  {
    key: 'bookings',
    label: 'Bookings',
    to: '/bookings',
    icon: Calendar,
    minRole: 'employee',
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    to: '/maintenance',
    icon: Wrench,
    minRole: 'employee',
  },
  {
    type: 'divider',
    key: 'div1',
    minRole: 'asset_manager',
  },
  {
    key: 'audit',
    label: 'Audit',
    to: '/audit',
    icon: ClipboardCheck,
    minRole: 'asset_manager',
  },
  {
    key: 'reports',
    label: 'Reports',
    to: '/reports',
    icon: BarChart3,
    minRole: 'asset_manager',
  },
  {
    key: 'activity',
    label: 'Activity Logs',
    to: '/activity',
    icon: Activity,
    minRole: 'asset_manager',
  },
  {
    type: 'divider',
    key: 'div2',
    minRole: 'admin',
  },
  {
    key: 'org-setup',
    label: 'Org Setup',
    to: '/org-setup',
    icon: Settings,
    minRole: 'admin',
  },
];

export function Sidebar() {
  const collapsed = useUIStore(selectSidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const role = useAuthStore(selectRole);

  const visibleItems = NAV_ITEMS.filter((item) =>
    hasRolePrivilege(role, item.minRole)
  );

  return (
    <aside className={[styles.sidebar, collapsed ? styles.collapsed : ''].join(' ')}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>
          <Boxes size={22} />
        </span>
        {!collapsed && (
          <span className={styles.logoText}>AssetFlow</span>
        )}
      </div>

      {/* Nav */}
      <nav className={styles.nav} aria-label="Main navigation">
        {visibleItems.map((item) => {
          if (item.type === 'divider') {
            return <div key={item.key} className={styles.divider} />;
          }

          const Icon = item.icon;

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.active : '']
                  .filter(Boolean)
                  .join(' ')
              }
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>
                <Icon size={18} />
              </span>
              {!collapsed && (
                <span className={styles.navLabel}>{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        className={styles.collapseBtn}
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
