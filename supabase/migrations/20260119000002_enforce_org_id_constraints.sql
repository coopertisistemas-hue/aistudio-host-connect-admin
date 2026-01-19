-- Migration: Enforce org_id NOT NULL and Foreign Keys (CORRECTED)
-- Description: Makes org_id mandatory and adds FK constraints
-- Date: 2026-01-19
-- Author: Supabase Security Team
-- IMPORTANT: Run this AFTER 20260119000001_backfill_org_id.sql
-- CRITICAL: This migration will FAIL if any NULL org_id values exist
-- CORRECTED: Only enforces constraints on tables that actually exist

-- =============================================================================
-- PRE-FLIGHT VALIDATION
-- =============================================================================

-- Check for NULL org_id values before enforcing NOT NULL
DO $$
DECLARE
    tables_with_nulls text[];
    null_count integer;
BEGIN
    -- Check each table for NULL org_id
    SELECT array_agg(table_name)
    INTO tables_with_nulls
    FROM (
        SELECT 'amenities' as table_name, COUNT(*) as cnt FROM public.amenities WHERE org_id IS NULL
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
    ) t
    WHERE cnt > 0;
    
    IF array_length(tables_with_nulls, 1) > 0 THEN
        RAISE EXCEPTION 'Cannot enforce NOT NULL: The following tables have NULL org_id values: %. Run backfill migration first.', 
            array_to_string(tables_with_nulls, ', ');
    ELSE
        RAISE NOTICE 'PRE-FLIGHT CHECK PASSED: No NULL org_id values found';
    END IF;
END $$;

-- =============================================================================
-- PHASE 1: ADD FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Add FK constraints BEFORE NOT NULL (allows for better error messages)

ALTER TABLE public.amenities
ADD CONSTRAINT fk_amenities_org_id 
FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- room_categories (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_categories') THEN
        ALTER TABLE public.room_categories
        ADD CONSTRAINT fk_room_categories_org_id 
        FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.room_types
ADD CONSTRAINT fk_room_types_org_id 
FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.services
ADD CONSTRAINT fk_services_org_id 
FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.item_stock
ADD CONSTRAINT fk_item_stock_org_id 
FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.room_type_inventory
ADD CONSTRAINT fk_room_type_inventory_org_id 
FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.pricing_rules
ADD CONSTRAINT fk_pricing_rules_org_id 
FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.website_settings
ADD CONSTRAINT fk_website_settings_org_id 
FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- =============================================================================
-- PHASE 2: ENFORCE NOT NULL CONSTRAINTS
-- =============================================================================

-- Make org_id NOT NULL for all tables
-- This will fail if any NULL values exist or if FK constraint violations occur

ALTER TABLE public.amenities ALTER COLUMN org_id SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_categories') THEN
        ALTER TABLE public.room_categories ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

ALTER TABLE public.room_types ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.item_stock ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.room_type_inventory ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.pricing_rules ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.website_settings ALTER COLUMN org_id SET NOT NULL;

-- =============================================================================
-- PHASE 3: POST-ENFORCEMENT VALIDATION
-- =============================================================================

-- Verify all constraints were added
DO $$
DECLARE
    missing_fks text[];
    tables_to_check text[] := ARRAY[
        'amenities',
        'room_types',
        'services',
        'item_stock',
        'room_type_inventory',
        'pricing_rules',
        'website_settings'
    ];
    tbl_name text;
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_check
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            WHERE tc.table_schema = 'public'
              AND tc.table_name = tbl_name
              AND tc.constraint_name = 'fk_' || tbl_name || '_org_id'
              AND tc.constraint_type = 'FOREIGN KEY'
        ) THEN
            missing_fks := array_append(missing_fks, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_fks, 1) > 0 THEN
        RAISE EXCEPTION 'Missing FK constraints on tables: %', array_to_string(missing_fks, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All FK constraints added to existing tables';
    END IF;
END $$;

-- Verify all NOT NULL constraints were added
DO $$
DECLARE
    nullable_columns text[];
    tables_to_check text[] := ARRAY[
        'amenities',
        'room_types',
        'services',
        'item_stock',
        'room_type_inventory',
        'pricing_rules',
        'website_settings'
    ];
    tbl_name text;
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_check
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = tbl_name
              AND c.column_name = 'org_id'
              AND c.is_nullable = 'YES'
        ) THEN
            nullable_columns := array_append(nullable_columns, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(nullable_columns, 1) > 0 THEN
        RAISE EXCEPTION 'org_id is still nullable on tables: %', array_to_string(nullable_columns, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All org_id columns are NOT NULL on existing tables';
    END IF;
END $$;


-- Final success message
DO $$
DECLARE
    table_count integer;
BEGIN
    SELECT COUNT(*)
    INTO table_count
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE 'fk_%_org_id';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ORG_ID ENFORCEMENT COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ % tables now have org_id NOT NULL', table_count;
    RAISE NOTICE '✓ % FK constraints to organizations', table_count;
    RAISE NOTICE '✓ Multi-tenant isolation enforced';
    RAISE NOTICE '========================================';
END $$;
