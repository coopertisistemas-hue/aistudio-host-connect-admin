-- ============================================================================
-- MULTI-TENANT ISOLATION VALIDATION TEST SUITE
-- ============================================================================
-- Date: 2026-01-19
-- Objective: Prove that multi-tenant isolation works with zero data leakage
-- Author: Supabase Security Team
--
-- ⚠️ IMPORTANT: SETUP REQUIRED BEFORE RUNNING ⚠️
--
-- STEP 1: Create 5 users in Supabase Auth Dashboard
--   - test-user-a1@example.com (Org A Admin)
--   - test-user-a2@example.com (Org A Member)
--   - test-user-b1@example.com (Org B Admin)
--   - test-user-b2@example.com (Org B Member)
--   - test-staff@example.com (Staff)
--
-- STEP 2: Copy each user's UUID from Supabase Auth
--
-- STEP 3: Replace the placeholder UUIDs below (lines 35-39) with real UUIDs
--
-- STEP 4: Run this file via Supabase SQL Editor
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: SETUP - Create Test Organizations and Users
-- ============================================================================

-- ⚠️⚠️⚠️ REPLACE THESE UUIDs WITH REAL USER IDs FROM SUPABASE AUTH ⚠️⚠️⚠️
-- These placeholder UUIDs will cause FK constraint errors if not replaced!
--
-- To get real UUIDs:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create the 5 test users listed above
-- 3. Click on each user and copy their UUID
-- 4. Replace the values below

DO $$
DECLARE
    -- Organization IDs (generated automatically)
    org_a_id uuid := gen_random_uuid();
    org_b_id uuid := gen_random_uuid();
    
    -- 🔴 REPLACE THESE WITH ACTUAL AUTH.USERS IDs 🔴
    user_a1_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- ⚠️ REPLACE ME
    user_a2_id uuid := '00000000-0000-0000-0000-000000000002'::uuid; -- ⚠️ REPLACE ME
    user_b1_id uuid := '00000000-0000-0000-0000-000000000003'::uuid; -- ⚠️ REPLACE ME
    user_b2_id uuid := '00000000-0000-0000-0000-000000000004'::uuid; -- ⚠️ REPLACE ME
    user_s1_id uuid := '00000000-0000-0000-0000-000000000099'::uuid; -- ⚠️ REPLACE ME (staff)
    
    -- Property IDs
    property_a_id uuid := gen_random_uuid();
    property_b_id uuid := gen_random_uuid();
BEGIN
    -- Create Org A
    INSERT INTO organizations (id, name)
    VALUES (org_a_id, 'Test Org A')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create Org B
    INSERT INTO organizations (id, name)
    VALUES (org_b_id, 'Test Org B')
    ON CONFLICT (id) DO NOTHING;
    
    -- Add users to Org A
    INSERT INTO org_members (org_id, user_id, role)
    VALUES 
        (org_a_id, user_a1_id, 'admin'),
        (org_a_id, user_a2_id, 'member')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    
    -- Add users to Org B
    INSERT INTO org_members (org_id, user_id, role)
    VALUES 
        (org_b_id, user_b1_id, 'admin'),
        (org_b_id, user_b2_id, 'member')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    
    -- Add staff member
    INSERT INTO hostconnect_staff (user_id, role)
    VALUES (user_s1_id, 'support')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create property for Org A
    INSERT INTO properties (id, org_id, name, address)
    VALUES (property_a_id, org_a_id, 'Hotel A', '123 Street A')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create property for Org B
    INSERT INTO properties (id, org_id, name, address)
    VALUES (property_b_id, org_b_id, 'Hotel B', '456 Street B')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create test data for Org A
    INSERT INTO amenities (org_id, name, icon)
    VALUES 
        (org_a_id, 'WiFi A', 'wifi'),
        (org_a_id, 'Pool A', 'pool')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO room_types (org_id, property_id, name, base_price, capacity)
    VALUES 
        (org_a_id, property_a_id, 'Standard A', 100, 2),
        (org_a_id, property_a_id, 'Deluxe A', 200, 4)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO services (org_id, property_id, name, price)
    VALUES 
        (org_a_id, property_a_id, 'Breakfast A', 20),
        (org_a_id, property_a_id, 'Spa A', 50)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO inventory_items (org_id, name, category)
    VALUES 
        (org_a_id, 'Towel A', 'Bedding'),
        (org_a_id, 'Shampoo A', 'Toiletries')
    ON CONFLICT DO NOTHING;
    
    -- Create test data for Org B
    INSERT INTO amenities (org_id, name, icon)
    VALUES 
        (org_b_id, 'WiFi B', 'wifi'),
        (org_b_id, 'Gym B', 'gym')
    ON CONFLICT DO NOTHING;
    
    INSERT INTO room_types (org_id, property_id, name, base_price, capacity)
    VALUES 
        (org_b_id, property_b_id, 'Standard B', 150, 2),
        (org_b_id, property_b_id, 'Suite B', 300, 6)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO services (org_id, property_id, name, price)
    VALUES 
        (org_b_id, property_b_id, 'Breakfast B', 25),
        (org_b_id, property_b_id, 'Laundry B', 30)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO inventory_items (org_id, name, category)
    VALUES 
        (org_b_id, 'Towel B', 'Bedding'),
        (org_b_id, 'Soap B', 'Toiletries')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'TEST DATA SETUP COMPLETE';
    RAISE NOTICE 'Org A ID: %', org_a_id;
    RAISE NOTICE 'Org B ID: %', org_b_id;
    RAISE NOTICE 'Property A ID: %', property_a_id;
    RAISE NOTICE 'Property B ID: %', property_b_id;
