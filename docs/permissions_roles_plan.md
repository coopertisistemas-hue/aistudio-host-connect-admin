# Permissions & Roles — Backend Enforcement Plan

**Date**: 2026-01-19  
**Task**: TASK 3 — Permissions & Roles Backend Enforcement  
**Objective**: Enforce backend-level permissions aligned with frontend permission model  
**Status**: Planning Phase

---

## 1. Current Permission Model Analysis

### Existing Infrastructure

**Tables**:
- `org_members` - User roles in organizations (owner, admin, member, viewer)
- `member_permissions` - Granular module-level permissions (can_read, can_write)

**Roles** (from `org_members.role`):
- `owner` - Full access to everything
- `admin` - Full access to everything
- `member` - Granular permissions via `member_permissions`
- `viewer` - Read-only access to all modules

**Modules** (from frontend `usePermissions.ts`):
- `financial` - Financial data, invoices, expenses
- `bookings` - Reservations, bookings
- `guests` - Guest information
- `properties` - Property management
- `inventory` - Inventory, stock
- `team` - Team management, staff
- `reports` - Reports and analytics
- `settings` - System settings

**Permission Actions**:
- `can_read` - View data
- `can_write` - Create, update, delete data

### Current RLS Policies (member_permissions table)

```sql
-- Admins manage permissions
CREATE POLICY "Admins manage permissions" ON public.member_permissions
  FOR ALL USING (public.is_org_admin(org_id));

-- Members view own permissions
CREATE POLICY "Members view own permissions" ON public.member_permissions
  FOR SELECT USING (auth.uid() = user_id);
```

### Frontend Permission Logic (usePermissions.ts)

```typescript
// Owner/Admin: Full access
if (isOwnerOrAdmin) return true;

// Viewer: Read-only to all modules
if (role === 'viewer') return action === 'read';

// Member: Check member_permissions table
const permission = permissions.find(p => p.module_key === module);
if (action === 'read') return permission.can_read;
if (action === 'write') return permission.can_write;
```

---

## 2. Backend Enforcement Architecture

### Design Principles

1. **Single Source of Truth**: Permission logic in reusable SQL functions
2. **No Duplication**: One function per permission check
3. **Performance**: Optimized queries, minimal joins
4. **Security**: Fail-safe (deny by default)
5. **Maintainability**: Clear naming, comprehensive comments

### Permission Flow

```
User Request
    ↓
RLS Policy Check
    ↓
has_module_permission(module_key, action)
    ↓
Check role (owner/admin → allow)
    ↓
Check role (viewer → allow read only)
    ↓
Check member_permissions (member → granular)
    ↓
Allow or Deny
```

---

## 3. Helper SQL Functions

### Function 1: has_module_permission

**Purpose**: Check if current user has permission for a specific module and action

```sql
-- Migration: 20260119100000_permission_helper_functions.sql
-- Description: Create helper functions for granular permission checks
-- Date: 2026-01-19

-- =============================================================================
-- FUNCTION: has_module_permission
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_module_permission(
  p_org_id uuid,
  p_module_key text,
  p_action text DEFAULT 'read'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_permission record;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user's role in the organization
  SELECT role INTO v_role
  FROM public.org_members
  WHERE org_id = p_org_id
    AND user_id = v_user_id;
  
  -- If not a member, deny access
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Owner and Admin have full access
  IF v_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Viewer has read-only access to all modules
  IF v_role = 'viewer' THEN
    RETURN p_action = 'read';
  END IF;
  
  -- For members, check granular permissions
  IF v_role = 'member' THEN
    SELECT * INTO v_permission
    FROM public.member_permissions
    WHERE org_id = p_org_id
      AND user_id = v_user_id
      AND module_key = p_module_key;
    
    -- No permission record found - deny access
    IF v_permission IS NULL THEN
      RETURN false;
    END IF;
    
    -- Check specific action
    IF p_action = 'read' THEN
      RETURN v_permission.can_read;
    ELSIF p_action = 'write' THEN
      RETURN v_permission.can_write;
    ELSE
      RETURN false;
    END IF;
  END IF;
  
  -- Default: deny access
  RETURN false;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.has_module_permission(uuid, text, text) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.has_module_permission IS 
'Check if current user has permission for a specific module and action. 
Returns true if user has permission, false otherwise.
Supports roles: owner, admin (full access), viewer (read-only), member (granular).';
```

