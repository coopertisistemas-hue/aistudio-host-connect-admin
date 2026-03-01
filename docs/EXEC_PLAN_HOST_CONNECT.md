# Host Connect Execution Plan (CONNECT Governance)

## Context

This execution plan organizes delivery for `aistudio-host-connect-admin` under CONNECT governance, using confirmed project facts and existing artifacts as source of truth.

- Scale baseline: 16 modules, ~95 screens, 67 hooks.
- Security baseline: multi-tenant scoping is PASS with `org_id`/`property_id` patterns.
- RLS baseline: 54/56 tables with RLS enabled (96%).
- Active blocker:
  - `public.precheckin_sessions` has RLS disabled.
  - `public.precheckin_sessions` is missing `org_id`.
- Known gaps:
  - P1: bulk room status updates, room categories CRUD completion, services/amenities pages.
  - P2: limited dashboard charts, no PDF/Excel export, OTA live status missing.
- Existing implementation artifacts:
  - `docs/AUDIT_MODULES.md`
  - `docs/UI_CRUD_STANDARD.md`
  - `docs/QA_BOOKINGS.md`
  - `docs/TENANT_SELECTOR.md`
  - `src/components/TenantSelector.tsx` (exists, pending layout wiring)
  - `src/pages/ReportPage.tsx` (exists, route wiring may be pending in `src/App.tsx`)
- STAGING pilot data (UPH):
  - `property_id`: `22222222-2222-2222-2222-222222222222`
  - `room_types`: 9
  - `rooms`: 44
  - onboarding mode: `hotel`

## Objectives

1. Remove tenant-security blocker (P0) and validate RLS-first posture.
2. Complete P1 operational capabilities with consistent CRUD/list/form/report standards.
3. Deliver P2 premium analytics/reporting behavior with tenant-aware filters and exports.
4. Prepare integration contracts (Host <-> Reserve <-> Portal) with explicit boundaries and RLS contract checks.
5. Enforce sprint-level QA gates and mandatory git sync after sprint approval.

## Principles and Non-Negotiables

- RLS-first and tenant isolation by default on all tenant data.
- No cross-tenant reads/writes; all flows scoped by `org_id` and `property_id`.
- Role gating is explicit (super_admin, org-level, property-level staff behavior as defined by product rules).
- Premium UI consistency across list/form/report pages (aligned with `docs/UI_CRUD_STANDARD.md`).
- Tenant selector behavior follows `docs/TENANT_SELECTOR.md` and is visible only where allowed by role.
- Dashboards/reports must be smart, filterable, and tenant-aware.
- Export support includes CSV and print view suitable for PDF generation.
- i18n quality: PT/EN/ES compatibility for labels/messages where the feature already follows i18n patterns.
- Do not introduce undocumented modules/tables; use existing architecture and contracts.

## Delivery Model

- Sprint sequence: `SP0 -> SP1 -> SP2 -> SP3`.
- End of each sprint:
  - QA gate must be PASS with stored evidence.
  - GO decision is required before merge.
  - Mandatory git sync: commit(s) + push + PR update.
- Evidence storage convention:
  - `docs/qa/SP0/`
  - `docs/qa/SP1/`
  - `docs/qa/SP2/`
  - `docs/qa/SP3/`

---

## Sprint 0 - Security P0 + Baseline Wiring

### Sprint Goal

Close the P0 security blocker in pre-checkin tenant isolation and complete baseline UI wiring already implemented (`TenantSelector`, `ReportPage` route).

### In Scope

- Database hardening for `public.precheckin_sessions`:
  - add `org_id` if absent
  - enable RLS
  - define tenant-scoped policies consistent with project patterns
- Baseline wiring:
  - integrate `src/components/TenantSelector.tsx` in the intended layout/header flow
  - wire `src/pages/ReportPage.tsx` route in `src/App.tsx`
- Minimal docs updates for implementation and QA evidence indexing.

### Out of Scope

- Dashboard/chart expansion.
- New export engines beyond baseline report wiring.
- New modules or unrelated refactors.

### Deliverables

- DB:
  - migration(s) for `precheckin_sessions` tenant compliance (`org_id`, RLS, policies)
- Code:
  - route wiring for report page
  - tenant selector integration in layout with role-based visibility
- Docs:
  - SP0 QA evidence index and validation notes

### QA Gate Checklist

- Manual:
  - verify Report route loads and respects auth/role expectations
  - verify TenantSelector visibility/behavior by role
  - verify no tenant context loss when switching org/property
- Automated/Scripted:
  - build passes (`pnpm build`)
  - lint passes if configured (`pnpm lint`)
  - SQL validations pass for RLS on `precheckin_sessions`

