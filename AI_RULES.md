# CONNECT — AI RULES (Global Standard)

Authoritative governance references (must be read together with this file):
- `ai/CONNECT_GUARDRAILS.md`
- `ai/CONNECT_WORKFLOW.md`
- `ai/CONNECT_QA_GATES.md`
- `ai/HOST_CONNECT_CONTEXT.md`

If any conflict exists, resolve in this order: security/compliance requirements > QA gates > workflow > repo conventions.

## 0. Operating Contract (non-negotiables)
- Roles:
  - Orchestrator: owns task framing, scope boundaries, and acceptance criteria.
  - GP: owns business priority, approvals, and production-risk decisions.
  - DEV (Codex): owns implementation, test execution, evidence capture, and reversibility.
- Decision authority:
  - DEV does not change approved scope without explicit Orchestrator/GP approval.
  - Breaking changes, production data access, and contract changes require explicit sign-off before execution.
- Execution flow:
  - Plan first, then implement, then run QA gates, then collect evidence, then sync to git.
  - No code change starts before a concrete step-by-step plan is stated.
- Execution autonomy (DEV):
  - DEV executes routine technical operations autonomously (read/write in repo, local commands, validation scripts, CI checks, evidence generation) without confirmation prompts.
  - Permission/escalation questions must be avoided when environment policy already grants full access.
  - Escalate only when a business/governance decision is required from GP/Orchestrator (scope change, risk acceptance, production-impact tradeoff, policy exception).
  - When escalation is required, provide clear options (A/B), risks, and recommendation.
- No unapproved scope expansion:
  - Do not add refactors/features outside requested scope unless approved.
  - If a blocker is found, stop and escalate with options and tradeoffs.

## 1. Security & Data Governance (RLS-first)
- Multi-tenant isolation is mandatory:
  - `org_id` is required for tenant-scoped organization data.
  - `property_id` is required for property-scoped data when applicable.
  - Cross-tenant reads/writes must be impossible by policy, not by UI convention.
- Never trust frontend authorization:
  - Frontend checks are UX only; authorization is enforced server-side and by RLS.
  - API/Edge layer validates tenant context and role on every mutating operation.
- RLS policy requirements:
  - RLS enabled on all multi-tenant tables.
  - Explicit policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
  - Negative tests required: cross-tenant query attempts must return zero rows/denied writes.
- Direct DB access is prohibited by default:
  - Client apps must not connect directly to privileged DB paths.
  - Service role usage is restricted to approved backend/admin workflows and audited.

## 2. Development Workflow (Connect)
- Branch naming:
  - `feature/<scope>`, `fix/<scope>`, `hotfix/<scope>`, `chore/<scope>`.
- Commit message standard:
  - Conventional format: `type(scope): summary` (example: `feat(host-sync): add reservation status mapping`).
- PR checklist (required):
  - Scope matches approved task.
  - Security impact assessed (RLS/auth/PII).
  - Migration and rollback documented (if DB changed).
  - QA gate evidence attached.
  - Integration contract impact identified.
- Sync-to-git policy:
  - Sync/push only after all required QA gates are PASS.
  - No partial sync for unvalidated production-impacting changes.
- Evidence capture is mandatory:
  - Store command outputs, SQL validation outputs, API samples, and screenshots when UI behavior is validated.

## 3. Quality Gates (mandatory)
All gates align with `ai/CONNECT_QA_GATES.md` and are release blockers if failed.

- Smoke Test Gate:
  - App starts, critical APIs respond, auth flow works, DB connectivity is healthy, dependencies are available.
  - Failure action: rollback immediately.
- Migration Validation Gate:
  - Migrations are idempotent, tested in staging, safe for large tables, and have rollback path.
  - Post-check: RLS remains enabled, indexes exist, logs have no migration errors.
  - Failure action: stop rollout, fix migration, re-validate.
- RLS Validation Gate:
  - RLS enabled on all tenant tables, policy coverage complete, cross-tenant leakage test passes.
  - Service-role bypass only for approved admin functions.
  - Failure action: hotfix RLS before routing traffic.
- Production Data Validation Gate:
  - No production data access without explicit GO approval.
  - Access must be logged, auditable, time-bound, and compliant with PII controls.
  - Failure action: revoke access and escalate to security.
- Integration Contract Validation Gate:
  - Contracts are backward compatible, webhooks/integrations pass, auth and rate-limit behavior validated.
  - Failure action: revert integration changes and re-test.

## 4. UI Premium Standards
- Layout consistency:
  - List pages: filters, sortable table/list, pagination, empty state.
  - Form pages: grouped sections, inline validation, explicit submit states.
  - Report pages: summary KPIs, drill-down, export actions.
- State coverage:
  - Every screen must include deterministic empty/loading/error states.
- Filtering:
  - Standard filters + smart filters (saved presets/recent combinations where relevant).
- Export and print:
  - CSV export and print-to-PDF patterns are required for report/list experiences when business data is presented.
- Role-based progressive disclosure:
  - Show only actions/data allowed by role; unauthorized actions are hidden or disabled with clear rationale.

## 5. i18n Standard
- Languages:
  - PT, EN, and ES are required from v1 for user-facing modules.
- String management:
  - No hard-coded user-facing strings in components/pages.
  - All UI text must come from i18n resources.
- Namespace conventions:
  - Use domain-based namespaces (example: `common`, `auth`, `reservations`, `properties`, `reports`).
- Fallback rules:
  - Fallback chain: requested locale -> English (`en`) -> non-empty key-safe default.
  - Missing keys must be logged in development and tracked for closure.

## 6. Database & Migrations Rules
- Idempotent SQL only:
  - Use safe guards such as `IF NOT EXISTS`/`IF EXISTS` where supported.
- Migration source of truth:
  - Schema changes only via `supabase/migrations/*.sql`.
  - No manual console drift in staging/production.
- Drift control:
  - Validate with schema dump/diff in CI or pre-release checks.
  - Any detected drift must be reconciled via migration, never by ad-hoc edits.
- Rollback and safety:
  - Each migration set must define rollback or compensating strategy.
  - For risky changes, require phased rollout and data-backfill safety checks.

## 7. Integrations & Contracts
- System boundaries:
  - Host, Reserve, and Portal modules communicate only through versioned contracts.
  - No implicit cross-repo coupling via undocumented payload shapes.
- Edge Functions/API contracts:
  - Inputs/outputs/auth requirements must be explicit and versioned.
  - Contract tests are required for changed endpoints/events.
- Versioning:
  - Breaking changes require new version path/tag plus migration guide and deprecation window.

## 8. Output Requirements for DEV (Codex)
Every response that proposes code must include:
- Summary
- Files to change
- Diff or patch
- QA steps
- Evidence to collect
- Git sync plan (commit messages)

If DB/RLS is affected, include:
- RLS checklist
- Minimal validation SQL (read-only)
- Gate status (PASS/BLOCKED) and reason

## 9. Repo Overrides (optional, keep small)
Use this section only for repo-specific operational details that do not weaken global rules.

Allowed examples:
- Local run/test commands (`pnpm dev`, `pnpm build`)
- Folder conventions unique to the repo
- Non-secret environment variable names

Forbidden examples:
- Secrets, tokens, passwords, private keys
- Rules that bypass RLS, QA gates, approvals, or migration controls

Current override for this repo:
- None
