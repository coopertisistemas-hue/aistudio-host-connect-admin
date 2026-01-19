# Sprint 0.1 — RLS Risk Matrix

**Date**: 2026-01-19  
**Objective**: Identify every table with missing, permissive, or unsafe RLS policies  
**Scope**: All tables in public schema  
**Method**: Analysis only (no schema changes)

---

## Executive Summary

### Overall Risk Assessment: 🔴 **HIGH RISK**

**Total Tables**: 48  
**RLS Enabled**: 48/48 (100%) ✅  
**Safe Tables**: 14 (29%)  
**Partially Safe**: 27 (56%)  
**Unsafe Tables**: 7 (15%) 🔴

---

## Risk Classification Criteria

### 🟢 SAFE
- ✅ RLS enabled
- ✅ No `qual = true` policies
- ✅ Proper org_id filtering (or intentionally global)
- ✅ No privilege escalation risks

### 🟡 PARTIALLY SAFE
- ✅ RLS enabled
- ⚠️ Missing org_id column (but has property_id or other scoping)
- ⚠️ Suboptimal policies (subqueries instead of helper functions)
- ⚠️ Minor security concerns

### 🔴 UNSAFE
- ❌ Policies with `qual = true` (global access)
- ❌ Policies with `auth.role() = 'authenticated'` (too permissive)
- ❌ Missing org_id with no alternative scoping
- ❌ Critical privilege escalation risks

---

## Complete Table Inventory (48 Tables)

### 🔴 UNSAFE (7 tables) - CRITICAL

#### 1. amenities
**Risk Level**: 🔴 CRITICAL  
**RLS Status**: ENABLED  
**Issue**: `qual = true` - ANY authenticated user can CRUD

**Policies**:
```sql
"Manage all amenities" - qual = true
```

**Missing**: org_id column  
**Impact**: Cross-org data corruption  
**Recommendation**: Add org_id, replace with `is_org_admin(org_id)` or make staff-only

---

#### 2. room_categories
**Risk Level**: 🔴 CRITICAL  
**RLS Status**: ENABLED  
**Issue**: `qual = true` - ANY authenticated user can CRUD

**Policies**:
```sql
"Manage all categories" - qual = true
```

**Missing**: org_id column  
**Impact**: Cross-org data corruption  
**Recommendation**: Add org_id, replace with `is_org_admin(org_id)`

---

#### 3. room_types
**Risk Level**: 🔴 CRITICAL  
**RLS Status**: ENABLED  
**Issue**: `qual = true` - ANY authenticated user can CRUD

**Policies**:
```sql
"authenticated_manage_room_types" - qual = true
```

**Has**: property_id (but missing org_id)  
**Impact**: Cross-org access to room types  
**Recommendation**: Add org_id, replace with `is_org_admin(org_id)`

---

#### 4. services
**Risk Level**: 🔴 CRITICAL  
**RLS Status**: ENABLED  
**Issue**: `qual = true` - Global read access

**Policies**:
```sql
"Enable read access for all users" - qual = true
```

**Has**: property_id (but missing org_id)  
**Impact**: Competitor can see all services/pricing  
**Recommendation**: Add org_id, replace with `is_org_member(org_id)`

---

#### 5. item_stock
**Risk Level**: 🔴 CRITICAL  
**RLS Status**: ENABLED  
**Issue**: `auth.role() = 'authenticated'` - Global visibility

**Policies**:
```sql
"Authenticated users can view stock" - (auth.role() = 'authenticated')
```

**Missing**: org_id column  
**Impact**: Cross-org inventory visibility  
**Recommendation**: Add org_id, replace with `is_org_member(org_id)`

---

#### 6. stock_items
**Risk Level**: 🔴 CRITICAL  
**RLS Status**: ENABLED  
**Issue**: `auth.role() = 'authenticated'` - Global visibility

**Policies**:
```sql
"Authenticated users can view stock items" - (auth.role() = 'authenticated')
```

**Missing**: org_id column  
**Impact**: Cross-org stock catalog visibility  
**Recommendation**: Add org_id, replace with `is_org_member(org_id)`

---

#### 7. room_type_inventory
**Risk Level**: 🔴 CRITICAL  
**RLS Status**: ENABLED  
**Issue**: "Temporary for MVP" policy - Complete bypass

