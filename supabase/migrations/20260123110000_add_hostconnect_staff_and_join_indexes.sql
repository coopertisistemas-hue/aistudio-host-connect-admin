-- Migration: Add Missing is_hostconnect_staff Function and Join Table Indexes
-- Description: Creates missing function used in RLS policies and optimizes join tables
-- Date: 2026-01-23

-- ============================================================================
-- 1. CREATE MISSING FUNCTION: is_hostconnect_staff
-- ============================================================================

-- This function is referenced in multiple RLS policies but was never created
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
-- 2. ADD INDEXES FOR JOIN TABLES (Performance Optimization)
-- ============================================================================

-- BOOKING_ROOMS: Critical for folio queries
CREATE INDEX IF NOT EXISTS idx_booking_rooms_booking_id 
ON public.booking_rooms(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_rooms_room_id 
ON public.booking_rooms(room_id);

CREATE INDEX IF NOT EXISTS idx_booking_rooms_property_id 
ON public.booking_rooms(property_id);

COMMENT ON INDEX idx_booking_rooms_booking_id IS 
'Performance: Folio page joins bookings with rooms';

-- BOOKING_GUESTS: Used in check-in and participant lists
CREATE INDEX IF NOT EXISTS idx_booking_guests_booking_id 
ON public.booking_guests(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_guests_guest_id 
ON public.booking_guests(guest_id);

COMMENT ON INDEX idx_booking_guests_booking_id IS 
'Performance: Check-in and participant queries';

-- PRE_CHECKIN_SESSIONS: Online check-in lookups
CREATE INDEX IF NOT EXISTS idx_precheckin_sessions_booking_id 
ON public.pre_checkin_sessions(booking_id);

CREATE INDEX IF NOT EXISTS idx_precheckin_sessions_token 
ON public.pre_checkin_sessions(token);

COMMENT ON INDEX idx_precheckin_sessions_token IS 
'Performance: Guest lookup by pre-check-in link token';

-- PRE_CHECKIN_SUBMISSIONS: Document submissions
CREATE INDEX IF NOT EXISTS idx_precheckin_submissions_session_id 
ON public.pre_checkin_submissions(session_id);

CREATE INDEX IF NOT EXISTS idx_precheckin_submissions_booking_id 
ON public.pre_checkin_submissions(booking_id);

-- BOOKING_CHARGES: Extra charges on folio
CREATE INDEX IF NOT EXISTS idx_booking_charges_booking_id 
ON public.booking_charges(booking_id);

COMMENT ON INDEX idx_booking_charges_booking_id IS 
'Performance: Folio items query';

-- BOOKING_GROUPS: Group/event bookings
CREATE INDEX IF NOT EXISTS idx_booking_groups_booking_id 
ON public.booking_groups(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_groups_property_id 
ON public.booking_groups(property_id);

-- GUEST_CONSENTS: LGPD compliance tracking
CREATE INDEX IF NOT EXISTS idx_guest_consents_guest_id 
ON public.guest_consents(guest_id);

-- AUDIT_LOG: System audit trail (optional but helpful)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
ON public.audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_id 
ON public.audit_log(org_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
ON public.audit_log(created_at DESC);

COMMENT ON INDEX idx_audit_log_created_at IS 
'Performance: Audit log typically queried by recent date';

-- ============================================================================
-- 3. UPDATE STATISTICS
-- ============================================================================

ANALYZE public.booking_rooms;
ANALYZE public.booking_guests;
ANALYZE public.pre_checkin_sessions;
ANALYZE public.pre_checkin_submissions;
ANALYZE public.booking_charges;
ANALYZE public.booking_groups;
ANALYZE public.guest_consents;
ANALYZE public.audit_log;

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================

-- SUMMARY:
-- - Created is_hostconnect_staff() function (fixes broken RLS policies)
-- - Added 16 indexes on join tables
-- - Total indexes in this migration: 16
-- - Expected execution time: 1-3 minutes
--
-- VERIFICATION:
-- SELECT * FROM pg_proc WHERE proname = 'is_hostconnect_staff';
-- Should return 1 row
--
-- SELECT COUNT(*) FROM pg_indexes 
-- WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
-- Should show increased count
