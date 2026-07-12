# ⚙️ AssetFlow — Complete Setup Guide

> **AssetFlow** is an Enterprise Asset & Resource Management System built with React 19, Vite 8, Supabase, and Zustand. This guide walks you through everything needed to get the project running locally from scratch.

---

## 📋 Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Tech Stack Overview](#2-tech-stack-overview)
3. [All Dependencies](#3-all-dependencies)
4. [Project Structure](#4-project-structure)
5. [Environment Setup](#5-environment-setup)
6. [Supabase Setup](#6-supabase-setup)
7. [Installation & Running Locally](#7-installation--running-locally)
8. [Database Migrations](#8-database-migrations)
9. [Available Scripts](#9-available-scripts)
10. [Roles & Auth Flow](#10-roles--auth-flow)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. System Requirements

Before you begin, make sure the following are installed on your machine:

| Tool | Minimum Version | How to Check | Download |
|------|----------------|--------------|----------|
| **Node.js** | v18.0.0+ (v20 LTS recommended) | `node -v` | [nodejs.org](https://nodejs.org) |
| **npm** | v9.0.0+ | `npm -v` | Bundled with Node.js |
| **Git** | Any recent version | `git --version` | [git-scm.com](https://git-scm.com) |
| **A Supabase account** | Free tier works | — | [supabase.com](https://supabase.com) |

> **Windows users**: Use PowerShell or Windows Terminal. Node.js must be added to your PATH during installation.

---

## 2. Tech Stack Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | ^19.2.7 | UI component model |
| **Build Tool** | Vite | ^8.1.1 | Dev server + bundler |
| **Language** | JavaScript (JSX) | ES Modules | App logic |
| **Backend / BaaS** | Supabase | ^2.110.2 | Auth, Database, Storage, Realtime |
| **State Management** | Zustand | ^5.0.14 | Global client-side state |
| **Data Fetching** | TanStack Query | ^5.101.2 | Server state, caching, sync |
| **Routing** | React Router DOM | ^7.18.1 | Client-side navigation |
| **Forms** | React Hook Form | ^7.81.0 | Performant form handling |
| **Form Validation** | Zod | ^4.4.3 | Schema-based validation |
| **Form Resolvers** | @hookform/resolvers | ^5.4.0 | Zod <-> RHF bridge |
| **Icons** | Lucide React | ^1.24.0 | SVG icon library |
| **Notifications** | Sonner | ^2.0.7 | Toast notifications |
| **Date Utilities** | date-fns | ^4.4.0 | Date formatting & math |
| **Linter** | Oxlint | ^1.71.0 | Fast JS linting |

---

## 3. All Dependencies

### Production Dependencies

```json
{
  "@hookform/resolvers": "^5.4.0",
  "@supabase/supabase-js": "^2.110.2",
  "@tanstack/react-query": "^5.101.2",
  "date-fns": "^4.4.0",
  "lucide-react": "^1.24.0",
  "react": "^19.2.7",
  "react-dom": "^19.2.7",
  "react-hook-form": "^7.81.0",
  "react-router-dom": "^7.18.1",
  "sonner": "^2.0.7",
  "zod": "^4.4.3",
  "zustand": "^5.0.14"
}
```

#### Dependency Details

| Package | Version | What it does |
|---------|---------|-------------|
| `@hookform/resolvers` | ^5.4.0 | Connects Zod schema validation to React Hook Form — eliminates boilerplate validation code |
| `@supabase/supabase-js` | ^2.110.2 | Official Supabase JS client. Handles Auth, Postgres queries via PostgREST, Storage bucket uploads, and Realtime subscriptions |
| `@tanstack/react-query` | ^5.101.2 | Manages async server state — caching, background refetching, pagination, optimistic updates |
| `date-fns` | ^4.4.0 | Lightweight, tree-shakeable date utility library (formatting, comparison, arithmetic) |
| `lucide-react` | ^1.24.0 | Beautiful, consistent SVG icon set with React components |
| `react` | ^19.2.7 | Core React library — UI rendering |
| `react-dom` | ^19.2.7 | DOM-specific React rendering |
| `react-hook-form` | ^7.81.0 | Performant forms library — uncontrolled inputs, minimal re-renders |
| `react-router-dom` | ^7.18.1 | Client-side routing — supports nested routes, loaders, protected routes |
| `sonner` | ^2.0.7 | Opinionated, beautiful toast notification system |
| `zod` | ^4.4.3 | TypeScript-first schema validation — used for form input validation |
| `zustand` | ^5.0.14 | Minimal, fast global state management — used for auth + profile state |

---

### Dev Dependencies

```json
{
  "@types/react": "^19.2.17",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^6.0.3",
  "oxlint": "^1.71.0",
  "vite": "^8.1.1"
}
```

| Package | Version | What it does |
|---------|---------|-------------|
| `@types/react` | ^19.2.17 | TypeScript types for React (used by IDE IntelliSense) |
| `@types/react-dom` | ^19.2.3 | TypeScript types for React DOM |
| `@vitejs/plugin-react` | ^6.0.3 | Vite plugin — enables JSX transform, Fast Refresh (HMR) |
| `oxlint` | ^1.71.0 | Extremely fast Rust-based JS/TS linter |
| `vite` | ^8.1.1 | Next-gen frontend build tool — instant HMR, optimized production builds |

---

## 4. Project Structure

```
The_Matrix-DevA/
├── index.html                    # HTML entry point
├── vite.config.js                # Vite configuration
├── package.json                  # npm dependencies & scripts
├── SETUP.md                      # This file — full setup guide
├── .env.example                  # Environment variable template
├── .env.local                    # Your actual secrets (NEVER commit)
├── .gitignore
├── .oxlintrc.json                # Oxlint configuration
│
├── public/                       # Static assets (served as-is)
│
├── src/
│   ├── main.jsx                  # App bootstrap — renders <App /> into #root
│   ├── App.jsx                   # Root component — router + providers
│   ├── App.css                   # App-level styles
│   ├── index.css                 # Global CSS reset & design tokens
│   ├── supabase.js               # Supabase client singleton
│   │
│   ├── stores/
│   │   └── authStore.js          # Zustand auth store (session, profile, loading, error)
│   │
│   ├── services/
│   │   └── auth.service.js       # Supabase auth & profile API calls
│   │
│   ├── hooks/
│   │   ├── useAuth.js            # Auth bootstrap hook + consumer hook
│   │   └── useProfile.js         # Profile-specific hook
│   │
│   ├── components/               # Reusable UI components
│   ├── pages/                    # Page-level components (routes)
│   ├── lib/                      # Shared utilities
│   └── assets/                   # Images, SVGs
│
└── supabase/
    ├── seed.sql                  # Seed data for development
    └── migrations/               # Database migration files (run in order)
        ├── 001_enums.sql
        ├── 002_tables.sql
        ├── 003_indexes_constraints.sql
        ├── 004_helpers.sql
        ├── 005_rls.sql
        ├── 006_triggers.sql
        ├── 007_views.sql
        ├── 008_notification_helper.sql
        ├── 009_rpc_functions.sql
        ├── 010_analytics_functions.sql
        └── 011_realtime.sql
```

---

## 5. Environment Setup

The app requires two environment variables to connect to Supabase.

### Step 1 — Open `.env.local`

The file `.env.local` exists in the project root. Open it and fill in your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### Step 2 — Get your Supabase credentials

1. Log in at [supabase.com](https://supabase.com)
2. Open your project dashboard
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → paste as `VITE_SUPABASE_URL`
   - **anon / public** key → paste as `VITE_SUPABASE_PUBLISHABLE_KEY`

> **Important**: The `VITE_` prefix is required — Vite only exposes variables that start with `VITE_` to the browser. Never use the `service_role` key on the frontend.

---

## 6. Supabase Setup

### Option A — Use Supabase Cloud (Recommended)

1. Sign up at [supabase.com](https://supabase.com) (free tier available)
2. Create a new project and wait for provisioning (~1–2 minutes)
3. Go to **SQL Editor** in the dashboard
4. Run each migration file in order (see [Database Migrations](#8-database-migrations))

### Option B — Local Supabase (Docker required)

> Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```powershell
# Install Supabase CLI via npm
npm install -g supabase

# Start local Supabase stack
supabase start

# Apply migrations
supabase db push

# Get local credentials (use these in .env.local)
supabase status
```

---

## 7. Installation & Running Locally

### Step 1 — Navigate to the project

```powershell
cd The_Matrix-DevA\The_Matrix-DevA
```

### Step 2 — Install all dependencies

```powershell
npm install
```

Expected output:
```
added 47 packages, and audited 48 packages
found 0 vulnerabilities
```

### Step 3 — Configure environment variables

Edit `.env.local` with your Supabase credentials (see [Environment Setup](#5-environment-setup) above).

### Step 4 — Apply database migrations

Run each file in `supabase/migrations/` in order via Supabase SQL Editor (see [Database Migrations](#8-database-migrations)).

### Step 5 — Start the development server

```powershell
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 8. Database Migrations

Run these SQL files in **Supabase SQL Editor** in the following order:

| Order | File | Description |
|-------|------|-------------|
| 1 | `001_enums.sql` | Custom PostgreSQL enum types (roles, statuses, categories) |
| 2 | `002_tables.sql` | Core tables: `profiles`, `assets`, `departments`, `requests` |
| 3 | `003_indexes_constraints.sql` | Performance indexes and foreign key constraints |
| 4 | `004_helpers.sql` | Utility/helper functions used by other migrations |
| 5 | `005_rls.sql` | Row Level Security policies (data access control per role) |
| 6 | `006_triggers.sql` | DB triggers (e.g., auto-create profile on user signup) |
| 7 | `007_views.sql` | PostgreSQL views for complex joined queries |
| 8 | `008_notification_helper.sql` | Notification system helper functions |
| 9 | `009_rpc_functions.sql` | RPC functions callable from the frontend |
| 10 | `010_analytics_functions.sql` | Analytics/reporting aggregate functions |
| 11 | `011_realtime.sql` | Enable Supabase Realtime on relevant tables |

#### How to run in Supabase Cloud:

1. Go to your project → **SQL Editor** → **+ New Query**
2. Copy & paste the content of each `.sql` file
3. Click **Run** — repeat for each file in order

#### Optionally seed development data:

After all migrations, run `supabase/seed.sql` to populate sample data.

---

## 9. Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR at `localhost:5173` |
| `npm run build` | Build optimized production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint linter on all source files |

---

## 10. Roles & Auth Flow

### User Roles

| Role | Access Level |
|------|-------------|
| `employee` | View own assets, submit requests |
| `department_head` | Manage their department's assets & requests |
| `asset_manager` | Full asset CRUD, approve/reject requests |
| `admin` | Full system access including user management |

### Authentication Flow

```
App mounts
   |
   +-- useAuthBootstrap() mounted in App.jsx
         |
         +-- supabase.auth.getSession()
               |
               +-- No session  --> setInitializing(false)
               |
               +-- Session exists --> fetchProfile(userId)
                                          |
                                          v
                                   setProfile(data)
                                   setInitializing(false)
         |
         +-- onAuthStateChange() [runs for all future auth events]

Router renders based on state:
   - isInitializing = true  --> Loading spinner
   - isAuthenticated = true --> Protected routes (Dashboard, etc.)
   - isAuthenticated = false --> Auth routes (Login, Register)
```

### Zustand Auth Store State

| Key | Type | Description |
|-----|------|-------------|
| `session` | `Session \| null` | Supabase session (persisted to localStorage) |
| `profile` | `Profile \| null` | User profile from `public.profiles` table |
| `isInitializing` | `boolean` | `true` while waiting for initial session check |
| `isLoading` | `boolean` | `true` during any auth operation |
| `error` | `string \| null` | Last error message |

---

## 11. Troubleshooting

### Missing Supabase environment variables

**Cause**: `.env.local` is missing or has placeholder values.
**Fix**: Edit `.env.local` and paste your actual Supabase project URL and anon key.

---

### `supabase` is not recognized (CLI error)

**Cause**: Supabase CLI is not installed.
**Fix**: The CLI is only needed for local Docker setup. For cloud Supabase, run migrations manually in the SQL Editor — no CLI needed.

---

### Port `5173` already in use

**Fix**: Kill the process using the port:

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

---

### `PGRST116` error (profile row not found)

**Cause**: User signed up but the `profiles` row wasn't created (trigger may be delayed).
**Fix**: Handled gracefully in `auth.service.js` — returns `null`. Ensure `006_triggers.sql` migration has been applied.

---

### All DB queries return empty / RLS blocking

**Cause**: Row Level Security is active but user is unauthenticated.
**Fix**: Ensure the user is signed in before any queries. Check that `005_rls.sql` migration ran successfully.

---

### `node_modules not found` / import errors

**Fix**: Re-run install from the correct directory:

```powershell
cd The_Matrix-DevA\The_Matrix-DevA
npm install
```

---

## Quick Start Reference

```powershell
# 1. Install
npm install

# 2. Fill in .env.local with Supabase credentials

# 3. Run migrations 001 to 011 in Supabase SQL Editor

# 4. Start dev server
npm run dev

# Visit http://localhost:5173
```

---

*Setup guide for AssetFlow — The Matrix Dev A. For architecture details, see `implementation_plan.md` and `architecture_patch_v1.1.md`.*
