-- Fix check_accommodation_limit to respect TRIAL status
-- If the user is in a valid trial, they should get Premium/Founder limits (100) even if their base plan is 'free'.

CREATE OR REPLACE FUNCTION check_accommodation_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
  user_plan TEXT;
  user_plan_status TEXT;
  user_trial_expires_at TIMESTAMPTZ;
  is_trial_active BOOLEAN;
BEGIN
  -- Get the current number of properties for the user
  SELECT COUNT(*) INTO current_count
  FROM public.properties
  WHERE user_id = new.user_id; 

  -- Get the user's limit, plan, and trial info from profiles
  SELECT 
    accommodation_limit, 
    plan, 
    plan_status, 
    trial_expires_at 
  INTO 
    max_limit, 
    user_plan, 
    user_plan_status, 
    user_trial_expires_at
  FROM public.profiles
  WHERE id = new.user_id;

  -- Determine if trial is active
  IF user_plan_status = 'trial' AND user_trial_expires_at > NOW() THEN
    is_trial_active := TRUE;
  ELSE
    is_trial_active := FALSE;
  END IF;

  -- Default limit logic (Fallback + Trial Override)
  -- 1. If explicit limit is set, use it (unless we want Trial to override explicit low limits? Let's say explicit wins if present, but usually explicit is NULL or matched to plan).
  -- Actually, let's treat Trial as "Temporarily Premium".
  
  IF is_trial_active THEN
     -- If in trial, ensure at least 100 slots (Premium/Founder level)
     IF max_limit IS NULL OR max_limit < 100 THEN
        max_limit := 100;
        user_plan := 'trial (premium)'; -- Just for error message context
     END IF;
  ELSIF max_limit IS NULL THEN
    -- Fallback for non-trial users with NULL limits
    CASE user_plan
      WHEN 'founder' THEN max_limit := 100;
      WHEN 'premium' THEN max_limit := 100;
      WHEN 'pro' THEN max_limit := 10;
      WHEN 'basic' THEN max_limit := 2;
      ELSE max_limit := 1; -- Free or unknown
    END CASE;
  END IF;

  -- Check if adding 1 would exceed the limit
  IF (current_count + 1) > max_limit THEN
    RAISE EXCEPTION 'Limite de acomodações atingido para o plano %. Atual: %, Limite: %', user_plan, current_count, max_limit
      USING ERRCODE = 'P0001'; 
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
