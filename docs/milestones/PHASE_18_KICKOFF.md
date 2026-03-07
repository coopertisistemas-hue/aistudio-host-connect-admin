# Phase 18 Kickoff - Paid Traffic Integrations

Date: 2026-03-06
Status: IN_PROGRESS

## Goal

Establish paid traffic integration baselines (Google Ads, Meta Ads, and attribution) with strict pilot safety and no direct provider coupling.

## Planned Sprints

- SP45 - Google Ads baseline
- SP46 - Meta Ads baseline
- SP47 - Attribution engine baseline

## Architecture Rules

- Multi-tenant safe (`orgId`, optional `propertyId`)
- Queue-first integration with Outbox and EventBus
- Adapter/layer isolation
- Feature flags for rollout safety
- CorrelationId tracing
- Retry and DLQ compatibility
- No direct provider SDK coupling in core logic
- No UPH pilot runtime disruption

## Current Progress

- [x] SP45 - Google Ads baseline (PASS)
- [x] SP46 - Meta Ads baseline (PASS)
- [x] SP47 - Attribution engine baseline (PASS)