### Evidence Required

- psql output proving:
  - `precheckin_sessions` now has `org_id`
  - RLS enabled
  - policies present
- screenshots:
  - TenantSelector rendered in layout
  - Report route page access
- logs:
  - build/lint output captured in sprint evidence folder

### GO / NO-GO Criteria

- GO:
  - P0 table is tenant-compliant (`org_id` + RLS + policy checks PASS)
  - baseline wiring complete and functional
  - no tenant leakage in manual checks
- NO-GO:
  - any failed RLS/tenant check
  - route/layout integration regressions

### Rollback Notes

- DB rollback via down migration for SP0 changes.
- Feature rollback by reverting wiring commits (route/layout) while preserving unrelated work.
- If rollback is triggered, restore previous stable tag and re-run SP0 QA gate.

### Sync-to-Git Rules (Mandatory After SP0 Approval)

- Branch: `feat/sp0-security-baseline`
- Commit format: Conventional Commits with sprint tag
  - `fix(sp0,security): enforce precheckin_sessions tenant RLS`
  - `feat(sp0,ui): wire tenant selector and report route`
- PR checklist must be complete before merge (see standard checklist section).

---

## Sprint 1 - Operational Gaps (P1)

### Sprint Goal

Close operational feature gaps for day-to-day property operations using the established CRUD standard.

### In Scope

- Bulk room status updates.
- Room categories CRUD completion.
- Services management pages.
- Amenities management pages.
- Standardization to list/form/report behavior from `docs/UI_CRUD_STANDARD.md`.

### Out of Scope

- New BI/advanced charting.
- Cross-system integration changes.
- OTA live status implementation.

### Deliverables

- Code/UI:
  - bulk status update user flow with tenant/role checks
  - complete CRUD flows for room categories
  - services pages aligned to standard patterns
  - amenities pages aligned to standard patterns
- QA docs:
  - task matrix covering create/read/update/delete and guardrails per feature

### QA Gate Checklist

- Manual:
  - execute CRUD checklist for room categories/services/amenities
  - execute bulk room status scenarios (single property and role restrictions)
  - verify table/list filters preserve selected tenant context
- Automated/Scripted:
  - build/lint
  - smoke flow covering operations pages
  - tenant leakage negative tests (wrong property/org context)

### Evidence Required

- screenshots for list/form/report parity (before/after where relevant)
- scenario logs for bulk room status operations
- SQL evidence validating no cross-tenant records affected
- build/lint outputs

### GO / NO-GO Criteria

- GO:
  - all P1 scoped features delivered and QA PASS
  - role and tenant scoping validated across actions
  - UI behavior consistent with CRUD standards
- NO-GO:
  - any incomplete CRUD path
  - any leakage or role bypass

### Rollback Notes

- Revert feature commits by scope (`bulk-status`, `room-categories`, `services`, `amenities`) if regressions appear.
- Keep security fixes from SP0 intact; rollback only SP1 deltas.

### Sync-to-Git Rules (Mandatory After SP1 Approval)

- Branch: `feat/sp1-operations-crud`
- Commit format examples:
  - `feat(sp1,rooms): add bulk room status updates`
  - `feat(sp1,crud): complete room categories services amenities flows`
- Push and open/update PR only after QA evidence is stored under `docs/qa/SP1/`.

---

## Sprint 2 - Smart Dashboards + Exports (P2)

### Sprint Goal

Elevate analytics/reporting with smart filters and export capabilities while preserving tenant/role safety and premium consistency.

### In Scope

- Expand dashboard charts beyond current limited set.
- Smart filters (date, tenant/property, operational slices as supported by existing data).
- Export capabilities:
  - CSV export
  - print view designed for PDF generation
- Role and tenant-aware behavior across dashboards/reports.

### Out of Scope

- New data warehouse architecture.
- External BI platform integrations.
- OTA live status implementation if it requires new backend contracts not yet available.

### Deliverables

- Code/UI:
  - upgraded dashboard/reporting screens with premium, consistent patterns
  - CSV export actions
  - print styles/views suitable for browser print-to-PDF
- QA docs:
  - export validation matrix (CSV content accuracy, print layout quality)

### QA Gate Checklist

- Manual:
  - verify filter interactions and tenant scope retention
  - verify print view readability and pagination behavior
  - verify export actions available only to allowed roles
- Automated/Scripted:
  - build/lint
  - smoke checks for key dashboard/report routes
  - data spot checks between UI aggregates and SQL totals

### Evidence Required

- screenshots of dashboard states + filter scenarios
- sample CSV artifacts and print-to-PDF outputs
- SQL-to-UI comparison logs for selected metrics
- build/lint outputs

