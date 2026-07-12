# Developer A — AssetFlow Implementation Plan

> All work on branch `DevA`. No direct pushes to `main`. Git operations done by user only.

## Pre-Requisites (User Actions)

> [!IMPORTANT]
> Before I start coding, you need to:
> 1. **Create a Supabase project** at [supabase.com](https://supabase.com) — get the **Project URL** and **Anon Key**
> 2. **Create branch `DevA`** from `main`: `git checkout -b DevA`
> 3. Share the Supabase URL + Anon Key with me

## Developer A Scope (from plan §10.1 + v1.1 patches)

### Phase 1 — Foundation (DB + Auth + Core Infra)

| # | Task | Files |
|---|------|-------|
| 1 | **Vite + React project scaffold** | `package.json`, `vite.config.js`, `index.html` |
| 2 | **Supabase migration: Enums** | `supabase/migrations/001_enums.sql` |
| 3 | **Supabase migration: Tables** (v1.1 — no `current_holder_id`/`expected_return_date` on assets) | `supabase/migrations/002_tables.sql` |
| 4 | **Supabase migration: Indexes + Constraints** (including `btree_gist` exclusion) | `supabase/migrations/003_indexes_constraints.sql` |
| 5 | **Supabase migration: Helper functions** (`get_user_role`, `get_user_department`, `role_level`, `has_role_privilege`) | `supabase/migrations/004_helpers.sql` |
| 6 | **Supabase migration: RLS policies** (all tables, v1.1 hierarchy-aware) | `supabase/migrations/005_rls.sql` |
| 7 | **Supabase migration: Triggers** (asset tag gen, new user profile, mat view refresh — retained per v1.1 §5.5) | `supabase/migrations/006_triggers.sql` |
| 8 | **Supabase migration: Views** (`asset_current_allocation` mat view, `assets_enriched`, `dashboard_kpis`, `overdue_allocations`) | `supabase/migrations/007_views.sql` |
| 9 | **Supabase migration: Notification helper** (`create_notification` function) | `supabase/migrations/008_notification_helper.sql` |
| 10 | **Supabase migration: RPC functions** (all 8: `allocate_asset`, `return_asset`, `approve_transfer`, `book_resource`, `approve_maintenance`, `resolve_maintenance`, `close_audit_cycle`, `create_audit_cycle`) | `supabase/migrations/009_rpc_functions.sql` |
| 11 | **Supabase migration: Analytics functions** (6 functions for reports) | `supabase/migrations/010_analytics_functions.sql` |
| 12 | **Supabase migration: Realtime publication** | `supabase/migrations/011_realtime.sql` |
| 13 | **Seed data** (admin user, sample departments, sample categories) | `supabase/seed.sql` |
| 14 | **Supabase client singleton** | `src/supabase.js` |
| 15 | **Environment setup** | `.env.local` (gitignored), `.env.example` |
| 16 | **Constants + Permissions** | `src/lib/constants.js`, `src/lib/permissions.js` |
| 17 | **Formatters + Validators** | `src/lib/formatters.js`, `src/lib/validators.js` |
| 18 | **Auth store (Zustand)** | `src/stores/authStore.js` |
| 19 | **Auth hooks** | `src/hooks/useAuth.js`, `src/hooks/useProfile.js` |
| 20 | **Auth service** | `src/services/auth.service.js` |
| 21 | **Auth components** | `src/components/auth/ProtectedRoute.jsx`, `src/components/auth/RoleGate.jsx` |

---

### Phase 2 — Auth Pages (Screen 1)

| # | Task | Files |
|---|------|-------|
| 22 | **Login page** | `src/pages/auth/LoginPage.jsx` |
| 23 | **Signup page** | `src/pages/auth/SignupPage.jsx` |
| 24 | **Forgot password page** | `src/pages/auth/ForgotPasswordPage.jsx` |

---

### Phase 3 — Organization Setup (Screen 3, Admin only)

| # | Task | Files |
|---|------|-------|
| 25 | **Departments service** | `src/services/departments.service.js` |
| 26 | **Categories service** | `src/services/categories.service.js` |
| 27 | **Profiles service** | `src/services/profiles.service.js` |
| 28 | **Org Setup page container** | `src/pages/org-setup/OrgSetupPage.jsx` |
| 29 | **Departments tab** | `src/pages/org-setup/DepartmentsTab.jsx` |
| 30 | **Categories tab** | `src/pages/org-setup/CategoriesTab.jsx` |
| 31 | **Employee Directory tab** | `src/pages/org-setup/EmployeeDirectoryTab.jsx` |
| 32 | **Form components** | `src/components/forms/DepartmentForm.jsx`, `src/components/forms/CategoryForm.jsx` |

---

### Phase 4 — App Entry + Routes (Developer A portion)

| # | Task | Files |
|---|------|-------|
| 33 | **App entry point** | `src/main.jsx`, `src/App.jsx` |
| 34 | **Route config** (A's routes only, additive pattern) | `src/routes.jsx` |
| 35 | **Global styles skeleton** | `src/styles/variables.css`, `src/styles/reset.css`, `src/styles/global.css` |

---

## Commit Strategy

Each phase = one commit on `DevA` branch:
1. `feat(a): scaffold vite + supabase migrations + seed`
2. `feat(a): auth infra — store, hooks, service, guards`
3. `feat(a): auth pages — login, signup, forgot password`
4. `feat(a): org setup — departments, categories, employee directory`
5. `feat(a): app entry, routes, global styles skeleton`

---

## Open Questions

> [!IMPORTANT]
> 1. **Supabase project**: You need to create it and share URL + anon key before I can wire `supabase.js`. Should I use placeholder values and you replace later, or wait?
> 2. **Supabase CLI**: Do you want me to use `supabase init` + local dev, or just create migration files you'll run manually via Supabase dashboard SQL editor?
> 3. **Storage buckets**: Plan calls for `asset-photos`, `asset-documents`, `maintenance-photos`. Want me to create these via migration SQL or you'll set them up in dashboard?
> 4. **Email confirmation**: Plan says email confirmation enabled. For dev/testing, want me to disable it initially so signup flow doesn't block?

## Verification Plan

### Automated Tests
- `npm run test` with Vitest for `permissions.js`, `validators.js`, `RoleGate`

### Manual Verification
- Sign up creates Employee profile
- Login/logout works
- RoleGate hides admin content for employees
- Org Setup CRUD for departments/categories/employees
- RLS blocks unauthorized access

## Git Instructions for You

Before I start coding:
```bash
git checkout -b DevA
```

After each phase, I'll tell you what to commit:
```bash
git add -A
git commit -m "feat(a): <message>"
git push origin DevA
```

When ready to merge to main:
```bash
git checkout main
git merge DevA
git push origin main
```
