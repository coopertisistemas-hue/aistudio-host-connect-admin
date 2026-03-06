# PROJECT DEEP AUDIT REPORT

## 1) Executive Summary
Host Connect reached pilot-ready maturity with end-to-end execution evidence across 10 phases (`docs/milestones/PHASE_1_REPORT.md` ... `docs/milestones/PHASE_10_REPORT.md`).

Current state is strong in multi-tenant governance and operational discipline:
- Hard DB safety gates are implemented and automated in CI (`.github/workflows/*gate*.yml`, `scripts/ci/*gate*.ps1`).
- Production-readiness artifacts exist for observability and DR (`docs/observability/SP19_*`, `docs/ops/SP20_RELEASE_DRY_RUN_RUNBOOK.md`, `docs/ops/SP23_INCIDENT_ROLLBACK_RUNBOOK.md`).
- Commercial/financial modules (billing orchestration, subscription lifecycle, revenue assurance, monetization console) are present in app routes and hooks.

Main product gap to "100% Urubici coverage" is integration depth (real OTA adapters, Brazilian fiscal/payment operations, advanced guest communication automation), not baseline platform architecture.

## 2) Current Capabilities Map

### 2.1 UI / Pages / Route Surface
Routing is centralized in `src/App.tsx` (route registry from line ~134 to ~618). Major route domains observed:
- Public & auth: `/`, `/auth`, `/book/:propertyId?`, `/pre-checkin/:token`, `/pre-checkin-grupo/:token`.
- Core ops: `/dashboard`, `/front-desk`, `/arrivals`, `/departures`, `/operation/rooms`, `/operation/housekeeping`, `/operation/demands`.
- Reservations & sales: `/bookings`, `/reservations/pipeline`, `/reports`, `/channel-manager`.
- Property configuration: `/properties`, `/room-categories`, `/room-types`, `/rooms`, `/amenities`, `/inventory`, `/services`.
- Finance/revenue: `/financial`, `/expenses`, `/billing/orchestration`, `/billing/subscription-lifecycle`, `/billing/revenue-assurance`, `/monetization/console`, `/executive/consolidation`.
- Marketing/channels: `/marketing/overview`, `/marketing/connectors`, `/marketing/google`, `/marketing/ota/:provider`, `/marketing/inbox`.
- Governance/admin/support: `/settings`, `/settings/permissions`, `/admin/audit-log`, `/admin-panel`, `/support/*`, `/support/admin/*`.
- Mobile operation app: `/m/*` routes (housekeeping, maintenance, rooms, financial, reservations, executive).

Sidebar operational taxonomy is explicit in `src/components/AppSidebar.tsx` with grouped modules:
- Operacional
- Vendas & Reservas
- Marketing & Canais
- Configuração de Unidades
- Financeiro
- Gestão & Admin

### 2.2 Hooks / Services (selected core)
Hook inventory is broad (`src/hooks/` has >70 hooks). Critical operational hooks include:
- Tenant/auth context:
  - `src/hooks/useAuth.tsx`
  - `src/hooks/useOrg.ts`
  - `src/hooks/useSelectedProperty.tsx`
- Reservation operations:
  - `src/hooks/useBookings.tsx`
  - `src/hooks/useFrontDesk.tsx`
  - `src/hooks/useArrivals.tsx`, `src/hooks/useDepartures.tsx`
  - `src/hooks/useOtaSync.tsx`
- Financial/revenue:
  - `src/hooks/useFolio.tsx`
  - `src/hooks/useInvoices.tsx`
  - `src/hooks/useBillingOrchestration.tsx`
  - `src/hooks/useSubscriptionLifecycle.tsx`
  - `src/hooks/useRevenueAssurance.tsx`
  - `src/hooks/useMonetizationConsole.tsx`
- Workforce/ops:
  - `src/hooks/useHousekeeping.tsx`, `src/hooks/useMaintenance.tsx`, `src/hooks/useShifts.tsx`, `src/hooks/useTasks.tsx`
- Access controls:
  - `src/hooks/usePermissions.ts`
  - `src/hooks/useEntitlements.ts`

Evidence of tenant-scoped query patterns appears in key hooks (example: `.eq('org_id', currentOrgId)` in `useInvoices`, `useBillingOrchestration`, `useRevenueAssurance`, `useFolio`).

