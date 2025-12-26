
-- Migration: Bootstrap Personal Organization for Users
-- Description: Ensures every user has at least one organization (Personal Org).
-- Date: 2025-12-26

-- 1. Helper Function: Create Personal Org
CREATE OR REPLACE FUNCTION public.create_personal_org_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id uuid;
    v_user_name text;
BEGIN
    -- Idempotency Check: If user is already a member of ANY organization, skip.
    -- (We assume if they are a member, they are 'set up'. If we wanted to force a PERSONAL org specifically, logic would differ).
    IF EXISTS (SELECT 1 FROM public.org_members WHERE user_id = p_user_id) THEN
        RETURN;
    END IF;

    -- Get user name for better org name (optional, fallback to generic)
    SELECT full_name INTO v_user_name FROM public.profiles WHERE id = p_user_id;
    IF v_user_name IS NULL OR v_user_name = '' THEN
        v_user_name := 'Minha Hospedagem';
    ELSE
        v_user_name := v_user_name || ' - Hospedagem';
    END IF;

    -- Create Org
    INSERT INTO public.organizations (name, owner_id)
    VALUES (v_user_name, p_user_id)
    RETURNING id INTO v_org_id;

    -- Add User as Owner
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (v_org_id, p_user_id, 'owner');
    
EXCEPTION WHEN OTHERS THEN
    -- Log error or ignore to prevent blocking user creation
    RAISE WARNING 'Failed to create personal org for user %: %', p_user_id, SQLERRM;
END;
$$;

-- 2. Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user_org()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.create_personal_org_for_user(NEW.id);
    RETURN NEW;
END;
$$;

-- 3. Trigger Definition
DROP TRIGGER IF EXISTS tr_ensure_personal_org ON public.profiles;
CREATE TRIGGER tr_ensure_personal_org
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_org();

-- 4. Backfill: Run for existing users who might have been missed or pre-date this migration
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT id FROM public.profiles LOOP
        PERFORM public.create_personal_org_for_user(r.id);
    END LOOP;
END;
$$;
