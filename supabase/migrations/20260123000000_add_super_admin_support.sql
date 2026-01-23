-- Migration: Add Super Admin Support
-- Description: Enables Connect team members to access all organizations for support purposes
-- Date: 2026-01-23

-- ============================================================================
-- 1. ADD SUPER ADMIN FIELD TO PROFILES
-- ============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- Add index for performance (only index TRUE values to save space)
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin 
ON public.profiles(is_super_admin) 
WHERE is_super_admin = true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_super_admin IS 
'Connect team members with cross-organizational access for support. Only set via direct SQL.';

-- ============================================================================
-- 2. HELPER FUNCTION: CHECK IF USER IS SUPER ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_super_admin() IS 
'Returns true if current user is a super admin (Connect team member)';

-- ============================================================================
-- 3. UPDATE RLS POLICIES - ORGANIZATIONS
-- ============================================================================

-- Members can view their organizations OR super admins can view all
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
CREATE POLICY "Members can view their organizations" ON public.organizations
    FOR SELECT
    USING (
      public.is_super_admin() -- ✅ Super admin sees all orgs
      OR
      public.is_org_member(id) -- ✅ Members see their orgs
    );

-- Only Admins OR super admins can update
DROP POLICY IF EXISTS "Admins can update organization" ON public.organizations;
CREATE POLICY "Admins can update organization" ON public.organizations
    FOR UPDATE
    USING (
      public.is_super_admin() -- ✅ Super admin can update any org
      OR
      public.is_org_admin(id) -- ✅ Org admins can update their org
    );

-- ============================================================================
-- 4. UPDATE RLS POLICIES - ORG MEMBERS
-- ============================================================================

-- Members can view org members OR super admins can view all
DROP POLICY IF EXISTS "Members can view their org members" ON public.org_members;
CREATE POLICY "Members can view their org members" ON public.org_members
    FOR SELECT
    USING (
      public.is_super_admin() -- ✅ Super admin sees all members
      OR
      auth.uid() = user_id -- Can see self
      OR 
      EXISTS ( -- Can see others in same org
        SELECT 1 FROM public.org_members om 
        WHERE om.org_id = org_members.org_id 
        AND om.user_id = auth.uid()
      )
    );

-- Admins OR super admins can manage org members
DROP POLICY IF EXISTS "Admins can manage org members" ON public.org_members;
CREATE POLICY "Admins can manage org members" ON public.org_members
    FOR ALL
    USING (
      public.is_super_admin() -- ✅ Super admin can manage any org members
      OR
      public.is_org_admin(org_id)
    );

-- ============================================================================
-- 5. UPDATE RLS POLICIES - BOOKINGS
-- ============================================================================

-- Super admin can view ALL bookings across all orgs
DROP POLICY IF EXISTS "Users can view bookings in their org" ON public.bookings;
CREATE POLICY "Users can view bookings in their org" ON public.bookings
    FOR SELECT
    USING (
      public.is_super_admin() -- ✅ Super admin sees all bookings
      OR
      public.is_org_member(org_id)
    );

-- Super admin can manage bookings in any org
DROP POLICY IF EXISTS "Users can manage bookings in their org" ON public.bookings;
CREATE POLICY "Users can manage bookings in their org" ON public.bookings
    FOR ALL
    USING (
      public.is_super_admin() -- ✅ Super admin can manage any booking
      OR
      public.is_org_member(org_id)
    );

-- ============================================================================
-- 6. UPDATE RLS POLICIES - GUESTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view guests in their org" ON public.guests;
CREATE POLICY "Users can view guests in their org" ON public.guests
    FOR SELECT
    USING (
      public.is_super_admin()
      OR
      public.is_org_member(org_id)
    );

DROP POLICY IF EXISTS "Users can manage guests in their org" ON public.guests;
CREATE POLICY "Users can manage guests in their org" ON public.guests
    FOR ALL
    USING (
      public.is_super_admin()
      OR
      public.is_org_member(org_id)
    );

-- ============================================================================
-- 7. UPDATE RLS POLICIES - ROOMS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view rooms in their property" ON public.rooms;
CREATE POLICY "Users can view rooms in their property" ON public.rooms
    FOR SELECT
    USING (
      public.is_super_admin()
      OR
      EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = rooms.property_id
        AND public.is_org_member(p.org_id)
      )
    );