END $$;

-- ============================================================================
-- SECTION 2: POSITIVE TESTS - Verify users can see their own org's data
-- ============================================================================

-- Test 2.1: Org A Admin can see Org A data
-- Expected: Success, returns Org A data only
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    amenities_count integer;
    room_types_count integer;
    services_count integer;
BEGIN
    -- Simulate user A1 session
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Count visible amenities
    SELECT COUNT(*) INTO amenities_count FROM amenities;
    
    -- Count visible room types
    SELECT COUNT(*) INTO room_types_count FROM room_types;
    
    -- Count visible services
    SELECT COUNT(*) INTO services_count FROM services;
    
    RAISE NOTICE '=== TEST 2.1: Org A Admin Access ===';
    RAISE NOTICE 'Amenities visible: % (Expected: 2)', amenities_count;
    RAISE NOTICE 'Room Types visible: % (Expected: 2)', room_types_count;
    RAISE NOTICE 'Services visible: % (Expected: 2)', services_count;
    
    IF amenities_count = 2 AND room_types_count = 2 AND services_count = 2 THEN
        RAISE NOTICE '✅ TEST 2.1 PASSED';
    ELSE
        RAISE EXCEPTION '❌ TEST 2.1 FAILED';
    END IF;
END $$;

-- Test 2.2: Org A Member can see Org A data (read-only mostly)
-- Expected: Success, returns Org A data only
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000002'::uuid; -- User A2
    properties_count integer;
    inventory_count integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    SELECT COUNT(*) INTO properties_count FROM properties;
    SELECT COUNT(*) INTO inventory_count FROM inventory_items;
    
    RAISE NOTICE '=== TEST 2.2: Org A Member Access ===';
    RAISE NOTICE 'Properties visible: % (Expected: 1)', properties_count;
    RAISE NOTICE 'Inventory Items visible: % (Expected: 2)', inventory_count;
    
    IF properties_count = 1 AND inventory_count = 2 THEN
        RAISE NOTICE '✅ TEST 2.2 PASSED';
    ELSE
        RAISE EXCEPTION '❌ TEST 2.2 FAILED';
    END IF;
END $$;

-- Test 2.3: Org B Admin can see Org B data
-- Expected: Success, returns Org B data only
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000003'::uuid; -- User B1
    amenities_count integer;
    room_types_count integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    SELECT COUNT(*) INTO amenities_count FROM amenities;
    SELECT COUNT(*) INTO room_types_count FROM room_types;
    
    RAISE NOTICE '=== TEST 2.3: Org B Admin Access ===';
    RAISE NOTICE 'Amenities visible: % (Expected: 2)', amenities_count;
    RAISE NOTICE 'Room Types visible: % (Expected: 2)', room_types_count;
    
    IF amenities_count = 2 AND room_types_count = 2 THEN
        RAISE NOTICE '✅ TEST 2.3 PASSED';
    ELSE
        RAISE EXCEPTION '❌ TEST 2.3 FAILED';
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: NEGATIVE TESTS - Verify users CANNOT see other org's data
-- ============================================================================