### Function 2: get_user_module_permissions

**Purpose**: Get all module permissions for current user (for caching)

```sql
-- =============================================================================
-- FUNCTION: get_user_module_permissions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_module_permissions(p_org_id uuid)
RETURNS TABLE (
  module_key text,
  can_read boolean,
  can_write boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get user's role
  SELECT om.role INTO v_role
  FROM public.org_members om
  WHERE om.org_id = p_org_id
    AND om.user_id = v_user_id;
  
  IF v_role IS NULL THEN
    RETURN;
  END IF;
  
  -- Owner/Admin: Full access to all modules
  IF v_role IN ('owner', 'admin') THEN
    RETURN QUERY
    SELECT 
      unnest(ARRAY['financial', 'bookings', 'guests', 'properties', 'inventory', 'team', 'reports', 'settings'])::text,
      true,
      true;
    RETURN;
  END IF;
  
  -- Viewer: Read-only to all modules
  IF v_role = 'viewer' THEN
    RETURN QUERY
    SELECT 
      unnest(ARRAY['financial', 'bookings', 'guests', 'properties', 'inventory', 'team', 'reports', 'settings'])::text,
      true,
      false;
    RETURN;
  END IF;
  
  -- Member: Return granular permissions
  IF v_role = 'member' THEN
    RETURN QUERY
    SELECT 
      mp.module_key,
      mp.can_read,
      mp.can_write
    FROM public.member_permissions mp
    WHERE mp.org_id = p_org_id
      AND mp.user_id = v_user_id;
    RETURN;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_module_permissions(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_user_module_permissions IS 
'Get all module permissions for current user in the specified organization.
Returns a table with module_key, can_read, can_write for each module.';
```

### Function 3: is_viewer_role

**Purpose**: Quick check if user is viewer (for read-only enforcement)

```sql
-- =============================================================================
-- FUNCTION: is_viewer_role
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_viewer_role(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.org_members
  WHERE org_id = p_org_id
    AND user_id = auth.uid();
  
  RETURN v_role = 'viewer';
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_viewer_role(uuid) TO authenticated;

COMMENT ON FUNCTION public.is_viewer_role IS 
'Check if current user has viewer role in the specified organization.
Viewers have read-only access to all modules.';
```

---

## 4. Permission-Aware RLS Policies

### Module-to-Table Mapping

| Module | Tables |
|--------|--------|
| `financial` | invoices, expenses, pricing_rules |
| `bookings` | bookings, booking_charges |
| `guests` | (guest data in bookings) |
| `properties` | properties, rooms, room_types |
| `inventory` | inventory_items, item_stock, stock_items, room_type_inventory |
| `team` | staff_profiles, departments, shifts, shift_assignments |
| `reports` | (read-only views, no specific tables) |
| `settings` | website_settings, services |

### Template: Permission-Aware RLS Policy

