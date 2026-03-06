# FNRH Monitoring Baseline (SP51)

Date: 2026-03-06
Status: Baseline defined (internal-only)

## Purpose

Define the operational monitoring model required to safely activate future FNRH provider integration.

## Monitoring dimensions

## 1) Submission lifecycle status

Track and expose at minimum:
- `prepared`: payload transformed and valid for adapter handoff
- `invalid`: payload blocked by validation rules
- `processing`: currently being handled in queue worker path
- `failed`: failed and pending retry
- `dead_letter`: retry exhausted

## 2) Retry visibility

Required metrics:
- failed message count by tenant/property
- next-attempt schedule visibility
- retry attempt distribution
- top retry error classes

## 3) DLQ visibility

Required views:
- DLQ volume by tenant/property
- DLQ volume by lifecycle stage (`pre_checkin`, `checkin`, `checkout`)
- oldest DLQ item age
- unresolved DLQ count

## 4) Validation visibility (BLOCK/WARN/INFO)

Required breakdowns:
- issue count by severity
- issue count by field/code
- latest invalid submissions with correlation IDs

## 5) Tenant/property traceability

Every monitored record must include:
- `orgId`
- `propertyId`
- `correlationId`
- `lifecycleStage`
- `submissionId`

## 6) Baseline alert definitions (no external provider yet)

Define internal alert conditions:
- `DLQ_SPIKE`: DLQ count above threshold
- `BLOCK_SPIKE`: blocking validations above threshold
- `RETRY_BACKLOG`: failed/retry queue growth above threshold
- `PROPERTY_CONFIG_MISSING`: repeated profile/establishment-code missing

Alert actions in baseline mode:
- mark alert in internal observability state
- include correlation + tenant/property metadata
- no external notification dispatch in this sprint

## 7) Operational dashboards (future implementation target)

Minimum dashboard sections:
- Submission pipeline health
- Validation quality health
- Retry and DLQ health
- Tenant/property compliance status

## 8) Data retention guidance

Monitoring records should retain:
- status transitions
- timestamps
- issue metadata
- payload hash (never full raw payload in normal logs)

## Current implementation baseline in code

`src/integrations/compliance/` now exposes monitoring-oriented structures via:
- `FnrhMonitoringSnapshot` contract
- adapter snapshot generation
- layer-level aggregation with outbox status counts