**Policies**:
```sql
"Enable all access for authenticated users (Temporary for MVP)" - (auth.role() = 'authenticated')
```

**Missing**: org_id column  
**Impact**: Complete multi-tenant bypass  
**Recommendation**: URGENT - Add org_id, implement strict RLS

---

### 🟡 PARTIALLY SAFE (27 tables)

#### 8. bookings
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: org_id ✅, property_id ✅

**Policies**:
```sql
"Strict: Org Members view bookings" - is_org_member(org_id) ✅
"Strict: Org Members insert bookings" - is_org_member(org_id) ✅
"Strict: Org Members update bookings" - is_org_member(org_id) ✅
"Strict: Org Admins delete bookings" - is_org_admin(org_id) ✅
```

**Issue**: None major, policies are strict  
**Recommendation**: ✅ Good - Consider adding permission-aware policies for granular access

---

#### 9. departments
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped via property_id  
**Issue**: Missing org_id for consistency  
**Recommendation**: Add org_id for multi-property organizations

---

#### 10. entity_photos
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Missing**: org_id, property_id (generic table)

**Policies**: Scoped via entity_type/entity_id  
**Issue**: No direct org isolation  
**Recommendation**: Add org_id via trigger based on entity_type

---

#### 11. expenses
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id for consistency  
**Recommendation**: Add org_id, update policies to use `is_org_member(org_id)`

---

#### 12. faqs
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Has**: org_id ✅

**Policies**: Org-scoped  
**Issue**: None  
**Recommendation**: ✅ Good

---

#### 13. ideas
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Has**: org_id ✅

**Policies**: Org-scoped  
**Issue**: None  
**Recommendation**: ✅ Good

---

#### 14. idea_comments
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Scoped**: Via ideas FK

**Policies**: Scoped via parent idea  
**Issue**: None  
**Recommendation**: ✅ Good

---

#### 15. inventory_items
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: org_id ✅

**Policies**:
```sql
"Users can view inventory items of their org" - org_id IN (SELECT ...)
```

**Issue**: Uses subquery instead of helper function (performance)  
**Recommendation**: Replace with `is_org_member(org_id)` for performance

---

#### 16. invoices
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id for consistency  
**Recommendation**: Add org_id, implement permission-aware policies

---

#### 17. org_invites
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: org_id ✅

**Policies**:
```sql
"Admins manage invites" - is_org_admin(org_id) ✅
"Anyone can look up token" - qual = true ⚠️
```

**Issue**: Public token lookup (intentional for join flow)  
**Recommendation**: ✅ Acceptable for use case, but add rate limiting

---

#### 18. pantry_stock
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id  
**Recommendation**: Add org_id

---

#### 19. pricing_rules
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id, exposes pricing strategy  
**Recommendation**: Add org_id, strict policies

---

#### 20. properties
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Has**: org_id ✅

**Policies**:
```sql
"Strict: Org Members view properties" - is_org_member(org_id) ✅
"Strict: Org Admins insert properties" - is_org_admin(org_id) ✅
"Strict: Org Admins update properties" - is_org_admin(org_id) ✅
"Strict: Org Admins delete properties" - is_org_admin(org_id) ✅
```

**Issue**: None  
**Recommendation**: ✅ Excellent - Model for other tables

---

#### 21. property_photos
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id  
**Recommendation**: Add org_id via trigger

---

#### 22. rooms
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: org_id ✅, property_id ✅

**Policies**:
```sql
"Strict: Org Members view rooms" - Uses property FK, not direct org_id check
```

**Issue**: Policy doesn't directly check org_id  
**Recommendation**: Update to `is_org_member(org_id)`

---

#### 23. shifts
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id  
**Recommendation**: Add org_id

---

#### 24. shift_assignments
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Missing**: org_id, property_id (scoped via FK)

**Policies**: Scoped via shifts FK  
**Issue**: No direct org isolation  
**Recommendation**: Add org_id via trigger

---

#### 25. staff_profiles
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id  
**Recommendation**: Add org_id

---

#### 26. stock_movements
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Missing**: org_id (scoped via FK)

**Policies**: Scoped via item FK  
**Issue**: No direct org isolation  
**Recommendation**: Add org_id via trigger

---

#### 27. tasks
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id  
**Recommendation**: Add org_id

---

#### 28. testimonials
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id  
**Recommendation**: Add org_id

---

