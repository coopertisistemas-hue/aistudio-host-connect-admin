
-- Migration: Create Organizations and Members
-- Description: Implements multi-user structure (organizations) without breaking existing profile model.
-- Date: 2025-12-26

-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL -- Optional direct link to owner for easy access
);

-- 2. Create Organization Members Table
CREATE TABLE IF NOT EXISTS public.org_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(org_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- 4. Helper Functions (Security Definer)

-- 4.1 Check if user is member of specific org
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.org_members 
    WHERE org_id = p_org_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- 4.2 Check if user is admin/owner of specific org
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.org_members 
    WHERE org_id = p_org_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$;

-- 4.3 Get Current Org ID (Primary/First Found) for the user
-- Usage: useful for default scope when user logs in
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT org_id INTO v_org_id
    FROM public.org_members
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC -- Stable ordering (oldest membership)
    LIMIT 1;
    
    RETURN v_org_id;
END;
$$;

-- 5. RLS Policies

-- ORG_MEMBERS Policies
-- Members can view members of their own orgs
DROP POLICY IF EXISTS "Members can view their org members" ON public.org_members;
CREATE POLICY "Members can view their org members" ON public.org_members
    FOR SELECT
    USING (
      auth.uid() = user_id -- Can see self
      OR 
      EXISTS ( -- Can see others in same org
        SELECT 1 FROM public.org_members om 
        WHERE om.org_id = org_members.org_id 
        AND om.user_id = auth.uid()
      )
    );

-- Only Admins can insert/update/delete members
DROP POLICY IF EXISTS "Admins can manage org members" ON public.org_members;
CREATE POLICY "Admins can manage org members" ON public.org_members
    FOR ALL
    USING (
      public.is_org_admin(org_id)
    );

-- ORGANIZATIONS Policies
-- Members can view their organizations
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
CREATE POLICY "Members can view their organizations" ON public.organizations
    FOR SELECT
    USING (
      public.is_org_member(id)
    );

-- Only Admins (of that org) can update
DROP POLICY IF EXISTS "Admins can update organization" ON public.organizations;
CREATE POLICY "Admins can update organization" ON public.organizations
    FOR UPDATE
    USING (
      public.is_org_admin(id)
    );

-- Insert: usually done via RPC or global flow not restricted by row existing yet.
-- But allowing authenticated users to create a NEW organization is often desired.
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT
    WITH CHECK (true); 
    -- Note: After insert, they need to be added to org_members to see it/admin it.
    -- Usually handled by a "create_organization" RPC to do both transactionally.

-- 6. RPC to Create Organization (Transactional convenience)
CREATE OR REPLACE FUNCTION public.create_organization(org_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_org_id uuid;
    current_uid uuid;
BEGIN
    current_uid := auth.uid();
    
    -- Check Authentication
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated: You must be logged in to create an organization.';
    END IF;

    -- 1. Create Org
    INSERT INTO public.organizations (name, owner_id)
    VALUES (org_name, current_uid)
    RETURNING id INTO new_org_id;

    -- 2. Add Creator as Owner
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (new_org_id, current_uid, 'owner');

    RETURN json_build_object('id', new_org_id, 'name', org_name);
END;
$$;