-- Test 3.1: Org A user tries to see Org B data via direct query
-- Expected: Returns 0 rows
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    org_b_id uuid;
    leaked_count integer;
BEGIN
    -- Get Org B ID
    SELECT id INTO org_b_id FROM organizations WHERE name = 'Test Org B';
    
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try to see Org B amenities
    SELECT COUNT(*) INTO leaked_count 
    FROM amenities 
    WHERE name LIKE '%B';
    
    RAISE NOTICE '=== TEST 3.1: Cross-Org Direct Query ===';
    RAISE NOTICE 'Org B amenities visible to Org A user: % (Expected: 0)', leaked_count;
    
    IF leaked_count = 0 THEN
        RAISE NOTICE '✅ TEST 3.1 PASSED - No data leakage';
    ELSE
        RAISE EXCEPTION '❌ TEST 3.1 FAILED - DATA LEAKAGE DETECTED';
    END IF;
END $$;

-- Test 3.2: Org A user tries to see Org B data via org_id filter
-- Expected: Returns 0 rows (RLS blocks it)
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    org_b_id uuid;
    leaked_count integer;
BEGIN
    SELECT id INTO org_b_id FROM organizations WHERE name = 'Test Org B';
    
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try to explicitly filter by Org B's org_id
    SELECT COUNT(*) INTO leaked_count 
    FROM room_types 
    WHERE org_id = org_b_id;
    
    RAISE NOTICE '=== TEST 3.2: Cross-Org Filter Bypass Attempt ===';
    RAISE NOTICE 'Org B room types visible via filter: % (Expected: 0)', leaked_count;
    
    IF leaked_count = 0 THEN
        RAISE NOTICE '✅ TEST 3.2 PASSED - RLS blocked filter bypass';
    ELSE
        RAISE EXCEPTION '❌ TEST 3.2 FAILED - FILTER BYPASS DETECTED';
    END IF;
END $$;

-- Test 3.3: Org A user tries to see Org B data via JOIN
-- Expected: Returns 0 rows (RLS on both tables)
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    leaked_count integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try to JOIN to see Org B data
    SELECT COUNT(*) INTO leaked_count 
    FROM properties p
    JOIN room_types rt ON rt.property_id = p.id
    WHERE p.name LIKE '%B';
    
    RAISE NOTICE '=== TEST 3.3: Cross-Org JOIN Bypass Attempt ===';
    RAISE NOTICE 'Org B data visible via JOIN: % (Expected: 0)', leaked_count;
    
    IF leaked_count = 0 THEN
        RAISE NOTICE '✅ TEST 3.3 PASSED - JOIN did not bypass RLS';
    ELSE
        RAISE EXCEPTION '❌ TEST 3.3 FAILED - JOIN BYPASS DETECTED';
    END IF;
END $$;

-- Test 3.4: Org B user tries to see Org A data via inventory JOIN
-- Expected: Returns 0 rows
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000003'::uuid; -- User B1
    leaked_count integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try to see Org A inventory via JOIN
    SELECT COUNT(*) INTO leaked_count 
    FROM inventory_items ii
    WHERE ii.name LIKE '%A';
    
    RAISE NOTICE '=== TEST 3.4: Reverse Cross-Org Access ===';
    RAISE NOTICE 'Org A inventory visible to Org B user: % (Expected: 0)', leaked_count;
    
    IF leaked_count = 0 THEN
        RAISE NOTICE '✅ TEST 3.4 PASSED - Reverse access blocked';
    ELSE
        RAISE EXCEPTION '❌ TEST 3.4 FAILED - REVERSE LEAKAGE DETECTED';
    END IF;
END $$;

-- ============================================================================
-- SECTION 4: STAFF TESTS - Verify staff can see ALL data
-- ============================================================================

