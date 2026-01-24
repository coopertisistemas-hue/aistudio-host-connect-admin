-- Hotfix: Fix org_members RLS recursion (avoid org_members subqueries in policy)
-- Date: 2026-01-24

BEGIN;

-- Remove ALL existing policies to avoid recursion regressions
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT polname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'org_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.org_members', policy_record.polname);
  END LOOP;
END;
$$;

-- Helper to check admin role without RLS recursion
CREATE OR REPLACE FUNCTION public.is_org_admin_no_rls(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_org_admin_no_rls(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_org_admin_no_rls(uuid, uuid) TO authenticated;

-- Replace recursive policies
CREATE POLICY "Members can view their org members" ON public.org_members
  FOR SELECT
  USING (
    public.is_super_admin()
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = org_members.org_id
        AND o.owner_id = auth.uid()
    )
    OR public.is_org_admin_no_rls(org_members.org_id, auth.uid())
  );

CREATE POLICY "Admins can manage org members" ON public.org_members
  FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = org_members.org_id
        AND o.owner_id = auth.uid()
    )
    OR public.is_org_admin_no_rls(org_members.org_id, auth.uid())
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = org_members.org_id
        AND o.owner_id = auth.uid()
    )
    OR public.is_org_admin_no_rls(org_members.org_id, auth.uid())
  );

-- Manual verification snippet (run as SQL Editor):
-- 1) SELECT * FROM public.org_members WHERE user_id = auth.uid();
-- 2) SELECT * FROM public.org_members WHERE org_id != (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() LIMIT 1);
-- 3) As org owner: SELECT * FROM public.org_members WHERE org_id = '<ORG_ID>'; 

COMMIT;
