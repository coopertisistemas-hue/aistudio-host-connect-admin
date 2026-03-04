# SP19 Alert Policy (CONNECT)

## Purpose
Define the minimum operational alert policy for PRD pilot readiness under CONNECT governance.

## Severity Levels (SEV0-SEV3)
- `SEV0` Critical outage or tenant-security incident.
  - Criteria: platform unavailable for pilot users, cross-tenant leakage evidence, auth system down.
  - Target response: immediate (0-5 min).
- `SEV1` Major degradation with business impact.
  - Criteria: sustained error/latency spikes on core flows, billing/revenue assurance blocking operations.
  - Target response: 15 min.
- `SEV2` Partial degradation or non-critical feature impact.
  - Criteria: specific module unstable, recoverable integration failures.
  - Target response: 60 min.
- `SEV3` Minor issue or warning trend.
  - Criteria: non-blocking anomalies, temporary retries without user impact.
  - Target response: next business cycle.

## Ownership & Response
- Primary operational owner: `GP`.
- Technical escalation path: `GP -> Orchestrator -> DEV`.
- Decision authority for go/no-go in pilot windows: `GP + Orchestrator`.

## Notification Channels (Placeholders)
- `CHANNEL_INCIDENT_PRIMARY` (MISSING - define in SP20)
- `CHANNEL_INCIDENT_ESCALATION` (MISSING - define in SP20)
- `CHANNEL_DAILY_SUMMARY` (MISSING - define in SP20)

## Core Alerts

## A1) Availability/Uptime
- Trigger:
  - App not reachable for >2 minutes OR >3 consecutive failed health probes.
- Impact:
  - Users cannot operate core flows.
- First 5 minutes:
  1. Confirm outage from second network.
  2. Check latest deployment/version and CI status.
  3. Check auth and DB connectivity basic probes.
- Escalation:
  - `SEV0` if full outage >5 min.
- Recovery confirmation:
  - 10 consecutive successful probes and successful login + dashboard load.

## A2) Auth Failures Spike
- Trigger:
  - Auth failure rate >5% over 10 minutes.
- Impact:
  - Users blocked from login/session refresh.
- First 5 minutes:
  1. Check auth endpoint errors and token refresh events.
  2. Validate env configuration and key rotation status.
  3. Execute controlled login smoke test.
- Escalation:
  - `SEV1` if sustained >15 min.
- Recovery confirmation:
  - Failure rate <1% for 30 minutes and smoke login PASS.

## A3) Error Rate Spike (Client/Edge)
- Trigger:
  - Unhandled error rate >2% over 15 minutes in core routes.
- Impact:
  - Increased flow failures and user friction.
- First 5 minutes:
  1. Identify top failing route/module.
  2. Correlate with latest release and changed components.
  3. Execute rollback decision check if regression confirmed.
- Escalation:
  - `SEV1` for core revenue/operations paths; else `SEV2`.
- Recovery confirmation:
  - Error rate back to baseline (<0.5%) for 30 minutes.

## A4) Latency Regression (Web + Edge)
- Trigger:
  - p95 >1500ms or p99 >3000ms for 15 minutes on critical API/UI interactions.
- Impact:
  - Severe UX degradation, potential timeout loops.
- First 5 minutes:
  1. Identify endpoint/page with worst p95.
  2. Check recent query/profile changes and drift signals.
  3. Apply mitigations (traffic reduction, rollback, hot path isolation).
- Escalation:
  - `SEV1` if core journeys affected.
- Recovery confirmation:
  - p95/p99 below threshold for 30 minutes.

## A5) Data Integrity - Revenue Assurance NO_GO
- Trigger:
  - Revenue Assurance status `NO_GO` in pilot scope.
- Impact:
  - Settlement risk and financial leakage.
- First 5 minutes:
  1. Review no-go reasons in Revenue Assurance module.
  2. Validate invoice/payment/booking deltas.
  3. Freeze risky financial operations until triage closure.
- Escalation:
  - `SEV1` by default; `SEV0` if widespread billing corruption is suspected.
- Recovery confirmation:
  - Revenue Assurance returns `GO` and reconciliation checks match expected ranges.

## A6) Integration Failures - Reserve <-> Host
- Trigger:
  - Sync failure ratio >10% over 15 minutes OR webhook processing queue backlog threshold exceeded.
- Impact:
  - Contract drift and stale cross-system state.
- First 5 minutes:
  1. Validate contract version and failing payload class.
  2. Re-run integration smoke checks.
  3. Identify whether issue is producer or consumer side.
- Escalation:
  - `SEV1` if reservation lifecycle blocked; else `SEV2`.
- Recovery confirmation:
  - Failure ratio <2% for 30 minutes and latest sync checklist PASS.

## Alert Review Cadence
- During pilot window: 24/7 monitoring with scheduled owner rotation.
- Outside pilot window: business-hours review + daily summary.

