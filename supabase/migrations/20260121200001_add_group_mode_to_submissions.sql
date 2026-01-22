-- Sprint 5.2: Extend pre_checkin_submissions for group mode
-- Purpose: Add "mode" column to differentiate individual vs group submissions
-- Additive only, pilot-safe

-- Add mode column (default 'individual' for backward compatibility)
ALTER TABLE pre_checkin_submissions 
ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'individual' 
CHECK (mode IN ('individual', 'group'));

-- Update payload comment to document group mode structure
COMMENT ON COLUMN pre_checkin_submissions.payload IS 'JSONB containing participant data. Individual mode: {full_name, document?, email?, phone?, birthdate?}. Group mode: {participants: [{full_name, document?, email?, phone?}, ...]}';

-- Update table comment to reflect group mode support
COMMENT ON TABLE pre_checkin_submissions IS 'Stores guest-submitted pre-check-in data pending admin review and application to bookings. Supports individual and group (batch) submissions. Scoped by org_id for multi-tenant isolation.';
