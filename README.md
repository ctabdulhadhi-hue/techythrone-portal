# Techythrone Cybersecurity Challenge Portal 🛡️💻

A production-grade, state-of-the-art Cybersecurity Capture The Flag (CTF) Challenge Platform built for the **Techythrone Security Perimeter**.

Engineered with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Supabase (PostgreSQL, GoTrue Auth, Private Storage)**, this platform enforces a strict **Zero-Trust Security Architecture**, **Multi-Layer PostgreSQL Row-Level Security (RLS)**, a **5-Factor Secure Download Authorization Barrier**, and a **Cryptographically Secure CTF Flag Submission & Deterministic Leaderboard System**.

---

## 🌟 Key Features

- **Techythrone Cyber Aesthetic**: Immersive dark obsidian theme (`#090d16`), scanline grid backgrounds, terminal monospace typography, cyber emerald/cyan accents, and interactive simulated terminal heroes.
- **Cryptographic Flag Submission & Atomic Scoring**:
  - Keyed HMAC-SHA-256 flag digest verification with constant-time equality check (`crypto.timingSafeEqual`) to eliminate timing side-channels.
  - Race-safe atomic PostgreSQL function (`record_challenge_solve`) preventing double-point allocations and handling concurrent submissions cleanly.
  - Server-enforced rate limiting (max 5 failed submissions per minute per challenge).
  - Configurable platform flag format: `THR{...}`.
  - Plaintext flags and flag digests are strictly guarded from direct browser access via column-level security.
- **Global Operative Leaderboard (`/leaderboard`) & Dashboard Telemetry**:
  - Server-side aggregated leaderboard view (`public.leaderboard`) with deterministic tie-breaking: Total Points (DESC) → Solves Count (DESC) → Earliest Final Solve Timestamp (ASC) → Username Alphabetical.
  - Interactive top operatives telemetry widget embedded directly on the user dashboard.
- **Application-Level Download Verification Flow**:
  - Private challenge file attachments are protected by single-use, 15-minute expiring SHA-256 verification tokens delivered via transactional email.
  - Dashboard exploration, challenge browsing, and safe HTML preview sandbox are available immediately without download verification.
- **5-Factor Secure Attachment Downloads**: Challenge binaries and forensics images are stored in a private Supabase bucket and are strictly accessible via short-lived (60s) signed URLs after verifying:
  1. Authenticated session (`auth.getUser()`).
  2. Download verification status (`profiles.download_verified_at != null`).
  3. Active profile status (`is_active == true`).
  4. Published challenge status (or active admin clearance).
  5. Verified database association between attachment and requested challenge.
- **Defense-in-Depth PostgreSQL Security**:
  - Ordinary users are granted `UPDATE (display_name)` only; sensitive columns (`role`, `is_active`, `email`, `username`, `id`, `created_at`, `updated_at`, `download_verified_at`) are structurally immutable to non-admin callers.
  - Column privileges on `challenges.flag_hash` revoked from regular and anonymous callers.
  - `SECURITY INVOKER` trigger (`trg_01_guard_profile_escalation`) validates true caller identity and rejects unauthorized modifications.
  - `SECURITY DEFINER` timestamp trigger (`trg_02_update_profiles_timestamp`) safely maintains UTC timestamps using `pg_catalog.now()`.
- **Dedicated Admin Control Panel (`/admin`)**:
  - Telemetry overview: challenge lifecycle counts, registered operatives, encrypted payload storage metrics.
  - Challenge CRUD & lifecycle state machine (`draft` -> `published` -> `archived`) with flag configuration and point allocation (0 - 5000).
  - Private attachment payload manager with atomic upload, replace, and delete operations.
  - Operative management: promote vetted users to admin, suspend accounts, and built-in self-lockout prevention.
- **User Dashboard & Public Catalog**:
  - Filterable challenge catalog (Web, Crypto, Reverse Engineering, Forensics, Pwn, OSINT).
  - Mission briefing detail views with Markdown support, safe HTML previews, flag submission perimeter, and verified download gates.
  - Operative dashboard for callsign updates and solve metrics.
- **Automated Testing Suite**:
  - Comprehensive unit and security integration tests via **Vitest** (100% passing across 34 tests).
  - End-to-end tests via **Playwright**.
  - Automated **GitHub Actions CI** pipeline.

---

