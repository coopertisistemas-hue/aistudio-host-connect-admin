-- Migration: Backfill org_id for existing operational tables (CORRECTED)
-- Description: Safely populates org_id from properties table
-- Date: 2026-01-19
-- Author: Supabase Security Team
-- IMPORTANT: Run this AFTER 20260119000000_add_org_id_to_operational_tables.sql
-- CORRECTED: Only backfills tables that actually exist

-- =============================================================================
-- PHASE 1: BACKFILL FROM PROPERTIES (Tables with property_id)
-- =============================================================================

-- 1. room_types
UPDATE public.room_types rt
SET org_id = p.org_id
FROM public.properties p
WHERE rt.property_id = p.id
  AND rt.org_id IS NULL;

-- 2. services
UPDATE public.services s
SET org_id = p.org_id
FROM public.properties p
WHERE s.property_id = p.id
  AND s.org_id IS NULL;

-- 3. pricing_rules
UPDATE public.pricing_rules pr
SET org_id = p.org_id
FROM public.properties p
WHERE pr.property_id = p.id
  AND pr.org_id IS NULL;

-- 4. website_settings
UPDATE public.website_settings ws
SET org_id = p.org_id
FROM public.properties p
WHERE ws.property_id = p.id
  AND ws.org_id IS NULL;

-- =============================================================================
-- PHASE 2: BACKFILL VIA FK RELATIONSHIPS
-- =============================================================================

-- room_type_inventory: Backfill via room_types
UPDATE public.room_type_inventory rti
SET org_id = rt.org_id
FROM public.room_types rt
WHERE rti.room_type_id = rt.id
  AND rti.org_id IS NULL
  AND rt.org_id IS NOT NULL;

-- item_stock: Backfill via inventory_items (which already has org_id)
UPDATE public.item_stock ist
SET org_id = ii.org_id
FROM public.inventory_items ii
WHERE ist.item_id = ii.id
  AND ist.org_id IS NULL
  AND ii.org_id IS NOT NULL;

-- =============================================================================
-- PHASE 3: HANDLE SPECIAL CASES (Tables without property_id or FK)
-- =============================================================================

-- amenities: Business decision needed
-- Option A: Assign to first org (temporary solution)
-- Option B: Keep NULL and make global (staff-only management)
-- Option C: Duplicate for each org

-- TEMPORARY SOLUTION: Assign to first org if only one org exists
DO $$
DECLARE
    org_count integer;
    first_org_id uuid;
BEGIN
    SELECT COUNT(*) INTO org_count FROM public.organizations;
    
    IF org_count = 1 THEN
        SELECT id INTO first_org_id FROM public.organizations LIMIT 1;
        
        UPDATE public.amenities
        SET org_id = first_org_id
        WHERE org_id IS NULL;
        
        RAISE NOTICE 'Assigned all amenities to org: %', first_org_id;
    ELSIF org_count = 0 THEN
        RAISE WARNING 'No organizations exist. Cannot backfill amenities.';
    ELSE
        RAISE NOTICE 'Multiple orgs exist (%). Amenities require manual assignment or duplication.', org_count;
        RAISE NOTICE 'Current NULL amenities count: %', (SELECT COUNT(*) FROM public.amenities WHERE org_id IS NULL);
    END IF;
END $$;

-- room_categories: Similar to amenities (if table exists)
DO $$
DECLARE
    org_count integer;
    first_org_id uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_categories') THEN
        RAISE NOTICE 'SKIPPED: room_categories table does not exist';
        RETURN;
    END IF;
    
    SELECT COUNT(*) INTO org_count FROM public.organizations;
    
    IF org_count = 1 THEN
        SELECT id INTO first_org_id FROM public.organizations LIMIT 1;
        
        EXECUTE 'UPDATE public.room_categories SET org_id = $1 WHERE org_id IS NULL' USING first_org_id;
        
        RAISE NOTICE 'Assigned all room_categories to org: %', first_org_id;
    ELSIF org_count = 0 THEN
        RAISE WARNING 'No organizations exist. Cannot backfill room_categories.';
    ELSE
        RAISE NOTICE 'Multiple orgs exist (%). Room categories require manual assignment or duplication.', org_count;
    END IF;
END $$;

-- =============================================================================
-- PHASE 4: VALIDATION
-- =============================================================================

-- Report NULL org_id counts per table
DO $$
DECLARE
    null_counts text;
BEGIN
    SELECT string_agg(table_name || ': ' || null_count::text, E'\n')
    INTO null_counts
    FROM (
        SELECT 'amenities' as table_name, COUNT(*) as null_count FROM public.amenities WHERE org_id IS NULL
        UNION ALL
        SELECT 'room_types', COUNT(*) FROM public.room_types WHERE org_id IS NULL
        UNION ALL
        SELECT 'services', COUNT(*) FROM public.services WHERE org_id IS NULL
        UNION ALL
        SELECT 'item_stock', COUNT(*) FROM public.item_stock WHERE org_id IS NULL
        UNION ALL
        SELECT 'room_type_inventory', COUNT(*) FROM public.room_type_inventory WHERE org_id IS NULL
        UNION ALL
        SELECT 'pricing_rules', COUNT(*) FROM public.pricing_rules WHERE org_id IS NULL
        UNION ALL
        SELECT 'website_settings', COUNT(*) FROM public.website_settings WHERE org_id IS NULL
    ) counts
    WHERE null_count > 0;
    
    IF null_counts IS NOT NULL THEN
        RAISE WARNING E'Tables with NULL org_id:\n%', null_counts;
    ELSE
        RAISE NOTICE 'SUCCESS: All tables have org_id populated';
    END IF;
END $$;

-- Check for orphaned records (org_id doesn't exist in organizations)
DO $$
DECLARE
    orphaned_records text;
BEGIN
    SELECT string_agg(table_name || ': ' || orphan_count::text, E'\n')
    INTO orphaned_records
    FROM (
        SELECT 'amenities' as table_name, COUNT(*) as orphan_count 
        FROM public.amenities a
        WHERE a.org_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = a.org_id)
        UNION ALL
        SELECT 'room_types', COUNT(*) 
        FROM public.room_types rt
        WHERE rt.org_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = rt.org_id)
        UNION ALL
        SELECT 'services', COUNT(*) 
        FROM public.services s
        WHERE s.org_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = s.org_id)
        UNION ALL
        SELECT 'item_stock', COUNT(*) 
        FROM public.item_stock ist
        WHERE ist.org_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = ist.org_id)
        UNION ALL
        SELECT 'room_type_inventory', COUNT(*) 
        FROM public.room_type_inventory rti
        WHERE rti.org_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = rti.org_id)
        UNION ALL
        SELECT 'pricing_rules', COUNT(*) 
        FROM public.pricing_rules pr
        WHERE pr.org_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = pr.org_id)
        UNION ALL
        SELECT 'website_settings', COUNT(*) 
        FROM public.website_settings ws
        WHERE ws.org_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = ws.org_id)
    ) orphans
    WHERE orphan_count > 0;
    
    IF orphaned_records IS NOT NULL THEN
        RAISE EXCEPTION E'Orphaned records found (org_id not in organizations):\n%', orphaned_records;
    ELSE
        RAISE NOTICE 'SUCCESS: No orphaned records found';
    END IF;
END $$;