```sql
-- Migration: 20260119100001_permission_aware_rls_policies.sql
-- Description: Implement permission-aware RLS policies for all modules
-- Date: 2026-01-19

-- =============================================================================
-- FINANCIAL MODULE
-- =============================================================================

-- invoices table
DROP POLICY IF EXISTS "org_members_select_invoices" ON public.invoices;
DROP POLICY IF EXISTS "org_members_insert_invoices" ON public.invoices;
DROP POLICY IF EXISTS "org_members_update_invoices" ON public.invoices;
DROP POLICY IF EXISTS "org_admins_delete_invoices" ON public.invoices;

-- SELECT: Users with 'financial' read permission
CREATE POLICY "financial_read_invoices"
ON public.invoices
FOR SELECT
USING (
  public.has_module_permission(org_id, 'financial', 'read')
  OR
  public.is_hostconnect_staff()
);

-- INSERT: Users with 'financial' write permission
CREATE POLICY "financial_write_invoices"
ON public.invoices
FOR INSERT
WITH CHECK (
  public.has_module_permission(org_id, 'financial', 'write')
);

-- UPDATE: Users with 'financial' write permission
CREATE POLICY "financial_update_invoices"
ON public.invoices
FOR UPDATE
USING (
  public.has_module_permission(org_id, 'financial', 'write')
  OR
  public.is_hostconnect_staff()
);

-- DELETE: Only admins (viewers cannot delete even with write permission)
CREATE POLICY "financial_delete_invoices"
ON public.invoices
FOR DELETE
USING (
  public.is_org_admin(org_id)
);

-- expenses table (similar pattern)
DROP POLICY IF EXISTS "org_members_select_expenses" ON public.expenses;
DROP POLICY IF EXISTS "org_members_insert_expenses" ON public.expenses;
DROP POLICY IF EXISTS "org_members_update_expenses" ON public.expenses;
DROP POLICY IF EXISTS "org_admins_delete_expenses" ON public.expenses;

CREATE POLICY "financial_read_expenses"
ON public.expenses
FOR SELECT
USING (
  public.has_module_permission(org_id, 'financial', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "financial_write_expenses"
ON public.expenses
FOR INSERT
WITH CHECK (
  public.has_module_permission(org_id, 'financial', 'write')
);

CREATE POLICY "financial_update_expenses"
ON public.expenses
FOR UPDATE
USING (
  public.has_module_permission(org_id, 'financial', 'write')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "financial_delete_expenses"
ON public.expenses
FOR DELETE
USING (
  public.is_org_admin(org_id)
);

-- pricing_rules table
DROP POLICY IF EXISTS "org_members_select_pricing_rules" ON public.pricing_rules;

CREATE POLICY "financial_read_pricing_rules"
ON public.pricing_rules
FOR SELECT
USING (
  public.has_module_permission(org_id, 'financial', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "financial_manage_pricing_rules"
ON public.pricing_rules
FOR ALL
USING (
  public.has_module_permission(org_id, 'financial', 'write')
);

-- =============================================================================
-- BOOKINGS MODULE
-- =============================================================================

-- bookings table
DROP POLICY IF EXISTS "Strict: Org Members view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Strict: Org Members insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Strict: Org Members update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Strict: Org Admins delete bookings" ON public.bookings;

CREATE POLICY "bookings_read_bookings"
ON public.bookings
FOR SELECT
USING (
  public.has_module_permission(org_id, 'bookings', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "bookings_write_bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  public.has_module_permission(org_id, 'bookings', 'write')
);

CREATE POLICY "bookings_update_bookings"
ON public.bookings
FOR UPDATE
USING (
  public.has_module_permission(org_id, 'bookings', 'write')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "bookings_delete_bookings"
ON public.bookings
FOR DELETE
USING (
  public.is_org_admin(org_id)
);

-- =============================================================================
-- PROPERTIES MODULE
-- =============================================================================

-- properties table
DROP POLICY IF EXISTS "Strict: Org Members view properties" ON public.properties;
DROP POLICY IF EXISTS "Strict: Org Admins insert properties" ON public.properties;
DROP POLICY IF EXISTS "Strict: Org Admins update properties" ON public.properties;
DROP POLICY IF EXISTS "Strict: Org Admins delete properties" ON public.properties;

CREATE POLICY "properties_read_properties"
ON public.properties
FOR SELECT
USING (
  public.has_module_permission(org_id, 'properties', 'read')
  OR
  public.is_hostconnect_staff()
);

-- Properties are structural - only admins can create/update/delete
CREATE POLICY "properties_manage_properties"
ON public.properties
FOR ALL
USING (
  public.is_org_admin(org_id)
);

-- rooms table
DROP POLICY IF EXISTS "Strict: Org Members view rooms" ON public.rooms;

CREATE POLICY "properties_read_rooms"
ON public.rooms
FOR SELECT
USING (
  public.has_module_permission(org_id, 'properties', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "properties_manage_rooms"
ON public.rooms
FOR ALL
USING (
  public.is_org_admin(org_id)
);

-- room_types table
DROP POLICY IF EXISTS "org_members_select_room_types" ON public.room_types;
DROP POLICY IF EXISTS "org_admins_insert_room_types" ON public.room_types;
DROP POLICY IF EXISTS "org_admins_update_room_types" ON public.room_types;
DROP POLICY IF EXISTS "org_admins_delete_room_types" ON public.room_types;

CREATE POLICY "properties_read_room_types"
ON public.room_types
FOR SELECT
USING (
  public.has_module_permission(org_id, 'properties', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "properties_manage_room_types"
ON public.room_types
FOR ALL
USING (
  public.is_org_admin(org_id)
);

-- =============================================================================
-- INVENTORY MODULE
-- =============================================================================

-- inventory_items table
DROP POLICY IF EXISTS "org_members_select_inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "org_members_insert_inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "org_members_update_inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "org_admins_delete_inventory_items" ON public.inventory_items;

CREATE POLICY "inventory_read_inventory_items"
ON public.inventory_items
FOR SELECT
USING (
  public.has_module_permission(org_id, 'inventory', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "inventory_write_inventory_items"
ON public.inventory_items
FOR INSERT
WITH CHECK (
  public.has_module_permission(org_id, 'inventory', 'write')
);

CREATE POLICY "inventory_update_inventory_items"
ON public.inventory_items
FOR UPDATE
USING (
  public.has_module_permission(org_id, 'inventory', 'write')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "inventory_delete_inventory_items"
ON public.inventory_items
FOR DELETE
USING (
  public.is_org_admin(org_id)
);

-- item_stock, stock_items, room_type_inventory (similar pattern)
-- ... (apply same pattern to all inventory tables)

-- =============================================================================
-- TEAM MODULE
-- =============================================================================

-- staff_profiles table
CREATE POLICY "team_read_staff_profiles"
ON public.staff_profiles
FOR SELECT
USING (
  public.has_module_permission(org_id, 'team', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "team_manage_staff_profiles"
ON public.staff_profiles
FOR ALL
USING (
  public.has_module_permission(org_id, 'team', 'write')
);

-- departments, shifts, shift_assignments (similar pattern)

-- =============================================================================
-- SETTINGS MODULE
-- =============================================================================

-- website_settings table
CREATE POLICY "settings_read_website_settings"
ON public.website_settings
FOR SELECT
USING (
  public.has_module_permission(org_id, 'settings', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "settings_manage_website_settings"
ON public.website_settings
FOR ALL
USING (
  public.has_module_permission(org_id, 'settings', 'write')
);

-- services table
DROP POLICY IF EXISTS "org_members_select_services" ON public.services;
DROP POLICY IF EXISTS "org_members_insert_services" ON public.services;
DROP POLICY IF EXISTS "org_members_update_services" ON public.services;
DROP POLICY IF EXISTS "org_admins_delete_services" ON public.services;

CREATE POLICY "settings_read_services"
ON public.services
FOR SELECT
USING (
  public.has_module_permission(org_id, 'settings', 'read')
  OR
  public.is_hostconnect_staff()
);

CREATE POLICY "settings_manage_services"
ON public.services
FOR ALL
USING (
  public.has_module_permission(org_id, 'settings', 'write')
);
```

