# DR0 Drift Inventory (STAGING vs Repo Migrations)

Date: 2026-03-01  
Scope: structural drift inventory from `docs/db/SUPABASE_SCHEMA_STAGING_2026-03-01.sql` vs `supabase/migrations/*.sql`  
Governance baseline: `AI_RULES.md`, `ai/CONNECT_GUARDRAILS.md`, `ai/CONNECT_QA_GATES.md`

## 1) Table Inventory

Decision labels:
- `KEEP`: object is expected in the reconciled target model.
- `DROP`: object should be removed from reconciled target model.
- `BACKPORT`: object must be added to repo migrations if STAGING behavior is retained.
- `DEFER`: requires GP/Orchestrator decision before structural action.

### 1.1 Missing in STAGING (expected by repo)

| Table | Decision | Rationale |
|---|---|---|
| `public.booking_groups` | `KEEP` | Present in migration history and tied to booking domain model; absence in STAGING is drift. |
| `public.property_photos` | `KEEP` | Present in migration history and tied to media/storage workflow; absence in STAGING is drift. |

Execution interpretation:
- If Path A (Repo SSOT): recreate in STAGING via migrations (`BACKPORT` to STAGING state).
- If Path B (STAGING SSOT): either backport equivalent replacement objects into repo or formally `DROP` from future model (GP decision required).

### 1.2 Extra in STAGING (not represented in repo)

| Table | Decision | Rationale |
|---|---|---|
| `public.departments` | `DEFER` | Not in migration chain; likely operational module. Needs product ownership confirmation. |
| `public.entity_photos` | `DEFER` | Appears to overlap with photo/media concerns; risk of model duplication. |
| `public.expenses` | `DEFER` | Financial-like domain table; requires GP confirmation before keep/drop. |
| `public.faqs` | `DEFER` | Marketing/content-style object; unclear if in UPH pilot scope. |
| `public.features` | `DEFER` | Marketing/content-style object; unclear if in UPH pilot scope. |
| `public.how_it_works_steps` | `DEFER` | Marketing/content-style object; unclear if in UPH pilot scope. |
| `public.integrations` | `DEFER` | Potentially strategic integration catalog; must be explicitly versioned if retained. |
| `public.invoices` | `DEFER` | Commercial/financial impact; requires GP sign-off for retention model. |
| `public.lead_timeline_events` | `DEFER` | CRM/sales domain outside confirmed migration model. |
| `public.notifications` | `DEFER` | Cross-cutting domain object; requires clear ownership and policy model. |
| `public.pricing_plans` | `DEFER` | Commercial domain object; requires business decision for pilot. |
| `public.reservation_leads` | `DEFER` | Reservation funnel object not represented in repo migrations. |
| `public.reservation_quotes` | `DEFER` | Reservation quoting object not represented in repo migrations. |
| `public.shift_assignments` | `DEFER` | Ops/staff scheduling domain outside current migration model. |
| `public.shift_handoffs` | `DEFER` | Ops/staff scheduling domain outside current migration model. |
| `public.shifts` | `DEFER` | Ops/staff scheduling domain outside current migration model. |
| `public.staff_profiles` | `DEFER` | Staff domain object with unclear target architecture. |
| `public.stock_check_items` | `DEFER` | Inventory module object outside repo migration chain. |
| `public.stock_daily_checks` | `DEFER` | Inventory module object outside repo migration chain. |
| `public.stock_items` | `DEFER` | Inventory module object outside repo migration chain. |
| `public.stock_locations` | `DEFER` | Inventory module object outside repo migration chain. |
| `public.stock_movements` | `DEFER` | Inventory ledger-like object; high integrity requirements. |
| `public.tasks` | `DEFER` | Task management object not represented in repo migrations. |
| `public.testimonials` | `DEFER` | Marketing/content object not represented in repo migrations. |

GP decision block for extra tables:
- Option A (`DROP` in STAGING): table is out of approved UPH pilot scope; remove through audited migration.
- Option B (`BACKPORT` to repo): table is in approved scope; create migration(s), RLS, indexes, triggers, tests, and docs.

## 2) RLS / Policy Drift Inventory

