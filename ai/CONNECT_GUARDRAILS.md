# CONNECT Guardrails

Production-grade security and data governance principles for Host Connect.

---

## Row-Level Security (RLS) First

- **Always enforce RLS** at the database level for all tenant-scoped tables
- Every table containing multi-tenant data MUST have RLS enabled
- RLS policies must be explicit and cover all access patterns (SELECT, INSERT, UPDATE, DELETE)
- Never rely on application logic alone to enforce tenant isolation

## Never Trust the Frontend

- All input from client applications is considered untrusted
- Validate all data at the API layer before database operations
- Enforce authorization checks server-side, not client-side
- Assume any client-side validation can be bypassed

## Multi-Tenant Strict Isolation

- **org_id** is the primary tenant identifier for organization-level resources
- **property_id** is the secondary identifier for property-level resources within an organization
- Every database query affecting tenant data MUST include org_id and/or property_id filters
- Cross-tenant queries must be impossible by design

## No Direct Database Access from Client

- All database operations MUST go through the API layer
- Client applications must never connect directly to the database
- Use service roles or authenticated roles with minimal privileges
- API routes act as the single entry point for data access

## Idempotent SQL Always

- All migration scripts must be idempotent (safe to run multiple times)
- Use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- Include rollback strategies for every schema change
- Test migrations in staging before production deployment

## No Seed Data in Production

- Production databases must not contain demo or seed data
- Seed data is only permitted in development and staging environments
- Use migration scripts for structural changes, not data population
- Production data must only come from real user interactions or approved data loads

## Controlled Migrations Only

- All schema changes require explicit migration files
- Migrations must be reviewed and approved before execution
- Large migrations must be split into atomic steps
- Monitor migration performance and have rollback plans

## Logs and Audit Awareness

- Log all sensitive operations with appropriate log levels
- Include correlation IDs for tracing requests across services
- Audit trail for data modifications (who, what, when)
- Do not log sensitive data (passwords, tokens, PII)

---

**Last Updated:** 2026-02-28  
**Enforced By:** All DEV, ORCHESTRATOR, and GP roles