### 2.3 DB Schema / Core Modules / Relationships
Evidence sources:
- Migrations (`supabase/migrations/*.sql`)
- Supabase generated types (`src/integrations/supabase/types.ts`)
- RLS gate runtime inventory (`docs/qa/SP26/sql/rls_gate.log`)

Core domain modules identified:
- Identity/tenant: `organizations`, `org_members`, `org_invites`, `member_permissions`, `profiles`.
- Property/room inventory: `properties`, `rooms`, `room_types`, `room_categories`, `amenities`, `room_type_inventory`, `property_photos`, `entity_photos`.
- Reservations/guest lifecycle: `bookings`, `booking_rooms`, `booking_groups`, `booking_guests`, `guests`, `guest_consents`, `pre_checkin_sessions`, `pre_checkin_submissions`, `reservation_leads`, `reservation_quotes`.
- Financial: `invoices`, `booking_charges`, `folio_items`, `folio_payments`, `expenses`, `pricing_rules`, `pricing_plans`.
- Operations: `tasks`, `departments`, `demands`-related tables, `shifts`, `shift_assignments`, `shift_handoffs`, stock tables.
- Support/admin/audit: `tickets`, `ticket_comments`, `ideas`, `idea_comments`, `audit_log`, `notifications`.

Observed key relationships from generated types (`src/integrations/supabase/types.ts`):
- `bookings.property_id -> properties.id`
- `bookings.room_type_id -> room_types.id`
- `invoices.booking_id -> bookings.id`
- `invoices.property_id -> properties.id`
- `rooms.property_id -> properties.id`
- `rooms.room_type_id -> room_types.id`
- `reservation_orchestration_events` links to booking/org/property.

Important limitation:
- Generated TypeScript DB types are partially stale vs current schema: tables present in live gate inventory (for example `folio_items`, `folio_payments`, `booking_charges`, `booking_groups`, `property_photos`) are not represented in `src/integrations/supabase/types.ts`. This increases runtime `as any` usage and weakens compile-time DB safety.

### 2.4 RLS Posture (Protected Surface + Validation)
Current governance posture is gate-driven:
- RLS zero-policy regression gate:
  - Script: `scripts/ci/run_rls_gate_check.ps1`
  - SQL: `scripts/sql/rls_gate_check.sql`
  - CI: `.github/workflows/rls-gate.yml`
- Tenant contract gate:
  - Script: `scripts/ci/run_tenant_contract_gate.ps1`
  - SQL: `scripts/sql/tenant_contract_check.sql`
  - CI: `.github/workflows/tenant-contract-gate.yml`
- Structural drift gate:
  - Script: `scripts/ci/run_structural_drift_gate.ps1`
  - SQL: `scripts/sql/structural_fingerprint.sql`
  - CI: `.github/workflows/structural-drift-gate.yml`
- Migration discipline gate:
  - Script: `scripts/ci/check_migration_naming.ps1`
  - CI: `.github/workflows/migration-discipline-gate.yml`

Most recent pilot evidence (SP25/SP26) shows gates PASS:
- `docs/qa/SP25/sql/*.log`
- `docs/qa/SP26/sql/*.log`

### 2.5 CI Gates
Implemented gates and objective:
- `RLS Gate`: fails if public table has RLS enabled and zero policies.
- `Tenant Contract Gate`: fails on RLS-enabled table missing `org_id` (outside allowlist), warns/fails on policy heuristics.
- `Structural Drift Gate`: compares live deterministic fingerprint against baseline (`docs/db/baselines/SP1B_baseline/structural_fingerprint.csv`).
- `Migration Naming Gate`: enforces canonical migration filename pattern and blocks rollback scripts in apply chain.

### 2.6 Integrations and Contracts
Documented integration contracts exist in `docs/integrations/`:
- Reserve ↔ Host baseline: `SP7_RESERVE_HOST_CONTRACT_V1.md`
- OTA sync contract: `SP10_CHANNEL_MANAGER_SYNC_CONTRACT.md`
- Public API contract/authz: `SP11_PUBLIC_API_V1_SPEC.md`, `SP11_PUBLIC_API_AUTHZ_RULES.md`
- Billing/revenue contracts: `SP14_*`, `SP17_*`, `SP18_*`

