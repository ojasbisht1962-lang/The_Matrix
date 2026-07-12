# DevA → DevB / DevC / DevD Handoff

> Branch `main` was force-pushed 2026-07-12. All DevA work is live.
> Each dev branches **from `main`** today.

---

## What DevA Delivered (on `main`)

### Database Migrations
| File | Contents |
|---|---|
| `001_enums.sql` | All enum types |
| `002_tables.sql` | All 13 tables (v1.1 — no `current_holder_id` on assets) |
| `003_indexes_constraints.sql` | Indexes + btree_gist exclusion |
| `004_helpers.sql` | `get_user_role`, `role_level`, `has_role_privilege` |
| `005_rls.sql` | Full RLS, hierarchy-aware |
| `006_triggers.sql` | Asset tag gen, new-user profile, mat-view refresh |
| `007_views.sql` | `asset_current_allocation`, `assets_enriched`, `dashboard_kpis`, `overdue_allocations` |
| `008_notification_helper.sql` | `create_notification()` function |
| `009_rpc_functions.sql` | 8 RPCs: allocate_asset, return_asset, approve_transfer, book_resource, approve_maintenance, resolve_maintenance, close_audit_cycle, create_audit_cycle |
| `010_analytics_functions.sql` | 6 analytics RPCs |
| `011_realtime.sql` | Realtime publication |
| `012_seed_admin_user.sql` | First admin + sample data |

### Frontend Files
| Path | Purpose |
|---|---|
| `src/supabase.js` | Singleton Supabase client |
| `src/lib/constants.js` | Enums, status labels, color maps |
| `src/lib/permissions.js` | `hasRolePrivilege`, canXxx helpers |
| `src/lib/formatters.js` | Date, currency, status formatters |
| `src/lib/validators.js` | All Zod schemas |
| `src/stores/authStore.js` | Zustand auth store |
| `src/hooks/useAuth.js` | `useAuthBootstrap` + `useAuth` |
| `src/hooks/useProfile.js` | Profile + optimistic update |
| `src/services/auth.service.js` | signIn/signUp/signOut/forgotPassword/uploadAvatar |
| `src/services/departments.service.js` | CRUD |
| `src/services/categories.service.js` | CRUD |
| `src/services/profiles.service.js` | Directory, role/dept assignment |
| `src/components/auth/ProtectedRoute.jsx` | Route guard |
| `src/components/auth/RoleGate.jsx` | RBAC gate |
| `src/pages/auth/LoginPage.jsx` | Screen 1 |
| `src/pages/auth/SignupPage.jsx` | Screen 1 |
| `src/pages/auth/ForgotPasswordPage.jsx` | Screen 1 |
| `src/pages/org-setup/OrgSetupPage.jsx` | Screen 3 container |
| `src/pages/org-setup/DepartmentsTab.jsx` | Screen 3A |
| `src/pages/org-setup/CategoriesTab.jsx` | Screen 3B |
| `src/pages/org-setup/EmployeeDirectoryTab.jsx` | Screen 3C |
| `src/components/forms/DepartmentForm.jsx` | Modal |
| `src/components/forms/CategoryForm.jsx` | Modal |
| `src/styles/variables.css` | Design tokens |
| `src/styles/reset.css` | CSS reset |
| `src/styles/global.css` | Utilities + Inter font |
| `src/routes.jsx` | Route config (additive) |
| `src/App.jsx` | Root: auth bootstrap + router + Toaster |
| `src/main.jsx` | Vite entry |

---

## API Contracts — What DevA Exports

### `src/hooks/useAuth.js`
```js
// useAuthBootstrap already mounted in App.jsx — do NOT call again
const { session, profile, isInitializing, isAuthenticated, role, error, isLoading } = useAuth();
```

### `src/hooks/useProfile.js`
```js
const { profile, updateProfile } = useProfile();
// profile: { id, full_name, email, role, department_id, avatar_url, status }
await updateProfile({ full_name: 'New Name' }); // optimistic
```