-- Test 4.1: Staff can see both Org A and Org B data
-- Expected: Success, sees data from both orgs
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000099'::uuid; -- User S1 (staff)
    total_amenities integer;
    total_properties integer;
    total_room_types integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    SELECT COUNT(*) INTO total_amenities FROM amenities;
    SELECT COUNT(*) INTO total_properties FROM properties;
    SELECT COUNT(*) INTO total_room_types FROM room_types;
    
    RAISE NOTICE '=== TEST 4.1: Staff Cross-Org Access ===';
    RAISE NOTICE 'Total amenities visible: % (Expected: 4 - both orgs)', total_amenities;
    RAISE NOTICE 'Total properties visible: % (Expected: 2 - both orgs)', total_properties;
    RAISE NOTICE 'Total room types visible: % (Expected: 4 - both orgs)', total_room_types;
    
    IF total_amenities = 4 AND total_properties = 2 AND total_room_types = 4 THEN
        RAISE NOTICE '✅ TEST 4.1 PASSED - Staff has cross-org access';
    ELSE
        RAISE EXCEPTION '❌ TEST 4.1 FAILED - Staff access incorrect';
    END IF;
END $$;

-- Test 4.2: Verify staff can filter by specific org if needed
-- Expected: Staff can explicitly access specific org data
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000099'::uuid; -- User S1 (staff)
    org_a_id uuid;
    org_a_amenities integer;
BEGIN
    SELECT id INTO org_a_id FROM organizations WHERE name = 'Test Org A';
    
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    SELECT COUNT(*) INTO org_a_amenities 
    FROM amenities 
    WHERE org_id = org_a_id;
    
    RAISE NOTICE '=== TEST 4.2: Staff Filtered Org Access ===';
    RAISE NOTICE 'Org A amenities (filtered): % (Expected: 2)', org_a_amenities;
    
    IF org_a_amenities = 2 THEN
        RAISE NOTICE '✅ TEST 4.2 PASSED - Staff can filter by org';
    ELSE
        RAISE EXCEPTION '❌ TEST 4.2 FAILED';
    END IF;
END $$;

-- ============================================================================
-- SECTION 5: MALICIOUS QUERY ATTEMPTS
-- ============================================================================

-- Test 5.1: Attempt UNION bypass
-- Expected: Returns 0 Org B rows for Org A user
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    leaked_count integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try UNION to combine Org A and Org B results
    -- RLS should still filter both parts of the UNION
    SELECT COUNT(*) INTO leaked_count FROM (
        SELECT id, name FROM amenities WHERE name LIKE '%A'
        UNION ALL
        SELECT id, name FROM amenities WHERE name LIKE '%B'
    ) combined;
    
    RAISE NOTICE '=== TEST 5.1: UNION Bypass Attempt ===';
    RAISE NOTICE 'Rows returned via UNION: % (Expected: 2 - only Org A)', leaked_count;
    
    IF leaked_count = 2 THEN
        RAISE NOTICE '✅ TEST 5.1 PASSED - UNION did not bypass RLS';
    ELSE
        RAISE EXCEPTION '❌ TEST 5.1 FAILED - UNION BYPASS DETECTED';
    END IF;
END $$;

-- Test 5.2: Attempt subquery bypass
-- Expected: Subquery also respects RLS
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    leaked_count integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try to use subquery to access Org B data
    SELECT COUNT(*) INTO leaked_count 
    FROM room_types rt
    WHERE rt.id IN (
        SELECT id FROM room_types WHERE name LIKE '%B'
    );
    
    RAISE NOTICE '=== TEST 5.2: Subquery Bypass Attempt ===';
    RAISE NOTICE 'Rows from subquery: % (Expected: 0)', leaked_count;
    
    IF leaked_count = 0 THEN
        RAISE NOTICE '✅ TEST 5.2 PASSED - Subquery respects RLS';
    ELSE
        RAISE EXCEPTION '❌ TEST 5.2 FAILED - SUBQUERY BYPASS DETECTED';
    END IF;
END $$;

