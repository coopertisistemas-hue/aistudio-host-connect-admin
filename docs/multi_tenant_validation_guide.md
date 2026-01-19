# Multi-Tenant Isolation Validation — Test Guide

**Date**: 2026-01-19  
**Test File**: 20260119000006_multi_tenant_validation_tests.sql  
**Objective**: Prove zero data leakage between organizations  
**Status**: ✅ READY FOR EXECUTION

---

## Overview

This test suite validates that multi-tenant isolation is working correctly by:
1. Creating 2 separate organizations with test data
2. Creating users in each org (admin, member)
3. Creating a staff member
4. Running positive and negative access tests
5. Attempting malicious bypass techniques
6. Verifying zero data leakage

---

## Test Structure

### 1. SETUP (Section 1)
Creates test organizations A and B with:
- 2 organizations
- 4 org users (2 per org: admin + member)
- 1 staff user
- Properties, amenities, room types, services, inventory for each org

### 2. POSITIVE TESTS (Section 2)
Validates users CAN see their own org's data:
- Test 2.1: Org A admin sees Org A data
- Test 2.2: Org A member sees Org A data
- Test 2.3: Org B admin sees Org B data

### 3. NEGATIVE TESTS (Section 3)
Validates users CANNOT see other org's data:
- Test 3.1: Direct query attempt
- Test 3.2: org_id filter bypass attempt
- Test 3.3: JOIN bypass attempt
- Test 3.4: Reverse access attempt

### 4. STAFF TESTS (Section 4)
Validates staff CAN see all orgs' data:
- Test 4.1: Staff sees both orgs
- Test 4.2: Staff can filter by specific org

### 5. MALICIOUS TESTS (Section 5)
Validates bypass attempts are blocked:
- Test 5.1: UNION bypass attempt
- Test 5.2: Subquery bypass attempt
- Test 5.3: CTE bypass attempt
- Test 5.4: Multi-level JOIN bypass attempt

### 6. WRITE TESTS (Section 6)
Validates cross-org writes are blocked:
- Test 6.1: INSERT to other org blocked

---

## Pre-Requisites

### Create Test Users in Supabase Auth

Before running the test, create 5 users in Supabase Auth Dashboard:

1. **User A1** (Org A Admin)
   - Email: `test-user-a1@example.com`
   - Copy UUID after creation

2. **User A2** (Org A Member)
   - Email: `test-user-a2@example.com`
   - Copy UUID after creation

3. **User B1** (Org B Admin)
   - Email: `test-user-b1@example.com`
   - Copy UUID after creation

4. **User B2** (Org B Member)
   - Email: `test-user-b2@example.com`
   - Copy UUID after creation

5. **User S1** (Staff)
   - Email: `test-staff@example.com`
   - Copy UUID after creation

---

## Configuration

### Update UUIDs in Test File

Replace the placeholder UUIDs in Section 1 (SETUP) with the actual UUIDs from Supabase Auth:

```sql
-- Line ~35-40 in the test file
user_a1_id uuid := 'REPLACE-WITH-USER-A1-UUID'::uuid;
user_a2_id uuid := 'REPLACE-WITH-USER-A2-UUID'::uuid;
user_b1_id uuid := 'REPLACE-WITH-USER-B1-UUID'::uuid;
user_b2_id uuid := 'REPLACE-WITH-USER-B2-UUID'::uuid;
user_s1_id uuid := 'REPLACE-WITH-STAFF-UUID'::uuid;
```

---

## Execution Instructions

### Option 1: Via Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `20260119000006_multi_tenant_validation_tests.sql`
4. Update user UUIDs (see Configuration above)
5. Click "Run"
6. Watch the NOTICE messages for test results

### Option 2: Via psql

```bash
# Edit the file to update UUIDs first
psql -h <host> -U <user> -d <database> \
  -f supabase/migrations/20260119000006_multi_tenant_validation_tests.sql
```

---

## Expected Results

### Successful Test Run

If all tests pass, you'll see:

```
NOTICE: TEST DATA SETUP COMPLETE
NOTICE: Org A ID: <uuid>
NOTICE: Org B ID: <uuid>
...
NOTICE: === TEST 2.1: Org A Admin Access ===
NOTICE: Amenities visible: 2 (Expected: 2)
NOTICE: Room Types visible: 2 (Expected: 2)
NOTICE: Services visible: 2 (Expected: 2)
NOTICE: ✅ TEST 2.1 PASSED
...
NOTICE: === TEST 3.1: Cross-Org Direct Query ===
NOTICE: Org B amenities visible to Org A user: 0 (Expected: 0)
NOTICE: ✅ TEST 3.1 PASSED - No data leakage
...
NOTICE: === TEST 4.1: Staff Cross-Org Access ===
NOTICE: Total amenities visible: 4 (Expected: 4 - both orgs)
NOTICE: ✅ TEST 4.1 PASSED - Staff has cross-org access
...
NOTICE: ========================================
NOTICE: MULTI-TENANT ISOLATION TEST SUMMARY
NOTICE: ========================================
NOTICE: ZERO DATA LEAKAGE CONFIRMED
NOTICE: ========================================
```

### Failed Test

If a test fails, you'll see:

```
ERROR: ❌ TEST X.X FAILED - DATA LEAKAGE DETECTED
```

**Action**: Review RLS policies for the affected table.

---

## Test Scenarios Explained

### Test 2.1: Org A Admin Access ✅

**Scenario**: User A1 (admin of Org A) queries amenities, room_types, services

**Expected**:
- Amenities: 2 (WiFi A, Pool A)
- Room Types: 2 (Standard A, Deluxe A)
- Services: 2 (Breakfast A, Spa A)

**What it proves**: Users can see their own org's data

---

### Test 3.1: Cross-Org Direct Query ❌

**Scenario**: User A1 tries to see Org B amenities by filtering `name LIKE '%B'`

**Expected**: 0 rows returned

**What it proves**: RLS filters out other org's data even when explicitly queried

---

### Test 3.3: Cross-Org JOIN Bypass ❌

**Scenario**: User A1 tries to JOIN properties and room_types to access Org B data

```sql
SELECT * FROM properties p
JOIN room_types rt ON rt.property_id = p.id
WHERE p.name LIKE '%B';
```

**Expected**: 0 rows returned

**What it proves**: 
- RLS applies to BOTH tables in the JOIN
- Even if properties weren't filtered, room_types would be
- JOINs don't bypass RLS

---

### Test 4.1: Staff Cross-Org Access ✅

**Scenario**: Staff member S1 queries amenities, properties, room_types

**Expected**:
- Amenities: 4 (2 from Org A + 2 from Org B)
- Properties: 2 (1 from Org A + 1 from Org B)
- Room Types: 4 (2 from Org A + 2 from Org B)

**What it proves**: `is_hostconnect_staff()` grants cross-org access

---

### Test 5.1: UNION Bypass ❌

**Scenario**: User A1 tries UNION ALL to combine Org A and Org B results

```sql
SELECT id FROM amenities WHERE name LIKE '%A'
UNION ALL
SELECT id FROM amenities WHERE name LIKE '%B';
```

**Expected**: 2 rows (only Org A), not 4

**What it proves**: RLS applies to BOTH parts of UNION independently

---

### Test 5.4: Multi-level JOIN Bypass ❌

**Scenario**: User A1 tries complex JOIN chain

```sql
SELECT * FROM properties p
JOIN room_types rt ON rt.property_id = p.id
JOIN services s ON s.property_id = p.id
WHERE s.name LIKE '%B';
```

**Expected**: 0 rows

**What it proves**: RLS applies to ALL tables in complex JOIN chains

---

### Test 6.1: Cross-Org INSERT ❌

**Scenario**: User A1 tries to INSERT into amenities with Org B's org_id

```sql
INSERT INTO amenities (org_id, name, icon)
VALUES (<org_b_id>, 'Malicious', 'hack');
```

**Expected**: INSERT blocked by WITH CHECK policy

**What it proves**: Users cannot write to other org's tables

---

## Validation Matrix

| Test | Type | User | Expected Result | What it Proves |
|------|------|------|-----------------|----------------|
| 2.1 | Positive | Org A Admin | See 2 amenities | Own org access works |
| 2.2 | Positive | Org A Member | See 1 property | Member access works |
| 2.3 | Positive | Org B Admin | See 2 amenities | Org B isolation works |
| 3.1 | Negative | Org A User | See 0 Org B items | Direct query blocked |
| 3.2 | Negative | Org A User | See 0 Org B items | Filter bypass blocked |
| 3.3 | Negative | Org A User | See 0 Org B items | JOIN bypass blocked |
| 3.4 | Negative | Org B User | See 0 Org A items | Reverse access blocked |
| 4.1 | Staff | Staff | See 4 amenities (both orgs) | Staff cross-org works |
| 4.2 | Staff | Staff | Can filter to specific org | Staff filtering works |
| 5.1 | Malicious | Org A User | UNION returns 2 not 4 | UNION respects RLS |
| 5.2 | Malicious | Org A User | Subquery returns 0 | Subquery respects RLS |
| 5.3 | Malicious | Org A User | CTE returns 0 | CTE respects RLS |
| 5.4 | Malicious | Org A User | Complex JOIN returns 0 | Multi-JOIN respects RLS |
| 6.1 | Write | Org A User | INSERT blocked | Cross-org write blocked |

