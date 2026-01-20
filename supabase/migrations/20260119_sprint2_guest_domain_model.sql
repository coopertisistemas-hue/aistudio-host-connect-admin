-- SPRINT 2: GUEST DOMAIN MODEL MIGRATION (RESILIENT VERSION)
-- Ensures schema alignment even if tables were partially created previously.

-- 0. UTILITY: Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. TABLE: guests
CREATE TABLE IF NOT EXISTS public.guests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id),
    first_name text NOT NULL,
    last_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS document text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS birthdate date;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS notes text;

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

ALTER TABLE public.guest_consents ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'data_processing';
ALTER TABLE public.guest_consents ADD COLUMN IF NOT EXISTS granted boolean NOT NULL DEFAULT false;
ALTER TABLE public.guest_consents ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system';
ALTER TABLE public.guest_consents ADD COLUMN IF NOT EXISTS captured_by uuid;

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

ALTER TABLE public.booking_guests ADD COLUMN IF NOT EXISTS guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL;
ALTER TABLE public.booking_guests ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT 'Hóspede';
ALTER TABLE public.booking_guests ADD COLUMN IF NOT EXISTS document text;
ALTER TABLE public.booking_guests ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

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

-- Ensure critical columns exist before indexing
ALTER TABLE public.pre_checkin_sessions ADD COLUMN IF NOT EXISTS token text UNIQUE;
-- If token was added without NOT NULL previously, enforce it if needed, 
-- but for simplicity in migration:
ALTER TABLE public.pre_checkin_sessions ALTER COLUMN token SET NOT NULL; 

ALTER TABLE public.pre_checkin_sessions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.pre_checkin_sessions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_pre_checkin_sessions_org_id ON public.pre_checkin_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_pre_checkin_sessions_org_booking ON public.pre_checkin_sessions(org_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_pre_checkin_sessions_org_token ON public.pre_checkin_sessions(org_id, token);

/*
--------------------------------------------------
MIGRATION SUMMARY
--------------------------------------------------
- Purpose: Resilient Guest Domain Model for Sprint 2.
- Tables Reinforced: guests, guest_consents, booking_guests, pre_checkin_sessions.
- Ensures columns (token, type, document) exist before index creation.
--------------------------------------------------
*/
