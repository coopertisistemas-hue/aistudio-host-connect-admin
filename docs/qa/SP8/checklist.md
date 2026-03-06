# SP8 Checklist

- [x] Migration created (forward-only, idempotent)
- [x] Build PASS (`build.log`)
- [x] Typecheck PASS (`typecheck.log`)
- [x] Lint changed files PASS (`lint_changed_files.log`)
- [x] Preflight linked project validated (`sql/preflight_cli.txt`)
- [x] `supabase db push --linked` PASS (`sql/db_push.log`)
- [x] RLS gate PASS (`sql/rls_gate.log`)
- [x] Structural drift gate PASS (`sql/structural_drift_gate.log`)
- [x] Tenant contract gate PASS (`sql/tenant_contract_gate.log`)
- [x] SQL validation outputs captured (`sql/sql_validation_outputs.txt`)
- [x] Sync-to-git
