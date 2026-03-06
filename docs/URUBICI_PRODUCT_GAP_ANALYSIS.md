# URUBICI PRODUCT GAP ANALYSIS

## 1) Target Reality: What "100% Coverage" Means for Urubici

Urubici hospitality market typically mixes:
- Small pousadas (owner-operated, low headcount, manual workflows)
- Boutique inns/hotels (higher service expectations, OTA dependency)
- Mid-size hotels (need stronger operational controls and revenue discipline)

### Practical local workflow baseline
A complete product for Urubici should reliably cover:
- Front desk full cycle: pre-arrival, check-in, stay operations, check-out, post-stay.
- Inventory and housekeeping synchronization by room status.
- Daily rate/availability consistency across direct + OTA channels.
- Financial close: folio, invoice/payment, delinquency and reconciliation.
- Guest communication and reputation operations (Google + OTA messaging/reviews).
- Tenant-safe operations for groups with one or multiple properties.

Assumption (explicit): specific municipal fiscal e-invoice details may vary by city/service provider; this analysis marks fiscal integrations as required scope but not implementation-ready without final tax/provider contract.

## 2) Gap Matrix

| Feature Area | Current Status | Impact if Missing | Priority |
|---|---|---|---|
| Reservation sources (direct + OTA) | **Partial** | OTA-origin bookings not fully automated end-to-end | P0 |
| Channel management (rate/availability sync) | **Partial** (contract + manual sync UI, simulated adapters) | Overbooking and stale pricing risk | P0 |
| Payments and reconciliation (PIX/card/acquirer settlement) | **Partial** (Stripe flow + internal assurance) | Cash-flow mismatch and operational friction | P0 |
| Housekeeping workflow | **Exists** (web + mobile routes/hooks) | - | P1 |
| Maintenance tickets/demands | **Exists** | - | P1 |
| Guest identity + stay lifecycle | **Partial** (guest/pre-checkin domains exist, no complete KYC/automation stack) | Service inconsistency and compliance risk | P1 |
| Tax/fiscal invoicing (Brazil-specific) | **Missing/Partial** | Fiscal non-compliance/manual workload | P0 |
| Access control (roles + module permissions) | **Exists/Partial** (roles and permissions modules exist) | Privilege misconfiguration risk | P1 |
| Multi-property / holding operations | **Exists/Partial** (org/property model, executive consolidation baseline) | Portfolio visibility and standardized governance may be limited | P1 |
| Guest communication automation (email/OTA inbox/CRM cadence) | **Partial** | Lost upsell/review opportunities | P1 |
| Revenue management automation (yield, rule engine with demand signals) | **Partial** | Revenue leakage in seasonality-heavy region | P1 |
| BI/export/compliance analytics | **Partial** | Manual reporting effort for management/accounting | P2 |

### Evidence pointers
- OTA/channel baseline: `src/pages/ChannelManagerPage.tsx`, `src/hooks/useOtaSync.tsx`, `docs/integrations/SP10_CHANNEL_MANAGER_SYNC_CONTRACT.md`, `supabase/functions/sync-ota-inventory/index.ts`.
- Financial assurance baseline: `src/pages/BillingOrchestrationPage.tsx`, `src/pages/RevenueAssurancePage.tsx`, hooks in `src/hooks/useBillingOrchestration.tsx`, `useRevenueAssurance.tsx`, `useFolio.tsx`.
- Access and tenant controls: `src/hooks/usePermissions.ts`, `src/hooks/useEntitlements.ts`, `scripts/ci/run_tenant_contract_gate.ps1`.

## 3) Must-Have for Urubici (Top 10)
1. **Real OTA two-way sync in production** (Booking/Airbnb/Expedia via robust adapters) - reduces overbooking and manual updates.
2. **Availability/rate parity monitor with alerting** - detects divergence between PMS and channels.
3. **PIX + card settlement reconciliation pipeline** - daily close without spreadsheet work.
4. **Brazil fiscal integration layer (NFS-e/NF-e where applicable)** - operational/legal compliance.
5. **Unified guest timeline** (booking, pre-checkin, folio, interactions, issues) - improves service quality.
6. **Automated pre-arrival and post-stay communications** - check-in readiness and review capture.
7. **Housekeeping SLA and turnaround dashboards** - room readiness for peak occupancy days.
8. **Maintenance preventive scheduling + incident classification** - reduce downtime and guest complaints.
9. **Role policy hardening + permission audit trail UX** - secure delegation in teams.
10. **Manager KPI cockpit for seasonality** (occupancy, ADR, RevPAR, cashflow variance) - better tactical decisions.

## 4) Additional Product Gaps by Segment

### Small pousadas
- Need simpler onboarding and fewer mandatory configurations.
- Need low-friction payment and communication templates.

### Boutique hotels
- Need stronger guest personalization and reputation loops.
- Need faster OTA + direct booking orchestration.

### Mid-size hotels
- Need robust shift/staff governance and exception workflows.
- Need portfolio-level executive analytics and standardized controls.

## 5) Current Readiness Split

### Production-ready baseline (evidence-backed)
- Multi-tenant governance and gate pipeline (`.github/workflows/*gate*.yml`, `scripts/ci/*`, `scripts/sql/*`).
- Operational readiness docs and drills (`docs/observability/SP19_*`, `docs/ops/SP20_*`, `docs/ops/SP23_*`, `docs/qa/SP24/*`).
- Pilot validation artifacts (`docs/qa/SP26/pilot/pilot_signoff.md`).

### Needs work to reach true "100% Urubici"
- OTA adapter depth and operational SLAs.
- Fiscal/payment integration depth for Brazilian operations.
- End-to-end communication automation and reputation workflows.
- DB type generation alignment with live schema (to reduce `any` and hidden drift).
