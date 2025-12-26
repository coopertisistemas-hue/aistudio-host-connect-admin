
-- Migration: Implement Backend Trial Logic
-- Description: Adds trial columns to public.profiles and logic for initialization and extension.
-- Date: 2025-12-26

-- 1. Add Trial Columns to Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS trial_extended_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS trial_extension_days int NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_extension_reason text NULL,
ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'active'; -- 'trial' | 'active' | 'expired'

-- 2. Trigger Function: Initialize Trial
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS TRIGGER AS $$
BEGIN
    -- Only initialize trial if plan is empty or free (default assumption for new signups)
    IF (NEW.plan IS NULL OR NEW.plan = 'free' OR NEW.plan = '') THEN
        NEW.plan_status := 'trial';
        NEW.trial_started_at := now();
        NEW.trial_expires_at := now() + interval '15 days';
        -- Optional: Set plan to 'premium' or similar if trial gives access to everything?
        -- User requirements didn't specify changing the 'plan' column itself, only setting 'plan_status'='trial'.
        -- We will assume Entitlements Logic will handle (plan='free' AND plan_status='trial') -> Give Premium Access.
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
-- Check if trigger exists first to avoid errors on repeat runs (drop if exists)
DROP TRIGGER IF EXISTS tr_initialize_trial ON public.profiles;

CREATE TRIGGER tr_initialize_trial
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_trial();


-- 4. Function: Extend Trial (RPC)
-- Only staff (support/admin) can execute this.
CREATE OR REPLACE FUNCTION public.extend_trial(
    target_user_id uuid, 
    reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_profile record;
BEGIN
    -- 4.1 Check Permissions: Caller must be HostConnect Staff
    IF NOT public.is_hostconnect_staff() THEN
        RAISE EXCEPTION 'Access Denied: Only staff can extend trials.';
    END IF;

    -- 4.2 Fetch Target Profile
    SELECT * INTO target_profile FROM public.profiles WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found.';
    END IF;

    -- 4.3 Validate Extension Rules
    -- Rule: Must be in 'trial' status (or expired trial that we want to reactivate?)
    -- Adding check: plan_status must be 'trial' OR (plan_status='expired' AND trial_started_at IS NOT NULL)
    -- Actually user req: "só pode estender se plan_status='trial' e trial_extension_days=0"
    
    IF target_profile.plan_status != 'trial' THEN
        RAISE EXCEPTION 'Cannot extend trial: User is not currently in active trial (Status: %)', target_profile.plan_status;
    END IF;

    IF target_profile.trial_extension_days > 0 THEN
        RAISE EXCEPTION 'Cannot extend trial: Trial has already been extended once.';
    END IF;

    -- 4.4 Apply Extension
    UPDATE public.profiles
    SET 
        trial_extended_at = now(),
        trial_extension_days = 15,
        trial_extension_reason = reason,
        trial_expires_at = trial_expires_at + interval '15 days'
    WHERE id = target_user_id;

    RETURN json_build_object(
        'success', true, 
        'message', 'Trial extended by 15 days.',
        'new_expires_at', (target_profile.trial_expires_at + interval '15 days')
    );
END;
$$;