### `src/stores/authStore.js`
```js
import { useAuthStore, selectRole, selectProfile, selectIsAuthenticated } from '../stores/authStore';
const role = useAuthStore(selectRole);
// 'admin' | 'asset_manager' | 'department_head' | 'employee' | null
```

### `src/components/auth/RoleGate.jsx`
```jsx
<RoleGate requiredRole="asset_manager">
  <RegisterAssetButton />
</RoleGate>

<RoleGate requiredRole="admin" fallback={<Navigate to="/dashboard" replace />}>
  <AdminOnlyContent />
</RoleGate>
```

### `src/lib/permissions.js`
```js
import { canRegisterAsset, canAllocateAsset, canApproveMaintenance,
         canCreateAudit, canManageOrg, canViewAllAnalytics,
         canBookResource, canRaiseMaintenance, canApproveTransfer } from '../lib/permissions';

canRegisterAsset(role)         // asset_manager+
canAllocateAsset(role)         // asset_manager+
canApproveMaintenance(role)    // asset_manager+
canCreateAudit(role)           // admin only
canManageOrg(role)             // admin only
canViewAllAnalytics(role)      // asset_manager+
canBookResource(role)          // employee+ (all)
canRaiseMaintenance(role)      // employee+ (all)
canApproveTransfer(role, userDeptId, assetDeptId)  // asset_manager+ OR dept_head in same dept
```

### CSS Design Tokens (`src/styles/variables.css`)
```css
var(--color-primary)       /* #6366f1 */
var(--color-bg)            /* #080b12 */
var(--color-bg-elevated)   /* #111827 */
var(--color-border)        /* rgba(255,255,255,.07) */
var(--color-text)          /* #e2e8f0 */
var(--color-text-muted)    /* #94a3b8 */
var(--color-success)       /* #4ade80 */
var(--color-warning)       /* #fbbf24 */
var(--color-danger)        /* #f87171 */
var(--color-info)          /* #818cf8 */
var(--radius-sm/md/lg/xl)
var(--shadow-sm/md/lg)
var(--font-sans)           /* Inter */
```

---

## Developer B — Asset Core & UI Foundation

**Branch**: `git checkout -b DevB`

**Owns**:
- All shared UI: `src/components/ui/*` (Button, Input, Badge, Modal, Table, Card, Tabs, SearchBar, PageHeader, Spinner, EmptyState)
- App shell: `src/components/layout/AppShell.jsx`, `Sidebar.jsx`, `Topbar.jsx`
- `src/stores/uiStore.js`
- Screen 2 — Dashboard (`src/pages/dashboard/DashboardPage.jsx`)
- Screen 4 — Assets (`src/pages/assets/AssetsPage.jsx`, `AssetDetailPage.jsx`)
- Screen 5 — Allocation & Transfer (`src/pages/allocation/AllocationPage.jsx`)
- `src/services/assets.service.js`
- `src/services/allocations.service.js`
- `src/services/transfers.service.js`
- Appends routes to `src/routes.jsx`

**Key DB Notes**:
- `assets_enriched` view: has `current_holder_name`, `current_holder_id` — use for asset lists
- `overdue_allocations` view: pre-filtered overdue rows
- `dashboard_kpis` view: one call gets all KPIs

> [!CAUTION]
> `assets` table has NO `current_holder_id` column (v1.1 patch). Always use `assets_enriched` or `asset_current_allocation` view.

**RPCs**:
```js
supabase.rpc('allocate_asset', { p_asset_id, p_to_user_id, p_expected_return, p_notes })
supabase.rpc('return_asset', { p_allocation_id, p_condition, p_notes })
supabase.rpc('approve_transfer', { p_transfer_request_id })
```

---

## Developer C — Operations & Scheduling

**Branch**: `git checkout -b DevC`

