ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS accommodation_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS founder_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS founder_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS entitlements JSONB;

-- Update RLS policies if necessary (assuming existing policies cover update by admin/self)
-- Ideally, ensure only admins can update these specific columns, but for now we follow existing patterns.