---

## 5. Viewer Read-Only Enforcement

### Strict Viewer Policies

```sql
-- Migration: 20260119100002_viewer_read_only_enforcement.sql
-- Description: Ensure viewers cannot write to any table
-- Date: 2026-01-19

-- =============================================================================
-- VIEWER READ-ONLY ENFORCEMENT
-- =============================================================================

-- Create a helper function to block viewer writes
CREATE OR REPLACE FUNCTION public.block_viewer_writes(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is a viewer, deny write operations
  IF public.is_viewer_role(p_org_id) THEN
    RAISE EXCEPTION 'Viewers have read-only access. Write operations are not permitted.';
  END IF;
  
  RETURN true;
END;
$$;

-- Apply viewer write block to all critical tables
-- This is a safety net in addition to permission checks

-- Example: invoices
CREATE POLICY "viewer_block_write_invoices"
ON public.invoices
FOR INSERT
WITH CHECK (
  public.block_viewer_writes(org_id)
  AND
  public.has_module_permission(org_id, 'financial', 'write')
);

-- Apply to all tables with write operations
-- This ensures viewers cannot write even if permission logic has a bug
```

---

## 6. Permission Flow Documentation

### Permission Check Sequence

```
1. User makes request (e.g., INSERT into invoices)
   ↓
2. RLS Policy: "financial_write_invoices" triggered
   ↓
3. WITH CHECK calls has_module_permission(org_id, 'financial', 'write')
   ↓
4. has_module_permission function:
   a. Get user_id from auth.uid()
   b. Get role from org_members
   c. If owner/admin → ALLOW
   d. If viewer → DENY (write not allowed)
   e. If member → Check member_permissions table
      - Find record where module_key = 'financial'
      - Return can_write value
   ↓
5. If TRUE → Allow INSERT
   If FALSE → Deny with error
```

