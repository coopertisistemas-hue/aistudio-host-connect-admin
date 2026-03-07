# UPH Pilot Rollout Plan (Phase 25)

## Pilot Scope
- Tenant: Urubici Park Hotel (UPH)
- Rollout style: staged and reversible
- No runtime mutation introduced by Phase 25 artifacts

## Activation Sequence
1. Enable `advancedObservability` for UPH scoped org/property.
2. Enable `integrationHealthMonitoring` for UPH scoped org/property.
3. Enable `performanceBaseline` for UPH scoped org/property.
4. Enable `operationalAuditHardening` for UPH scoped org/property.
5. Enable `rolloutReadinessChecklist` for UPH scoped org/property.

## Validation Windows
- Window A (Observability): verify telemetry field completeness (`orgId`, `propertyId`, `correlationId`, `eventType`, `timestamp`).
- Window B (Health): verify internal health signal generation and no auto-remediation behavior.
- Window C (Performance): verify throughput/latency baseline capture and synthetic load placeholders.
- Window D (Audit): verify normalized audit traces and `traceComplete` coverage.

## Rollback Plan
- Disable all Phase 25 flags in reverse activation order.
- Keep evidence artifacts immutable for post-mortem and approval traceability.

## Go/No-Go Rule
- Go only if all gates in `PRODUCTION_READINESS_CHECKLIST.md` are PASS.
