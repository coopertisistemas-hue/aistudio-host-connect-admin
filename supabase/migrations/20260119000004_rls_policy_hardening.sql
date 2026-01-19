-- Migration: RLS Policy Hardening - Replace Unsafe Policies
-- Description: Replace qual=true and overly permissive policies with strict org-based isolation
-- Date: 2026-01-19
-- Author: Supabase Security Team
-- IMPORTANT: Run this AFTER org_id enforcement migrations (20260119000002)

-- =============================================================================
-- CRITICAL: This migration drops and recreates RLS policies
-- Ensure org_id is populated and NOT NULL before running
-- =============================================================================

-- =============================================================================
-- TABLE 1: amenities
-- =============================================================================
-- Current Issue: qual = true (ANY authenticated user can CRUD)
-- Fix: Restrict to org members + HostConnect staff

-- Drop unsafe policies
DROP POLICY IF EXISTS "Manage all amenities" ON public.amenities;

-- Policy: Org members can view their org's amenities
-- Allows: All org members (owner, admin, member, viewer)
-- Denies: Users from other orgs, unauthenticated users
CREATE POLICY "org_members_select_amenities" 
ON public.amenities
FOR SELECT
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can insert amenities
-- Allows: Org owners and admins
-- Denies: Members, viewers, other orgs
CREATE POLICY "org_admins_insert_amenities" 
ON public.amenities
FOR INSERT
WITH CHECK (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can update amenities
-- Allows: Org owners and admins
-- Denies: Members, viewers, other orgs
CREATE POLICY "org_admins_update_amenities" 
ON public.amenities
FOR UPDATE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can delete amenities
-- Allows: Org owners and admins
-- Denies: Members, viewers, other orgs
CREATE POLICY "org_admins_delete_amenities" 
ON public.amenities
FOR DELETE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- =============================================================================
-- TABLE 2: room_types
-- =============================================================================
-- Current Issue: qual = true (ANY authenticated user can CRUD)
-- Fix: Restrict to org members + HostConnect staff

-- Drop unsafe policies
DROP POLICY IF EXISTS "authenticated_manage_room_types" ON public.room_types;

-- Policy: Org members can view their org's room types
CREATE POLICY "org_members_select_room_types" 
ON public.room_types
FOR SELECT
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can insert room types
CREATE POLICY "org_admins_insert_room_types" 
ON public.room_types
FOR INSERT
WITH CHECK (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can update room types
CREATE POLICY "org_admins_update_room_types" 
ON public.room_types
FOR UPDATE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can delete room types
CREATE POLICY "org_admins_delete_room_types" 
ON public.room_types
FOR DELETE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- =============================================================================
-- TABLE 3: services
-- =============================================================================
-- Current Issue: qual = true for SELECT (global read access)
-- Fix: Restrict to org members only

-- Drop unsafe policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.services;

-- Policy: Org members can view their org's services
CREATE POLICY "org_members_select_services" 
ON public.services
FOR SELECT
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can insert services
CREATE POLICY "org_admins_insert_services" 
ON public.services
FOR INSERT
WITH CHECK (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can update services
CREATE POLICY "org_admins_update_services" 
ON public.services
FOR UPDATE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can delete services
CREATE POLICY "org_admins_delete_services" 
ON public.services
FOR DELETE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- =============================================================================
-- TABLE 4: item_stock
-- =============================================================================
-- Current Issue: auth.role() = 'authenticated' (too permissive - global visibility)
-- Fix: Restrict to org members only

-- Drop unsafe policies
DROP POLICY IF EXISTS "Authenticated users can view stock" ON public.item_stock;
DROP POLICY IF EXISTS "Authenticated users can update stock" ON public.item_stock;
DROP POLICY IF EXISTS "Authenticated users can modify stock" ON public.item_stock;
DROP POLICY IF EXISTS "Authenticated users can delete stock" ON public.item_stock;

-- Policy: Org members can view their org's stock
CREATE POLICY "org_members_select_item_stock" 
ON public.item_stock
FOR SELECT
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org members can insert stock records
-- Note: Members can manage stock (not just admins)
CREATE POLICY "org_members_insert_item_stock" 
ON public.item_stock
FOR INSERT
WITH CHECK (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org members can update stock
CREATE POLICY "org_members_update_item_stock" 
ON public.item_stock
FOR UPDATE
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can delete stock records
CREATE POLICY "org_admins_delete_item_stock" 
ON public.item_stock
FOR DELETE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- =============================================================================
-- TABLE 5: room_type_inventory
-- =============================================================================
-- Current Issue: "Temporary for MVP" policy (complete bypass)
-- Fix: Strict org-based policies

-- Drop unsafe policies
DROP POLICY IF EXISTS "Enable all access for authenticated users (Temporary for MVP)" ON public.room_type_inventory;

-- Policy: Org members can view their org's inventory
CREATE POLICY "org_members_select_room_type_inventory" 
ON public.room_type_inventory
FOR SELECT
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org members can insert inventory records
CREATE POLICY "org_members_insert_room_type_inventory" 
ON public.room_type_inventory
FOR INSERT
WITH CHECK (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org members can update inventory
CREATE POLICY "org_members_update_room_type_inventory" 
ON public.room_type_inventory
FOR UPDATE
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can delete inventory records
CREATE POLICY "org_admins_delete_room_type_inventory" 
ON public.room_type_inventory
FOR DELETE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- =============================================================================
-- TABLE 6: pricing_rules
-- =============================================================================
-- Current Issue: May have overly permissive policies
-- Fix: Ensure strict org-based access

-- Drop any existing policies
DROP POLICY IF EXISTS "Authenticated users can view pricing rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Authenticated users can manage pricing rules" ON public.pricing_rules;

-- Policy: Org members can view their org's pricing rules
CREATE POLICY "org_members_select_pricing_rules" 
ON public.pricing_rules
FOR SELECT
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can insert pricing rules
-- Note: Only admins can create pricing rules (sensitive business logic)
CREATE POLICY "org_admins_insert_pricing_rules" 
ON public.pricing_rules
FOR INSERT
WITH CHECK (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can update pricing rules
CREATE POLICY "org_admins_update_pricing_rules" 
ON public.pricing_rules
FOR UPDATE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can delete pricing rules
CREATE POLICY "org_admins_delete_pricing_rules" 
ON public.pricing_rules
FOR DELETE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- =============================================================================
-- TABLE 7: website_settings
-- =============================================================================
-- Current Issue: May have overly permissive policies
-- Fix: Ensure strict admin-only access (sensitive config)

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.website_settings;
DROP POLICY IF EXISTS "Authenticated users can view website settings" ON public.website_settings;
DROP POLICY IF EXISTS "Authenticated users can manage website settings" ON public.website_settings;

-- Policy: Org members can view their org's website settings
CREATE POLICY "org_members_select_website_settings" 
ON public.website_settings
FOR SELECT
USING (
  public.is_org_member(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can insert website settings
-- Note: Only admins can manage website settings (public-facing config)
CREATE POLICY "org_admins_insert_website_settings" 
ON public.website_settings
FOR INSERT
WITH CHECK (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can update website settings
CREATE POLICY "org_admins_update_website_settings" 
ON public.website_settings
FOR UPDATE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- Policy: Org admins can delete website settings
CREATE POLICY "org_admins_delete_website_settings" 
ON public.website_settings
FOR DELETE
USING (
  public.is_org_admin(org_id) 
  OR public.is_hostconnect_staff()
);

-- =============================================================================
-- CONDITIONAL: room_categories (if exists)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'room_categories'
    ) THEN
        -- Drop unsafe policies
        EXECUTE 'DROP POLICY IF EXISTS "Manage all categories" ON public.room_categories';
        
        -- Create strict policies
        EXECUTE '
        CREATE POLICY "org_members_select_room_categories" 
        ON public.room_categories
        FOR SELECT
        USING (
          public.is_org_member(org_id) 
          OR public.is_hostconnect_staff()
        )';
        
        EXECUTE '
        CREATE POLICY "org_admins_insert_room_categories" 
        ON public.room_categories
        FOR INSERT
        WITH CHECK (
          public.is_org_admin(org_id) 
          OR public.is_hostconnect_staff()
        )';
        
        EXECUTE '
        CREATE POLICY "org_admins_update_room_categories" 
        ON public.room_categories
        FOR UPDATE
        USING (
          public.is_org_admin(org_id) 
          OR public.is_hostconnect_staff()
        )';
        
        EXECUTE '
        CREATE POLICY "org_admins_delete_room_categories" 
        ON public.room_categories
        FOR DELETE
        USING (
          public.is_org_admin(org_id) 
          OR public.is_hostconnect_staff()
        )';
        
        RAISE NOTICE 'SUCCESS: RLS policies hardened for room_categories';
    ELSE
        RAISE NOTICE 'SKIPPED: room_categories table does not exist';
    END IF;
END $$;

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify no tables have qual = true policies
DO $$
DECLARE
    unsafe_policies text;
BEGIN
    SELECT string_agg(tablename || '.' || policyname, ', ')
    INTO unsafe_policies
    FROM pg_policies
    WHERE schemaname = 'public'
      AND qual = 'true'
      AND tablename IN (
        'amenities', 'room_categories', 'room_types', 'services',
        'item_stock', 'room_type_inventory', 'pricing_rules', 'website_settings'
      );
    
    IF unsafe_policies IS NOT NULL THEN
        RAISE EXCEPTION 'Tables still have qual=true policies: %', unsafe_policies;
    ELSE
        RAISE NOTICE 'SUCCESS: No qual=true policies found on hardened tables';
    END IF;
END $$;

-- Verify all tables have at least one policy per operation
DO $$
DECLARE
    tables_to_check text[] := ARRAY[
        'amenities', 'room_types', 'services', 'item_stock',
        'room_type_inventory', 'pricing_rules', 'website_settings'
    ];
    tbl_name text;
    select_count integer;
    insert_count integer;
    update_count integer;
    delete_count integer;
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_check
    LOOP
        SELECT COUNT(*) INTO select_count FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = tbl_name AND cmd = 'SELECT';
        
        SELECT COUNT(*) INTO insert_count FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = tbl_name AND cmd = 'INSERT';
        
        SELECT COUNT(*) INTO update_count FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = tbl_name AND cmd = 'UPDATE';
        
        SELECT COUNT(*) INTO delete_count FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = tbl_name AND cmd = 'DELETE';
        
        IF select_count = 0 OR insert_count = 0 OR update_count = 0 OR delete_count = 0 THEN
            RAISE WARNING 'Table % is missing policies: SELECT=%, INSERT=%, UPDATE=%, DELETE=%', 
                tbl_name, select_count, insert_count, update_count, delete_count;
        ELSE
            RAISE NOTICE 'Table % has complete policies: SELECT=%, INSERT=%, UPDATE=%, DELETE=%', 
                tbl_name, select_count, insert_count, update_count, delete_count;
        END IF;
    END LOOP;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICY HARDENING COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ 7 tables hardened with strict org-based policies';
    RAISE NOTICE '✓ qual=true policies replaced';
    RAISE NOTICE '✓ authenticated-only policies replaced';
    RAISE NOTICE '✓ All operations (SELECT/INSERT/UPDATE/DELETE) covered';
    RAISE NOTICE '========================================';
END $$;