DROP POLICY IF EXISTS "Users can manage rooms in their property" ON public.rooms;
CREATE POLICY "Users can manage rooms in their property" ON public.rooms
    FOR ALL
    USING (
      public.is_super_admin()
      OR
      EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = rooms.property_id
        AND public.is_org_member(p.org_id)
      )
    );

-- ============================================================================
-- 8. UPDATE RLS POLICIES - PROPERTIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view properties in their org" ON public.properties;
CREATE POLICY "Users can view properties in their org" ON public.properties
    FOR SELECT
    USING (
      public.is_super_admin()
      OR
      public.is_org_member(org_id)
    );

DROP POLICY IF EXISTS "Users can manage properties in their org" ON public.properties;
CREATE POLICY "Users can manage properties in their org" ON public.properties
    FOR ALL
    USING (
      public.is_super_admin()
      OR
      public.is_org_member(org_id)
    );

-- ============================================================================
-- 9. UPDATE RLS POLICIES - FOLIO ITEMS (COMMENTED - Table does not exist yet)
-- ============================================================================
-- NOTE: Uncomment when folio_items table is created

-- DROP POLICY IF EXISTS "Users can view folio items in their org" ON public.folio_items;
-- CREATE POLICY "Users can view folio items in their org" ON public.folio_items
--     FOR SELECT
--     USING (
--       public.is_super_admin()
--       OR
--       EXISTS (
--         SELECT 1 FROM public.bookings b
--         WHERE b.id = folio_items.booking_id
--         AND public.is_org_member(b.org_id)
--       )
--     );

-- DROP POLICY IF EXISTS "Users can manage folio items in their org" ON public.folio_items;
-- CREATE POLICY "Users can manage folio items in their org" ON public.folio_items
--     FOR ALL
--     USING (
--       public.is_super_admin()
--       OR
--       EXISTS (
--         SELECT 1 FROM public.bookings b
--         WHERE b.id = folio_items.booking_id
--         AND public.is_org_member(b.org_id)
--       )
--     );

-- ============================================================================
-- 10. UPDATE RLS POLICIES - FOLIO PAYMENTS (COMMENTED - Table does not exist yet)
-- ============================================================================
-- NOTE: Uncomment when folio_payments table is created

-- DROP POLICY IF EXISTS "Users can view folio payments in their org" ON public.folio_payments;
-- CREATE POLICY "Users can view folio payments in their org" ON public.folio_payments
--     FOR SELECT
--     USING (
--       public.is_super_admin()
--       OR
--       EXISTS (
--         SELECT 1 FROM public.bookings b
--         WHERE b.id = folio_payments.booking_id
--         AND public.is_org_member(b.org_id)
--       )
--     );

-- DROP POLICY IF EXISTS "Users can manage folio payments in their org" ON public.folio_payments;
-- CREATE POLICY "Users can manage folio payments in their org" ON public.folio_payments
--     FOR ALL
--     USING (
--       public.is_super_admin()
--       OR
--       EXISTS (
--         SELECT 1 FROM public.bookings b
--         WHERE b.id = folio_payments.booking_id
--         AND public.is_org_member(b.org_id)
--       )
--     );

-- ============================================================================
-- 11. SECURITY: Prevent self-promotion to super admin
-- ============================================================================

-- Create trigger to prevent users from promoting themselves
CREATE OR REPLACE FUNCTION public.prevent_super_admin_self_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if current user is already a super admin
  -- This prevents regular users from promoting themselves
  IF NEW.is_super_admin = true AND OLD.is_super_admin = false THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Only super admins can promote users to super admin';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger
DROP TRIGGER IF EXISTS trigger_prevent_super_admin_self_promotion ON public.profiles;
CREATE TRIGGER trigger_prevent_super_admin_self_promotion
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin)
  EXECUTE FUNCTION public.prevent_super_admin_self_promotion();

-- ============================================================================
-- NOTES FOR ADMINS
-- ============================================================================

-- To create a super admin, run this SQL directly in Supabase SQL Editor:
-- 
-- UPDATE public.profiles 
-- SET is_super_admin = true 
-- WHERE email = 'suporte@cooperti.com.br';
--
-- To list all super admins:
--
-- SELECT id, email, full_name, is_super_admin 
-- FROM public.profiles 
-- WHERE is_super_admin = true;
