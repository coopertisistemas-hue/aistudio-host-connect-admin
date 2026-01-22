-- Migration: Create booking_rooms table for Sprint 4.5
-- Goal: Link bookings to specific rooms in a multi-tenant way.

CREATE TABLE IF NOT EXISTS public.booking_rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
    is_primary boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Constraints
    CONSTRAINT booking_rooms_org_booking_room_unique UNIQUE (org_id, booking_id, room_id)
);

-- RLS Policies
ALTER TABLE public.booking_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view booking_rooms for their org"
    ON public.booking_rooms FOR SELECT
    USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert booking_rooms for their org"
    ON public.booking_rooms FOR INSERT
    WITH CHECK (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update booking_rooms for their org"
    ON public.booking_rooms FOR UPDATE
    USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete booking_rooms for their org"
    ON public.booking_rooms FOR DELETE
    USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_rooms_composite_booking 
    ON public.booking_rooms (org_id, property_id, booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_rooms_composite_room 
    ON public.booking_rooms (org_id, property_id, room_id);

CREATE INDEX IF NOT EXISTS idx_booking_rooms_primary 
    ON public.booking_rooms (org_id, property_id, booking_id, is_primary);

-- Updated_at Trigger
CREATE TRIGGER handle_booking_rooms_updated_at 
    BEFORE UPDATE ON public.booking_rooms 
    FOR EACH ROW EXECUTE FUNCTION public.moddatetime();

-- Audit Comments
COMMENT ON TABLE public.booking_rooms IS 'Links bookings to rooms (Sprint 4.5)';
COMMENT ON COLUMN public.booking_rooms.is_primary IS 'Indicates the main room assigned to this booking';
