-- 002_restrict_profiles_select.sql
-- Safety pre-checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles'
  ) THEN
    RAISE EXCEPTION 'Missing table public.profiles';
  END IF;
END $$;

-- Restrict profile reads to self (plus super admin)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Anyone can read profiles'
  ) THEN
    ALTER POLICY "Anyone can read profiles"
      ON public.profiles
      USING ((auth.uid() = id) OR public.is_super_admin());
  ELSE
    CREATE POLICY "Anyone can read profiles"
      ON public.profiles
      FOR SELECT
      USING ((auth.uid() = id) OR public.is_super_admin());
  END IF;
END $$;

-- Rollback (minimal, safe)
-- ALTER POLICY "Anyone can read profiles"
--   ON public.profiles
--   USING (true);
