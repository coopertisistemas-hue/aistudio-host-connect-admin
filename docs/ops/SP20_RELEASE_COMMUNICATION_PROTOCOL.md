# SP20 Release Communication Protocol

## Purpose
Define deterministic communication flow for release dry-run and pilot readiness decisions.

## Roles
- `GP`: operational owner, trigger and closeout authority.
- `Orchestrator`: governance validation and go/no-go co-decision.
- `DEV (Codex)`: execution owner for commands, evidence, and technical triage.

## Event Types
1. `DRY_RUN_START`
- Contains: timestamp, target env, expected end window.

2. `DRY_RUN_BLOCKER`
- Contains: severity, failing command/check, impact scope, immediate mitigation.

3. `DRY_RUN_RECOVERY`
- Contains: remediation performed, evidence location, new status.

4. `DRY_RUN_COMPLETE`
- Contains: PASS/PARTIAL/FAIL, mandatory evidence paths, next action.

## Severity Mapping
- `SEV0`: full outage/security incident, immediate stop.
- `SEV1`: major degradation blocking pilot readiness.
- `SEV2`: partial issue with workaround.
- `SEV3`: informational anomaly.

## Notification Placeholders
- `CHANNEL_RELEASE_PRIMARY` (MISSING - configure in pilot phase)
- `CHANNEL_RELEASE_ESCALATION` (MISSING - configure in pilot phase)

## Response SLAs
- SEV0: immediate (<5 min)
- SEV1: 15 min
- SEV2: 60 min
- SEV3: next business cycle

## Mandatory Attachments per Completion Message
- `docs/qa/SP20/sql/release_dry_run.log`
- `docs/qa/SP20/sql/migration_list.log`
- `docs/qa/SP20/ops/health_checks.log`
- `docs/qa/SP20/SP20_REPORT.md`

