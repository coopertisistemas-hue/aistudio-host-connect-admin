# SP60 - Workflow Handoff Baseline

## Objective
Create internal workflow signal contracts that convert alerts/recommendations into queue-compatible events.

## Scope
- Added `src/modules/workflow/WorkflowEventTypes.ts`
- Added `src/modules/workflow/WorkflowEventAdapter.ts`
- Added `src/modules/workflow/WorkflowSignalLayer.ts`
- Added tenant/property-safe feature flag guard: `workflowSignals`
- Added correlationId propagation and outbox/event-bus compatible forwarding.

## Safety
- No task execution.
- No PMS runtime workflow changes.
- No DB changes.
- Internal contracts only.

## Sprint Verdict
PASS
