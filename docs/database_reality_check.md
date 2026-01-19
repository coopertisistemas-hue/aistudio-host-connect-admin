# Supabase — Current State & Risk Assessment (UPDATED)

**Date**: 2026-01-19  
**Source**: Real-time database analysis via Supabase SQL Editor  
**Project**: Host Connect (oravqykjpgqoiidqnfja)  
**Analyst**: Senior Supabase Architect  

---

## Executive Summary

### Overall Status: 🔴 **HIGH RISK**

**Critical Findings**:
- ✅ **48 tables** in production (vs. 25 expected from migrations)
- ✅ **RLS enabled** on ALL tables
- 🔴 **CRITICAL**: Multiple tables with `qual = true` (global access)
- 🔴 **CRITICAL**: `amenities`, `room_categories`, `room_types` allow ANY authenticated user to manage
- 🔴 **CRITICAL**: `item_stock`, `stock_items` have global visibility
- ⚠️ **Multiple tables missing `org_id`** for multi-tenant isolation

---

## 1. Complete Table Inventory (48 Tables)

### 1.1 All Tables with RLS Status

| # | Table Name | RLS Status | Size | Category |
|---|------------|------------|------|----------|
| 1 | `amenities` | ENABLED | 40 kB | 🔴 Config |
| 2 | `bookings` | ENABLED | 16 kB | ✅ Operations |
| 3 | `departments` | ENABLED | 8192 bytes | ⚠️ HR |
| 4 | `entity_photos` | ENABLED | 8192 bytes | ⚠️ Media |
| 5 | `expenses` | ENABLED | 8192 bytes | ⚠️ Financial |
| 6 | `faqs` | ENABLED | 8192 bytes | ✅ Support |
| 7 | `hostconnect_staff` | ENABLED | 8192 bytes | ✅ Admin |
| 8 | `ideas` | ENABLED | 8192 bytes | ✅ Support |
| 9 | `idea_comments` | ENABLED | 8192 bytes | ✅ Support |
| 10 | `inventory_items` | ENABLED | 8192 bytes | ⚠️ Inventory |
| 11 | `invoices` | ENABLED | 8192 bytes | ⚠️ Financial |
| 12 | `item_stock` | ENABLED | 8192 bytes | 🔴 Inventory |
| 13 | `member_permissions` | ENABLED | 8192 bytes | ✅ Security |
| 14 | `organizations` | ENABLED | 8192 bytes | ✅ Core |
| 15 | `org_invites` | ENABLED | 8192 bytes | ✅ Core |
| 16 | `org_members` | ENABLED | 8192 bytes | ✅ Core |
| 17 | `pantry_stock` | ENABLED | 8192 bytes | ⚠️ Inventory |
| 18 | `pricing_rules` | ENABLED | 8192 bytes | ⚠️ Config |
| 19 | `profiles` | ENABLED | 16 kB | ✅ Core |
| 20 | `properties` | ENABLED | 16 kB | ✅ Core |
| 21 | `property_photos` | ENABLED | 8192 bytes | ⚠️ Media |
| 22 | `room_categories` | ENABLED | 8192 bytes | 🔴 Config |
| 23 | `rooms` | ENABLED | 8192 bytes | ⚠️ Operations |
| 24 | `room_types` | ENABLED | 8192 bytes | 🔴 Config |
| 25 | `room_type_inventory` | ENABLED | 8192 bytes | 🔴 Inventory |
| 26 | `services` | ENABLED | 8192 bytes | 🔴 Config |
| 27 | `shifts` | ENABLED | 8192 bytes | ⚠️ HR |
| 28 | `shift_assignments` | ENABLED | 8192 bytes | ⚠️ HR |
| 29 | `staff_profiles` | ENABLED | 8192 bytes | ⚠️ HR |
| 30 | `stock_items` | ENABLED | 8192 bytes | 🔴 Inventory |
| 31 | `stock_movements` | ENABLED | 8192 bytes | ⚠️ Inventory |
| 32 | `tasks` | ENABLED | 8192 bytes | ⚠️ Operations |
| 33 | `testimonials` | ENABLED | 8192 bytes | ✅ Marketing |
| 34 | `tickets` | ENABLED | 8192 bytes | ✅ Support |
| 35 | `ticket_comments` | ENABLED | 8192 bytes | ✅ Support |
| 36 | `website_settings` | ENABLED | 8192 bytes | ⚠️ Config |
| 37-48 | *(Additional tables)* | ENABLED | - | - |

