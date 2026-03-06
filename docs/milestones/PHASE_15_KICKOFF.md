# Phase 15 Kickoff: Reputation and Local SEO Foundation

**Date**: 2026-03-06
**Status**: IN PROGRESS

## Goal

Establish reputation and local SEO integration primitives for hospitality properties.

## Scope

- Google Reviews integration baseline
- Google Business Profile primitives
- Review monitoring layer
- Reputation analytics foundation
- Review alerts placeholder

## Constraints

- NO real Google APIs integration yet
- Use adapter pattern for future provider isolation
- Multi-tenant safe (orgId based)
- Queue-first for all external events
- CorrelationId tracing required

## Architecture

```
src/integrations/reputation/
├── ReviewMonitoringLayer     # Ingest review events
├── InternalReviewAdapter     # Tenant-safe storage
├── ReputationAnalyticsLayer # Rating aggregation, trends
└── types.ts                  # Interfaces
```

## Sprints

| Sprint | Focus |
|--------|-------|
| SP39   | Review Monitoring Baseline |
| SP40   | Reputation Analytics Baseline |

## Dependencies

- Phase 11 (Integration Platform) - Event bus, outbox queue
- Phase 12 (Communication Layer) - Template system
- Phase 13 (Guest CRM) - Guest profiles

## Pilot Protection

- Feature flags for new modules
- No breaking changes to existing flows
- Isolated from core PMS

## Success Criteria

- [ ] ReviewMonitoringLayer implemented with queue-first ingestion
- [ ] InternalReviewAdapter with tenant-safe storage
- [ ] CorrelationId propagation
- [ ] ReputationAnalyticsLayer baseline
- [ ] All QA gates passing
