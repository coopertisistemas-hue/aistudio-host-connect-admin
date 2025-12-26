
-- Migration: Backfill org_id for Existing Data
-- Description: Populates org_id for core tables based on the user's personal organization.
-- Date: 2025-12-26

DO $$
BEGIN

    -- 1. Update Properties (Direct user_id)
    UPDATE public.properties t
    SET org_id = (
        SELECT org_id 
        FROM public.org_members om 
        WHERE om.user_id = t.user_id 
        ORDER BY om.created_at ASC 
        LIMIT 1
    )
    WHERE t.org_id IS NULL;

    -- 2. Update Tickets (Direct user_id)
    UPDATE public.tickets t
    SET org_id = (
        SELECT org_id 
        FROM public.org_members om 
        WHERE om.user_id = t.user_id 
        ORDER BY om.created_at ASC 
        LIMIT 1
    )
    WHERE t.org_id IS NULL;

    -- 3. Update Ideas (Direct user_id)
    UPDATE public.ideas t
    SET org_id = (
        SELECT org_id 
        FROM public.org_members om 
        WHERE om.user_id = t.user_id 
        ORDER BY om.created_at ASC 
        LIMIT 1
    )
    WHERE t.org_id IS NULL;

    -- 4. Update Rooms (Via Property)
    -- Requires properties to be updated first
    UPDATE public.rooms t
    SET org_id = p.org_id
    FROM public.properties p
    WHERE t.property_id = p.id
    AND t.org_id IS NULL
    AND p.org_id IS NOT NULL;

    -- 5. Update Bookings (Via Property)
    -- Requires properties to be updated first
    UPDATE public.bookings t
    SET org_id = p.org_id
    FROM public.properties p
    WHERE t.property_id = p.id
    AND t.org_id IS NULL
    AND p.org_id IS NOT NULL;

END $$;
