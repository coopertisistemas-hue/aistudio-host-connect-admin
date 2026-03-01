# HOST CONNECT — PHASE 1 SMOKE TEST REPORT

- **Repo:** `aistudio-host-connect-admin`
- **Branch:** `main`
- **Commit:** `4dc3c1027b255b5673648792789181ad24d4813b`
- **Date:** `2026-02-28`
- **Environment:** Local (development)
- **Commands executed:**
  - `npx tsc --noEmit --skipLibCheck` ✓ (passed)
  - `pnpm run build` (timeout - resource constrained)
  - `pnpm run lint` (timeout - resource constrained)

---

## A — Login & Redirect: **PASS**

### Evidence:
- `PostLoginRedirect.tsx:15-68` implements deterministic redirect logic
- No redirect loops: guarded by `window.location.pathname !== destination`
- Role-based destinations:
  - `staff_housekeeping` → `/m/housekeeping`
  - `admin`, `manager`, `staff_frontdesk`, `viewer`, default → `/front-desk`
  - `isSuperAdmin` → `/dashboard`
  - `!onboardingCompleted` → `/setup`

### Blocking Issues: None

---

## B — Operation Modes: **FAIL (NOT IMPLEMENTED)**

### Evidence:
- Searched codebase for `SIMPLIFIED`, `STANDARD`, `FULL` patterns — **0 matches**
- No operation mode state or configuration found
- No sidebar behavior variations based on mode

### Blocking Issues:
1. **MISSING FEATURE**: Operation modes (SIMPLIFIED/STANDARD/FULL) are not implemented
2. Cannot test mode-specific sidebar behavior
3. No mapping of features to operation modes

---

## C — Progressive Disclosure: **PARTIAL**

### Evidence:
- **Plan-based entitlements**: `useEntitlements.ts` controls module access by plan (free/basic/pro/premium/founder)
- **Role-based access**: `useOrg.ts` provides `role` (owner/admin/member/viewer)
- **Member permissions**: `member_permissions` table supports module-level `can_read`

### What's Working:
- Plan gating: `ecommerce`, `otas`, `gmb`, `ai_assistant`, `financial`, `tasks` gated by plan
- Role-based navigation restrictions via `userRole` in components

### What's Missing:
- Progressive disclosure tied to **operation modes** (which don't exist)
- No mode + role combination restrictions

### Blocking Issues:
1. **MISSING FEATURE**: Cannot fully test progressive disclosure without operation modes
2. Progressive disclosure only works on plan axis, not on mode axis

---

## D — Operational Flow: **PASS**

### Evidence:
- **Booking Flow**: `useBookings.tsx` - create, update, delete bookings with org_id
- **Check-in/Check-out**: `useUpdateBookingStatus.tsx`, status constants in `src/lib/constants/statuses.ts`
- **Room Status**: `useUpdateRoomStatus.tsx`
- **Front Desk**: `FrontDeskPage.tsx` - arrivals, departures, quick booking
- **Housekeeping**: `HousekeepingPage.tsx`, `MobileHousekeepingPage.tsx`

### Key Components Verified:
- `FrontDeskPage.tsx:99-150` - arrivals today query with date filtering
- `useBookings.tsx:128-182` - createBooking mutation with org_id
- `useUpdateBookingStatus.tsx` - status transitions

### Blocking Issues: None

---

## E — Multi-tenant / RLS: **PASS**

### Evidence:
- **Database RLS**: Migration `20260119000004_rls_policy_hardening.sql` implements strict org-based policies
  - 7 tables hardened: amenities, room_types, services, item_stock, room_type_inventory, pricing_rules, website_settings
  - Uses helper functions: `is_org_member()`, `is_org_admin()`, `is_hostconnect_staff()`
- **Frontend Isolation**: All data hooks include `org_id` in queries
  - `useBookings.tsx:71` - `.eq('org_id', currentOrgId)`
  - `useOrg.ts` - provides `currentOrgId` from organization context
  - `useSelectedProperty.tsx` - provides `selectedPropertyId` for property-level filtering

### Verified Patterns:
```typescript
// useBookings.tsx:51-71
if (!currentOrgId) {
  console.warn('[useBookings] Abortando fetch: currentOrgId indefinido.');
  return [];
}
// ... query includes .eq('org_id', currentOrgId)
```

### Blocking Issues: None

---

## GO/NO-GO: **NO-GO**

### Reason:
- **Operation Modes (B)** feature is **NOT IMPLEMENTED**
- This blocks full validation of **Progressive Disclosure (C)**

---

## Blocking Issues Summary:

| Issue | Severity | Description |
|-------|----------|-------------|
| B.1 | **HIGH** | Operation modes (SIMPLIFIED/STANDARD/FULL) not implemented in codebase |
| C.1 | **MEDIUM** | Progressive disclosure cannot be fully validated without operation modes |

---

## Suggested Next Action:

1. **Implement Operation Modes** (if required by product):
   - Add `operation_mode` field to profiles/organizations
   - Create mode configuration (which features visible per mode)
   - Update sidebar/sidebar component to react to mode

2. **Re-run Phase 1 Smoke Test** after operation modes are implemented

3. **Verify Progressive Disclosure** with new mode + role combinations

---

## Test Artifacts:
- TypeScript compilation: ✓ Passed (`npx tsc --noEmit --skipLibCheck`)
- Code analysis: Manual review of 15+ source files
- Database migrations: 40+ migration files reviewed for RLS policies
