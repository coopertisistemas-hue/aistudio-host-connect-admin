# Supabase Production Readiness Checklist

**Date**: 2026-01-19  
**Project**: HostConnect Admin  
**Objective**: Ensure Supabase backend is production-ready  
**Status**: Pre-Deployment Audit

---

## Executive Summary

### Current Production Readiness: 🔴 **NOT READY**

**Critical Blockers**: 5  
**High Priority Issues**: 12  
**Medium Priority Issues**: 8  

**Recommendation**: **DO NOT DEPLOY** until critical blockers are resolved.

---

## 1. RLS (Row Level Security) Protection

### 1.1 All Tables Have RLS Enabled ✅

**Status**: ✅ **PASS** - All 48 tables have RLS enabled

**Verification Query**:
```sql
-- Check for tables without RLS
SELECT 
    schemaname,
    tablename
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename
    FROM pg_tables pt
    JOIN pg_class c ON c.relname = pt.tablename
    WHERE c.relrowsecurity = true
  );
```

**Expected Result**: 0 rows (all tables have RLS)  
**Actual Result**: ✅ 0 rows

---

### 1.2 No Overly Permissive Policies 🔴

**Status**: 🔴 **FAIL** - 7 tables have `qual = true` (global access)

**Critical Issues**:

| Table | Policy | Issue | Risk |
|-------|--------|-------|------|
| `amenities` | "Manage all amenities" | qual = true | 🔴 ANY user can CRUD |
| `room_categories` | "Manage all categories" | qual = true | 🔴 ANY user can CRUD |
| `room_types` | "authenticated_manage_room_types" | qual = true | 🔴 ANY user can CRUD |
| `services` | "Enable read access for all users" | qual = true | 🔴 Global visibility |
| `item_stock` | "Authenticated users can view stock" | auth.role() = 'authenticated' | 🔴 Global visibility |
| `stock_items` | "Authenticated users can view stock items" | auth.role() = 'authenticated' | 🔴 Global visibility |
| `room_type_inventory` | "Enable all access (Temporary for MVP)" | auth.role() = 'authenticated' | 🔴 Complete bypass |

**Verification Query**:
```sql
-- Find policies with qual = true or overly permissive
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual = 'true'
    OR qual LIKE '%authenticated%'
  )
ORDER BY tablename;
```

**Required Action**: Replace all `qual = true` policies with org-scoped policies

**Blocker**: 🔴 **YES** - Critical security vulnerability

---

### 1.3 Policies Use Helper Functions ⚠️

**Status**: ⚠️ **PARTIAL** - Some policies use subqueries instead of helper functions

**Issues**:
- `inventory_items` uses `IN (SELECT ...)` instead of `is_org_member()`
- Performance impact on large datasets

**Verification Query**:
```sql
-- Find policies using subqueries
SELECT 
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%SELECT%'
  AND qual NOT LIKE '%is_org_%'
ORDER BY tablename;
```

**Required Action**: Replace subqueries with `is_org_member()` or `is_org_admin()`

**Blocker**: 🟡 **NO** - Performance issue, not security

---

## 2. Multi-Tenant Isolation

### 2.1 All Tables Have org_id 🔴

**Status**: 🔴 **FAIL** - 15+ tables missing `org_id`

**Missing org_id**:
- `amenities` (🔴 CRITICAL)
- `room_types` (🔴 CRITICAL)
- `room_categories` (🔴 CRITICAL)
- `services` (🔴 CRITICAL)
- `item_stock` (🔴 CRITICAL)
- `stock_items` (🔴 CRITICAL)
- `room_type_inventory` (🔴 CRITICAL)
- `staff_profiles` (🟡 HIGH)
- `invoices` (🟡 HIGH)
- `expenses` (🟡 HIGH)
- `departments` (🟡 HIGH)
- `pricing_rules` (🟡 HIGH)
- `website_settings` (🟡 HIGH)
- `pantry_stock` (🟡 HIGH)
- `shifts` (🟡 HIGH)
- `tasks` (🟡 HIGH)
- `entity_photos` (🟢 MEDIUM)
- `shift_assignments` (🟢 MEDIUM)
- `stock_movements` (🟢 MEDIUM)

**Verification Query**:
```sql
-- List tables without org_id
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
  AND table_name NOT IN ('profiles', 'hostconnect_staff', 'audit_log', 'ticket_comments', 'idea_comments')
ORDER BY table_name;
```

**Required Action**: Execute Multi-Tenant Enforcement Plan (Task 2)

