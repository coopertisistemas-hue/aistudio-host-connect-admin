-- Sprint 2.2: Pre-Check-in Submissions Table
-- Purpose: Store guest-submitted pre-check-in data for admin review and application
-- Security: org_id scoping, foreign key to pre_checkin_sessions
-- Additive only, no breaking changes

-- Create pre_checkin_submissions table
CREATE TABLE IF NOT EXISTS pre_checkin_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    session_id uuid NOT NULL REFERENCES pre_checkin_sessions(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'applied', 'rejected')),
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance and scoping
CREATE INDEX IF NOT EXISTS idx_pre_checkin_submissions_org_id 
    ON pre_checkin_submissions(org_id);

CREATE INDEX IF NOT EXISTS idx_pre_checkin_submissions_org_session 
    ON pre_checkin_submissions(org_id, session_id);

CREATE INDEX IF NOT EXISTS idx_pre_checkin_submissions_org_status 
    ON pre_checkin_submissions(org_id, status);

CREATE INDEX IF NOT EXISTS idx_pre_checkin_submissions_org_session_created 
    ON pre_checkin_submissions(org_id, session_id, created_at DESC);

-- Add updated_at trigger (reuses existing project-standard function)
CREATE TRIGGER set_pre_checkin_submissions_updated_at
    BEFORE UPDATE ON pre_checkin_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE pre_checkin_submissions IS 'Stores guest-submitted pre-check-in data pending admin review and application to bookings. Scoped by org_id for multi-tenant isolation.';
COMMENT ON COLUMN pre_checkin_submissions.payload IS 'JSONB containing participant data: {full_name, document?, email?, phone?, birthdate?}';
COMMENT ON COLUMN pre_checkin_submissions.status IS 'Workflow status: submitted (pending review), applied (added to booking), rejected (declined by admin)';
