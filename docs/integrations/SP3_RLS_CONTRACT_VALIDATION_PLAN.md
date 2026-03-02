# SP3 RLS Contract Validation Plan

## Objective
Validate that integration paths preserve tenant isolation and role boundaries under RLS-first governance.

## Validation Layers
1. Schema-level
- Verify target tables have RLS enabled.
- Verify required tenant columns exist where expected (`org_id`, `property_id`).

2. Policy-level
- Verify CRUD policy presence for integration-touched tables.
- Verify policy predicates are tenant-aware (org/property checks or approved allowlist rationale).

3. Runtime-level
- Execute cross-tenant negative reads/writes (must fail or return empty).
- Execute role-based negative writes for viewer/non-admin roles.

## Query Pack References
- `scripts/sql/rls_gate_check.sql`
- `scripts/sql/tenant_contract_check.sql`
- `scripts/sql/structural_fingerprint.sql`

## PASS Criteria
- No table in `public` with RLS enabled and zero policies.
- Tenant contract check Query A returns zero rows (except explicit allowlist entries in contract gate).
- Structural drift gate matches committed baseline when no intended schema change exists.
- Integration-scoped negative tests confirm no cross-tenant access.

## BLOCK Criteria
- Any RLS-enabled table without policies.
- Any unapproved tenant-contract violation.
- Any structural drift not explained by intentional migration/version update.

## Evidence to Collect
- Gate logs (RLS, tenant contract, structural drift).
- SQL outputs for policy/table inventory used in decision.
- Sprint report with explicit PASS/BLOCK decision and residuals.

## Operational Note
For legacy tables without `org_id`, usage must remain explicitly documented in allowlist with migration follow-up tracked in backlog.
