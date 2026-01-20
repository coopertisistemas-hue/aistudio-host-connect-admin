/* 
   SPRINT 2 MIGRATION VALIDATION SCRIPT
   Target: Staging Environment
   Purpose: Validate Guests Domain Model (Sprint 2)
*/

BEGIN;

-- ============================================================================
-- SECTION A: TABLES & COLUMNS EXISTENCE
-- ============================================================================
DO $$ 
BEGIN
    -- Check Tables
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guests') THEN RAISE EXCEPTION 'Table guests missing'; END IF;
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guest_consents') THEN RAISE EXCEPTION 'Table guest_consents missing'; END IF;
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'booking_guests') THEN RAISE EXCEPTION 'Table booking_guests missing'; END IF;
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pre_checkin_sessions') THEN RAISE EXCEPTION 'Table pre_checkin_sessions missing'; END IF;

    -- Check org_id NOT NULL and references
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'guests' AND column_name = 'org_id' AND is_nullable = 'YES') THEN RAISE EXCEPTION 'guests.org_id should be NOT NULL'; END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'guest_consents' AND column_name = 'org_id' AND is_nullable = 'YES') THEN RAISE EXCEPTION 'guest_consents.org_id should be NOT NULL'; END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'booking_guests' AND column_name = 'org_id' AND is_nullable = 'YES') THEN RAISE EXCEPTION 'booking_guests.org_id should be NOT NULL'; END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pre_checkin_sessions' AND column_name = 'org_id' AND is_nullable = 'YES') THEN RAISE EXCEPTION 'pre_checkin_sessions.org_id should be NOT NULL'; END IF;

    RAISE NOTICE 'SECTION A: Schema existence validated.';
END $$;


-- ============================================================================
-- SECTION B: FOREIGN KEYS & UNIQUE CONSTRAINTS
-- ============================================================================
DO $$
BEGIN
    -- unique constraint on pre_check_in token
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pre_checkin_sessions_token_key' OR (conname LIKE '%token%' AND contype = 'u' AND conrelid = 'public.pre_checkin_sessions'::regclass)
    ) THEN RAISE EXCEPTION 'Unique constraint on pre_checkin_sessions.token missing'; END IF;

    RAISE NOTICE 'SECTION B: Constraints validated.';
END $$;


-- ============================================================================
-- SECTION C: INDEXES AUDIT
-- ============================================================================
-- Note: This section lists indexes to verify they were created.
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('guests', 'guest_consents', 'booking_guests', 'pre_checkin_sessions')
ORDER BY tablename;


-- ============================================================================
-- SECTION D: UPDATED_AT TRIGGER TEST
-- ============================================================================
DO $$
DECLARE
    v_guest_id UUID;
    v_org_id UUID;
    v_t1 TIMESTAMPTZ;
    v_t2 TIMESTAMPTZ;
BEGIN
    -- Get a valid Org
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    IF v_org_id IS NULL THEN
        RAISE NOTICE 'Skipping Trigger Test: No organization found to link.';
    ELSE
        INSERT INTO public.guests (org_id, first_name, last_name, email)
        VALUES (v_org_id, 'Trigger', 'Test', 'trigger@test.com')
        RETURNING id, updated_at INTO v_guest_id, v_t1;

        PERFORM pg_sleep(0.1); -- Minimal delay to ensure timestamp difference

        UPDATE public.guests SET first_name = 'Trigger-Updated' WHERE id = v_guest_id;
        
        SELECT updated_at INTO v_t2 FROM public.guests WHERE id = v_guest_id;

        IF v_t1 = v_t2 THEN
            RAISE EXCEPTION 'Trigger failed: updated_at was not changed.';
        END IF;

        -- Cleanup
        DELETE FROM public.guests WHERE id = v_guest_id;
        RAISE NOTICE 'SECTION D: Trigger test PASSED.';
    END IF;
END $$;


-- ============================================================================
-- SECTION E: 2-ORG SMOKE DATA (MANUAL EXECUTION RECOMMENDED)
-- ============================================================================
/*
   INSTRUCTIONS for Section E:
   Run these queries to verify isolation. 
   Cleanup is provides in SECTION F.
*/

-- 1. Create 2 Test Orgs
INSERT INTO public.organizations (name) VALUES ('VALIDATION_ORG_A'), ('VALIDATION_ORG_B');

-- 2. Create Guests for each Org
INSERT INTO public.guests (org_id, first_name, last_name, email)
SELECT id, 'Guest', 'Org A', 'guest_a@validation.com' FROM public.organizations WHERE name = 'VALIDATION_ORG_A';

INSERT INTO public.guests (org_id, first_name, last_name, email)
SELECT id, 'Guest', 'Org B', 'guest_b@validation.com' FROM public.organizations WHERE name = 'VALIDATION_ORG_B';

-- 3. Create Consents
INSERT INTO public.guest_consents (org_id, guest_id, type, granted, source)
SELECT g.org_id, g.id, 'data_processing', true, 'system'
FROM public.guests g WHERE g.email = 'guest_a@validation.com';

INSERT INTO public.guest_consents (org_id, guest_id, type, granted, source)
SELECT g.org_id, g.id, 'data_processing', true, 'system'
FROM public.guests g WHERE g.email = 'guest_b@validation.com';

-- 4. Create Pre-Check-in Sessions
INSERT INTO public.pre_checkin_sessions (org_id, booking_id, token, expires_at, status)
SELECT g.org_id, b.id, 'TOKEN_A_SECURE_HASH', now() + interval '7 days', 'pending'
FROM public.guests g 
CROSS JOIN (SELECT id FROM public.bookings LIMIT 1) b
WHERE g.email = 'guest_a@validation.com';

-- Note: booking_guests is skipped in automated smoke test if no bookings exist.

-- 5. Verification Queries (Should return 1 row each if correctly scoped)
-- SELECT count(*) FROM public.guests WHERE org_id = (SELECT id FROM public.organizations WHERE name = 'VALIDATION_ORG_A');
-- SELECT count(*) FROM public.guests WHERE org_id = (SELECT id FROM public.organizations WHERE name = 'VALIDATION_ORG_B');


-- ============================================================================
-- SECTION F: CLEANUP
-- ============================================================================
/* 
   Run these explicitly after verification.
*/
DELETE FROM public.pre_checkin_sessions WHERE token LIKE 'TOKEN_%';
DELETE FROM public.guest_consents WHERE guest_id IN (SELECT id FROM public.guests WHERE email LIKE '%@validation.com');
DELETE FROM public.guests WHERE email LIKE '%@validation.com' OR email = 'trigger@test.com';
DELETE FROM public.organizations WHERE name LIKE 'VALIDATION_ORG_%';

COMMIT;
