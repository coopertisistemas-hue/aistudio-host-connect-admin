# SP15 Revenue Indicators Contract (v1.0)

## Purpose
Define the minimum tenant-scoped indicator contract for the SP15 Monetization Console.

## Scope
- Organization-level indicators only (`org_id` context from authenticated user scope).
- No cross-tenant aggregation.
- Read-only analytics baseline.

## Indicators
1. `mrrBaseline`
- Description: baseline monthly recurring revenue estimate.
- Rule: `max(planPrice, paidLast30Days)`.
- Unit: BRL.

2. `invoicedValue`
- Description: total invoiced amount in current query scope.
- Source: `public.invoices.total_amount`.
- Unit: BRL.

3. `paidValue`
- Description: total paid amount in current query scope.
- Source: `public.invoices.paid_amount`.
- Unit: BRL.

4. `outstandingValue`
- Description: receivables pending collection.
- Rule: `max(0, invoicedValue - paidValue)`.
- Unit: BRL.

5. `delinquencyRate`
- Description: outstanding exposure ratio.
- Rule: `outstandingValue / invoicedValue * 100` (0 when denominator is 0).
- Unit: percentage.

6. `overdueInvoices`
- Description: invoices past due and not settled.
- Rule: status not in `paid`, `cancelled` and `due_date < now`.
- Unit: count.

7. `trialDaysRemaining`
- Description: days until trial expires.
- Source: `profiles.trial_expires_at` from org owner profile.
- Unit: days (`null` when absent).

8. `churnRiskScore`
- Description: operational risk score for retention triage.
- Rule: bounded score `[0..100]` from overdue + delinquency + trial pressure.
- Unit: score.

9. `planMix`
- Description: distribution of plans in org members.
- Source: `org_members` + `profiles.plan`.
- Unit: grouped count by plan.

10. `upgradeRecommended`
- Description: upgrade opportunity signal.
- Rule: `true` when occupancy/limit pressure or delinquency pressure is high and plan is not top-tier.
- Unit: boolean.

## Export Contract
- CSV export must include KPI, risk, opportunity, plan mix, and billing timeline rows.
- Output must be deterministic and UTF-8 with BOM.

## Tenant & Security Notes
- Data access is constrained by authenticated context and RLS-enforced tables.
- Frontend contract does not bypass server authorization.