**Legend**:
- ✅ Secure (proper org isolation)
- ⚠️ Missing org_id or weak RLS
- 🔴 Critical security gap (global access)

---

## 2. Multi-Tenancy Analysis

### 2.1 Tables with org_id and property_id

Based on real-time query results:

| Table | org_id | property_id | Risk Assessment |
|-------|--------|-------------|-----------------|
| `organizations` | N/A | ❌ | ✅ Root entity |
| `org_members` | ✅ | ❌ | ✅ Secure |
| `member_permissions` | ✅ | ❌ | ✅ Secure |
| `properties` | ✅ | N/A | ✅ Secure |
| `bookings` | ✅ | ✅ | ✅ Secure |
| `rooms` | ✅ | ✅ | ⚠️ Weak RLS |
| `tickets` | ✅ | ❌ | ✅ Secure |
| `ideas` | ✅ | ❌ | ✅ Secure |
| `inventory_items` | ✅ | ❌ | ⚠️ Subquery RLS |
| **Missing org_id** | | | |
| `amenities` | ❌ | ❌ | 🔴 **CRITICAL** |
| `room_types` | ❌ | ✅ | 🔴 **CRITICAL** |
| `room_categories` | ❌ | ❌ | 🔴 **CRITICAL** |
| `services` | ❌ | ✅ | 🔴 **CRITICAL** |
| `pricing_rules` | ❌ | ✅ | ⚠️ Property-scoped |
| `entity_photos` | ❌ | ❌ | ⚠️ Generic table |
| `website_settings` | ❌ | ✅ | ⚠️ Property-scoped |
| `staff_profiles` | ❌ | ✅ | ⚠️ Property-scoped |
| `departments` | ❌ | ✅ | ⚠️ Property-scoped |
| `invoices` | ❌ | ✅ | ⚠️ Property-scoped |
| `expenses` | ❌ | ✅ | ⚠️ Property-scoped |
| `item_stock` | ❌ | ❌ | 🔴 **CRITICAL** |
| `stock_items` | ❌ | ❌ | 🔴 **CRITICAL** |
| `stock_movements` | ❌ | ❌ | ⚠️ Needs review |
| `pantry_stock` | ❌ | ✅ | ⚠️ Property-scoped |
| `room_type_inventory` | ❌ | ❌ | 🔴 **CRITICAL** |
| `shifts` | ❌ | ✅ | ⚠️ Property-scoped |
| `shift_assignments` | ❌ | ❌ | ⚠️ Needs FK check |
| `tasks` | ❌ | ✅ | ⚠️ Property-scoped |

---

## 3. Critical RLS Policy Vulnerabilities

### 3.1 🔴 CRITICAL: Global Access Policies (qual = true)

Based on `pg_policies` analysis, the following tables have **UNRESTRICTED ACCESS**:

#### **amenities**
```sql
-- CRITICAL VULNERABILITY
Policy: "Manage all amenities"
Condition: qual = true
Impact: ANY authenticated user can INSERT/UPDATE/DELETE all amenities
```

#### **room_categories**
```sql
-- CRITICAL VULNERABILITY  
Policy: "Manage all categories"
Condition: qual = true
Impact: ANY authenticated user can manage all room categories globally
```

#### **room_types**
```sql
-- CRITICAL VULNERABILITY
Policy: "authenticated_manage_room_types"
Condition: qual = true
Impact: ANY authenticated user can manage all room types across all organizations
```