Edge function integration surface (`supabase/functions/`):
- Booking/public APIs: `check-availability`, `calculate-price`, `get-public-website-settings`
- OTA orchestration: `sync-ota-inventory`
- Payments: `create-checkout-session`, `verify-stripe-session`
- Operational identity/support/social/AI: `get-operational-identity`, `send-support-email`, `social-media-manager`, `ai-proxy`

## 3) Financial Subsystem Maturity
Financial maturity is **advanced baseline / partial production depth**:
- Folio operations and payments: `src/hooks/useFolio.tsx`, route `/operation/folio/:id`.
- Invoice lifecycle: `src/hooks/useInvoices.tsx`, `invoices` table.
- Billing event/idempotency analytics: `src/hooks/useBillingOrchestration.tsx` + `src/lib/monetization/billingIdempotency.ts`.
- Subscription lifecycle controls: `src/hooks/useSubscriptionLifecycle.tsx` + `src/lib/monetization/subscriptionLifecycle.ts`.
- Revenue assurance GO/NO-GO: `src/hooks/useRevenueAssurance.tsx`, route `/billing/revenue-assurance`.
- Monetization console KPIs/risk/opportunity: `src/hooks/useMonetizationConsole.tsx`, route `/monetization/console`.

Current constraints:
- Stripe checkout exists, but local Brazilian payment rails (PIX gateway reconciliation and fiscal coupling) are not fully productized as a complete operational package.

## 4) Operational Maturity
Operational maturity is **strong**:
- Observability baseline and alert policy:
  - `docs/observability/SP19_ALERT_POLICY.md`
  - `docs/observability/SP19_OBSERVABILITY_BASELINE.md`
  - `scripts/sql/health_checks.sql`
  - `scripts/ci/run_health_checks.ps1`
- Release readiness dry-run:
  - `docs/ops/SP20_RELEASE_DRY_RUN_RUNBOOK.md`
- Incident/rollback runbook:
  - `docs/ops/SP23_INCIDENT_ROLLBACK_RUNBOOK.md`
- DR evidence:
  - `docs/qa/SP24/ops/backup_restore_drill.log`
  - `docs/qa/SP24/ops/rto_rpo_measurements.md`
- Go-live pilot evidence:
  - `docs/qa/SP26/pilot/monitoring_window_log.md`
  - `docs/qa/SP26/pilot/pilot_signoff.md`

## 5) Known Limitations and Technical Debt
Evidence-based limitations (explicitly documented):
1. Type generation drift
- `src/integrations/supabase/types.ts` does not reflect all active tables found in gate outputs (`docs/qa/SP26/sql/rls_gate.log`), forcing `as any` in hooks.

2. Integration depth still baseline/simulated in parts
- OTA sync function includes placeholder simulation strategy (`simulateOtaUpdate` in `supabase/functions/sync-ota-inventory/index.ts`).

3. Edge-function hardening consistency varies
- Historical security audit indicates critical risks in function auth/org validation (`docs/edge_functions_security_audit.md`, `docs/production_readiness_checklist.md`).
- Some functions were improved later (for example `sync-ota-inventory` uses ANON + Authorization), but audit docs show pending standardization across all functions.

4. Internationalization debt
- Mixed EN/PT messages in edge functions and docs; governance expects PT/EN/ES consistency.

5. Build artifact size warning
- Recurrent build warnings on large frontend bundles in sprint build logs (for example `docs/qa/SP25/build.log`, `docs/qa/SP26/build.log`).

## 6) Appendix - Repo Navigation Map
Fast onboarding map:
- Frontend app shell/routing:
  - `src/App.tsx`
  - `src/components/AppSidebar.tsx`
- Core domains (hooks):
  - `src/hooks/` (reservations, ops, finance, security context)
- Supabase layer:
  - `src/integrations/supabase/client.ts`
  - `src/integrations/supabase/types.ts`
- Database history:
  - `supabase/migrations/`
  - `docs/db/` (DR0A and schema governance)
- Edge/server logic:
  - `supabase/functions/*/index.ts`
- Integration contracts:
  - `docs/integrations/`
- Quality gates:
  - `scripts/ci/`, `scripts/sql/`, `.github/workflows/`
- Sprint and phase evidence:
  - `docs/qa/SP*/`
  - `docs/milestones/PHASE_*_REPORT.md`
