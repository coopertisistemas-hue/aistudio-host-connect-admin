# ROADMAP URUBICI 100 PERCENT

## 1) Strategy Options for OTA Integrations

### Option A - Direct API Integrations (Booking.com, Expedia, Airbnb, Hoteis.com)
**What it is**
- Build native provider adapters in Host Connect for rates, availability, reservations, modifications, cancellations and (where available) messaging.

**Pros**
- Maximum control over feature behavior and observability.
- Lower dependency on third-party channel manager roadmap.
- Potentially lower long-term transaction cost.

**Cons / Constraints**
- Each OTA has independent certification and onboarding constraints.
- Contract and sandbox access may require legal/commercial approval before engineering.
- Higher maintenance cost (version drift, rate limits, provider outages).
- Slower time-to-value for pilot properties.

**Feasibility**
- Medium/High technically, High operational complexity.
- Requires per-provider integration contracts, test suites and replay-safe idempotency strategy.

**Dependencies**
- Signed API contracts per provider.
- Credential lifecycle and rotation runbook.
- Contract-test harness in CI.

### Option B - Channel Manager Integration (Recommended Baseline)
**What it is**
- Integrate Host Connect with one channel manager abstraction that already aggregates OTA connectivity.

**Pros**
- Fastest path to multi-OTA coverage for Urubici pilot scale.
- Reduced provider-specific certification burden.
- Lower operational complexity for initial rollout.

**Cons**
- Functional ceiling depends on channel manager capabilities.
- Added external dependency and potential cost.
- Debugging may require triage across two vendors.

**Feasibility**
- High for pilot acceleration.
- Strong fit with existing contract-oriented artifacts (`docs/integrations/SP10_CHANNEL_MANAGER_SYNC_CONTRACT.md`).

**Dependencies**
- Final channel manager partner selection.
- Contract baseline v2 (inventory + reservation + reconciliation payloads).
- Monitoring and retry policy for webhook/event ingestion.

### Option C - Hybrid (Recommended Medium-Term)
**What it is**
- Start with channel manager for breadth, then add direct adapters for high-impact providers/features where margin/quality justify.

**Why this is preferred**
- Delivers near-term coverage and long-term strategic control.
- De-risks pilot launch while preserving evolution path.

## 2) Google Integrations

### Google Business Profile (GBP)
**Feasible scope**
- Operational playbook for posts/reviews/Q&A response cadence.
- Connector module for status and response queue (phase-based).

**Dependencies**
- OAuth/app verification.
- Role policy for who can publish/respond.
- Audit log for actions.

### Google Hotel Center / Free Booking Links / Hotel Ads
**Feasible scope**
- Product feed and availability/rate feed export.
- Conversion/attribution baseline.

**Dependencies / Constraints**
- Partner requirements and feed quality thresholds.
- Commercial and account-level enrollment prerequisites.
- SLA for feed freshness and incident response.

## 3) Phased Roadmap (Phase 11+)

Governance model for all sprints below:
- Evidence mandatory in `docs/qa/SPxx/`.
- PASS only when required QA logs exist and gates pass.
- Sync-to-git only after PASS.

### Phase 11 - OTA Reliability Foundation
**Objective**
- Make reservation/rate/availability synchronization operationally reliable and auditable.

#### SP27 - Integration Contract Baseline v2
**Scope**
- Define canonical payloads for inventory/rates/reservations/cancellations.
- Define idempotency keys and replay behavior.

**Acceptance criteria**
- New contract docs under `docs/integrations/` with versioning and examples.
- Contract-test plan documented.