#### **services**
```sql
-- CRITICAL VULNERABILITY
Policy: "Enable read access for all users"
Condition: qual = true
Impact: Global visibility of all services across organizations
```

### 3.2 🔴 CRITICAL: Inventory System Bypass

#### **item_stock**
```sql
-- CRITICAL VULNERABILITY
Policy: "Authenticated users can view stock"
Condition: (auth.role() = 'authenticated'::text)
Impact: ANY logged-in user can see ALL stock levels across ALL organizations
```

#### **stock_items**
```sql
-- CRITICAL VULNERABILITY
Policy: "Authenticated users can view stock items"
Condition: (auth.role() = 'authenticated'::text)
Impact: Global visibility of all stock items
```

#### **room_type_inventory**
```sql
-- CRITICAL VULNERABILITY
Policy: "Enable all access for authenticated users (Temporary for MVP)"
Condition: (auth.role() = 'authenticated'::text)
Impact: Complete bypass of multi-tenant isolation
```

### 3.3 ⚠️ Medium Risk: Subquery Performance Issues

#### **inventory_items**
```sql
-- PERFORMANCE ISSUE
Policy: "Users can view inventory items of their org"
Condition: (org_id IN ( SELECT org_members.org_id FROM org_members WHERE (org_members.user_id = auth.uid())))
Impact: Subquery executed for EVERY row instead of using is_org_member() helper
```

---

## 4. Security Functions Analysis

### 4.1 Available Helper Functions (22 total)

**Core Security Functions**:
- ✅ `is_org_member(uuid)` - Check org membership
- ✅ `is_org_admin(uuid)` - Check admin status
- ✅ `is_hostconnect_staff()` - Check staff status
- ✅ `check_user_access(uuid)` - Property-level access check
- ✅ `check_booking_access(uuid)` - Booking-level access check
- ✅ `get_user_role(uuid, uuid)` - Get user role in org
- ✅ `create_organization(text)` - Create org + add owner
- ✅ `accept_invite(uuid)` - Accept org invite

**Utility Functions**:
- `moddatetime()` - Update updated_at
- `update_updated_at_column()` - Update timestamp
- `update_stock_balance()` - Stock management
- `handle_new_user()` - Auto-create profile

### 4.2 Missing Functions

❌ **No audit logging functions** for:
- Permission changes
- Staff management
- Critical config updates
- Booking lifecycle events

---

## 5. Triggers Analysis (25 total)

### 5.1 Existing Triggers

**Update Timestamp Triggers** (Most tables):
- `handle_updated_at` using `moddatetime()`

**Specialized Triggers**:
- `update_stock_balance` on `stock_movements`
- `on_auth_user_created` on `auth.users` → `handle_new_user()`

### 5.2 Missing Triggers

❌ **No audit triggers** for:
- `member_permissions` (permission changes)
- `hostconnect_staff` (staff additions/removals)
- `organizations` (org creation/updates)
- `properties` (property creation/updates)
- `bookings` (booking lifecycle)
- `pricing_rules` (pricing changes)
- `website_settings` (config changes)

---

## 6. Risk Assessment Matrix

### Priority 1: CRITICAL (Immediate Action Required)

| Issue | Impact | Tables Affected | Estimated Fix Time |
|-------|--------|-----------------|-------------------|
| Global access policies | Data corruption, cross-org leakage | amenities, room_categories, room_types, services | 2-3 hours |
| Inventory system bypass | Complete multi-tenant failure | item_stock, stock_items, room_type_inventory | 3-4 hours |
| Missing org_id on core tables | Inconsistent isolation | 15+ tables | 1-2 days |

### Priority 2: HIGH (This Week)

| Issue | Impact | Tables Affected | Estimated Fix Time |
|-------|--------|-----------------|-------------------|
| Subquery performance in RLS | Slow queries, timeout risk | inventory_items | 1 hour |
| Missing audit triggers | No compliance trail | All critical tables | 1 day |
| Property-only scoped tables | Weak org isolation | staff_profiles, invoices, expenses | 1 day |

