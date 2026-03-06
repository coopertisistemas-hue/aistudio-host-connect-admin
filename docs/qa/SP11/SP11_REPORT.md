# SP11 Report - Public API Hardening

## Summary
SP11 endureceu a borda de API publica com contrato versionado, escopos obrigatorios por endpoint, rate limit por cliente+endpoint, validacoes de propriedade e auditoria estruturada com `trace_id`.

## Scope Mapping
- Contratos/versionamento de endpoints publicos: entregue.
- Escopos de token/chave + limites de uso: entregue.
- Auditoria minima de requests/falhas: entregue.

## Files Changed
- `supabase/functions/_shared/publicApi.ts`
- `supabase/functions/check-availability/index.ts`
- `supabase/functions/calculate-price/index.ts`
- `supabase/functions/get-public-website-settings/index.ts`
- `src/hooks/useBookingEngine.tsx`
- `src/hooks/usePublicWebsiteSettings.tsx`
- `docs/integrations/SP11_PUBLIC_API_V1_SPEC.md`
- `docs/integrations/SP11_PUBLIC_API_AUTHZ_RULES.md`
- `docs/qa/SP11/SP11_REPORT.md`
- `docs/qa/SP11/checklist.md`
- `docs/qa/SP11/build.log`
- `docs/qa/SP11/typecheck.log`
- `docs/qa/SP11/lint_changed_files.log`

## DB Changes
No DB changes.

## QA Steps Executed + Results
- Build: PASS (`docs/qa/SP11/build.log`)
- Typecheck: PASS (`docs/qa/SP11/typecheck.log`)
- Lint changed files: PASS (`docs/qa/SP11/lint_changed_files.log`)

## Gate Results
- DB gates: not required (no migration/schema/policy changes in SP11).

## Final Verdict
**PASS**

## Residuals / Follow-ups
- Rate limit atual e best-effort em memoria da edge runtime; para enforce distribuido, evoluir para backend compartilhado de rate limit na fase seguinte.
