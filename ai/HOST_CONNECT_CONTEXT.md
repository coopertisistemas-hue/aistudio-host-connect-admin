# Host Connect Context

Context document for Host Connect within the Connect ecosystem.

---

## Overview

Host Connect is a property management system (PMS) integration layer that enables hosts to manage their lodging operations through the Connect platform. It serves as the bridge between various property management systems and the broader Connect marketplace.

---

## Core Concepts

### Portal Discovers
The Host Connect system provides discovery capabilities that allow the Connect portal to:
- Find available properties across connected PMS systems
- Query property details, availability, and pricing
- Aggregate listings from multiple sources

### Reserve Converts
Host Connect handles reservation conversion and synchronization:
- Converts booking requests into confirmed reservations
- Syncs reservation status across PMS and Connect
- Manages booking modifications and cancellations
- Handles pricing calculations and overrides

### Host Operates
Property hosts use Host Connect to manage their operations:
- Update property details and availability
- Manage rates and restrictions
- View booking history and guest information
- Configure sync preferences and rules

---

## Architecture

### Multi-Tenant PMS
Host Connect operates as a multi-tenant system:
- Each organization (host) has isolated data via `org_id`
- Each property is identified by `property_id`
- PMS connections are organization-scoped
- Data access is strictly partitioned by tenant

### UPH Pilot as Controlled Rollout
Universal Property Hub (UPH) is the pilot integration:
- Gradual rollout to select host partners
- Controlled feature availability
- Monitored performance metrics
- Feedback-driven improvements

---

## Guiding Principles

### Stability Over Speed
- Reliability is the primary metric
- Breaking changes are avoided in minor versions
- Feature flags enable safe rollbacks
- Production incidents take priority over new features

### Security Over Convenience
- All data access requires authentication
- RLS is enforced at the database level
- No production data in development environments
- Audit trails for all sensitive operations
- API keys and secrets are never exposed

---

## Integration Points

| System | Role |
|--------|------|
| Connect Portal | User interface for hosts and guests |
| Property Management Systems | Source of truth for property data |
| Reservation Services | Booking orchestration |
| Analytics | Usage tracking and reporting |

---

## Key Metrics

- **Uptime Target:** 99.9%
- **API Latency:** < 200ms p95
- **Data Sync Frequency:** Near real-time
- **Supported PMS Systems:** Growing ecosystem

---

**Last Updated:** 2026-02-28  
**Version:** 1.0
