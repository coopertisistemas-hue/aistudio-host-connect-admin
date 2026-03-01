# SP0-A DB Hardening Plan (STAGING)

Scope:
- Database security hardening only (no application code changes).
- Priority is tenant isolation and RLS enforcement under CONNECT governance.
- Primary target starts with pre-checkin data path hardening.

Reference inputs:
- `docs/db/SUPABASE_SCHEMA_STAGING_2026-03-01.sql`
- `docs/db/SCHEMA_AUDIT_STAGING_2026-03-01.md`
- `ai/CONNECT_GUARDRAILS.md`

## SP0-A Goal

Eliminate P0 tenant-isolation risks in pre-checkin tables, standardize policy posture, and produce verifiable evidence pack for QA gate.

## Current State Snapshot (from STAGING dump)

- `public.precheckin_sessions`
  - `org_id`: present
  - RLS: enabled
  - policies: 1 (SELECT policy)
- `public.pre_checkin_sessions`
  - `org_id`: present
  - RLS: disabled
  - policies: 0
- `public.pre_checkin_submissions`
  - `org_id`: present
  - RLS: disabled
  - policies: 0

Interpretation:
- P0 remains active because underscore tables are not protected.
- Naming split (`precheckin_*` vs `pre_checkin_*`) is a hardening risk and must be controlled.

## SP0-A Execution Checklist

### A. Baseline and freeze

- [ ] Confirm authoritative data path in code and API usage (`precheckin_sessions` vs `pre_checkin_sessions`) before DDL.
- [ ] Freeze schema changes outside SP0-A window.
- [ ] Create migration file(s) only (idempotent style, no ad-hoc dashboard SQL).

### B. Start with `precheckin_sessions` (mandatory first check)

- [ ] Re-validate `org_id` existence.
- [ ] Re-validate RLS is enabled.
- [ ] Re-validate policy set aligns with CONNECT contract.
- [ ] If write operations are required by product flow, add explicit write policies:
  - org member SELECT
  - org admin INSERT/UPDATE/DELETE
  - optional super_admin override (if role model uses it)

Note:
- In the current dump, `precheckin_sessions` already has `org_id` and RLS enabled.
- Action is verify + normalize policy model, not schema addition (unless new gap appears).

### C. Harden `pre_checkin_sessions` (P0)

- [ ] Keep `org_id` as NOT NULL tenant key.
- [ ] Add `property_id` only if pre-checkin workflow is property-scoped in product contract (`UNKNOWN` from schema alone).
- [ ] Backfill strategy (if adding column):
  - derive from booking/property relation where available
  - fallback null-handling strategy approved before NOT NULL enforcement
- [ ] Enable RLS.
- [ ] Create explicit policies:
  - SELECT: org member or super_admin
  - INSERT/UPDATE/DELETE: org admin (or stricter) or super_admin
- [ ] Add essential indexes:
  - `(org_id)`
  - `(org_id, booking_id)`
  - `(org_id, token)`
  - if `property_id` adopted: `(org_id, property_id)` and common access composites

### D. Harden `pre_checkin_submissions` (P0)

- [ ] Keep `org_id` as NOT NULL tenant key.
- [ ] Add `property_id` only if parent/session contract requires property scope (`UNKNOWN` pending domain decision).
- [ ] Backfill strategy (if adding column):
  - derive from parent session then booking/property
- [ ] Enable RLS.
- [ ] Create policies:
  - SELECT: org member or super_admin
  - INSERT/UPDATE/DELETE: org admin (or dedicated role) or super_admin
- [ ] Add essential indexes:
  - `(org_id)`
  - `(org_id, session_id)`
  - `(org_id, status)`
  - if `property_id` adopted: `(org_id, property_id)` and query-path composites

### E. Policy contract standardization (CONNECT)

- [ ] Align pre-checkin policy names and semantics with org-based standards.
- [ ] Ensure policy expressions use existing helper functions where available:
  - `public.is_org_member(uuid)`
  - `public.is_org_admin(uuid)`
  - `public.is_super_admin()`
- [ ] Remove/replace temporary broad policies if discovered.
- [ ] Document final policy matrix in QA evidence.

### F. Naming convergence decision

