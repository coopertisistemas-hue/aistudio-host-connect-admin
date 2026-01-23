-- Migration: Add Missing is_hostconnect_staff Function (CRITICAL FIX ONLY)
-- Description: Creates missing function used in RLS policies
-- Date: 2026-01-23
-- NOTE: Minimal version - only creates critical function, no indexes

-- ============================================================================
-- CREATE MISSING FUNCTION: is_hostconnect_staff (CRITICAL)
-- ============================================================================

-- This function is referenced in multiple RLS policies but was never created
-- Without this function, RLS policies will fail and users may be blocked
-- HostConnect staff = Super Admins (same permissions)

CREATE OR REPLACE FUNCTION public.is_hostconnect_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE  -- Cache result during query execution
SET search_path = public
AS $$
BEGIN
  -- HostConnect staff members are super admins
  -- This is an alias for consistency with existing policies
  RETURN public.is_super_admin();
END;
$$;

COMMENT ON FUNCTION public.is_hostconnect_staff() IS 
'Returns true if current user is a HostConnect staff member (super admin). 
Used in RLS policies for cross-organizational support access.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify function was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_hostconnect_staff'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: is_hostconnect_staff() function created';
  ELSE
    RAISE EXCEPTION '❌ FAILED: is_hostconnect_staff() function not found';
  END IF;
END $$;
