# EXEC PLAN — Phase 2: Reservation & Revenue Engine

## Scope
Build the next operational layer focused on reservation conversion quality, folio/revenue consistency, and finance-grade reporting integrity under CONNECT governance.

## Phase Goals
1. Strengthen reservation lifecycle reliability (lead -> quote -> booking -> stay -> folio close).
2. Raise revenue data trust with deterministic calculations and exports.
3. Formalize guardrails for pricing, charges, payments, and reconciliation.

## Non-Negotiables
- RLS-first, tenant isolation by `org_id`/`property_id`.
- No manual DB hotfix; forward-only migrations when required.
- Sprint QA package mandatory under `docs/qa/SPX/`.
- Sync-to-git only on PASS.

---

## SP4 — Reservation Lifecycle Hardening

### Goal
Stabilize reservation domain transitions and reduce operational ambiguity in booking state management.

### In Scope
- Normalize booking status transitions and guards in UI flows.
- Enforce tenant-safe actions for check-in/check-out/room assignment paths.
- Improve report consistency for status-based KPIs.

### Deliverables
- Booking transition matrix implementation and validation notes.
- Tenant-safe guards in key reservation actions.
- QA evidence package (`docs/qa/SP4/`).

### QA Required
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `eslint` for changed files
- If DB touched: `db push` + RLS/structural/tenant gates + SQL outputs

---

## SP5 — Folio, Charges & Payments Integrity

### Goal
Improve financial correctness across folio operations and payment capture workflow.

### In Scope
- Folio line-item consistency checks (charges/payments/balance).
- Payment state transition safety and auditability.
- Export correctness for folio/revenue artifacts.

### Deliverables
- Folio integrity improvements with tenant-safe enforcement.
- QA evidence package (`docs/qa/SP5/`).

### QA Required
- Same sprint protocol and DB gates if schema/policies change.

---

## SP6 — Revenue Intelligence & Reconciliation

### Goal
Deliver trustworthy revenue analytics/reconciliation for operator decisioning.

### In Scope
- Reconciliation views (booked vs realized vs paid).
- Drill-down/reporting consistency across dashboard, financial and reports.
- Export fidelity (CSV/print) for finance operations.

### Deliverables
- Revenue reconciliation feature set.
- QA evidence package (`docs/qa/SP6/`).

### QA Required
- Same sprint protocol and DB gates if schema/policies change.

---

## Phase 2 Exit Criteria
- SP4, SP5, SP6 each marked PASS with evidence package.
- Any DB change is traceable by migration + gate logs.
- `docs/milestones/PHASE_2_REPORT.md` produced with sprint verdicts and residual debt.
