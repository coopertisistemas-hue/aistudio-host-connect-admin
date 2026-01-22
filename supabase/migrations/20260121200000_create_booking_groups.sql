-- Sprint 5.2: Booking Groups Model
-- Enables group booking management with multi-tenant isolation

-- Create booking_groups table
CREATE TABLE IF NOT EXISTS public.booking_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    leader_name TEXT,
    leader_phone TEXT,
    estimated_participants INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_booking_groups_org_property_booking 
    ON public.booking_groups(org_id, property_id, booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_groups_org_property_name 
    ON public.booking_groups(org_id, property_id, group_name);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_booking_groups
    BEFORE UPDATE ON public.booking_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.booking_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Multi-tenant isolation

-- Policy: Users can view groups for bookings in their org
CREATE POLICY "Users can view booking_groups in their org"
    ON public.booking_groups
    FOR SELECT
    USING (
        org_id IN (
            SELECT om.org_id 
            FROM public.org_members om 
            WHERE om.user_id = auth.uid()
        )
    );

-- Policy: Admins/Managers/Staff can insert groups
CREATE POLICY "Staff can insert booking_groups"
    ON public.booking_groups
    FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT om.org_id 
            FROM public.org_members om 
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'staff')
        )
        AND property_id IN (
            SELECT p.id 
            FROM public.properties p 
            WHERE p.org_id = booking_groups.org_id
        )
        AND booking_id IN (
            SELECT b.id 
            FROM public.bookings b 
            WHERE b.org_id = booking_groups.org_id 
            AND b.property_id = booking_groups.property_id
        )
    );

-- Policy: Admins/Managers/Staff can update groups
CREATE POLICY "Staff can update booking_groups"
    ON public.booking_groups
    FOR UPDATE
    USING (
        org_id IN (
            SELECT om.org_id 
            FROM public.org_members om 
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'staff')
        )
    )
    WITH CHECK (
        org_id IN (
            SELECT om.org_id 
            FROM public.org_members om 
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager', 'staff')
        )
    );

-- Policy: Admins/Managers can delete groups
CREATE POLICY "Admins can delete booking_groups"
    ON public.booking_groups
    FOR DELETE
    USING (
        org_id IN (
            SELECT om.org_id 
            FROM public.org_members om 
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager')
        )
    );

-- Add comment for documentation
COMMENT ON TABLE public.booking_groups IS 'Groups associated with bookings for efficient batch pre-checkin handling';