### Example Scenarios

**Scenario 1: Owner creates invoice**
```
User: owner@example.com (role: owner)
Action: INSERT into invoices
Result: ✅ ALLOWED (owner has full access)
```

**Scenario 2: Viewer tries to create invoice**
```
User: viewer@example.com (role: viewer)
Action: INSERT into invoices
Result: ❌ DENIED (viewers are read-only)
Error: "Viewers have read-only access. Write operations are not permitted."
```

**Scenario 3: Member with financial write permission**
```
User: member@example.com (role: member)
Permissions: financial (can_read: true, can_write: true)
Action: INSERT into invoices
Result: ✅ ALLOWED (has explicit write permission)
```

**Scenario 4: Member without financial permission**
```
User: member@example.com (role: member)
Permissions: bookings (can_read: true, can_write: true)
Action: INSERT into invoices
Result: ❌ DENIED (no permission for financial module)
```

---

## 7. Validation & Testing

### Test Queries

```sql
-- =============================================================================
-- VALIDATION QUERIES
-- =============================================================================

-- 1. Test has_module_permission function
SELECT 
  public.has_module_permission(
    '<org_id>'::uuid,
    'financial',
    'read'
  ) as can_read_financial;

-- 2. Test get_user_module_permissions function
SELECT * FROM public.get_user_module_permissions('<org_id>'::uuid);

-- 3. Test viewer read-only enforcement
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<viewer_user_id>';

-- Should succeed (read)
SELECT * FROM public.invoices LIMIT 1;

-- Should fail (write)
INSERT INTO public.invoices (org_id, property_id, ...) VALUES (...);
-- Expected error: "Viewers have read-only access"

RESET ROLE;

-- 4. Test member granular permissions
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<member_user_id>';

-- If member has financial read permission, should succeed
SELECT * FROM public.invoices LIMIT 1;

-- If member does NOT have financial write permission, should fail
INSERT INTO public.invoices (org_id, property_id, ...) VALUES (...);

RESET ROLE;

-- 5. Verify all tables have permission-aware policies
SELECT 
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%_read_%' OR policyname LIKE '%_write_%'
GROUP BY tablename
ORDER BY tablename;
```

### Integration Test Scenarios

```typescript
// Frontend integration test
describe('Permission Enforcement', () => {
  it('should allow owner to access all modules', async () => {
    // Login as owner
    // Try to read/write financial, bookings, etc.
    // All should succeed
  });
  
  it('should restrict viewer to read-only', async () => {
    // Login as viewer
    // Try to read invoices → should succeed
    // Try to create invoice → should fail
  });
  
  it('should enforce member granular permissions', async () => {
    // Login as member with only bookings permission
    // Try to read bookings → should succeed
    // Try to read invoices → should fail
  });
});
```

---

## 8. Migration Execution Plan

### Phase 1: Create Helper Functions (30 minutes)

```bash
# Run migration
psql -f 20260119100000_permission_helper_functions.sql

# Verify functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'has_module%';
```

### Phase 2: Update RLS Policies (2 hours)

