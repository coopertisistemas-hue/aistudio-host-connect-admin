-- SPRINT 2: GUEST DOMAIN MODEL MIGRATION (ULTRA-RESILIENT)
-- Ensures schema alignment even if tables were partially created previously.

-- 0. UTILITY: Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. TABLE: guests
CREATE TABLE IF NOT EXISTS public.guests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    first_name text NOT NULL DEFAULT 'Unknown',
    last_name text NOT NULL DEFAULT 'Unknown',
    full_name text, -- Make it nullable here to avoid conflicts on new tables
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure ALL specified columns exist (remaining ones not in CREATE TABLE)
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS document text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS birthdate date;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS notes text;

-- REINFORCE/FIX: If guests existed and full_name is NOT NULL, drop it.
DO $$
BEGIN
    -- Ensure columns exist
    ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS first_name text;
    ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS last_name text;
    ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS full_name text;

    -- Drop NOT NULL from full_name if it's currently enforced
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'guests' 
        AND column_name = 'full_name' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.guests ALTER COLUMN full_name DROP NOT NULL;
    END IF;

    -- Ensure first_name and last_name are NOT NULL
    UPDATE public.guests SET first_name = 'Unknown' WHERE first_name IS NULL;
    UPDATE public.guests SET last_name = 'Unknown' WHERE last_name IS NULL;
    ALTER TABLE public.guests ALTER COLUMN first_name SET NOT NULL;
    ALTER TABLE public.guests ALTER COLUMN last_name SET NOT NULL;
END $$;


CREATE INDEX IF NOT EXISTS idx_guests_org_id ON public.guests(org_id);
CREATE INDEX IF NOT EXISTS idx_guests_org_document ON public.guests(org_id, document);
CREATE INDEX IF NOT EXISTS idx_guests_org_email ON public.guests(org_id, email);

DROP TRIGGER IF EXISTS update_guests_updated_at ON public.guests;
CREATE TRIGGER update_guests_updated_at
    BEFORE UPDATE ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLE: guest_consents
CREATE TABLE IF NOT EXISTS public.guest_consents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- REINFORCE/FIX: Handle potential name/constraint conflicts
DO $$
BEGIN
    ALTER TABLE public.guest_consents ADD COLUMN IF NOT EXISTS type text;
    ALTER TABLE public.guest_consents ADD COLUMN IF NOT EXISTS granted boolean;
    ALTER TABLE public.guest_consents ADD COLUMN IF NOT EXISTS source text;
    ALTER TABLE public.guest_consents ADD COLUMN IF NOT EXISTS captured_by uuid;
    
    -- Make legacy/conflicting columns NULLable if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'guest_consents' AND column_name = 'consent_type' AND is_nullable = 'NO') THEN
        ALTER TABLE public.guest_consents ALTER COLUMN consent_type DROP NOT NULL;
    END IF;

    -- Enforce NOT NULL on new columns
    UPDATE public.guest_consents SET type = 'data_processing' WHERE type IS NULL;
    UPDATE public.guest_consents SET granted = false WHERE granted IS NULL;
    UPDATE public.guest_consents SET source = 'system' WHERE source IS NULL;
    ALTER TABLE public.guest_consents ALTER COLUMN type SET NOT NULL;
    ALTER TABLE public.guest_consents ALTER COLUMN granted SET NOT NULL;
    ALTER TABLE public.guest_consents ALTER COLUMN source SET NOT NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_guest_consents_org_id ON public.guest_consents(org_id);
CREATE INDEX IF NOT EXISTS idx_guest_consents_org_guest ON public.guest_consents(org_id, guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_consents_org_type_granted ON public.guest_consents(org_id, type, granted);


-- 3. TABLE: booking_guests
CREATE TABLE IF NOT EXISTS public.booking_guests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- REINFORCE/FIX: Handle potential name/constraint conflicts
DO $$
BEGIN
    ALTER TABLE public.booking_guests ADD COLUMN IF NOT EXISTS guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL;
    ALTER TABLE public.booking_guests ADD COLUMN IF NOT EXISTS full_name text;
    ALTER TABLE public.booking_guests ADD COLUMN IF NOT EXISTS document text;
    ALTER TABLE public.booking_guests ADD COLUMN IF NOT EXISTS is_primary boolean;

    -- Make legacy/conflicting columns NULLable if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'booking_guests' AND column_name = 'guest_name' AND is_nullable = 'NO') THEN
        ALTER TABLE public.booking_guests ALTER COLUMN guest_name DROP NOT NULL;
    END IF;

    -- Enforce NOT NULL on new columns
    UPDATE public.booking_guests SET full_name = 'Guest' WHERE full_name IS NULL;
    UPDATE public.booking_guests SET is_primary = false WHERE is_primary IS NULL;
    ALTER TABLE public.booking_guests ALTER COLUMN full_name SET NOT NULL;
    ALTER TABLE public.booking_guests ALTER COLUMN is_primary SET NOT NULL;
END $$;


CREATE INDEX IF NOT EXISTS idx_booking_guests_org_id ON public.booking_guests(org_id);
CREATE INDEX IF NOT EXISTS idx_booking_guests_org_booking ON public.booking_guests(org_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_guests_org_guest ON public.booking_guests(org_id, guest_id);

-- 4. TABLE: pre_checkin_sessions
CREATE TABLE IF NOT EXISTS public.pre_checkin_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- REINFORCE/FIX: Handle potential name/constraint conflicts
DO $$
BEGIN
    ALTER TABLE public.pre_checkin_sessions ADD COLUMN IF NOT EXISTS token text;
    ALTER TABLE public.pre_checkin_sessions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
    ALTER TABLE public.pre_checkin_sessions ADD COLUMN IF NOT EXISTS status text;

    -- Make legacy/conflicting columns NULLable if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pre_checkin_sessions' AND column_name = 'token_hash' AND is_nullable = 'NO') THEN
        ALTER TABLE public.pre_checkin_sessions ALTER COLUMN token_hash DROP NOT NULL;
    END IF;

    -- Enforce NOT NULL on new columns
    -- NOTE: token must be unique, handled separately if needed
    ALTER TABLE public.pre_checkin_sessions ALTER COLUMN token SET NOT NULL;
    UPDATE public.pre_checkin_sessions SET status = 'pending' WHERE status IS NULL;
    ALTER TABLE public.pre_checkin_sessions ALTER COLUMN status SET NOT NULL;
END $$;

-- Explicitly ensure uniqueness on token
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pre_checkin_sessions_token_key') THEN
        ALTER TABLE public.pre_checkin_sessions ADD CONSTRAINT pre_checkin_sessions_token_key UNIQUE (token);
    END IF;
END $$;


CREATE INDEX IF NOT EXISTS idx_pre_checkin_sessions_org_id ON public.pre_checkin_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_pre_checkin_sessions_org_booking ON public.pre_checkin_sessions(org_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_pre_checkin_sessions_org_token ON public.pre_checkin_sessions(org_id, token);
