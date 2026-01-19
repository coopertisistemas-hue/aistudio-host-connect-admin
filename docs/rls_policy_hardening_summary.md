# RLS Policy Hardening — Summary

**Date**: 2026-01-19  
**Migration**: 20260119000004_rls_policy_hardening.sql  
**Objective**: Replace unsafe RLS policies with strict org-based isolation  
**Status**: ✅ READY FOR EXECUTION

---

## Overview

This migration replaces **qual = true** and **authenticated-only** policies with strict org-based isolation using helper functions for 7 critical tables.

---

## Tables Hardened

### 🔴 Critical Priority (7 tables)

| Table | Old Policy | New Policy | Access Model |
|-------|-----------|------------|--------------|
| amenities | qual = true | org-based | Admins: CRUD, Members: Read |
| room_types | qual = true | org-based | Admins: CRUD, Members: Read |
| services | qual = true (SELECT) | org-based | Admins: CRUD, Members: Read |
| item_stock | authenticated-only | org-based | Members: CRUD, Admins: Delete |
| room_type_inventory | "Temporary for MVP" | org-based | Members: CRUD, Admins: Delete |
| pricing_rules | (varies) | org-based | Admins: CRUD, Members: Read |
| website_settings | (varies) | org-based | Admins: CRUD, Members: Read |
| room_categories* | qual = true | org-based | Admins: CRUD, Members: Read |

*Conditional - only if table exists

---

## Policy Model

### SELECT (Read Access)
- ✅ **Org Members**: Can view their org's data
- ✅ **HostConnect Staff**: Can view all data (support access)
- ❌ **Other Orgs**: Cannot view
- ❌ **Unauthenticated**: Cannot view

```sql
CREATE POLICY "org_members_select_[table]" 
ON public.[table]
FOR SELECT
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);
```

### INSERT (Create Access)

**For Admin-Only Tables** (amenities, room_types, services, pricing_rules, website_settings):
- ✅ **Org Admins/Owners**: Can insert
- ✅ **HostConnect Staff**: Can insert
- ❌ **Members/Viewers**: Cannot insert

```sql
CREATE POLICY "org_admins_insert_[table]" 
ON public.[table]
FOR INSERT
WITH CHECK (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);
```

**For Member Tables** (item_stock, room_type_inventory):
- ✅ **All Org Members**: Can insert
- ✅ **HostConnect Staff**: Can insert

```sql
CREATE POLICY "org_members_insert_[table]" 
ON public.[table]
FOR INSERT
WITH CHECK (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);
```

### UPDATE (Modify Access)

Same pattern as INSERT.

### DELETE (Remove Access)

- ✅ **Org Admins Only**: Can delete
- ✅ **HostConnect Staff**: Can delete
- ❌ **Members/Viewers**: Cannot delete

```sql
CREATE POLICY "org_admins_delete_[table]" 
ON public.[table]
FOR DELETE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);
```

---

## Helper Functions Used

### 1. `is_org_member(org_id uuid)`
**Returns**: boolean  
**Logic**: Checks if current user belongs to the specified org  
**Query**:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.org_members
  WHERE org_id = $1
    AND user_id = auth.uid()
);
```

### 2. `is_org_admin(org_id uuid)`
**Returns**: boolean  
**Logic**: Checks if current user is owner or admin of the specified org  
**Query**:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.org_members
  WHERE org_id = $1
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
);
```

### 3. `is_hostconnect_staff()`
**Returns**: boolean  
**Logic**: Checks if current user is HostConnect staff (cross-org support access)  
**Query**:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.hostconnect_staff
  WHERE user_id = auth.uid()
    AND is_active = true
);
```

---

## Policies Created

### Per Table: 4 Policies

Each table receives **4 explicit policies**:

1. **SELECT policy** - Read access
2. **INSERT policy** - Create access
3. **UPDATE policy** - Modify access
4. **DELETE policy** - Remove access

**Total Policies Created**: 7 tables × 4 operations = **28 policies**

---

## Unsafe Policies Removed

### qual = true Policies (4)
- `"Manage all amenities"` on amenities
- `"Manage all categories"` on room_categories
- `"authenticated_manage_room_types"` on room_types
- `"Enable read access for all users"` on services

### authenticated-only Policies (4)
- `"Authenticated users can view stock"` on item_stock
- `"Authenticated users can update stock"` on item_stock
- `"Authenticated users can modify stock"` on item_stock
- `"Authenticated users can delete stock"` on item_stock

### "Temporary for MVP" Policies (1)
- `"Enable all access for authenticated users (Temporary for MVP)"` on room_type_inventory

**Total Unsafe Policies Removed**: **9 policies**

---

## Validation Queries

### 1. Check for remaining qual = true policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true'
  AND tablename IN (
    'amenities', 'room_categories', 'room_types', 'services',
    'item_stock', 'room_type_inventory', 'pricing_rules', 'website_settings'
  );
-- Expected: 0 rows
```

### 2. Verify all operations covered
```sql
SELECT 
    tablename,
    COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'amenities', 'room_types', 'services', 'item_stock',
    'room_type_inventory', 'pricing_rules', 'website_settings'
  )
GROUP BY tablename;
-- Expected: Each table should have 1 policy per operation
```

### 3. List all new policies
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'amenities', 'room_types', 'services', 'item_stock',
    'room_type_inventory', 'pricing_rules', 'website_settings'
  )
