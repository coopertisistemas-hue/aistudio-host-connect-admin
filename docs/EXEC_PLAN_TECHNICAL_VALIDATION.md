# EXEC PLAN TECHNICAL VALIDATION

## 1) Validation Summary
This validation is based on available artifacts in the repository because `docs/EXEC_PLAN_GROWTH_OPS_COMPLIANCE.md` is currently **MISSING**.

Validated sources used:
- `docs/BRAINSTORMING_EVALUATION_HOST_CONNECT.md`
- `docs/ROADMAP_URUBICI_100_PERCENT.md`
- `ai/CONNECT_GUARDRAILS.md`
- `ai/CONNECT_QA_GATES.md`

Overall conclusion:
- The proposed evolution direction is architecturally compatible with Host Connect.
- Phase ordering is mostly correct for pilot safety (foundation -> communication -> compliance -> growth -> advanced ops).
- The sprint breakdown is implementable, but needs stricter dependency gates and explicit integration platform milestones before business features.

Validation verdict: **APPROVED WITH ADJUSTMENTS**.

## 2) Architectural Consistency Review

### What is consistent
- Stability-first posture aligns with `ai/HOST_CONNECT_CONTEXT.md` principles.
- RLS-first and tenant isolation constraints are preserved (`ai/CONNECT_GUARDRAILS.md`).
- Contract-first integration model and rollback discipline align with `ai/CONNECT_WORKFLOW.md` and `ai/CONNECT_QA_GATES.md`.
- Recommended async integration patterns (outbox, retries, idempotency, DLQ) reduce risk to critical booking/check-in paths.

### Gaps to close before implementation
1. Missing explicit "integration platform contract" deliverable format (versioning, ownership, compatibility guarantees).
2. Missing hard SLO targets per integration family (webhook ack time, processing lag, retry success threshold).
3. Missing "data classification map" for PII/compliance fields, especially for FNRH and messaging payloads.
4. Missing explicit "provider credential rotation and expiry playbook" per external connector.

## 3) Phase Ordering Validation (Pilot Stability)

Current recommended sequence remains safe:
1. Integration backbone and queue hardening
2. Transactional communications (non-marketing first)
3. FNRH compliance domain
4. Marketing & growth engine
5. Social presence + insights + kanban
6. Stabilization and scale readiness

Ordering verdict: **Correct**, with one adjustment:
- Add a dedicated "pre-Phase 11 readiness checkpoint" to verify that existing pilot telemetry and incident response are sufficient to absorb integration load.

## 4) Technical Risks and Dependency Conflicts

### High-priority risks
- Provider API volatility (Ads/WhatsApp/Google/FNRH) causing unplanned behavior changes.
- Retry storm / queue backlog during seasonal peaks.
- Cross-module event drift between reservations, marketing attribution, and messaging outcomes.
- Compliance breach risk in FNRH (failed submissions without traceable fallback).
- Tenant leakage risk if new modules introduce weak policy coverage.

### Dependency conflicts to anticipate
- Marketing attribution depends on stable reservation/channel event model.
- Communication personalization depends on guest profile and consent consistency.
- Kanban cards linked to entities can become stale without strong event ordering guarantees.
- FNRH status workflows can conflict with front desk operations if state transitions are not source-of-truth driven.

## 5) Suggested Changes to the Plan

### 5.1 Integration Architecture
- Add a mandatory "Integration Contract Baseline" template per provider including:
  - auth model
  - payload schemas
  - idempotency key strategy
  - error taxonomy
  - replay procedure
  - versioning and backward compatibility policy
- Introduce provider capability matrix (`read`, `write`, `webhook`, `batch`, `rate_limit`) before implementation.

### 5.2 Messaging System
- Split messaging into two milestones:
  - M1 transactional only (booking/check-in/out notifications)
  - M2 marketing journeys (campaign and segmentation)
- Enforce consent and opt-out policy in message send path by design.
- Require per-channel delivery state machine and fallback route.

### 5.3 Marketing Integrations
- Start with ingestion and analytics read-only connectors before write/activation APIs.
- Require attribution quality gate before ROI dashboards are considered production-reliable.
- Use provider abstraction to avoid UI/business coupling to a single API surface.

### 5.4 Queue/Event Processing
- Mandatory outbox pattern for all compliance-critical and provider-dependent writes.
- Define queue SLOs and alert thresholds before onboarding first external integration.
- Add deterministic replay tooling with actor/audit metadata.

### 5.5 Compliance Handling (FNRH)
- Treat FNRH as compliance-critical bounded context.
- Require manual fallback workflow and operator runbook in same phase as API integration.
- Add daily reconciliation report: local check-ins vs FNRH accepted submissions.
- Add explicit GO/NO-GO gate for legal-compliance readiness before broader rollout.

## 6) Additional Guardrails (Mandatory)
1. No synchronous external API call in critical transaction path (booking/check-in/check-out commit).
2. Feature flags per tenant and per property for all new modules.
3. Canary rollout sequence: internal -> UPH subset -> full UPH.
4. Mandatory evidence package for every sprint in `docs/qa/SPxx/` with PASS/PARTIAL/FAIL.
5. For DB-touching sprints, enforce:
- `supabase db push --linked`
- RLS gate
- Structural drift gate
- Tenant contract gate
- Migration naming gate
6. Add integration chaos tests (timeout, 429, 5xx, malformed payload) before production enablement.
7. Redaction tests for logs to ensure no secrets/PII are leaked.

## 7) Sprint Breakdown Implementability
Implementability status: **YES (with sequencing adjustments)**.

Conditions for implementability:
- Complete integration platform foundation before business-facing connector breadth.
- Keep scope discipline: avoid bundling FNRH + full marketing automation in same sprint window.
- Use explicit phase closure reports (`docs/milestones/PHASE_X_REPORT.md`) with gate evidence links.

## 8) Recommended First Sprint Kickoff

### Kickoff recommendation: **SP27 - Integration Platform Contract & Reliability Baseline**

Objective:
- Establish reusable, testable integration backbone with no pilot disruption.

Scope:
- Integration contract template v1 (provider adapters + webhook schema + idempotency)
- Queue/outbox baseline specification (retry, DLQ, replay)
- SLO and alert policy baseline for integration workloads
- Runbook skeleton for incident triage and manual fallback

Acceptance criteria:
- Approved contract template published under `docs/integrations/`
- Queue/retry/DLQ operational policy documented under `docs/ops/`
- Alert thresholds and telemetry ownership documented under `docs/observability/`
- QA evidence package created under `docs/qa/SP27/` with PASS

Required QA evidence (no implementation yet, planning baseline):
- `SP27_REPORT.md`
- `checklist.md`
- `build.log`, `typecheck.log`, `lint_changed_files.log`
- `notes/decision_log.txt`

## 9) Final Recommendation
Proceed with Phase 11+ using a strict "foundation before feature breadth" rule. The plan is viable and safe for UPH pilot continuity if the adjustments above are applied and enforced through CONNECT gates and evidence discipline.
