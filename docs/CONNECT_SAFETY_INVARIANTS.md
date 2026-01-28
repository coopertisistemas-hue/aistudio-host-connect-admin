# CONNECT Safety Invariants

## Must Not Break
- Prefetch must be gated by feature flags.
- Observability must never emit PII (no user/org IDs, emails, tokens, phones).
- New heavy routes must be lazy-loaded.
- Feature flags must default OFF in production unless explicitly enabled.
- Error boundaries must not expose stack traces to users.

## Must Check Before Merge
- `pnpm safety:check`
- `pnpm -s build`

## Housekeeping Audit Hint
- Housekeeping cards must never display user names, emails, or IDs.
- Only relative time (e.g., “Atualizado há 5 min”) and role labels (e.g., “governança”) are allowed.

## Examples (Do/Don't)
- Do: guard prefetch with `PREFETCH_NAV` flag.
- Don't: call prefetch directly without flag checks.
- Do: normalize route keys and strip query strings for observability.
- Don't: log any user identifiers.
