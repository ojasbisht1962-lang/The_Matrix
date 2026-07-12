// ============================================
// AppShell — layout container for protected routes
// Wraps Sidebar, Topbar, and children outlets
// ============================================

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppShell.module.css';

export default function AppShell() {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <Topbar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