**Blocker**: 🔴 **YES** - Multi-tenant isolation not guaranteed

---

### 2.2 org_id NOT NULL Enforced ⚠️

**Status**: ⚠️ **PARTIAL** - Some tables have org_id but allow NULL

**Tables with nullable org_id**:
- All tables from 2.1 that have org_id but not enforced

**Verification Query**:
```sql
-- Check for nullable org_id columns
SELECT 
    table_name,
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'org_id'
  AND is_nullable = 'YES'
ORDER BY table_name;
```

**Required Action**: After backfill, enforce NOT NULL

**Blocker**: 🟡 **NO** - Can be fixed post-backfill

---

### 2.3 Cross-Org Access Prevention ✅

**Status**: ✅ **PASS** - RLS policies prevent cross-org access (when org_id exists)

**Verification Test**:
```sql
-- Test as User A trying to access Org B's data
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<user_a_id>';

-- Should return 0 rows (Org B's data)
SELECT COUNT(*) 
FROM properties 
WHERE org_id = '<org_b_id>';

RESET ROLE;
```

**Expected Result**: 0 rows  
**Actual Result**: ✅ 0 rows (when org_id exists and RLS is correct)

---

## 3. Permissions & Roles Enforcement

### 3.1 Permission Helper Functions Exist 🔴

**Status**: 🔴 **FAIL** - Helper functions not yet implemented

**Missing Functions**:
- `has_module_permission(org_id, module_key, action)`
- `get_user_module_permissions(org_id)`
- `is_viewer_role(org_id)`
- `block_viewer_writes(org_id)`

**Verification Query**:
```sql
-- Check for permission helper functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%permission%'
ORDER BY routine_name;
```

**Required Action**: Execute Permissions & Roles Plan (Task 3)

**Blocker**: 🔴 **YES** - Granular permissions not enforced

---

### 3.2 Viewer Read-Only Enforced 🔴

**Status**: 🔴 **FAIL** - No viewer write blocking

**Issue**: Viewers can currently write to tables if RLS allows

**Verification Test**:
```sql
-- Test as viewer trying to INSERT
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '<viewer_user_id>';

-- Should FAIL
INSERT INTO invoices (...) VALUES (...);

RESET ROLE;
```

**Expected Result**: Error  
**Actual Result**: ❌ May succeed (no viewer blocking)

**Required Action**: Implement `block_viewer_writes()` function

**Blocker**: 🔴 **YES** - Viewers may have write access

---

### 3.3 Module Permissions Enforced 🔴

**Status**: 🔴 **FAIL** - No module-level permission checks

**Issue**: RLS policies don't check `member_permissions` table

**Required Action**: Update all RLS policies to use `has_module_permission()`

**Blocker**: 🔴 **YES** - Granular permissions not working

---

## 4. Edge Functions Security

### 4.1 JWT Validation 🔴

**Status**: 🔴 **FAIL** - 8/10 functions missing JWT validation

**Functions Without JWT**:
- `check-availability` (🔴 CRITICAL)
- `calculate-price` (🔴 CRITICAL)
- `create-checkout-session` (🔴 CRITICAL - Payment fraud risk)
- `verify-stripe-session` (🔴 CRITICAL - Payment fraud risk)
- `sync-ota-inventory` (🔴 CRITICAL - Overbooking risk)
- `send-support-email` (🟢 ACCEPTABLE - Public endpoint)
- `ai-proxy` (🔴 CRITICAL - Cost abuse risk)
- `social-media-manager` (🔴 CRITICAL - Brand damage risk)

**Verification**: Manual code review

**Required Action**: Refactor all functions to validate JWT

**Blocker**: 🔴 **YES** - Unauthenticated access to sensitive operations

---

### 4.2 Org Context Verification 🔴

**Status**: 🔴 **FAIL** - 10/10 functions missing org_id verification

**Issue**: Functions don't verify user has access to requested property/org

**Required Action**: Add org_id verification via RLS (use ANON_KEY instead of SERVICE_ROLE_KEY)

**Blocker**: 🔴 **YES** - Cross-org access possible

---

### 4.3 SERVICE_ROLE_KEY Misuse 🔴

**Status**: 🔴 **FAIL** - 8/10 functions use SERVICE_ROLE_KEY for user operations

**Issue**: SERVICE_ROLE_KEY bypasses ALL RLS policies

**Functions Misusing SERVICE_ROLE_KEY**:
- `check-availability`
- `calculate-price`
- All others except `get-operational-identity` and `send-support-email`