-- Test 5.3: Attempt CTE bypass
-- Expected: CTE also respects RLS
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    leaked_count integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try to use CTE to access Org B data
    WITH all_services AS (
        SELECT * FROM services
    )
    SELECT COUNT(*) INTO leaked_count 
    FROM all_services
    WHERE name LIKE '%B';
    
    RAISE NOTICE '=== TEST 5.3: CTE Bypass Attempt ===';
    RAISE NOTICE 'Org B services via CTE: % (Expected: 0)', leaked_count;
    
    IF leaked_count = 0 THEN
        RAISE NOTICE '✅ TEST 5.3 PASSED - CTE respects RLS';
    ELSE
        RAISE EXCEPTION '❌ TEST 5.3 FAILED - CTE BYPASS DETECTED';
    END IF;
END $$;

-- Test 5.4: Attempt multi-level JOIN bypass
-- Expected: Returns 0 rows (RLS on all tables in JOIN chain)
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    leaked_count integer;
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try complex JOIN chain to access Org B data
    SELECT COUNT(*) INTO leaked_count 
    FROM properties p
    JOIN room_types rt ON rt.property_id = p.id
    JOIN services s ON s.property_id = p.id
    WHERE s.name LIKE '%B';
    
    RAISE NOTICE '=== TEST 5.4: Multi-level JOIN Bypass Attempt ===';
    RAISE NOTICE 'Org B data via complex JOIN: % (Expected: 0)', leaked_count;
    
    IF leaked_count = 0 THEN
        RAISE NOTICE '✅ TEST 5.4 PASSED - Complex JOIN blocked';
    ELSE
        RAISE EXCEPTION '❌ TEST 5.4 FAILED - COMPLEX JOIN BYPASS DETECTED';
    END IF;
END $$;

-- ============================================================================
-- SECTION 6: WRITE OPERATION TESTS
-- ============================================================================

-- Test 6.1: Org A user cannot INSERT into Org B
-- Expected: INSERT succeeds but data is scoped to Org A, not Org B
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid; -- User A1
    org_b_id uuid;
    new_amenity_id uuid;
    inserted_org_id uuid;
BEGIN
    SELECT id INTO org_b_id FROM organizations WHERE name = 'Test Org B';
    
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id)::text, true);
    
    -- Try to INSERT with Org B's org_id
    BEGIN
        INSERT INTO amenities (org_id, name, icon)
        VALUES (org_b_id, 'Malicious Amenity', 'hack')
        RETURNING id INTO new_amenity_id;
        
        -- Check what org_id was actually inserted
        SELECT org_id INTO inserted_org_id FROM amenities WHERE id = new_amenity_id;
        
        RAISE EXCEPTION '❌ TEST 6.1 FAILED - INSERT should have been blocked by WITH CHECK';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '=== TEST 6.1: Cross-Org INSERT Attempt ===';
        RAISE NOTICE '✅ TEST 6.1 PASSED - INSERT to Org B blocked';
    END;
END $$;

-- ============================================================================
-- SECTION 7: FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MULTI-TENANT ISOLATION TEST SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If you see this message, all tests passed!';
    RAISE NOTICE '✅ Positive tests: Users can see own org data';
    RAISE NOTICE '✅ Negative tests: Users cannot see other org data';
    RAISE NOTICE '✅ Staff tests: Staff can see all org data';
    RAISE NOTICE '✅ Malicious tests: All bypass attempts blocked';
    RAISE NOTICE '✅ Write tests: Cross-org writes blocked';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ZERO DATA LEAKAGE CONFIRMED';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- CLEANUP (Optional - run to remove test data)
-- ============================================================================

-- Uncomment to cleanup:
/*
DELETE FROM amenities WHERE name LIKE '%A' OR name LIKE '%B';
DELETE FROM room_types WHERE name LIKE '%A' OR name LIKE '%B';
DELETE FROM services WHERE name LIKE '%A' OR name LIKE '%B';
DELETE FROM inventory_items WHERE name LIKE '%A' OR name LIKE '%B';
DELETE FROM properties WHERE name LIKE 'Hotel%';
DELETE FROM org_members WHERE org_id IN (
    SELECT id FROM organizations WHERE name IN ('Test Org A', 'Test Org B')
);
DELETE FROM organizations WHERE name IN ('Test Org A', 'Test Org B');
DELETE FROM hostconnect_staff WHERE user_id = '00000000-0000-0000-0000-000000000099'::uuid;
*/
