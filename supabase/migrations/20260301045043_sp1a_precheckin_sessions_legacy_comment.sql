-- SP1-A hardening: annotate legacy precheckin_sessions table
-- Purpose: make legacy-only usage explicit in schema metadata.
-- Safety: forward-only, idempotent, no DML.

DO $$
BEGIN
  IF to_regclass('public.precheckin_sessions') IS NOT NULL THEN
    COMMENT ON TABLE public.precheckin_sessions IS
      'LEGACY ONLY: do not use for new features. Canonical tables are public.pre_checkin_sessions and public.pre_checkin_submissions.';

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'precheckin_sessions'
        AND column_name = 'org_id'
    ) THEN
      COMMENT ON COLUMN public.precheckin_sessions.org_id IS
        'Tenant scope (legacy table). Use org_id isolation for read/write access.';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'precheckin_sessions'
        AND column_name = 'booking_id'
    ) THEN
      COMMENT ON COLUMN public.precheckin_sessions.booking_id IS
        'Related booking id (legacy table). New pre-checkin flows must use canonical pre_checkin_* tables.';
    END IF;
  END IF;
END $$;