**QA commands**
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`

**Evidence**
- `docs/qa/SP27/SP27_REPORT.md`
- `docs/qa/SP27/build.log`
- `docs/qa/SP27/typecheck.log`
- `docs/qa/SP27/lint_changed_files.log`

#### SP28 - Channel Manager Adapter Hardening
**Scope**
- Harden webhook ingestion, retries, dead-letter policy and operational dashboards.

**Acceptance criteria**
- Deterministic retry policy documented and implemented.
- Drift between OTA and Host state measurable.

**Required gates**
- RLS gate
- Structural drift gate
- Tenant contract gate
- Migration naming gate (if DB touched)

#### SP29 - Overbooking Prevention and Conflict Resolution
**Scope**
- Reservation conflict detection and operator resolution flow.

**Acceptance criteria**
- Deterministic conflict states and playbook.
- Incident runbook update in `docs/ops/`.

**Phase closure artifact**
- `docs/milestones/PHASE_11_REPORT.md`

### Phase 12 - Payments, Fiscal and Reconciliation BR
**Objective**
- Reach operational-grade Brazil payment and fiscal readiness for pousadas/hotels.

#### SP30 - Payment Gateway Expansion (PIX/Card)
**Scope**
- Add provider abstraction for PIX and card settlement status.

**Acceptance criteria**
- Payment lifecycle states mapped to folio/invoice.
- Reconciliation hooks updated.

#### SP31 - Fiscal Notes and Tax Workflow Baseline
**Scope**
- Fiscal provider contract baseline (city-dependent assumptions explicit).

**Acceptance criteria**
- Fiscal integration contract doc.
- Fallback/manual flow documented.

#### SP32 - Daily Financial Close Automation
**Scope**
- End-of-day close pack and variance checks.

**Acceptance criteria**
- Close checklist and variance thresholds documented.

**Phase closure artifact**
- `docs/milestones/PHASE_12_REPORT.md`

### Phase 13 - Guest Lifecycle and Service Excellence
**Objective**
- Deliver complete guest journey automation and service workflows.

#### SP33 - Guest Identity + Pre-stay Validation
#### SP34 - Stay Lifecycle Automation (upsell/issue/recovery)
#### SP35 - Post-stay Feedback and Reputation Ops

**Acceptance criteria (phase-level)**
- Guest timeline is end-to-end traceable.
- Operational actions audited and role-scoped.

**Phase closure artifact**
- `docs/milestones/PHASE_13_REPORT.md`

### Phase 14 - Multi-Property Excellence and Executive Intelligence
**Objective**
- Mature holding/group operations with portfolio-level insight.

#### SP36 - Cross-property playbooks and benchmark KPIs
#### SP37 - Executive anomaly detection and alerts
#### SP38 - Portfolio profitability and forecast baseline

**Phase closure artifact**
- `docs/milestones/PHASE_14_REPORT.md`

### Phase 15 - PRD Stabilization and Expansion Readiness
**Objective**
- Certify stable operations for scaled rollout beyond UPH.

#### SP39 - Security hardening follow-up and least privilege verification
#### SP40 - Load/reliability validation and SLO confirmation
#### SP41 - Expansion go-live pack (onboarding + support readiness)

**Phase closure artifact**
- `docs/milestones/PHASE_15_REPORT.md`

## 4) Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| OTA API access/certification delays | Blocks direct integration timeline | Start with channel manager; parallel contract onboarding |
| Rate limiting / provider instability | Sync lag and booking inconsistency | Retry policy, backoff, dead-letter handling, replay tooling |
| Data correctness drift (overbooking) | Revenue loss and guest dissatisfaction | Conflict detection, idempotency keys, reconciliation checks |
| Tenant isolation regression | Security/compliance incident | Keep CI gates mandatory (RLS + tenant contract + drift) |
| Secret leakage via logs/config | Security incident | Redaction standard + secrets review checklist |
| Fiscal integration variability by municipality | Delayed tax automation | Contract abstraction + provider-specific adapters + manual fallback runbook |

## 5) Success Metrics for Pilot-to-Scale

- **Occupancy accuracy**: channel vs internal occupancy divergence below agreed threshold.
- **Revenue capture accuracy**: folio/invoice/settlement variance under threshold.
- **Sync reliability**: successful sync cycle percentage and webhook success rate.
- **Incident rate**: Sev0/Sev1 incidents per month below target.
- **Ops efficiency**: reduced manual time in front desk + housekeeping + reconciliation.
- **Tenant safety**: no cross-tenant access incidents; all security gates green in CI.

## 6) Governance Rules for All Future Sprints

For each SPxx in phases above, require:
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed files>`
- If DB touched:
  - `supabase db push --linked`
  - `scripts/ci/run_rls_gate_check.ps1`
  - `scripts/ci/run_structural_drift_gate.ps1`
  - `scripts/ci/run_tenant_contract_gate.ps1`
  - `scripts/ci/check_migration_naming.ps1`
- Evidence package under `docs/qa/SPxx/` with PASS/PARTIAL/FAIL verdict.
