# Phase 0 - Guest Guide Admin Architecture Review and Mutation Feasibility Gate

Date: 2026-03-07
Repository: `aistudio-host-connect-admin`
Scope: technical validation and safe scaffolding only

## 1) Repository Pattern Findings

### Supabase Client Pattern
- Client is centralized in `src/integrations/supabase/client.ts` via `createClient<Database>()`.
- All data hooks import this singleton (`supabase`) directly.
- `Database` types currently map only `public` schema in `src/integrations/supabase/types.ts`.

### Tenant and Access Context Pattern
- Context chain used by app:
  - `AuthProvider` (`src/hooks/useAuth.tsx`)
  - `SelectedPropertyProvider` (`src/hooks/useSelectedProperty.tsx`)
  - `AccessContextProvider` (`src/platform/access/AccessContext.tsx`)
  - `TenantContextProvider` (`src/platform/tenant/TenantContext.tsx`)
- Effective tenant scope consumed by modules: `currentOrgId`, `currentPropertyId`.

### Route and Module Registration Pattern
- Routing is centralized in `src/App.tsx` with explicit `<Route/>` entries.
- Access guards are route-level wrappers:
  - `TenantRoute`
  - `ModuleRoute`
  - `RoleRoute`
- Sidebar/menu is registered in `src/components/AppSidebar.tsx`.

### Query / Mutation Pattern
- Current repo standard is React Query hooks under `src/hooks/*`.
- Most hooks perform direct `supabase.from(...).select/insert/update/delete`.
- Edge usage exists but is selective (`supabase.functions.invoke`) and not a global requirement.
- No explicit module-local API layer is consistently enforced in existing CRUD hooks.

### Shared UX Primitives
- Layout: `DashboardLayout`, `OperationPageTemplate`, `EntityDetailTemplate`.
- KPI cards: `KpiCard`.
- Loading skeletons: `DataTableSkeleton`.
- Empty states: `components/onboarding/EmptyState`.
- Error UX is mostly toast-based (`use-toast`) with occasional inline fallback.

## 2) Mutation Feasibility Matrix (Guest Guide Admin)

Classification legend:
- `ALLOWED NOW`: technically aligned and safe under current validated repo/backend constraints.
- `BLOCKED`: cannot be implemented without violating current constraints.
- `REQUIRES ARCHITECTURAL DECISION`: possible in principle but lacks validated governance/contract.

| Entity | Feasibility | Rationale |
|---|---|---|
| `pages` | REQUIRES ARCHITECTURAL DECISION | Host Admin repo accepts direct writes for `public` schema, but `guest_guide` write contract is not validated in this repo and no typed schema binding exists. |
| `content_blocks` | REQUIRES ARCHITECTURAL DECISION | Same as above + ordering/publish operations require conflict and consistency rules. |
| `navigation_nodes` | REQUIRES ARCHITECTURAL DECISION | Reordering and activation require deterministic write semantics not yet defined. |
| `partners` | REQUIRES ARCHITECTURAL DECISION | Current repo supports CRUD pattern generally, but no validated `guest_guide` mutation boundary. |
| `partner_media` | REQUIRES ARCHITECTURAL DECISION | Requires media + metadata write policy and tenant guard model validation. |
| `partner_schedules` | REQUIRES ARCHITECTURAL DECISION | Needs transaction/consistency policy for schedule set replacement. |
| `background_videos` | REQUIRES ARCHITECTURAL DECISION | Default/sponsored uniqueness constraints need enforced write strategy. |
| `top_sticker_messages` | REQUIRES ARCHITECTURAL DECISION | Locale/time-window overlap validation must be defined before writes. |

### Important contradiction resolved by this gate
- Planned CRUD scope is **not** feasible under “existing APIs only”, because existing Guest Guide edges are read-oriented and do not expose admin mutations.
- Therefore, CRUD is not approved in Phase 0.

## 3) Tenant Safety Review

### How tenant context is sourced
- `org_id`: resolved from access context (`useOrg` + `AccessPolicyAdapter`).
- `property_id`: selected via `SelectedPropertyProvider` and propagated through tenant context.

### Current enforcement model
- Route-level guards validate authentication, tenant and property context before page render.
- Data-layer enforcement is mixed:
  - many hooks apply `.eq('org_id', currentOrgId)` / `.eq('property_id', ...)`
  - some operations rely heavily on backend RLS and role checks.

### Safety posture for Guest Guide writes
- Current patterns are insufficient to approve new cross-schema writes by default.
- Required minimum mutation safety rules for next phase:
  1. Every write must include explicit tenant scope (`org_id` + `property_id`) in filter or payload.
  2. Mutation hooks must refuse execution if `currentOrgId` or `currentPropertyId` is missing.
  3. Prefer server-side guard path when operation has side effects (publish/reorder/default flags).
  4. Add per-entity mutation invariant checks (e.g., single default video).
  5. Add audit logging for admin write actions.

## 4) Architecture Conventions Proposal

Recommended module structure (approved as baseline):

```text
src/modules/guestGuideAdmin
+-- api
+-- services
+-- hooks
¦   +-- queries
¦   +-- mutations
¦   +-- ui
+-- components
+-- pages
+-- types
¦   +-- dto.ts
¦   +-- domain.ts
¦   +-- forms.ts
+-- utils
+-- index.ts
```

Boundary rules:
- `api`: transport boundary only (edge invoke, headers, raw DTOs).
- `services`: mapping/adaptation `DTO -> domain` and command orchestration.
- `hooks/queries`: cache keys, read queries, stale policies.
- `hooks/mutations`: write commands only after mutation contract approval.
- `hooks/ui`: local interaction state (filters, drawers, dialogs), no network.
- `types/dto.ts`: payloads matching backend transport.
- `types/domain.ts`: UI-consumable normalized models.
- `types/forms.ts`: form schemas/view-models only.

## 5) Premium UI Governance Baseline

Reuse-first baseline for Guest Guide Admin:
- Section containers/cards: `OperationPageTemplate`, `Card`.
- KPI/stat cards: `KpiCard`.
- Loading skeletons: `DataTableSkeleton`.
- Empty states: `EmptyState` variants in onboarding components.
- Error states: maintain toast + add inline card alert on blocking failures.
- Page headers/action bars: `OperationPageTemplate` header + `headerActions`.

## 6) Phase 0 Decision

- Dashboard read path (KPI from `get_kpi_summary`) is viable for next phase.
- CRUD mutation path is **not approved** under current “existing APIs only” constraint.

Decision for next phase planning:
- **GO for dashboard read scope**
- **CRUD remains blocked pending architectural decision on mutation path governance**