**Owns**:
- Screen 6 — Resource Booking (`src/pages/bookings/BookingsPage.jsx`)
- Screen 7 — Maintenance (`src/pages/maintenance/MaintenancePage.jsx`) — Kanban
- `src/services/bookings.service.js`
- `src/services/maintenance.service.js`
- `src/components/forms/BookingForm.jsx`
- `src/components/forms/MaintenanceForm.jsx`

**Depends on A**: auth hooks, supabase client, RLS, RPCs
**Depends on B**: AppShell + all UI components (wait for DevB to land first)

**RPCs**:
```js
supabase.rpc('book_resource', { p_asset_id, p_start_time, p_end_time, p_notes })
// Throws Postgres error on overlap (btree_gist exclusion) — catch and show friendly message

supabase.rpc('approve_maintenance', { p_request_id })
supabase.rpc('resolve_maintenance', { p_request_id, p_resolution_notes })
```

**Maintenance status flow**: `pending → approved → technician_assigned → in_progress → resolved`

---

## Developer D — Compliance & Analytics

**Branch**: `git checkout -b DevD`

**Owns**:
- Screen 8 — Audit (`src/pages/audit/AuditPage.jsx`)
- Screen 9 — Reports (`src/pages/reports/ReportsPage.jsx`)
- Screen 10 — Activity Logs & Notifications (`src/pages/activity/ActivityLogsPage.jsx`, `NotificationsPage.jsx`)
- `src/services/audits.service.js`
- `src/services/analytics.service.js`
- `src/services/activityLogs.service.js`
- `src/services/notifications.service.js`
- `src/stores/notificationStore.js`
- `src/hooks/useRealtime.js`

**Depends on A**: all analytics RPCs already in DB, auth, supabase
**Depends on B**: AppShell + UI components

**Analytics RPCs (all ready in DB)**:
```js
supabase.rpc('get_utilization_by_department')
supabase.rpc('get_maintenance_frequency', { group_by: 'category' })
supabase.rpc('get_most_used_assets', { result_limit: 10 })
supabase.rpc('get_idle_assets', { days: 30 })
supabase.rpc('get_booking_heatmap')
supabase.rpc('get_department_allocation_summary')
```

**Audit RPCs**:
```js
supabase.rpc('create_audit_cycle', { p_name, p_scope_type, p_scope_value, p_start_date, p_end_date, p_auditor_ids })
supabase.rpc('close_audit_cycle', { p_cycle_id })
// DB trigger auto-marks unverified items as 'missing' on close
```

**Realtime notifications**:
```js
supabase.channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, handler)
  .subscribe()
```

---

## Critical Rules for ALL Devs

> [!IMPORTANT]
> DO NOT touch these files — DevA owns them:
> - `src/supabase.js`, `src/lib/*`, `src/styles/*`
> - `src/stores/authStore.js`
> - `src/hooks/useAuth.js`, `src/hooks/useProfile.js`
> - `src/services/auth.service.js`
> - `src/components/auth/*`
> - `src/main.jsx`, `src/App.jsx`
> - `supabase/migrations/*`

### Branch
```bash
git checkout main && git pull origin main
git checkout -b DevB   # or DevC, DevD
```

### Merge order
```
DevA (done) → DevB merges first → DevC and DevD after DevB
```
C and D **can build in parallel** but need DevB's AppShell to render inside it.

### CSS rules
Use CSS Modules (`.module.css`). Use DevA's design tokens. No TailwindCSS.

### Routes
DevB owns `src/routes.jsx`. DevC/D coordinate with DevB or each add to the ProtectedRoute children array:
```js
{ path: '/bookings', element: <BookingsPage /> }
{ path: '/maintenance', element: <MaintenancePage /> }
{ path: '/audit', element: <AuditPage /> }
```

### Commits
```
feat(b): dashboard + assets + allocation pages
feat(c): bookings calendar + maintenance kanban
feat(d): audit + reports + activity logs + notifications
```

### Env setup
```bash
cp .env.example .env.local
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```
