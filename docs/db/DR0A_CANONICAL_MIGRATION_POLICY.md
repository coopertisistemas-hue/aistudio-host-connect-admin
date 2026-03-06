# DR0-A Canonical Migration Policy (Path A: Repo SSOT)

Date: 2026-03-01  
Status: Approved path = Repo migrations are SSOT  
Scope: make STAGING reproducible and auditable from repository migrations.

## 1. Canonical Ordering Rule

For DR0-A, the migration apply chain is deterministic and derived from **lexicographic filename order** over files under `supabase/migrations/`.

Canonical forward migration filename pattern:
- `YYYYMMDDHHMMSS_<slug>.sql`

Why:
- Deterministic replay order.
- Consistent with migration versioning discipline.
- Auditable in PR review and CI.

## 2. Classification Rule

Each SQL file in `supabase/migrations/` is classified as exactly one of:
1. `FORWARD_CANONICAL`: matches timestamped pattern and is part of apply chain.
2. `FORWARD_NONSTANDARD`: forward intent but non-canonical name (ordering ambiguity risk).
3. `ROLLBACK_ONLY`: rollback script; never part of default apply chain.

## 3. Policy Decision for Current Nonstandard Files

Nonstandard files identified:
- `20260119_sprint2_guest_domain_model.sql`
- `20260120_sprint2.2_submissions.sql`
- `20260121_hotfix_status_constraint.sql`
- `20260121_housekeeping_foundation.sql`
- `20260121_operational_alerts_tables.sql`
- `add_phone_to_profiles_and_sync_trigger.sql`
- `fixes_trial_limit_logic.sql`
- `ROLLBACK_20251226170000_enforce_org_isolation.sql`

Mandatory decisions:
- `ROLLBACK_*.sql` MUST be `ROLLBACK_ONLY` and MUST NOT be in apply chain.
- All `FORWARD_NONSTANDARD` files MUST be normalized to canonical timestamp filenames **or** explicitly excluded from DR0-A apply chain with GP sign-off.

## 3.1 Applied Normalization Mapping (DR0-A)

The following nonstandard forward migrations were normalized to canonical filenames using remote-history-aligned versions:

| Old filename | New canonical filename |
|---|---|
| `20260119_sprint2_guest_domain_model.sql` | `20260119120000_sprint2_guest_domain_model.sql` |
| `20260120_sprint2.2_submissions.sql` | `20260120120000_sprint2_2_submissions.sql` |
| `20260121_hotfix_status_constraint.sql` | `20260121080000_hotfix_status_constraint.sql` |
| `20260121_housekeeping_foundation.sql` | `20260121090000_housekeeping_foundation.sql` |
| `20260121_operational_alerts_tables.sql` | `20260121100000_operational_alerts_tables.sql` |

Operational rule applied:
- Content copied 1:1 into canonical files.
- Original nonstandard files moved out of apply chain to `docs/db/legacy_migrations/`.
- SHA256 equivalence proof stored in `docs/db/evidence/DR0A/<timestamp>/01_normalization_map.txt`.

## 4. Chosen DR0-A Approach

Chosen approach: **Normalize forward nonstandard files into canonical timestamped migrations; exclude rollback scripts from apply chain.**

Reasoning:
- Path A goal is reproducibility. Excluding forward files creates functional drift risk.
- Renaming/normalizing gives deterministic order and preserves intended forward behavior.
- Rollback scripts remain available for incident response but are never auto-applied.

## 5. Execution Rules

1. Build canonical manifest from `FORWARD_CANONICAL` only.
2. Exclude any `ROLLBACK_ONLY` file from apply chain.
3. Do not run DR0-A if any `FORWARD_NONSTANDARD` remains unresolved.
4. Apply chain must be immutable during DR0-A run (no mid-run file additions).
5. Capture manifest and hash list in evidence.

## 6. STOP Conditions

STOP DR0-A immediately if:
- Any nonstandard forward migration remains unresolved.
- Any rollback script appears in the apply manifest.
- A migration file is edited after manifest freeze.

## 7. Audit Artifacts Required

Store under `docs/db/evidence/DR0A/<timestamp>/`:
- `migration_manifest.txt` (ordered list of applied files)
- `migration_manifest.sha256.txt`
- `dr0a_execution.log`
- SQL evidence outputs from `DR0A_EVIDENCE_SQL.sql`