## 🏗️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16.4.2 (App Router, Turbopack) | Server Components, Server Actions, Route Handlers |
| **Language** | TypeScript 5 (Strict Mode) | Type-safe schema validation and server execution |
| **Styling** | Tailwind CSS v4 & Lucide React | High-contrast cyber terminal aesthetics & responsive layouts |
| **Database & Auth** | Supabase (PostgreSQL 15+, GoTrue) | Multi-factor auth, triggers, functions, column-level grants |
| **Storage** | Supabase Storage (`challenge-files`) | Zero-trust private bucket with ephemeral signed URLs |
| **Validation** | Zod 4 | Server-side runtime input validation |
| **Testing** | Vitest 5 & Playwright | Unit, security integration, and E2E automation |
| **CI/CD** | GitHub Actions | Automated linting, testing, and type checking |

---

## 🗄️ Database & Storage Architecture

### DDL Schema Overview
- `public.profiles`: User identity, callsigns, security roles (`user` | `admin`), and active flags.
- `public.challenges`: CTF objectives with status lifecycle (`draft` | `published` | `archived`), difficulty, and point awards.
- `public.challenge_attachments`: Metadata tracking private files stored in Supabase Storage.
- `public.challenge_solves`: Records completed objectives.

### Security Migrations
1. [`supabase/migrations/00001_initial_schema.sql`](supabase/migrations/00001_initial_schema.sql): Enums, table structures, foreign keys with cascading deletions, and `pg_catalog.now()` defaults.
2. [`supabase/migrations/00002_rls_and_triggers.sql`](supabase/migrations/00002_rls_and_triggers.sql):
   - Strict column privileges (`REVOKE UPDATE ON public.profiles FROM authenticated; GRANT UPDATE (display_name)...`).
   - Trigger `trg_01_guard_profile_escalation` (`SECURITY INVOKER`) guarding role and active status.
   - Trigger `trg_02_update_profiles_timestamp` (`SECURITY DEFINER`) advancing timestamps safely.
   - Comprehensive RLS policies across all tables.
   - Explicit `REVOKE EXECUTE ... FROM PUBLIC` on security functions.
3. [`supabase/migrations/00003_storage_policies.sql`](supabase/migrations/00003_storage_policies.sql): Private `challenge-files` bucket configuration with admin-only storage RLS.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- A Supabase project (Free or Pro tier)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/cybersecurity-challenge-portal.git
cd cybersecurity-challenge-portal
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your project credentials:
```env
# Public Supabase Connection (Client & Server)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-Only Secret (Never expose to client!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Apply Database Migrations
In your Supabase project's SQL Editor (or via Supabase CLI), run the migration files in order:
1. `supabase/migrations/00001_initial_schema.sql`
2. `supabase/migrations/00002_rls_and_triggers.sql`
3. `supabase/migrations/00003_storage_policies.sql`

### 4. Bootstrap Initial Administrator
Create an initial admin operative securely using the headless bootstrap script:
```bash
# New Admin Account
npm run bootstrap:admin -- --email admin@techythrone.ctf --password "ComplexAdminPass123!" --name "SecOps Lead"

# Promote Existing User to Admin
npm run bootstrap:admin -- --email existing@user.ctf --force
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🧪 Automated Testing

### Run Vitest Unit & Security Integration Tests
Executes schema validation, session assertion, profile immutability, and 5-factor download suites:
```bash
npm test
```

### Run Playwright End-to-End Tests
```bash
npm run test:e2e
```

### Run ESLint Quality Verification
```bash
npm run lint
```

---

## 📦 Production Deployment

### 1. Deploying to Vercel
1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Configure the Environment Variables in the Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your custom domain or vercel.app URL)
4. Deploy!

### 2. Configure Supabase Auth Redirects
In your Supabase Dashboard:
1. Navigate to **Authentication** > **URL Configuration**.
2. Set **Site URL** to: `https://your-domain.vercel.app`
3. Add **Redirect URL**: `https://your-domain.vercel.app/auth/callback`

---

## 🔒 Security Best Practices Checklist

- [x] Zero client-side exposure of `SUPABASE_SERVICE_ROLE_KEY` (guarded by `import 'server-only'`).
- [x] Ephemeral signed URLs with 60s expiration for challenge payload downloads.
- [x] Column-level SQL permission lockdown (`GRANT UPDATE (display_name)` only).
- [x] Multi-layer defense: independent `assertAdminSession()` server-side verification on all privileged routes and actions.
- [x] Full input sanitization with Zod before database operations.
- [x] Protection against self-demotion and self-deactivation for administrators.

---

## 📄 License
Created for Techythrone Internship Assessment. All rights reserved © 2026.