---

## Troubleshooting

### Test 2.1 Fails (User cannot see own data)

**Symptoms**: `amenities_count = 0` instead of 2

**Possible Causes**:
- User is not in `org_members` table
- `is_org_member()` function has issues
- RLS policy wrong

**Debug**:
```sql
-- Check org membership
SELECT * FROM org_members WHERE user_id = '<user_a1_id>';

-- Manually check is_org_member
SET LOCAL request.jwt.claims TO '{"sub": "<user_a1_id>"}';
SELECT is_org_member('<org_a_id>');
-- Expected: true
```

---

### Test 3.1 Fails (User CAN see other org's data)

**Symptoms**: `leaked_count > 0` 

**CRITICAL**: This indicates **DATA LEAKAGE**

**Immediate Actions**:
1. Stop production deployment
2. Review RLS policies on the affected table
3. Check if org_id column exists and has data
4. Verify FK constraint to organizations

**Debug**:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'amenities';
-- Expected: rowsecurity = true

-- Check policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'amenities';

-- Check org_id column
SELECT org_id, name FROM amenities;
-- Should see org_id populated
```

---

### Test 4.1 Fails (Staff cannot see all data)

**Symptoms**: `total_amenities = 2` instead of 4

**Possible Causes**:
- User is not in `hostconnect_staff` table
- `is_hostconnect_staff()` function has issues

**Debug**:
```sql
-- Check staff membership
SELECT * FROM hostconnect_staff WHERE user_id = '<user_s1_id>';

-- Manually check function
SET LOCAL request.jwt.claims TO '{"sub": "<user_s1_id>"}';
SELECT is_hostconnect_staff();
-- Expected: true
```

---

### Test 5.X Fails (Bypass successful)

**CRITICAL**: This indicates **RLS BYPASS VULNERABILITY**

**Immediate Actions**:
1. STOP production deployment
2. Identify which bypass technique worked
3. Review RLS policy logic
4. Test with actual attack scenarios

---

## Cleanup

After testing, remove test data:

```sql
-- Uncomment the CLEANUP section at end of test file
-- Or run:
DELETE FROM amenities WHERE name LIKE '%A' OR name LIKE '%B';
DELETE FROM room_types WHERE name LIKE '%A' OR name LIKE '%B';
DELETE FROM services WHERE name LIKE '%A' OR name LIKE '%B';
DELETE FROM inventory_items WHERE name LIKE '%A' OR name LIKE '%B';
DELETE FROM properties WHERE name LIKE 'Hotel%';
DELETE FROM org_members WHERE org_id IN (
    SELECT id FROM organizations WHERE slug IN ('test-org-a', 'test-org-b')
);
DELETE FROM organizations WHERE slug IN ('test-org-a', 'test-org-b');
DELETE FROM hostconnect_staff WHERE user_id = '<staff_uuid>';
```

---

## Continuous Validation

### Run Tests Regularly

**Frequency**: After every RLS policy change

**CI/CD Integration**:
```bash
# Add to CI pipeline
psql $DATABASE_URL -f supabase/migrations/20260119000006_multi_tenant_validation_tests.sql
if [ $? -ne 0 ]; then
  echo "❌ Multi-tenant isolation tests FAILED"
  exit 1
fi
```

### Monitoring

**Alert on**:
- Any test failure
- Any data leakage detected
- Any bypass successful

---

## Success Criteria

✅ **All 15 tests pass**  
✅ **Zero data leakage detected**  
✅ **All bypass attempts blocked**  
✅ **Staff access works correctly**  
✅ **Write operations protected**

**Conclusion**: Multi-tenant isolation is **PRODUCTION READY**

---

**Created**: 2026-01-19  
**Status**: ✅ READY FOR EXECUTION  
**Next**: Run tests before production deployment
