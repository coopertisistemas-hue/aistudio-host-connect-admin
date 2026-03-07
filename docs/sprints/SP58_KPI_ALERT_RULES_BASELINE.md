# SP58 - KPI Alert Rules Baseline

## Objective
Create an internal KPI alert rules baseline consuming analytics signals.

## Scope
- Added `src/modules/alerts/AlertRuleTypes.ts`
- Added `src/modules/alerts/AlertRulesEngine.ts`
- Added `src/modules/alerts/AlertEvaluationService.ts`
- Added tenant/property-safe feature flag guard: `alertEngine`
- Added threshold/anomaly placeholder evaluations for revenue, funnel, campaign conversion and occupancy.

## Safety
- No external notifications.
- No provider integrations.
- No DB migrations.
- No PMS runtime flow changes.

## Sprint Verdict
PASS