### GO / NO-GO Criteria

- GO:
  - smart dashboard/report interactions operate correctly for tenant/role contexts
  - CSV and print-to-PDF flows validated
  - premium UI consistency accepted against standard
- NO-GO:
  - metric mismatch without explanation
  - export inaccuracies or access control gaps

### Rollback Notes

- Revert chart/export commits if regressions; preserve stable reporting baseline.
- Maintain feature flags/toggles where possible for safe disablement.

### Sync-to-Git Rules (Mandatory After SP2 Approval)

- Branch: `feat/sp2-smart-dashboards-exports`
- Commit format examples:
  - `feat(sp2,dashboard): add smart tenant-aware charts`
  - `feat(sp2,report): add csv export and print pdf view`
- Push only after QA evidence is added to `docs/qa/SP2/`.

---

## Sprint 3 - Integration Preparation (Plan/Contracts)

### Sprint Goal

Prepare integration-ready contracts for Host <-> Reserve <-> Portal and define boundaries for edge functions and RLS contracts, without forcing unready code.

### In Scope

- Contract definitions for key data exchanges and ownership boundaries.
- Edge function boundary mapping (input/output, auth context, tenant context).
- RLS contract checks for integration paths.
- Plan-level readiness checklist for implementation phase.

### Out of Scope

- Full production integration rollout if dependencies are not ready.
- New schema/modules beyond confirmed architecture.

### Deliverables

- Docs/Contracts:
  - integration contract matrix
  - edge function boundary specification
  - RLS contract validation plan
- Optional code stubs only if approved and dependency-ready.

### QA Gate Checklist

- Manual review:
  - architecture + security review sign-off
  - contract walkthrough across teams
- Automated/Scripted (if stubs exist):
  - build/lint
  - contract test skeleton execution

### Evidence Required

- signed contract review notes
- boundary diagrams/tables
- RLS contract check outputs

### GO / NO-GO Criteria

- GO:
  - contract set approved by responsible teams
  - RLS contract checks defined and validated for planned paths
- NO-GO:
  - unresolved ownership/security ambiguities

### Rollback Notes

- If stubs introduced, revert stubs and keep approved documentation baseline.

### Sync-to-Git Rules (Mandatory After SP3 Approval)

- Branch: `chore/sp3-integration-prep`
- Commit format examples:
  - `docs(sp3,contracts): define host-reserve-portal boundaries`
  - `docs(sp3,security): add rls contract validation plan`
- Push only after evidence is stored under `docs/qa/SP3/`.

---

## Standard PR Checklist (Required for Every Sprint)

- `pnpm build` PASS.
- `pnpm lint` PASS (if available in repository scripts).
- Sprint smoke checklist executed and PASS.
- RLS validation steps executed (including target tables impacted by sprint).
- Tenant leakage checks executed:
  - wrong `org_id` and wrong `property_id` negative scenarios
  - role boundary checks (super_admin vs org/property-level users)
- Evidence files attached/linked from the sprint QA folder.
- Rollback notes updated for actual delivered deltas.

## Mandatory psql Validation Snippets

Use `psql` against STAGING with approved credentials handling. Store command outputs in sprint evidence.

### 1) RLS Enabled Check (focus on `precheckin_sessions`)

```sql
-- List RLS status for public tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Direct check for blocker table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'precheckin_sessions';

-- Confirm org_id column existence on blocker table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'precheckin_sessions'
  AND column_name = 'org_id';

-- List policies for blocker table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'precheckin_sessions';
```

### 2) UPH Pilot Data Count Checks

```sql
-- Room types expected: 9
SELECT COUNT(*) AS room_types_count
FROM public.room_types
WHERE property_id = '22222222-2222-2222-2222-222222222222';

-- Rooms expected: 44
SELECT COUNT(*) AS rooms_count
FROM public.rooms
WHERE property_id = '22222222-2222-2222-2222-222222222222';
```

### 3) UPH Rooms Status Distribution (Pilot)

```sql
SELECT status, COUNT(*) AS qty
FROM public.rooms
WHERE property_id = '22222222-2222-2222-2222-222222222222'
GROUP BY status
ORDER BY status;
```

## Definition of Done (Program-Level)

- SP0 through SP3 completed with QA PASS and git sync after each sprint approval.
- P0 blocker resolved and verified by SQL evidence.
- P1 operational gaps addressed with CRUD standard consistency.
- P2 smart dashboards and export flows validated for tenant/role-aware behavior.
- Integration preparation contracts approved with RLS boundary checks defined.
- Evidence archive complete under `docs/qa/` for auditability.
