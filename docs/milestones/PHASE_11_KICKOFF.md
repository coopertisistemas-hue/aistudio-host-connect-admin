# Phase 11 Kickoff - Integration Platform

Repository: aistudio-host-connect-admin  
Phase: 11  
Status: Kickoff Approved for Execution  
Pilot context: UPH production pilot (stability-first)

## Phase Goal
Establish a safe integration foundation before any provider-specific rollout.

## Phase Scope
- Integration contract baseline and reliability rules.
- Event processing baseline (queue-first, idempotency, retries, DLQ).
- Integration observability baseline.

## Sprint Sequence
- SP27: Integration Platform Contract and Reliability Baseline
- SP28: Event Bus and Queue Processing Baseline
- SP29: Integration Observability Baseline

## Non-Negotiables
- No breaking changes on reservation/check-in/check-out critical path.
- Feature flags per tenant/property for any new integration behavior.
- No direct provider coupling in core PMS business flow.
- Evidence-first sprint closure with PASS verdict.

## Required QA/Gates by Sprint
Always:
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed files>`

If DB touched:
- `scripts/ci/check_migration_naming.ps1`
- `scripts/ci/run_rls_gate_check.ps1`
- `scripts/ci/run_structural_drift_gate.ps1`
- `scripts/ci/run_tenant_contract_gate.ps1`
- `supabase db push --linked`

## Exit Criteria for Phase 11
- SP27, SP28, SP29 closed with PASS.
- Phase report with evidence links published.
- Repo synced to `main` with clean working tree.