Reference expectation: tenant tables must have RLS and explicit CRUD coverage (`SELECT/INSERT/UPDATE/DELETE`) unless policy uses `FOR ALL`.

### 2.1 RLS enablement drift

| Table | Drift | Risk | Priority |
|---|---|---|---|
| `public.booking_groups` | Expected by repo but table absent in STAGING | Missing tenant boundary for expected domain path | `P0` |
| `public.property_photos` | Expected by repo but table absent in STAGING | Missing tenant boundary for expected media path | `P0` |

### 2.2 CRUD policy coverage gaps on expected RLS tables

| Table | Missing command coverage | Risk | Priority |
|---|---|---|---|
| `public.audit_log` | `INSERT`, `UPDATE`, `DELETE` | Incomplete explicit policy model; access intent unclear | `P1` |
| `public.booking_groups` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | No effective policy model due object absence | `P0` |
| `public.booking_guests` | `INSERT`, `UPDATE`, `DELETE` | Potential write-path denial or inconsistent auth behavior | `P1` |
| `public.hostconnect_staff` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Staff access model undefined/implicit | `P0` |
| `public.idea_comments` | `UPDATE`, `DELETE` | Incomplete mutation policy path | `P1` |
| `public.ideas` | `DELETE` | Incomplete mutation policy path | `P1` |
| `public.invoices` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Financial domain with undefined policy model | `P0` |
| `public.member_permissions` | `INSERT`, `UPDATE`, `DELETE` | Role/permission model may be inconsistent | `P0` |
| `public.org_invites` | `INSERT`, `UPDATE`, `DELETE` | Invite lifecycle access not fully defined | `P1` |
| `public.org_members` | `INSERT`, `UPDATE`, `DELETE` | Membership mutation path may be inconsistent | `P0` |
| `public.organizations` | `DELETE` | Partial lifecycle controls | `P1` |
| `public.precheckin_sessions` | `INSERT`, `UPDATE`, `DELETE` | Session lifecycle not fully covered | `P0` |
| `public.profiles` | `DELETE` | Profile lifecycle mismatch between environments | `P1` |
| `public.property_photos` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | No effective policy model due object absence | `P0` |
| `public.ticket_comments` | `UPDATE`, `DELETE` | Partial mutation policy controls | `P1` |
| `public.tickets` | `DELETE` | Partial mutation policy controls | `P1` |

### 2.3 Policy mismatch inventory (name/set drift)

Observed:
- Missing in STAGING vs repo expected policies: 84
- Extra in STAGING policies: 27
- Table+command mismatch pairs: 79

Interpretation:
- This is not only naming drift. Policy sets differ per command in multiple tables, indicating authorization model divergence.

### 2.4 Potential tenant-leakage policy candidates (manual security review required)

Policies that are likely permissive and require GP + Security explicit acceptance:
- Public-read style policies:
  - `faqs` public read
  - `features` public read
  - `pricing_plans` public read
  - `how_it_works_steps` public read
  - `website_settings` public read variants
- Broad authenticated-profile read/write patterns:
  - `profiles_read_authenticated`
  - `profiles_insert_self`
  - `profiles_update_self`
- Invite/token lookups:
  - `org_invites` token lookup style policy

Risk rule:
- Any policy with unscoped `USING (true)` or equivalent broad condition on tenant data is `P0` until proved safe by negative tests.

## 3) Nonstandard Migration Filename Inventory

Files requiring GP/Orchestrator decision for canonical ordering policy:
- `20260119_sprint2_guest_domain_model.sql`
- `20260120_sprint2.2_submissions.sql`
- `20260121_hotfix_status_constraint.sql`
- `20260121_housekeeping_foundation.sql`
- `20260121_operational_alerts_tables.sql`
- `add_phone_to_profiles_and_sync_trigger.sql`
- `fixes_trial_limit_logic.sql`
- `ROLLBACK_20251226170000_enforce_org_isolation.sql`

Decision options:
- Option A: keep files but introduce a canonical replay manifest and CI drift check.
- Option B: normalize into timestamped forward migrations; keep rollback scripts out of replay sequence.

## 4) DR0 Inventory Gate Status

- Gate status: `BLOCKED`
- Reason: unresolved `P0` RLS/policy drift and unresolved SSOT decision for extra STAGING objects.
