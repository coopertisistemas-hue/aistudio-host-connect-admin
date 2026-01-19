-- Migration: Add org_id to existing operational tables (CORRECTED)
-- Description: Adds org_id column only to tables that actually exist
-- Date: 2026-01-19
-- Author: Supabase Security Team
-- CORRECTED: Removed references to non-existent tables

-- =============================================================================
-- PHASE 1: ADD org_id COLUMNS (Only to existing tables)
-- =============================================================================

-- CRITICAL TABLES (Missing org_id, high security risk)

-- 1. amenities
ALTER TABLE public.amenities 
ADD COLUMN IF NOT EXISTS org_id uuid;

-- 2. room_categories (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_categories') THEN
        ALTER TABLE public.room_categories ADD COLUMN IF NOT EXISTS org_id uuid;
    END IF;
END $$;

-- 3. room_types (has property_id, adding org_id for consistency)
ALTER TABLE public.room_types 
ADD COLUMN IF NOT EXISTS org_id uuid;

-- 4. services (has property_id, adding org_id for consistency)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS org_id uuid;

-- 5. item_stock
ALTER TABLE public.item_stock 
ADD COLUMN IF NOT EXISTS org_id uuid;

-- 6. room_type_inventory
ALTER TABLE public.room_type_inventory 
ADD COLUMN IF NOT EXISTS org_id uuid;

-- 7. pricing_rules (has property_id)
ALTER TABLE public.pricing_rules 
ADD COLUMN IF NOT EXISTS org_id uuid;

-- 8. website_settings (has property_id)
ALTER TABLE public.website_settings 
ADD COLUMN IF NOT EXISTS org_id uuid;

-- =============================================================================
-- PHASE 2: ADD INDEXES (Before backfill for performance)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_amenities_org_id ON public.amenities(org_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_categories') THEN
        CREATE INDEX IF NOT EXISTS idx_room_categories_org_id ON public.room_categories(org_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_room_types_org_id ON public.room_types(org_id);
CREATE INDEX IF NOT EXISTS idx_services_org_id ON public.services(org_id);
CREATE INDEX IF NOT EXISTS idx_item_stock_org_id ON public.item_stock(org_id);
CREATE INDEX IF NOT EXISTS idx_room_type_inventory_org_id ON public.room_type_inventory(org_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_org_id ON public.pricing_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_website_settings_org_id ON public.website_settings(org_id);

-- =============================================================================
-- VALIDATION QUERIES
-- =============================================================================

-- Check that all columns were added successfully
DO $$
DECLARE
    missing_columns text[];
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
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = tbl_name
              AND c.column_name = 'org_id'
        ) THEN
            missing_columns := array_append(missing_columns, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Failed to add org_id to tables: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: org_id column added to all existing tables';
    END IF;
END $$;


-- Check room_categories separately (optional table)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_categories') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'room_categories' 
              AND column_name = 'org_id'
        ) THEN
            RAISE WARNING 'room_categories exists but org_id was not added';
        ELSE
            RAISE NOTICE 'SUCCESS: org_id added to room_categories';
        END IF;
    ELSE
        RAISE NOTICE 'SKIPPED: room_categories table does not exist';
    END IF;
END $$;
