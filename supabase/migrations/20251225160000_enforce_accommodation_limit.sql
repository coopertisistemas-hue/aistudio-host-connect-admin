-- Create a function to check accommodation limits before insertion
CREATE OR REPLACE FUNCTION check_accommodation_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
  user_plan TEXT;
BEGIN
  -- Get the current number of properties for the user (owner)
  -- Changed from created_by to user_id to match codebase usage in useProperties.tsx
  SELECT COUNT(*) INTO current_count
  FROM public.properties
  WHERE user_id = new.user_id; 

  -- Get the user's limit and plan from profiles
  SELECT accommodation_limit, plan INTO max_limit, user_plan
  FROM public.profiles
  WHERE id = new.user_id;

  -- Default limit to 0 if not found (security fallback)
  IF max_limit IS NULL THEN
    max_limit := 0;
  END IF;

  -- Check if adding 1 would exceed the limit
  -- Note: existing count + 1 (the one being inserted) > limit
  IF (current_count + 1) > max_limit THEN
    -- Raise a custom error that can be caught by the frontend
    RAISE EXCEPTION 'Limite de acomodações atingido para o plano %. Atual: %, Limite: %', user_plan, current_count, max_limit
      USING ERRCODE = 'P0001'; 
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the properties table
DROP TRIGGER IF EXISTS enforce_accommodation_limit ON public.properties;

CREATE TRIGGER enforce_accommodation_limit
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION check_accommodation_limit();
