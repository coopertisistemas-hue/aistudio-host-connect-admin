-- Fix Infinite Recursion in org_members RLS
-- The previous policy used a direct subquery to check membership, which triggered RLS recursively.
-- We must use the SECURITY DEFINER function is_org_member() to bypass RLS for this check.

DROP POLICY IF EXISTS "Members can view their org members" ON public.org_members;

CREATE POLICY "Members can view their org members" ON public.org_members
    FOR SELECT
    USING (
      auth.uid() = user_id -- Can see self
      OR 
      public.is_org_member(org_id) -- Use Security Definer function to check if I am in the same org
    );
