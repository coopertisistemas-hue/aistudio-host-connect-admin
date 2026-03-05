# SP36 REPORT

## Summary
SP36 implemented Email Marketing baseline with Integration Hub queue-first primitives, tenant-safe controls, and no external provider coupling.

## Scope Mapping
- Internal email marketing adapter: implemented via `InternalEmailMarketingAdapter` behind `EmailMarketingAdapter` contract.
- Queue-first processing: implemented with outbox enqueue and event bus dispatch in `EmailMarketingLayer`.
- Tenant/correlation governance: `orgId`, optional `propertyId`, and required `correlationId` are enforced in event creation.
- Consent and rollout guardrails: consent gate and feature-flag gate before enqueue.

## Files Changed
- `src/integrations/marketing/types.ts`
- `src/integrations/marketing/internalEmailMarketingAdapter.ts`
- `src/integrations/marketing/emailMarketingLayer.ts`
- `src/integrations/marketing/index.ts`
- `docs/sprints/SP36_EMAIL_MARKETING_BASELINE.md`
- `docs/milestones/PHASE_14_KICKOFF.md`
- `docs/milestones/PHASE_14_REPORT.md`
- `docs/qa/SP36/*`

## DB Changes
No DB changes.

## QA Commands and Results
- `pnpm build` -> PASS
- `pnpm exec tsc --noEmit` -> PASS
- `pnpm exec eslint src/integrations/marketing/*.ts` -> PASS

## Evidence Files
- `docs/qa/SP36/build.log`
- `docs/qa/SP36/typecheck.log`
- `docs/qa/SP36/lint_changed_files.log`
- `docs/qa/SP36/checklist.md`
- `docs/qa/SP36/notes/timestamp.txt`

## Risks / Residuals
- Adapter remains internal/in-memory and must be replaced by provider-backed send path in future sprints.
- Campaign analytics and delivery telemetry export remain pending.

## Final Verdict
PASS