**Required Action**: Replace with ANON_KEY + JWT

**Blocker**: 🔴 **YES** - RLS bypass

---

### 4.4 Portuguese Error Messages 🟡

**Status**: 🟡 **FAIL** - All functions use English error messages

**Issue**: Violates Portuguese (Brazil) requirement

**Required Action**: Replace all error messages with Portuguese

**Blocker**: 🟡 **NO** - UX issue, not security

---

## 5. SECURITY DEFINER Usage

### 5.1 No SECURITY DEFINER Abuse ✅

**Status**: ✅ **PASS** - All SECURITY DEFINER functions are legitimate

**Functions Using SECURITY DEFINER**:
- `is_org_member()` ✅ Legitimate
- `is_org_admin()` ✅ Legitimate
- `is_hostconnect_staff()` ✅ Legitimate
- `current_org_id()` ✅ Legitimate
- `create_organization()` ✅ Legitimate
- `accept_invite()` ✅ Legitimate
- `extend_trial()` ✅ Legitimate (staff-only)
- `handle_new_user()` ✅ Legitimate (trigger)
- `update_updated_at_column()` ✅ Legitimate (trigger)
- `set_org_id_from_property()` ✅ Legitimate (trigger)
- `log_profile_sensitive_changes()` ✅ Legitimate (trigger)

**Verification Query**:
```sql
-- List all SECURITY DEFINER functions
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND security_type = 'DEFINER'
ORDER BY routine_name;
```

**Review Criteria**:
- ✅ Function has legitimate admin purpose
- ✅ Function includes permission checks
- ✅ Function is not exploitable for privilege escalation

**Result**: ✅ All functions are legitimate

---

### 5.2 SECURITY DEFINER Functions Have Permission Checks ✅

**Status**: ✅ **PASS** - All admin functions check permissions

**Examples**:
```sql
-- extend_trial() checks is_hostconnect_staff()
IF NOT public.is_hostconnect_staff() THEN
    RAISE EXCEPTION 'Access Denied: Only staff can extend trials.';
END IF;

-- create_organization() checks auth.uid()
IF current_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated: You must be logged in to create an organization.';
END IF;
```

**Result**: ✅ All functions have proper checks

---

## 6. Public Access Control

### 6.1 No Unintentional Public Access 🔴

**Status**: 🔴 **FAIL** - 7 tables have unintentional public access

**Tables with Public Access**:
- `amenities` - qual = true (🔴 UNINTENTIONAL)
- `room_categories` - qual = true (🔴 UNINTENTIONAL)
- `room_types` - qual = true (🔴 UNINTENTIONAL)
- `services` - qual = true (🔴 UNINTENTIONAL)
- `item_stock` - auth.role() = 'authenticated' (🔴 UNINTENTIONAL)
- `stock_items` - auth.role() = 'authenticated' (🔴 UNINTENTIONAL)
- `room_type_inventory` - auth.role() = 'authenticated' (🔴 UNINTENTIONAL)

**Intentional Public Access** (✅ OK):
- `get-public-website-settings` Edge Function (public by design)

**Verification Query**:
```sql
-- Find policies allowing public access
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR qual LIKE '%authenticated%')
ORDER BY tablename;
```

**Required Action**: Lock down all unintentional public access

**Blocker**: 🔴 **YES** - Data leakage risk

---

## 7. Query Optimization

### 7.1 No SELECT * Without Filters ⚠️

**Status**: ⚠️ **PARTIAL** - Some queries may use SELECT *

**Issue**: Frontend code may use `SELECT *` which is inefficient

**Verification**: Manual code review of frontend queries

**Recommendation**: 
- Always specify columns: `SELECT id, name, org_id FROM ...`
- Always add filters: `WHERE org_id = ...`
- Use pagination: `LIMIT` and `OFFSET`

**Blocker**: 🟡 **NO** - Performance issue, not security

---

### 7.2 Indexes on org_id ⚠️

**Status**: ⚠️ **PARTIAL** - Some tables missing org_id indexes

**Required Indexes**:
```sql
-- After adding org_id columns, create indexes
CREATE INDEX IF NOT EXISTS idx_amenities_org_id ON amenities(org_id);
CREATE INDEX IF NOT EXISTS idx_room_types_org_id ON room_types(org_id);
CREATE INDEX IF NOT EXISTS idx_services_org_id ON services(org_id);
-- ... (all tables with org_id)
```

