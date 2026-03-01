# TENANT SELECTOR — TECHNICAL SPECIFICATION

**Version:** 1.0  
**Date:** 2026-02-28  
**Status:** IMPLEMENTED

---

## 1. OVERVIEW

The Tenant Selector component provides organization and property context switching for Host Connect. It respects role-based access controls and ensures multi-tenant isolation.

---

## 2. ROLE-BASED BEHAVIOR

| Role | Organization Selector | Property Selector | Fallback |
|------|---------------------|------------------|----------|
| super_admin | ✅ Visible | ✅ Visible | Onboarding property_id |
| admin | ❌ Hidden | ✅ Visible | Onboarding property_id |
| manager | ❌ Hidden | ✅ Visible | Onboarding property_id |
| staff_frontdesk | ❌ Hidden | ❌ Hidden | Locked to assigned property |
| staff_housekeeping | ❌ Hidden | ❌ Hidden | Locked to assigned property |
| viewer | ❌ Hidden | ❌ Hidden | Read-only context |

---

## 3. COMPONENTS

### 3.1 TenantSelector (Full)

Full dropdown selectors for both org and property.

**Usage:**
```tsx
import { TenantSelector } from '@/components/TenantSelector';

<TenantSelector mode="org_property" />  // Super admin
<TenantSelector mode="property_only" /> // Admin/Manager
```

### 3.2 TenantSelectorCompact (Dropdown)

Compact dropdown for header/toolbar integration.

**Usage:**
```tsx
import { TenantSelectorCompact } from '@/components/TenantSelector';

<TenantSelectorCompact />
```

---

## 4. FALLBACK LOGIC

The selector uses the following fallback priority for property selection:

1. **User-selected property** - stored in localStorage (`selectedPropertyId`)
2. **Onboarding property_id** - from `hostconnect_onboarding` table
3. **First available property** - from properties list

```typescript
// From useSelectedProperty.tsx
const displayPropertyId = selectedPropertyId || fallbackPropertyId;
```

---

## 5. PERSISTENCE

| Key | Storage | Scope |
|-----|----------|-------|
| selectedOrgId | React State | Session |
| selectedPropertyId | localStorage | Persistent |

---

## 6. INTEGRATION

### 6.1 Dashboard Layout

The selector should be placed in the header area:

```tsx
// src/components/DashboardLayout.tsx
import { TenantSelector } from '@/components/TenantSelector';

<header className="h-14 border-b flex items-center px-4">
  <TenantSelector className="mr-4" />
  {/* ... other header items */}
</header>
```

### 6.2 Existing Hooks

| Hook | Purpose |
|------|---------|
| `useOrg()` | Organization context (super_admin only) |
| `useSelectedProperty()` | Property context (all roles) |
| `useOnboardingState()` | Fallback property from onboarding |

---

## 7. SECURITY RULES

### 7.1 RLS Enforcement

All data queries MUST include tenant filters:

```typescript
// ✅ CORRECT - includes both org_id and property_id
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('org_id', currentOrgId)
  .eq('property_id', selectedPropertyId);

// ❌ WRONG - missing tenant filters
const { data } = await supabase
  .from('bookings')
  .select('*');
```

### 7.2 Staff Lockdown

Staff users cannot change context:

```typescript
// Hide selector for staff
if (userRole === 'staff_housekeeping' || userRole === 'staff_frontdesk') {
  return null; // No selector
}
```

---

## 8. TESTING CHECKLIST

### 8.1 Super Admin
- [ ] Can see organization dropdown
- [ ] Can see property dropdown
- [ ] Changing org resets property
- [ ] Selection persists across page reload

### 8.2 Admin/Manager
- [ ] Cannot see organization dropdown
- [ ] Can see property dropdown (if multiple properties)
- [ ] Single property shows as static badge
- [ ] Selection persists across page reload
- [ ] Onboarding property used as fallback

### 8.3 Staff
- [ ] No selector visible
- [ ] Context locked to assigned property
- [ ] Cannot switch properties manually

### 8.4 Multi-tenant
- [ ] Cannot access data from other orgs
- [ ] Cannot access data from other properties
- [ ] RLS policies enforced

---

## 9. FILES

| File | Description |
|------|-------------|
| `src/components/TenantSelector.tsx` | Main selector component |
| `src/hooks/useOrg.ts` | Organization context hook |
| `src/hooks/useSelectedProperty.tsx` | Property context hook |
| `src/hooks/useOnboardingState.tsx` | Onboarding fallback hook |

---

## 10. API REFERENCE

### TenantSelector Props

```typescript
interface TenantSelectorProps {
  mode?: 'org_property' | 'property_only' | 'hidden';
  className?: string;
}
```

### useSelectedProperty Hook

```typescript
interface SelectedPropertyContextType {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  isLoading: boolean;
  properties: Property[];
}
```

---

## 11. KNOWN ISSUES

- Staff property assignment requires manual configuration in database
- Onboarding must be completed for fallback to work
- Property list limited to user's organization (RLS)

---

## 12. APPROVAL

| Role | Name | Date |
|------|------|------|
| DEV | MiniMax | 2026-02-28 |
| ORCHESTRATOR | [Pending] | [Pending] |
| GP | [Pending] | [Pending] |
