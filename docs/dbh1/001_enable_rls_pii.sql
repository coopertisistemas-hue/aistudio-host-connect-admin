-- 001_enable_rls_pii.sql
-- Safety pre-checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'guests'
  ) THEN
    RAISE EXCEPTION 'Missing table public.guests';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'guest_consents'
  ) THEN
    RAISE EXCEPTION 'Missing table public.guest_consents';
  END IF;
END $$;

-- Enable and enforce RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests FORCE ROW LEVEL SECURITY;

ALTER TABLE public.guest_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_consents FORCE ROW LEVEL SECURITY;

-- Guests policies (org-scoped)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guests'
      AND policyname = 'Users can manage guests in their org'
  ) THEN
    ALTER POLICY "Users can manage guests in their org"
      ON public.guests
      USING (public.is_super_admin() OR public.is_org_member(org_id))
      WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));
  ELSE
    CREATE POLICY "Users can manage guests in their org"
      ON public.guests
      FOR ALL
      USING (public.is_super_admin() OR public.is_org_member(org_id))
      WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guests'
      AND policyname = 'Users can view guests in their org'
  ) THEN
    CREATE POLICY "Users can view guests in their org"
      ON public.guests
      FOR SELECT
      USING (public.is_super_admin() OR public.is_org_member(org_id));
  END IF;
END $$;

-- Guest consents policies (org-scoped)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'guest_consents'
      AND policyname = 'Org members manage guest consents'
  ) THEN
    ALTER POLICY "Org members manage guest consents"
      ON public.guest_consents
      USING (public.is_super_admin() OR public.is_org_member(org_id))
      WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));
  ELSE
    CREATE POLICY "Org members manage guest consents"
      ON public.guest_consents
      FOR ALL
      USING (public.is_super_admin() OR public.is_org_member(org_id))
      WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));
  END IF;
END $$;

-- Rollback (minimal, safe)
-- ALTER TABLE public.guest_consents NO FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.guest_consents DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Org members manage guest consents" ON public.guest_consents;
--
-- ALTER TABLE public.guests NO FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.guests DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Users can view guests in their org" ON public.guests;
-- DROP POLICY IF EXISTS "Users can manage guests in their org" ON public.guests;
-- CREATE POLICY "Users can manage guests in their org"
--   ON public.guests
--   USING (public.is_super_admin() OR public.is_org_member(org_id));