- [ ] Decide canonical table family (`precheckin_*` or `pre_checkin_*`).
- [ ] If consolidation is required, execute via staged migration plan (copy, dual-write window, cutover, cleanup).
- [ ] Mark final decision and risks in migration notes.

## Suggested Migration Skeleton (Idempotent Pattern)

```sql
-- Example skeleton: adjust names/columns to approved contract

-- 1) Ensure tenant columns
ALTER TABLE public.pre_checkin_sessions
  ADD COLUMN IF NOT EXISTS org_id uuid;

-- Optional and contract-dependent
-- ALTER TABLE public.pre_checkin_sessions
--   ADD COLUMN IF NOT EXISTS property_id uuid;

-- 2) Backfill (example pattern; exact joins depend on canonical relations)
-- UPDATE public.pre_checkin_sessions s
-- SET org_id = b.org_id
-- FROM public.bookings b
-- WHERE s.booking_id = b.id
--   AND s.org_id IS NULL;

-- 3) Enforce nullability when safe
-- ALTER TABLE public.pre_checkin_sessions
--   ALTER COLUMN org_id SET NOT NULL;

-- 4) Enable RLS
ALTER TABLE public.pre_checkin_sessions ENABLE ROW LEVEL SECURITY;

-- 5) Policy templates (drop/recreate pattern)
DROP POLICY IF EXISTS pre_checkin_sessions_org_member_select ON public.pre_checkin_sessions;
CREATE POLICY pre_checkin_sessions_org_member_select
ON public.pre_checkin_sessions
FOR SELECT
USING (public.is_super_admin() OR public.is_org_member(org_id));

DROP POLICY IF EXISTS pre_checkin_sessions_org_admin_write ON public.pre_checkin_sessions;
CREATE POLICY pre_checkin_sessions_org_admin_write
ON public.pre_checkin_sessions
FOR ALL
USING (public.is_super_admin() OR public.is_org_admin(org_id))
WITH CHECK (public.is_super_admin() OR public.is_org_admin(org_id));

-- 6) Essential indexes
CREATE INDEX IF NOT EXISTS idx_pre_checkin_sessions_org_id
  ON public.pre_checkin_sessions(org_id);
```

## psql Validation Pack (Required Evidence)

Use these queries after migration apply. Store outputs in sprint evidence.

### 1) RLS status check

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('precheckin_sessions', 'pre_checkin_sessions', 'pre_checkin_submissions')
ORDER BY tablename;
```

### 2) Policy listing check

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('precheckin_sessions', 'pre_checkin_sessions', 'pre_checkin_submissions')
ORDER BY tablename, policyname;
```

### 3) Tenant column presence check

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('precheckin_sessions', 'pre_checkin_sessions', 'pre_checkin_submissions')
  AND column_name IN ('org_id', 'property_id')
ORDER BY table_name, column_name;
```

### 4) Essential index check

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('precheckin_sessions', 'pre_checkin_sessions', 'pre_checkin_submissions')
ORDER BY tablename, indexname;
```

### 5) Tenant negative-test guidance (conceptual)

```sql
-- Conceptual flow only; exact role/session setup depends on environment auth harness.
-- Goal: prove tenant A cannot read tenant B rows.

-- Step A: set tenant context for org A, query count
-- SELECT set_config('app.current_org_id', '<org_a_uuid>', true);
-- SELECT count(*) FROM public.pre_checkin_sessions;

-- Step B: set tenant context for org B, query count
-- SELECT set_config('app.current_org_id', '<org_b_uuid>', true);
-- SELECT count(*) FROM public.pre_checkin_sessions;

-- Expected: no cross-tenant visibility.
```

## QA Gate (SP0-A PASS Criteria)

- [ ] No pre-checkin table remains with RLS disabled.
- [ ] Policy matrix exists and follows org-member/org-admin/super-admin governance.
- [ ] Tenant negative tests show no leakage.
- [ ] Required tenant indexes are present.
- [ ] Evidence stored under sprint QA docs with SQL outputs and migration references.

## Rollback Notes

- For each migration, provide explicit down migration steps (drop new policies/indexes, disable/revert only if safe and approved).
- If a new tenant column is added, rollback must preserve data integrity (no destructive drop without backup/export).
- In incident mode, prefer temporary policy lockdown (deny-by-default) over reverting tenant constraints.