### Priority 3: MEDIUM (This Month)

| Issue | Impact | Tables Affected | Estimated Fix Time |
|-------|--------|-----------------|-------------------|
| Generic tables without isolation | Potential leakage | entity_photos, shift_assignments | 1 day |
| Inconsistent naming conventions | Maintenance difficulty | Various | Ongoing |

---

## 7. Immediate Action Plan

### Step 1: Lock Down Global Access (TODAY)

```sql
-- 1. Fix amenities
DROP POLICY "Manage all amenities" ON amenities;
CREATE POLICY "Staff manage amenities" ON amenities
  FOR ALL USING (public.is_hostconnect_staff());

-- 2. Fix room_categories  
DROP POLICY "Manage all categories" ON room_categories;
CREATE POLICY "Staff manage categories" ON room_categories
  FOR ALL USING (public.is_hostconnect_staff());

-- 3. Fix room_types
DROP POLICY "authenticated_manage_room_types" ON room_types;
CREATE POLICY "Property owners manage room types" ON room_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = room_types.property_id
      AND public.is_org_admin(p.org_id)
    )
  );

-- 4. Fix services
DROP POLICY "Enable read access for all users" ON services;
CREATE POLICY "Property members view services" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = services.property_id
      AND public.is_org_member(p.org_id)
    )
  );

-- 5. Fix item_stock
DROP POLICY "Authenticated users can view stock" ON item_stock;
-- Need to add org_id first, then create proper policy

-- 6. Fix stock_items
DROP POLICY "Authenticated users can view stock items" ON stock_items;
-- Need to add org_id first, then create proper policy

-- 7. Fix room_type_inventory
DROP POLICY "Enable all access for authenticated users (Temporary for MVP)" ON room_type_inventory;
-- Need to add org_id first, then create proper policy
```

### Step 2: Add org_id to Critical Tables (THIS WEEK)

```sql
-- Add org_id columns
ALTER TABLE amenities ADD COLUMN org_id uuid REFERENCES organizations(id);
ALTER TABLE room_types ADD COLUMN org_id uuid REFERENCES organizations(id);
ALTER TABLE room_categories ADD COLUMN org_id uuid REFERENCES organizations(id);
ALTER TABLE services ADD COLUMN org_id uuid REFERENCES organizations(id);
ALTER TABLE item_stock ADD COLUMN org_id uuid REFERENCES organizations(id);
ALTER TABLE stock_items ADD COLUMN org_id uuid REFERENCES organizations(id);
ALTER TABLE room_type_inventory ADD COLUMN org_id uuid REFERENCES organizations(id);

-- Backfill org_id from properties
UPDATE amenities SET org_id = (SELECT org_id FROM properties LIMIT 1) WHERE org_id IS NULL;
-- Note: amenities might need to be org-specific or global - needs business decision

UPDATE room_types rt
SET org_id = p.org_id
FROM properties p
WHERE rt.property_id = p.id;

UPDATE services s
SET org_id = p.org_id
FROM properties p
WHERE s.property_id = p.id;

-- Make NOT NULL after backfill
ALTER TABLE room_types ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN org_id SET NOT NULL;
```

### Step 3: Optimize RLS Policies (THIS WEEK)

```sql
-- Replace subquery with helper function
DROP POLICY "Users can view inventory items of their org" ON inventory_items;
CREATE POLICY "Org members view inventory" ON inventory_items
  FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY "Users can insert inventory items to their org" ON inventory_items;
CREATE POLICY "Org members insert inventory" ON inventory_items
  FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- Similar for UPDATE and DELETE
```

---

## 8. Validation Queries

### 8.1 Verify RLS is Working

