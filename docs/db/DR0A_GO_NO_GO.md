# DR0-A GO / NO-GO Checklist

Date: 2026-03-01  
Path: A (Repo migrations are SSOT)

## 1) Preconditions

- [ ] GP approval for Path A is documented.
- [ ] Canonical migration manifest frozen and attached.
- [ ] Nonstandard forward migrations resolved (normalized or explicitly excluded with GP sign-off).
- [ ] Rollback scripts excluded from apply chain.
- [ ] Evidence root created: `docs/db/evidence/DR0A/<timestamp>/`.

If any unchecked: `NO-GO`.

## 2) Migration Validation Gate (PASS criteria)

- [ ] `supabase db push --linked` completed with exit code 0.
- [ ] No migration ordering anomalies observed.
- [ ] No manual SQL hotfixes used outside migrations.
- [ ] Post-apply schema dump captured.
- [ ] Migration logs attached in evidence.

PASS rule:
- All checks above must be true.

## 3) RLS Validation Gate (PASS criteria)

Based on `docs/db/DR0A_EVIDENCE_SQL.sql` outputs:
- [ ] All tenant-scoped public tables show `rls_enabled = true`.
- [ ] Query "RLS enabled but zero policies" returns none, or only approved exceptions with written rationale.
- [ ] Policy counts by table/command show no unexplained missing CRUD coverage.
- [ ] Negative tenant-isolation tests (run separately by operator) are attached and pass.

PASS rule:
- No unresolved `P0` RLS/policy issue.

## 4) Drift Re-validation Gate (PASS criteria)

- [ ] `booking_groups` exists in `public`.
- [ ] `property_photos` exists in `public`.
- [ ] No missing expected critical indexes.
- [ ] No unexplained trigger/function drift for critical domain tables.
- [ ] Drift report states: "no material drift" (no `P0`, no `P1` unresolved).

PASS rule:
- Material drift count for `P0` and `P1` is zero.

## 5) Final Decision

- [ ] Migration Validation Gate: PASS
- [ ] RLS Validation Gate: PASS
- [ ] Drift Re-validation Gate: PASS

Decision:
- If all three PASS: `GO`
- Else: `NO-GO`

Sign-off:
- DEV: ____________________ Date: __________
- Orchestrator: ____________ Date: __________
- Security Reviewer: _______ Date: __________
- GP: _____________________ Date: __________

## 6) Rollback Notes

- Rollback scripts are not in default apply chain and must be executed only by explicit incident decision.
- If DR0-A fails mid-run:
  - Stop further migration attempts.
  - Preserve all logs/dumps.
  - Recreate target environment from last known-good manifest and snapshot.
- Never bypass RLS controls as a temporary workaround.

## 7) Escalation Procedure

Escalate immediately to Orchestrator + GP + Security when:
- Any `P0` tenant isolation risk is detected.
- Migration execution diverges from manifest order.
- Unexpected STAGING-only privileged functions/policies appear.
- Evidence is incomplete or non-reproducible.

Escalation packet must include:
- Failure timestamp (UTC)
- Exact command output/log excerpt
- Affected objects
- Proposed next-safe action (`STOP`, `ROLLBACK`, or `REBUILD`)