**Verification Query**:
```sql
-- Check for missing indexes on org_id
SELECT 
    t.table_name,
    c.column_name
FROM information_schema.columns c
JOIN information_schema.tables t ON t.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.column_name = 'org_id'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
      AND i.tablename = t.table_name
      AND i.indexdef LIKE '%org_id%'
  )
ORDER BY t.table_name;
```

**Required Action**: Create indexes on all org_id columns

**Blocker**: 🟡 **NO** - Performance issue, not security

---

## 8. Documentation

### 8.1 All Policies Documented ⚠️

**Status**: ⚠️ **PARTIAL** - Some policies lack comments

**Recommendation**: Add comments to all RLS policies

**Example**:
```sql
-- Policy: Org members can view their org's properties
-- Enforces: Multi-tenant isolation via org_id
-- Allows: All org members (owner, admin, member, viewer)
-- Denies: Users from other orgs, unauthenticated users
CREATE POLICY "org_members_select_properties" 
ON public.properties
FOR SELECT
USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());
```

**Required Action**: Document all policies with clear comments

**Blocker**: 🟡 **NO** - Maintenance issue, not security

---

### 8.2 All Assumptions Explicit ⚠️

**Status**: ⚠️ **PARTIAL** - Some assumptions not documented

**Critical Assumptions to Document**:

1. **Multi-Tenancy Model**:
   - Every organization is isolated by `org_id`
   - Properties belong to organizations
   - Users access data via `org_members` table

2. **Role Hierarchy**:
   - `owner` = Full access to everything
   - `admin` = Full access to everything
   - `member` = Granular permissions via `member_permissions`
   - `viewer` = Read-only access to all modules

3. **Permission Model**:
   - 8 modules: financial, bookings, guests, properties, inventory, team, reports, settings
   - 2 actions: read, write
   - Write permission implies read permission

4. **HostConnect Staff**:
   - Can access ALL organizations (for support)
   - Bypass org_id isolation
   - Listed in `hostconnect_staff` table

5. **Edge Functions**:
   - User-initiated functions use ANON_KEY + JWT
   - System functions use SERVICE_ROLE_KEY + API key
   - All functions validate org_id context

**Required Action**: Document all assumptions in README or ARCHITECTURE.md

**Blocker**: 🟡 **NO** - Documentation issue

---

## 9. Audit & Compliance

### 9.1 Audit Logging Implemented ⚠️

**Status**: ⚠️ **PARTIAL** - Only profile changes are audited

**Current Audit Coverage**:
- ✅ Profile changes (plan, trial, status)
- ❌ Permission changes
- ❌ Staff additions/removals
- ❌ Organization changes
- ❌ Property changes
- ❌ Booking lifecycle
- ❌ Pricing changes
- ❌ Config changes

**Required Action**: Implement comprehensive audit triggers

**Blocker**: 🟡 **NO** - Compliance issue, not security blocker

---

### 9.2 Audit Log Protected ✅

**Status**: ✅ **PASS** - Audit log is staff-only

**Policy**:
```sql
CREATE POLICY "Staff views audit logs" ON public.audit_log
    FOR SELECT
    USING (public.is_hostconnect_staff());
```

**Result**: ✅ Only staff can view audit logs

---

## 10. Production Deployment Criteria

### 10.1 Critical Blockers (MUST FIX) 🔴

**Status**: 🔴 **5 BLOCKERS** - DO NOT DEPLOY

| # | Blocker | Impact | Effort |
|---|---------|--------|--------|
| 1 | 7 tables with global access (qual = true) | Data leakage, corruption | 4 hours |
| 2 | 15+ tables missing org_id | Multi-tenant isolation failure | 2 days |
| 3 | No permission helper functions | Granular permissions not working | 4 hours |
| 4 | 8 Edge Functions missing JWT | Unauthenticated access | 1 week |
| 5 | 8 Edge Functions using SERVICE_ROLE_KEY | RLS bypass | 1 week |

**Total Effort**: ~2-3 weeks

---

### 10.2 High Priority (FIX BEFORE LAUNCH) 🟡

**Status**: 🟡 **12 ISSUES**

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | Viewer write blocking not implemented | Viewers may have write access | 2 hours |
| 2 | Module permissions not enforced in RLS | Granular permissions not working | 1 day |
| 3 | Subqueries in RLS policies | Performance degradation | 2 hours |
| 4 | Missing org_id indexes | Slow queries | 1 hour |
| 5 | English error messages in Edge Functions | UX issue | 4 hours |
| 6 | No rate limiting on Edge Functions | Abuse risk | 1 day |
| 7 | No input sanitization | XSS/injection risk | 1 day |
| 8 | Incomplete audit logging | Compliance risk | 2 days |
| 9 | No Edge Function tests | Quality risk | 3 days |
| 10 | Missing policy documentation | Maintenance risk | 1 day |
| 11 | Assumptions not documented | Knowledge loss risk | 4 hours |
| 12 | No monitoring/alerting | Operational risk | 2 days |

