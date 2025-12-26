
-- Migration: Add org_id to Core Tables
-- Description: Prepares core tables for multi-tenancy by adding org_id column.
-- Date: 2025-12-26

-- 1. Add org_id to Properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_properties_org_id ON public.properties(org_id);

-- 2. Add org_id to Bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_org_id ON public.bookings(org_id);

-- 3. Add org_id to Rooms
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_rooms_org_id ON public.rooms(org_id);

-- 4. Add org_id to Support Tickets
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON public.tickets(org_id);

-- 5. Add org_id to Ideas
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ideas_org_id ON public.ideas(org_id);

-- Note: user_id columns remain strict for now until RLS migration.
-- In the future, we will likely backfill org_id based on the user's personal org
-- and then switch RLS to check org_id.
