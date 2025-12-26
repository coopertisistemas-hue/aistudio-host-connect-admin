
-- Migration: Create Audit Log and Triggers
-- Description: Tracks sensitive changes to profiles (plan, status, trial) and logs trial extensions.
-- Date: 2025-12-26

-- 1. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Who performed the action
    target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Who was affected
    action text NOT NULL, -- e.g., 'PROFILE_UPDATE', 'TRIAL_EXTENSION'
    old_data jsonb NULL, -- Snapshot before change
    new_data jsonb NULL  -- Snapshot after change
);

-- 2. RLS Policies
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Staff can view all logs
CREATE POLICY "Staff views audit logs" ON public.audit_log
    FOR SELECT
    USING (public.is_hostconnect_staff());

-- No one typically inserts directly via API, only via Server Functions/Triggers.
-- But if we want to allow insert from authenticated staff via API? 
-- Better to keep it closed and rely on SECURITY DEFINER functions/triggers.

-- 3. Trigger Function for Profile Changes
CREATE OR REPLACE FUNCTION public.log_profile_sensitive_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_actor uuid;
    changes_detected boolean := false;
    old_snapshot jsonb;
    new_snapshot jsonb;
BEGIN
    -- Attempt to get actor from auth.uid()
    current_actor := auth.uid();

    -- Check for sensitive columns changes
    IF (OLD.plan IS DISTINCT FROM NEW.plan) OR 
       (OLD.plan_status IS DISTINCT FROM NEW.plan_status) OR
       (OLD.trial_expires_at IS DISTINCT FROM NEW.trial_expires_at) OR 
       (OLD.trial_extension_days IS DISTINCT FROM NEW.trial_extension_days) THEN
       
       changes_detected := true;
    END IF;

    IF changes_detected THEN
        -- Construct snapshots of relevant fields only
        old_snapshot := jsonb_build_object(
            'plan', OLD.plan,
            'plan_status', OLD.plan_status,
            'trial_expires_at', OLD.trial_expires_at,
            'trial_extension_days', OLD.trial_extension_days
        );
        new_snapshot := jsonb_build_object(
            'plan', NEW.plan,
            'plan_status', NEW.plan_status,
            'trial_expires_at', NEW.trial_expires_at,
            'trial_extension_days', NEW.trial_extension_days
        );

        INSERT INTO public.audit_log (
            actor_user_id,
            target_user_id,
            action,
            old_data,
            new_data
        ) VALUES (
            current_actor,
            NEW.id,
            'PROFILE_SENSITIVE_UPDATE',
            old_snapshot,
            new_snapshot
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Apply Trigger to Profiles
DROP TRIGGER IF EXISTS tr_audit_profile_changes ON public.profiles;
CREATE TRIGGER tr_audit_profile_changes
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profile_sensitive_changes();

-- 5. Update extend_trial Function to force an explicit log entry
-- (The trigger will also fire, but this gives us the 'reason' in a separate clearer log if desired, 
-- or we can rely on the trigger. The user requested "validar" execution.
-- Let's update it to insert a custom log with the REASON which the trigger doesn't see easily).

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
    old_expiration timestamptz;
BEGIN
    -- Check Permissions
    IF NOT public.is_hostconnect_staff() THEN
        RAISE EXCEPTION 'Access Denied: Only staff can extend trials.';
    END IF;

    SELECT * INTO target_profile FROM public.profiles WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found.';
    END IF;

    -- Validate
    IF target_profile.plan_status != 'trial' THEN
         RAISE EXCEPTION 'Cannot extend trial: User is not currently in active trial (Status: %)', target_profile.plan_status;
    END IF;

    IF target_profile.trial_extension_days > 0 THEN
        RAISE EXCEPTION 'Cannot extend trial: Trial has already been extended once.';
    END IF;
    
    old_expiration := target_profile.trial_expires_at;

    -- Update
    UPDATE public.profiles
    SET 
        trial_extended_at = now(),
        trial_extension_days = 15,
        trial_extension_reason = reason,
        trial_expires_at = trial_expires_at + interval '15 days'
    WHERE id = target_user_id;

    -- Explicit Audit Log for Action Context (The trigger will also catch the data change)
    INSERT INTO public.audit_log (
        actor_user_id,
        target_user_id,
        action,
        old_data,
        new_data
    ) VALUES (
        auth.uid(),
        target_user_id,
        'TRIAL_EXTENSION_RPC',
        jsonb_build_object('reason', reason, 'old_expires_at', old_expiration),
        jsonb_build_object('extension_days', 15, 'new_expires_at', old_expiration + interval '15 days')
    );

    RETURN json_build_object(
        'success', true, 
        'message', 'Trial extended by 15 days.',
        'new_expires_at', (target_profile.trial_expires_at + interval '15 days')
    );
END;
$$;
