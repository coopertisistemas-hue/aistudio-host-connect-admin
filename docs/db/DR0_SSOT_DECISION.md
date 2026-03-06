# DR0 SSOT Decision Memo

Date: 2026-03-01  
Context: Material drift between STAGING schema dump and repo migrations under CONNECT governance (`RLS-first`, `no manual drift`).

## Decision to Make

Choose system of record (SSOT) for schema reconciliation:
- Path A: **Repo migrations are SSOT**
- Path B: **Current STAGING schema is SSOT**

## Path A: Repo is SSOT (reset/rebuild STAGING from migrations)

### Description
- Treat `supabase/migrations/*.sql` as authoritative.
- Rebuild STAGING from clean baseline + ordered migrations.
- Remove/replace STAGING-only objects unless explicitly reintroduced by approved migrations.

### Pros
- Aligns directly with CONNECT governance and auditable change history.
- Produces deterministic environment rebuild and repeatability.
- Simplifies future drift checks and CI enforcement.
- Lowest long-term governance risk for multi-repo Connect ecosystem.

### Cons
- May temporarily remove STAGING behaviors currently used by teams.
- Requires explicit handling of nonstandard migration filenames and replay order.
- If STAGING contains valid business features not in repo, they must be reintroduced intentionally.

### Risk
- Short-term delivery friction: `Medium`
- Security/governance risk after completion: `Low`
- Data/behavior mismatch during transition window: `Medium`

### Time Cost (estimate)
- Preparation and dry-run: 0.5-1 day
- Rebuild + validations + evidence: 1-2 days
- Total: 1.5-3 days

## Path B: STAGING is SSOT (backport STAGING objects into migrations)

### Description
- Treat current STAGING schema as authoritative.
- Generate reconciliation migrations to represent all retained STAGING objects/policies/functions/triggers in repo.
- Normalize and document all retained behavior.

### Pros
- Preserves current STAGING behavior with lower immediate disruption.
- Reduces risk of breaking unknown downstream consumers in short term.

### Cons
- Highest analysis effort: many extra objects with unclear ownership/scope.
- Risks codifying accidental/manual drift into permanent baseline.
- Harder to prove security intent for existing permissive policies.
- Increases complexity for UPH pilot stabilization.

### Risk
- Short-term delivery friction: `Low-Medium`
- Security/governance risk after completion: `Medium-High` (until full policy hardening done)
- Hidden behavior retention risk: `High`

### Time Cost (estimate)
- Classification and approval of extra objects: 1-2 days
- Backport migrations + policy hardening + validation: 2-4 days
- Total: 3-6 days

## GP Decision Matrix

| Criterion | Path A (Repo SSOT) | Path B (STAGING SSOT) |
|---|---|---|
| Governance fit | Strong | Moderate/weak until hardening complete |
| Security confidence | Higher | Lower initially |
| Speed to stable baseline | Faster | Slower |
| Preserves unknown STAGING behavior | Lower | Higher |
| Auditability | Higher | Medium |

## Recommendation (UPH pilot)

Recommended: **Path A (Repo SSOT)**, with controlled exceptions:
1. Rebuild STAGING from migrations.
2. For each STAGING-only object needed by pilot, reintroduce via explicit, reviewed migrations (`BACKPORT by exception`).
3. Enforce post-DR0 automated drift checks in CI.

Rationale:
- UPH pilot requires predictable, supportable behavior under strict tenant isolation.
- Current drift includes `P0` authorization model divergence; Path A is the fastest route to governance compliance.

## Required GP A/B Decisions

### Decision 1: Extra STAGING tables not in repo
- Option A: mark as out-of-scope for UPH and `DROP` during reconciliation.
- Option B: mark as in-scope and `BACKPORT` with full RLS/index/policy/test coverage.

### Decision 2: Public-read policy families
- Option A: retain only explicitly approved global/public resources.
- Option B: convert to tenant-scoped or authenticated-scoped policies before pilot GO.

### Decision 3: Nonstandard migration files
- Option A: preserve but maintain canonical replay manifest.
- Option B: normalize into timestamped forward migrations and isolate rollback scripts from apply chain.

## GO/NO-GO Statement

Current status: `NO-GO` for schema-affecting sprint work until SSOT path is approved and DR0 runbook execution completes with QA gate evidence.
