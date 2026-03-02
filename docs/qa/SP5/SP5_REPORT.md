# SP5 Report - Folio, Charges and Payments Integrity

## Summary
SP5 implementou hardening de banco para folio/revenue com migration forward-only, idempotente e RLS-first, incluindo criacao/normalizacao de `folio_items` e `folio_payments`, reforco de integridade em `invoices`/`booking_charges` e trigger de consistencia de escopo por `booking_id`.

## Scope Mapping
- Folio line-item consistency: constraints, trigger de consistencia e indexes.
- Payment integrity: tabela `folio_payments` hardened com constraints + RLS.
- Invoice/charges hardening: `org_id`, constraints e politicas CRUD explicitas.
- Structural drift governance: baseline atualizado para refletir mudança estrutural aprovada via migration.

## Files Changed
- `supabase/migrations/20260302143000_sp5_folio_revenue_db_hardening.sql`
- `src/hooks/useInvoices.tsx`
- `docs/db/baselines/SP1B_baseline/structural_fingerprint.csv`
- `docs/qa/SP5/SP5_REPORT.md`
- `docs/qa/SP5/checklist.md`
- `docs/qa/SP5/build.log`
- `docs/qa/SP5/typecheck.log`
- `docs/qa/SP5/lint_changed_files.log`
- `docs/qa/SP5/sql/preflight_cli.txt`
- `docs/qa/SP5/sql/db_push.log`
- `docs/qa/SP5/sql/migration_list_after_push.log`
- `docs/qa/SP5/sql/rls_gate.log`
- `docs/qa/SP5/sql/structural_drift_gate.log`
- `docs/qa/SP5/sql/tenant_contract_gate.log`
- `docs/qa/SP5/notes/timestamp.txt`

## DB Changes
- New migration: `20260302143000_sp5_folio_revenue_db_hardening.sql`
- Conteudo principal:
  - `CREATE TABLE IF NOT EXISTS` para `folio_items` e `folio_payments`
  - constraints de integridade de valores/categorias/metodos
  - backfill de `org_id` / `property_id` em `invoices` e `booking_charges`
  - trigger `enforce_booking_scope_consistency()` para coerencia `org_id/property_id` com booking
  - RLS enable + policies CRUD explicitas para `folio_items`, `folio_payments`, `invoices`, `booking_charges`

## QA Steps Executed + Results
- Build: PASS (`docs/qa/SP5/build.log`)
- Typecheck: PASS (`docs/qa/SP5/typecheck.log`)
- Lint changed files: PASS (`docs/qa/SP5/lint_changed_files.log`)
- Preflight CLI: PASS (`docs/qa/SP5/sql/preflight_cli.txt`)
  - linked project-ref local: `oravqykjpgqoiidqnfja`
- `supabase db push --linked`: PASS (`docs/qa/SP5/sql/db_push.log`)
- Remote migration check: PASS (`docs/qa/SP5/sql/migration_list_after_push.log`)
  - `20260302143000` presente em Local e Remote

## Gate Results (DB)
- RLS Gate: PASS (`docs/qa/SP5/sql/rls_gate.log`)
- Structural Drift Gate: PASS (`docs/qa/SP5/sql/structural_drift_gate.log`)
- Tenant Contract Gate: PASS (`docs/qa/SP5/sql/tenant_contract_gate.log`)

## Final Verdict
**PASS**

## Residuals / Follow-ups
- Prosseguir para SP6 (Revenue Intelligence & Reconciliation) usando baseline estrutural atualizado desta sprint.
