# SP0 Manual Validation Checklist

## UI Wiring
- [x] `TenantSelector` integrated in dashboard header.
  - File: `src/components/DashboardLayout.tsx`
  - Behavior: rendered only when `!isSuperAdmin` to avoid conflict with sidebar `OrgSwitcher`.
- [x] Role-based visibility remains in `TenantSelector`.
  - File: `src/components/TenantSelector.tsx` (staff/viewer returns `null`).
- [x] `ReportPage` wired into routing.
  - File: `src/App.tsx`
  - Route: `/reports`
  - Protection: wrapped in `<ProtectedRoute>`.
- [x] Tenant-aware route behavior.
  - `ReportPage` uses `useSelectedProperty` and `useBookings(selectedPropertyId)`.

## Validation
- [x] Build executed: `pnpm build` (PASS)
  - Log: `docs/qa/SP0/build.log`
- [x] TypeScript check executed: `pnpm exec tsc --noEmit` (PASS)
  - Log: `docs/qa/SP0/typecheck.log`
- [x] Lint on changed files executed: `pnpm exec eslint src/components/DashboardLayout.tsx src/App.tsx` (PASS)
  - Log: `docs/qa/SP0/lint_changed_files.log`
- [ ] Full repo lint is green.
  - Current status: FAIL due to pre-existing repository issues unrelated to this wiring.
  - Log: `docs/qa/SP0/lint.log`

## Tenant Context Persistence
- [x] Property persistence confirmed by implementation.
  - `useSelectedProperty` persists `selectedPropertyId` via localStorage.
- [x] Org switching remains on `OrgSwitcher` (super admin) without duplication in header.

## Screenshots
- [ ] Header showing `TenantSelector` rendered.
- [ ] `/reports` route rendered.

Required target paths:
- `docs/qa/SP0/screenshots/tenant-selector-header.png`
- `docs/qa/SP0/screenshots/report-page-route.png`

Note: screenshot capture requires interactive browser session by operator.