```bash
# Run migration
psql -f 20260119100001_permission_aware_rls_policies.sql

# Verify policies updated
SELECT tablename, policyname FROM pg_policies 
WHERE policyname LIKE '%_read_%' OR policyname LIKE '%_write_%';
```

### Phase 3: Viewer Read-Only Enforcement (30 minutes)

```bash
# Run migration
psql -f 20260119100002_viewer_read_only_enforcement.sql

# Test viewer write block
# (manual testing with viewer account)
```

### Phase 4: Validation & Testing (1 hour)

- Run all validation queries
- Test with real user accounts
- Verify permission enforcement
- Performance testing

---

## 9. Performance Considerations

### Optimization Strategies

1. **Function Caching**: `has_module_permission` uses SECURITY DEFINER with SET search_path for performance
2. **Index on org_members**: Ensure index on (org_id, user_id)
3. **Index on member_permissions**: Ensure index on (org_id, user_id, module_key)
4. **Avoid N+1 Queries**: Use `get_user_module_permissions` for bulk permission checks

### Expected Performance

- `has_module_permission`: < 5ms per call
- `get_user_module_permissions`: < 10ms per call
- RLS policy overhead: < 2ms per query

---

## 10. Rollback Plan

```sql
-- Migration: ROLLBACK_20260119100000_permission_enforcement.sql
-- Description: Rollback permission-aware RLS policies
-- Date: 2026-01-19

-- Drop permission helper functions
DROP FUNCTION IF EXISTS public.has_module_permission(uuid, text, text);
DROP FUNCTION IF EXISTS public.get_user_module_permissions(uuid);
DROP FUNCTION IF EXISTS public.is_viewer_role(uuid);
DROP FUNCTION IF EXISTS public.block_viewer_writes(uuid);

-- Restore original RLS policies
-- (Revert to org-level policies without permission checks)

-- Example: invoices
DROP POLICY IF EXISTS "financial_read_invoices" ON public.invoices;
DROP POLICY IF EXISTS "financial_write_invoices" ON public.invoices;
DROP POLICY IF EXISTS "financial_update_invoices" ON public.invoices;
DROP POLICY IF EXISTS "financial_delete_invoices" ON public.invoices;

CREATE POLICY "org_members_select_invoices" 
ON public.invoices
FOR SELECT
USING (public.is_org_member(org_id));

-- ... (restore all original policies)
```

---

## 11. Implementation Checklist

### Pre-Implementation
- [ ] Review module-to-table mapping
- [ ] Backup database
- [ ] Test in staging environment
- [ ] Prepare rollback plan

### Phase 1: Helper Functions
- [ ] Create `has_module_permission` function
- [ ] Create `get_user_module_permissions` function
- [ ] Create `is_viewer_role` function
- [ ] Test functions with sample data

### Phase 2: RLS Policies
- [ ] Update financial module policies
- [ ] Update bookings module policies
- [ ] Update properties module policies
- [ ] Update inventory module policies
- [ ] Update team module policies
- [ ] Update settings module policies

### Phase 3: Viewer Enforcement
- [ ] Create `block_viewer_writes` function
- [ ] Apply to all write policies
- [ ] Test with viewer account

### Phase 4: Validation
- [ ] Run validation queries
- [ ] Test all permission scenarios
- [ ] Performance testing
- [ ] Update documentation

---

## 12. Success Criteria

✅ **All modules have permission-aware RLS policies**  
✅ **Viewers are strictly read-only (cannot write to any table)**  
✅ **Members have granular permissions enforced**  
✅ **Owner/Admin have full access**  
✅ **Permission logic is centralized in helper functions**  
✅ **No permission logic duplication**  
✅ **Performance acceptable (< 10ms overhead)**  
✅ **Frontend and backend permissions aligned**

---

**Status**: ⏳ AWAITING APPROVAL  
**Next Step**: Review plan and approve migration execution  
**Estimated Total Time**: 4 hours  
**Risk Level**: MEDIUM (with proper testing and rollback plan)  
**Dependencies**: Multi-Tenant Enforcement (Task 2) should be completed first
