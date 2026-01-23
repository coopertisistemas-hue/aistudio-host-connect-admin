-- Migration: Add Performance Indexes for Join Tables
-- Description: Creates indexes on confirmed tables and columns only
-- Date: 2026-01-23
-- NOTE: Based on actual schema verification

-- ============================================================================
-- INDEXES FOR JOIN TABLES (VERIFIED COLUMNS ONLY)
-- ============================================================================

-- BOOKING_ROOMS: Critical for folio and room assignment queries
CREATE INDEX IF NOT EXISTS idx_booking_rooms_booking_id 
ON public.booking_rooms(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_rooms_room_id 
ON public.booking_rooms(room_id);

CREATE INDEX IF NOT EXISTS idx_booking_rooms_property_id 
ON public.booking_rooms(property_id);

CREATE INDEX IF NOT EXISTS idx_booking_rooms_org_id 
ON public.booking_rooms(org_id);

COMMENT ON INDEX idx_booking_rooms_booking_id IS 
'Performance: Folio page joins bookings with rooms';

-- BOOKING_GUESTS: Used in check-in and participant lists
CREATE INDEX IF NOT EXISTS idx_booking_guests_booking_id 
ON public.booking_guests(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_guests_guest_id 
ON public.booking_guests(guest_id);

CREATE INDEX IF NOT EXISTS idx_booking_guests_org_id 
ON public.booking_guests(org_id);

COMMENT ON INDEX idx_booking_guests_booking_id IS 
'Performance: Check-in and participant queries';

-- BOOKING_CHARGES: Extra charges on folio
CREATE INDEX IF NOT EXISTS idx_booking_charges_booking_id 
ON public.booking_charges(booking_id);

COMMENT ON INDEX idx_booking_charges_booking_id IS 
'Performance: Folio items query';

-- AUDIT_LOG: System audit trail (uses actor_user_id, not user_id!)
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id 
ON public.audit_log(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_target_user_id 
ON public.audit_log(target_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
ON public.audit_log(created_at DESC);

COMMENT ON INDEX idx_audit_log_created_at IS 
'Performance: Audit log typically queried by recent date';

-- ============================================================================
-- UPDATE STATISTICS
-- ============================================================================

ANALYZE public.booking_rooms;
ANALYZE public.booking_guests;
ANALYZE public.booking_charges;
ANALYZE public.audit_log;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INDEXES CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ booking_rooms: 4 indexes';
  RAISE NOTICE '✅ booking_guests: 3 indexes';
  RAISE NOTICE '✅ booking_charges: 1 index';
  RAISE NOTICE '✅ audit_log: 3 indexes';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TOTAL: 11 indexes created';
  RAISE NOTICE '========================================';
END $$;
