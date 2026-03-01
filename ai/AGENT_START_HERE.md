# CONNECT Agent Start Here

- Read `AI_RULES.md` and all `/ai` governance docs before proposing any changes.
- Follow this execution order: Plan -> Implement -> QA -> Evidence -> Sync-to-git.
- Work only within approved scope; do not expand scope without approval.
- Treat security and tenant isolation as non-negotiable (`org_id`/`property_id`, RLS-first).
- Never trust frontend authorization; enforce access in backend and RLS policies.
- Never introduce secrets, credentials, tokens, or private keys in code, docs, or logs.
- Use migrations only in `supabase/migrations/*.sql`; do not make manual schema drift changes.
- Require idempotent SQL and a rollback/compensation approach for DB-affecting changes.
- Run mandatory QA gates: Smoke, Migration, RLS, Production Data, Integration Contract.
- Collect evidence for each gate (command output, SQL results, API samples, screenshots when needed).
- Block sync-to-git until required gates are PASS.
- Keep integration contracts explicit, versioned, and backward compatible by default.
- Enforce PT/EN/ES i18n from v1; no hard-coded user-facing strings.
- If a rule conflict appears, prioritize security/compliance and escalate with options.
