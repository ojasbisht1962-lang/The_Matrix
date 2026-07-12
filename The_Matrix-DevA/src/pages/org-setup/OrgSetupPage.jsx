// ============================================
// OrgSetupPage — Screen 3 (Admin only)
// Tab container: Departments | Categories | Employees
// ============================================

import { useState } from 'react';
import { Building2, Tag, Users, Layers } from 'lucide-react';
import DepartmentsTab from './DepartmentsTab';
import CategoriesTab from './CategoriesTab';
import EmployeeDirectoryTab from './EmployeeDirectoryTab';
import styles from './orgSetup.module.css';

const TABS = [
  { id: 'departments', label: 'Departments', icon: Building2, component: DepartmentsTab },
  { id: 'categories',  label: 'Categories',  icon: Tag,       component: CategoriesTab },
  { id: 'employees',   label: 'Employees',   icon: Users,     component: EmployeeDirectoryTab },
];

export default function OrgSetupPage() {
  const [activeTab, setActiveTab] = useState('departments');

  const { component: ActiveComponent } = TABS.find((t) => t.id === activeTab);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLogo}>
          <div className={styles.headerLogoIcon}><Layers size={18} strokeWidth={1.8} /></div>
          AssetFlow
        </div>
        <span className={styles.headerSep}>/</span>
        <span className={styles.headerTitle}>Organization Setup</span>
      </header>

      {/* Body */}
      <div className={styles.body}>
        <h1 className={styles.pageTitle}>Organization Setup</h1>
        <p className={styles.pageSub}>
          Configure departments, asset categories, and manage your team.
        </p>

        {/* Tab nav */}
        <nav className={styles.tabs} aria-label="Org Setup sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(id)}
              aria-selected={activeTab === id}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Active tab content */}
        <ActiveComponent />
      </div>
    </div>
  );
}
