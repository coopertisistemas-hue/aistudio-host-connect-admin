-- ============================================================================
-- SECTION E: SMOKE TEST (2 ORGS) - CORRECTED
-- ============================================================================
DO $$
DECLARE 
  v_org_a UUID; 
  v_org_b UUID; 
  v_guest_a UUID; 
  v_guest_b UUID; 
  v_booking_a UUID; 
  v_token_a TEXT;
BEGIN
  -- 1) Setup Orgs (deterministic)
  INSERT INTO public.organizations (name)
  VALUES ('STAGING_TEST_ORG_A')
  RETURNING id INTO v_org_a;

  INSERT INTO public.organizations (name)
  VALUES ('STAGING_TEST_ORG_B')
  RETURNING id INTO v_org_b;

  -- 2) Setup Guests
  INSERT INTO public.guests (org_id, first_name, last_name, email)
  VALUES (v_org_a, 'Guest', 'A', 'staging_test_a@hostconnect.com')
  RETURNING id INTO v_guest_a;

  INSERT INTO public.guests (org_id, first_name, last_name, email)
  VALUES (v_org_b, 'Guest', 'B', 'staging_test_b@hostconnect.com')
  RETURNING id INTO v_guest_b;

  -- 3) Setup Consents
  INSERT INTO public.guest_consents (org_id, guest_id, type, granted, source)
  VALUES (v_org_a, v_guest_a, 'marketing', true, 'pre_checkin');

  INSERT INTO public.guest_consents (org_id, guest_id, type, granted, source)
  VALUES (v_org_b, v_guest_b, 'marketing', true, 'pre_checkin');

  -- 4) Setup Pre-Check-in Session
  v_token_a := encode(gen_random_bytes(32), 'hex');

  BEGIN
    SELECT id INTO v_booking_a
    FROM public.bookings
    WHERE org_id = v_org_a
    LIMIT 1;
  EXCEPTION WHEN undefined_column THEN
    SELECT id INTO v_booking_a
    FROM public.bookings
    LIMIT 1;
  END;

  IF v_booking_a IS NOT NULL THEN
    INSERT INTO public.pre_checkin_sessions (org_id, booking_id, token, expires_at, status)
    VALUES (v_org_a, v_booking_a, v_token_a, now() + interval '24 hours', 'pending');
  ELSE
    RAISE NOTICE 'No bookings found; pre_checkin_sessions insert skipped.';
  END IF;

  RAISE NOTICE 'Smoke test completed: org_a=% org_b=% guest_a=% guest_b=% booking_a=%',
    v_org_a, v_org_b, v_guest_a, v_guest_b, v_booking_a;
END $$;

-- ============================================================================
-- CLEANUP (Run after validation)
-- ============================================================================
DELETE FROM public.pre_checkin_sessions WHERE token LIKE '%' AND org_id IN (SELECT id FROM public.organizations WHERE name LIKE 'STAGING_TEST_ORG_%');
DELETE FROM public.guest_consents WHERE guest_id IN (SELECT id FROM public.guests WHERE email LIKE 'staging_test_%');
DELETE FROM public.guests WHERE email LIKE 'staging_test_%';
DELETE FROM public.organizations WHERE name LIKE 'STAGING_TEST_ORG_%';