```sql
-- Test as regular user (should see ONLY their org's data)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<test_user_id>';

-- Should return ONLY user's org properties
SELECT COUNT(*) FROM properties;

-- Should return ONLY user's org bookings
SELECT COUNT(*) FROM bookings;

-- BUG: Will return ALL amenities (needs fix)
SELECT COUNT(*) FROM amenities;

-- BUG: Will return ALL stock items (needs fix)
SELECT COUNT(*) FROM stock_items;
```

### 8.2 Find All Policies with qual = true

```sql
-- Identify all overly permissive policies
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true'
ORDER BY tablename;
```

### 8.3 Find All Tables Missing org_id

```sql
-- List tables without org_id column
SELECT table_name
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'org_id'
  )
  AND table_name NOT IN ('profiles', 'hostconnect_staff', 'ticket_comments', 'idea_comments')
ORDER BY table_name;
```

---

## 9. Compliance & Audit Gaps

### 9.1 Missing Audit Trail

**No audit logging for**:
- ❌ Permission changes (`member_permissions`)
- ❌ Staff management (`hostconnect_staff`)
- ❌ Organization changes (`organizations`)
- ❌ Property changes (`properties`)
- ❌ Booking lifecycle (`bookings`)
- ❌ Pricing changes (`pricing_rules`)
- ❌ Config changes (`website_settings`)

### 9.2 Recommended Audit Triggers

```sql
-- Create audit trigger for permission changes
CREATE OR REPLACE FUNCTION log_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    org_id,
    user_id,
    event_type,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(NEW.org_id, OLD.org_id),
    auth.uid(),
    TG_OP || '_PERMISSION',
    'member_permissions',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_audit_permissions
AFTER INSERT OR UPDATE OR DELETE ON member_permissions
FOR EACH ROW EXECUTE FUNCTION log_permission_changes();
```

---

## 10. Migration Strategy

### Phase 1: Emergency Fixes (TODAY - 4 hours)

1. ✅ Lock down global access policies
2. ✅ Add temporary restrictive policies to critical tables
3. ✅ Test with real user accounts

### Phase 2: Structural Fixes (THIS WEEK - 2 days)

1. ✅ Add `org_id` to all critical tables
2. ✅ Backfill `org_id` from properties
3. ✅ Update RLS policies to use helper functions
4. ✅ Make `org_id` NOT NULL where appropriate

### Phase 3: Optimization (NEXT WEEK - 2 days)

1. ✅ Replace subqueries with helper functions
2. ✅ Add indexes on `org_id` columns
3. ✅ Implement comprehensive audit triggers
4. ✅ Add `org_id` to audit_log table

### Phase 4: Validation (ONGOING)

1. ✅ Test multi-tenant isolation with real accounts
2. ✅ Performance testing on large datasets
3. ✅ Security audit with penetration testing
4. ✅ Compliance review

---

## 11. Conclusion

### Current State: 🔴 HIGH RISK

The HostConnect database has **48 tables** with **RLS enabled on all**, but suffers from **critical security vulnerabilities**:

1. 🔴 **7 tables with global access** (amenities, room_categories, room_types, services, item_stock, stock_items, room_type_inventory)
2. 🔴 **15+ tables missing org_id** for proper multi-tenant isolation
3. 🔴 **No audit logging** for critical operations
4. ⚠️ **Performance issues** with subquery-based RLS policies

### Immediate Actions Required:

**TODAY (4 hours)**:
1. Lock down global access policies
2. Add restrictive policies to critical tables
3. Test with real user accounts

**THIS WEEK (2 days)**:
4. Add `org_id` to all critical tables
5. Backfill and enforce NOT NULL
6. Optimize RLS policies

**NEXT WEEK (2 days)**:
7. Implement audit triggers
8. Performance optimization
9. Security validation

### Estimated Total Effort: **1 week** for critical fixes + ongoing optimization

---

**Report Status**: ✅ COMPLETE (Real-time database analysis)  
**Next Step**: Execute Phase 1 emergency fixes immediately  
**Analyst**: Senior Supabase Architect  
**Date**: 2026-01-19  
**Project**: Host Connect (oravqykjpgqoiidqnfja)