ORDER BY tablename, cmd;
```

---

## Testing Guide

### Test 1: Cross-Org Access (Should FAIL)

```sql
-- As User A (Org A)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<user_a_id>';

-- Try to access Org B's data
SELECT COUNT(*) FROM amenities WHERE org_id = '<org_b_id>';
-- Expected: 0 rows

SELECT COUNT(*) FROM room_types WHERE org_id = '<org_b_id>';
-- Expected: 0 rows

RESET ROLE;
```

### Test 2: Org Member Access (Should SUCCEED)

```sql
-- As User A (Org A, role = member)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<user_a_id>';

-- Should see Org A's data
SELECT COUNT(*) FROM amenities WHERE org_id = '<org_a_id>';
-- Expected: > 0 rows

SELECT COUNT(*) FROM services WHERE org_id = '<org_a_id>';
-- Expected: > 0 rows

RESET ROLE;
```

### Test 3: Member INSERT (Should FAIL on admin-only tables)

```sql
-- As User A (Org A, role = member)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<member_user_id>';

-- Try to INSERT amenity (admin-only)
INSERT INTO amenities (org_id, name, icon) 
VALUES ('<org_a_id>', 'Test Amenity', 'wifi');
-- Expected: Permission denied

-- But can INSERT item_stock (member-level)
INSERT INTO item_stock (org_id, item_id, location, quantity) 
VALUES ('<org_a_id>', '<item_id>', 'pantry', 10);
-- Expected: Success

RESET ROLE;
```

### Test 4: Admin CRUD (Should SUCCEED)

```sql
-- As Admin (Org A, role = admin)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<admin_user_id>';

-- INSERT
INSERT INTO amenities (org_id, name, icon) 
VALUES ('<org_a_id>', 'Test Amenity', 'wifi');
-- Expected: Success

-- UPDATE
UPDATE amenities SET name = 'Updated Amenity' 
WHERE org_id = '<org_a_id>' AND name = 'Test Amenity';
-- Expected: Success

-- DELETE
DELETE FROM amenities 
WHERE org_id = '<org_a_id>' AND name = 'Updated Amenity';
-- Expected: Success

RESET ROLE;
```

### Test 5: Staff Cross-Org Access (Should SUCCEED)

```sql
-- As HostConnect Staff
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<staff_user_id>';

-- Should see ALL orgs' data
SELECT COUNT(DISTINCT org_id) FROM amenities;
-- Expected: All orgs

SELECT COUNT(DISTINCT org_id) FROM room_types;
-- Expected: All orgs

RESET ROLE;
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Verify helper functions exist (`is_org_member`, `is_org_admin`, `is_hostconnect_staff`)
- [ ] Verify org_id is populated on all tables (no NULLs)
- [ ] Verify org_id has NOT NULL constraint
- [ ] Backup database
- [ ] Test in staging environment

### Deployment
- [ ] Run migration 20260119000004_rls_policy_hardening.sql
- [ ] Monitor for errors
- [ ] Verify validation queries pass

### Post-Deployment
- [ ] Run all 5 test scenarios
- [ ] Verify no qual = true policies remain
- [ ] Verify all operations covered (SELECT/INSERT/UPDATE/DELETE)
- [ ] Test actual user workflows in staging
- [ ] Monitor application for RLS-related errors

---

## Rollback Procedure

If issues occur, you can rollback by restoring the original policies:

```sql
-- Rollback amenities
DROP POLICY IF EXISTS "org_members_select_amenities" ON amenities;
DROP POLICY IF EXISTS "org_admins_insert_amenities" ON amenities;
DROP POLICY IF EXISTS "org_admins_update_amenities" ON amenities;
DROP POLICY IF EXISTS "org_admins_delete_amenities" ON amenities;

CREATE POLICY "Manage all amenities" ON amenities
FOR ALL USING (true);

-- Repeat for other tables...
```

**Better Approach**: Restore from database backup taken before migration.

---

## Success Criteria

✅ **All unsafe policies removed**: No qual = true, no authenticated-only  
✅ **All operations covered**: Each table has SELECT/INSERT/UPDATE/DELETE policies  
✅ **Cross-org access blocked**: Users from Org A cannot see Org B's data  
✅ **Staff access works**: HostConnect staff can access all orgs  
✅ **Role-based access**: Admins can CRUD, members can read (mostly)  
✅ **No application errors**: Existing workflows continue to work  

---

## Migration Order

**Execute in this order**:

1. ✅ 20260119000000_add_org_id_to_operational_tables.sql
2. ✅ 20260119000001_backfill_org_id.sql
3. ✅ 20260119000002_enforce_org_id_constraints.sql
4. ✅ 20260119000003_org_id_auto_fill_triggers.sql
5. **➡️ 20260119000004_rls_policy_hardening.sql** (THIS ONE)

---

## Estimated Impact

**Runtime**: 2-5 minutes  
**Downtime**: None (policies are replaced atomically)  
**Risk Level**: MEDIUM (test thoroughly in staging first)  
**Reversibility**: HIGH (can restore from backup or recreate old policies)

---

**Status**: ✅ READY FOR EXECUTION  
**Next Step**: Test in staging environment before production deployment

---

**Created**: 2026-01-19  
**Author**: Supabase Security Team