#### 29. tickets
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Has**: org_id ✅

**Policies**: Org-scoped  
**Issue**: None  
**Recommendation**: ✅ Good

---

#### 30. ticket_comments
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Scoped**: Via tickets FK

**Policies**: Scoped via parent ticket  
**Issue**: None  
**Recommendation**: ✅ Good

---

#### 31. website_settings
**Risk Level**: 🟡 MEDIUM  
**RLS Status**: ENABLED  
**Has**: property_id ✅  
**Missing**: org_id

**Policies**: Property-scoped  
**Issue**: Missing org_id, sensitive config  
**Recommendation**: Add org_id, strict admin-only policies

---

#### 32-34. booking_charges, booking_guests, booking_services
**Risk Level**: 🟡 LOW  
**RLS Status**: ENABLED  
**Scoped**: Via bookings FK

**Policies**: Scoped via parent booking  
**Issue**: None (inherit booking's org_id)  
**Recommendation**: ✅ Good

---

### 🟢 SAFE (14 tables)

#### 35. audit_log
**Risk Level**: 🟢 SAFE  
**RLS Status**: ENABLED  
**Access**: Staff-only

**Policies**:
```sql
"Staff views audit logs" - is_hostconnect_staff() ✅
```

**Issue**: None  
**Recommendation**: ✅ Perfect - Staff-only access for compliance

---

#### 36. hostconnect_staff
**Risk Level**: 🟢 SAFE  
**RLS Status**: ENABLED  
**Access**: Staff-only

**Policies**:
```sql
"Staff manages staff" - is_hostconnect_staff() ✅
```

**Issue**: None  
**Recommendation**: ✅ Perfect - Self-managed staff list

---

#### 37. member_permissions
**Risk Level**: 🟢 SAFE  
**RLS Status**: ENABLED  
**Has**: org_id ✅

**Policies**:
```sql
"Admins manage permissions" - is_org_admin(org_id) ✅
"Members view own permissions" - auth.uid() = user_id ✅
```

**Issue**: None  
**Recommendation**: ✅ Perfect - Secure permission management

---

#### 38. organizations
**Risk Level**: 🟢 SAFE  
**RLS Status**: ENABLED  
**Root Entity**: N/A (no org_id needed)

**Policies**:
```sql
"Org members view their org" - is_org_member(id) ✅
"Org admins update their org" - is_org_admin(id) ✅
```

**Issue**: None  
**Recommendation**: ✅ Perfect - Root entity with proper isolation

---

#### 39. org_members
**Risk Level**: 🟢 SAFE  
**RLS Status**: ENABLED  
**Has**: org_id ✅

**Policies**:
```sql
"Org members view members" - is_org_member(org_id) ✅
"Org admins manage members" - is_org_admin(org_id) ✅
```

**Issue**: None  
**Recommendation**: ✅ Perfect - Core multi-tenant table

---

#### 40. profiles
**Risk Level**: 🟢 SAFE  
**RLS Status**: ENABLED  
**Scope**: User-scoped (1:1 with auth.users)

**Policies**:
```sql
"Users view own profile" - auth.uid() = id ✅
"Users update own profile" - auth.uid() = id ✅
```

**Issue**: None  
**Recommendation**: ✅ Perfect - User-scoped by design

---

#### 41-48. Other Safe Tables
- `booking_payments` - Scoped via bookings
- `guest_documents` - Scoped via guests
- `maintenance_requests` - Property-scoped with proper RLS
- `notifications` - User-scoped
- `payment_methods` - Org-scoped
- `reports` - Org-scoped with proper RLS
- `room_amenities` - Scoped via rooms
- `user_preferences` - User-scoped

---

## Risk Matrix Summary

| Risk Level | Count | % | Tables |
|------------|-------|---|--------|
| 🔴 UNSAFE | 7 | 15% | amenities, room_categories, room_types, services, item_stock, stock_items, room_type_inventory |
| 🟡 PARTIALLY SAFE | 27 | 56% | bookings, departments, entity_photos, expenses, invoices, pricing_rules, rooms, shifts, staff_profiles, tasks, website_settings, etc. |
| 🟢 SAFE | 14 | 29% | audit_log, hostconnect_staff, member_permissions, organizations, org_members, profiles, etc. |

---

## Critical Findings

### 1. Tables with `qual = true` (4 tables)
- `amenities` - "Manage all amenities"
- `room_categories` - "Manage all categories"
- `room_types` - "authenticated_manage_room_types"
- `services` - "Enable read access for all users"

**Impact**: ANY authenticated user can access/modify these tables across ALL organizations

---

### 2. Tables with `auth.role() = 'authenticated'` (3 tables)
- `item_stock` - "Authenticated users can view stock"
- `stock_items` - "Authenticated users can view stock items"
- `room_type_inventory` - "Enable all access (Temporary for MVP)"

**Impact**: Global visibility of inventory data across organizations

---

### 3. Tables Missing org_id (15 tables)
**Critical**:
- amenities, room_categories, item_stock, stock_items, room_type_inventory

**High Priority**:
- room_types, services, staff_profiles, invoices, expenses, departments, pricing_rules, website_settings, pantry_stock, shifts, tasks

**Impact**: Inconsistent multi-tenant isolation

---

### 4. Performance Issues (1 table)
- `inventory_items` - Uses subquery instead of `is_org_member()` helper

**Impact**: Slow queries on large datasets

---

## Recommendations by Priority

### 🔴 CRITICAL (Fix This Week)

1. **Lock down global access policies**
   ```sql
   -- amenities
   DROP POLICY "Manage all amenities" ON amenities;
   CREATE POLICY "Staff manage amenities" ON amenities
     FOR ALL USING (is_hostconnect_staff());
   
   -- room_categories
   DROP POLICY "Manage all categories" ON room_categories;
   CREATE POLICY "Admins manage categories" ON room_categories
     FOR ALL USING (is_org_admin(org_id));
   
   -- room_types
   DROP POLICY "authenticated_manage_room_types" ON room_types;
   CREATE POLICY "Admins manage room types" ON room_types
     FOR ALL USING (is_org_admin(org_id));
   
   -- services
   DROP POLICY "Enable read access for all users" ON services;
   CREATE POLICY "Org members view services" ON services
     FOR SELECT USING (is_org_member(org_id));
   ```

2. **Add org_id to critical tables**
   - amenities, room_types, room_categories, services
   - item_stock, stock_items, room_type_inventory

3. **Remove "Temporary for MVP" policy**
   ```sql
   DROP POLICY "Enable all access for authenticated users (Temporary for MVP)" 
     ON room_type_inventory;
   ```

---

### 🟡 HIGH (Fix Next Week)

4. **Add org_id to remaining tables**
   - staff_profiles, invoices, expenses, departments
   - pricing_rules, website_settings, pantry_stock, shifts, tasks

5. **Optimize subquery policies**
   ```sql
   -- inventory_items
   DROP POLICY "Users can view inventory items of their org" ON inventory_items;
   CREATE POLICY "Org members view inventory" ON inventory_items
     FOR SELECT USING (is_org_member(org_id));
   ```

6. **Update rooms policy**
   ```sql
   DROP POLICY "Strict: Org Members view rooms" ON rooms;
   CREATE POLICY "Org members view rooms" ON rooms
     FOR SELECT USING (is_org_member(org_id));
   ```

---

### 🟢 MEDIUM (Fix This Month)

7. **Add org_id to generic tables via triggers**
   - entity_photos, shift_assignments, stock_movements

8. **Add rate limiting to public endpoints**
   - org_invites token lookup

9. **Document all assumptions**
   - Why certain tables are intentionally global
   - Business logic for amenities (global vs org-specific)

---

## Validation Queries

### Check for qual = true policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true'
ORDER BY tablename;
```

### Check for overly permissive policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%authenticated%'
ORDER BY tablename;
```

### Check for tables without org_id
```sql
SELECT table_name
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'org_id'
  )
  AND table_name NOT IN ('profiles', 'hostconnect_staff', 'audit_log')
ORDER BY table_name;
```

---

## Conclusion

**Current State**: 🔴 **HIGH RISK**

- **7 UNSAFE tables** with critical vulnerabilities
- **27 PARTIALLY SAFE tables** with minor issues
- **14 SAFE tables** with proper isolation

**Immediate Action Required**: Fix 7 UNSAFE tables (estimated 1 week)

**Production Readiness**: **NOT READY** until UNSAFE tables are fixed

---

**Report Date**: 2026-01-19  
**Analyst**: Senior Supabase Security Architect  
**Next Review**: After critical fixes implemented