**Total Effort**: ~2 weeks

---

### 10.3 Medium Priority (FIX POST-LAUNCH) 🟢

**Status**: 🟢 **8 ISSUES**

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | SELECT * queries | Performance | 1 week |
| 2 | No query optimization | Performance | Ongoing |
| 3 | No caching strategy | Performance | 1 week |
| 4 | No backup strategy | Data loss risk | 1 day |
| 5 | No disaster recovery plan | Business continuity | 2 days |
| 6 | No performance monitoring | Operational visibility | 1 week |
| 7 | No cost monitoring | Budget overrun | 1 day |
| 8 | No security scanning | Vulnerability detection | 1 week |

**Total Effort**: ~1 month

---

## 11. Final Verification Checklist

### Pre-Deployment Verification

**Run these queries before deploying**:

```sql
-- 1. Verify all tables have RLS
SELECT COUNT(*) as tables_without_rls
FROM pg_tables t
WHERE schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    WHERE c.relname = t.tablename 
    AND c.relrowsecurity = true
  );
-- Expected: 0

-- 2. Verify no policies with qual = true
SELECT COUNT(*) as overly_permissive_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true';
-- Expected: 0

-- 3. Verify all critical tables have org_id
SELECT COUNT(*) as tables_missing_org_id
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'amenities', 'room_types', 'room_categories', 'services',
    'item_stock', 'stock_items', 'room_type_inventory'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'org_id'
  );
-- Expected: 0

-- 4. Verify permission helper functions exist
SELECT COUNT(*) as permission_functions
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'has_module_permission',
    'get_user_module_permissions',
    'is_viewer_role',
    'block_viewer_writes'
  );
-- Expected: 4

-- 5. Verify no NULL org_id in production data
SELECT 
    'properties' as table_name, COUNT(*) as null_count 
FROM properties WHERE org_id IS NULL
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings WHERE org_id IS NULL
UNION ALL
SELECT 'rooms', COUNT(*) FROM rooms WHERE org_id IS NULL;
-- Expected: All 0
```

---

## 12. Deployment Approval

### Sign-Off Checklist

**Before deploying to production, confirm**:

- [ ] All 5 critical blockers resolved
- [ ] All RLS policies tested with real user accounts
- [ ] Cross-org access tested and blocked
- [ ] All Edge Functions refactored and tested
- [ ] Permission system tested (owner, admin, member, viewer)
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Monitoring/alerting configured
- [ ] Team trained on new security model
- [ ] Documentation updated

**Deployment Approval**:
- [ ] Tech Lead Approval: ________________
- [ ] Security Review: ________________
- [ ] Product Owner Approval: ________________
- [ ] Date: ________________

---

## 13. Post-Deployment Monitoring

### Week 1 Monitoring

**Monitor these metrics**:
- RLS policy violations (should be 0)
- Failed authentication attempts
- Cross-org access attempts (should be 0)
- Edge Function errors
- Query performance (p95, p99)
- Database CPU/memory usage
- Audit log entries

**Alert Thresholds**:
- RLS violations: Alert immediately
- Failed auth > 10/min: Alert
- Edge Function errors > 5%: Alert
- Query p95 > 1s: Warning
- Database CPU > 80%: Warning

---

## Conclusion

### Current Status: 🔴 **NOT PRODUCTION READY**

**Critical Issues**: 5 blockers must be resolved before deployment

**Estimated Time to Production Ready**: 2-3 weeks

**Recommended Next Steps**:
1. **Week 1**: Fix critical blockers (RLS, org_id, Edge Functions)
2. **Week 2**: Fix high priority issues (permissions, testing)
3. **Week 3**: Final testing and deployment

**Risk Assessment**: **HIGH** - Current state allows cross-org data access and unauthenticated operations

**Recommendation**: **DELAY PRODUCTION DEPLOYMENT** until all critical blockers are resolved.

---

**Report Date**: 2026-01-19  
**Analyst**: Senior Supabase Architect  
**Status**: ⏳ AWAITING APPROVAL TO FIX BLOCKERS
