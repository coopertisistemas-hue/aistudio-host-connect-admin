-- SP0-A residual remediation: precheckin_sessions (legacy no-underscore table)
-- Goal: eliminate RLS enabled + zero policies blocker with explicit tenant-scoped CRUD policies.
-- Safety: forward-only, idempotent, no destructive DML.

ALTER TABLE IF EXISTS public.precheckin_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'precheckin_sessions'
      AND policyname = 'precheckin_sessions_select'
  ) THEN
    EXECUTE $p$
      CREATE POLICY precheckin_sessions_select
      ON public.precheckin_sessions
      FOR SELECT
      USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());
    $p$;
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'precheckin_sessions'
      AND policyname = 'precheckin_sessions_insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY precheckin_sessions_insert
      ON public.precheckin_sessions
      FOR INSERT
      WITH CHECK (public.is_org_member(org_id) OR public.is_hostconnect_staff());
    $p$;
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'precheckin_sessions'
      AND policyname = 'precheckin_sessions_update'
  ) THEN
    EXECUTE $p$
      CREATE POLICY precheckin_sessions_update
      ON public.precheckin_sessions
      FOR UPDATE
      USING (public.is_org_member(org_id) OR public.is_hostconnect_staff())
      WITH CHECK (public.is_org_member(org_id) OR public.is_hostconnect_staff());
    $p$;
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'precheckin_sessions'
      AND policyname = 'precheckin_sessions_delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY precheckin_sessions_delete
      ON public.precheckin_sessions
      FOR DELETE
      USING (public.is_org_admin(org_id) OR public.is_hostconnect_staff());
    $p$;
  END IF;
END $$;

