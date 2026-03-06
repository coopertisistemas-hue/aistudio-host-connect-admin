# SP1 Checklist

- [x] Implementação SP1 concluída (bulk status + CRUD room categories/services/amenities)
- [x] Build executado e logado (`build.log`)
- [x] Typecheck executado e logado (`typecheck.log`)
- [x] Lint de arquivos alterados executado e logado (`lint_changed_files.log`)
- [x] Migration forward-only criada e aplicada (`20260302123000_sp1_property_scope_amenities.sql`)
- [x] `supabase db push --linked` executado e logado (`sql/db_push.log`)
- [x] RLS gate PASS (`sql/rls_gate.log`)
- [x] Structural drift gate PASS (`sql/structural_drift_gate.log`)
- [x] Tenant contract gate PASS (`sql/tenant_contract_gate.log`)
- [x] Evidências SQL salvas em `docs/qa/SP1/sql/`
- [x] SP1 report gerado (`SP1_REPORT.md`)
