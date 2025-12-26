
-- ROLLBACK: Enforce Organization Isolation
-- Description: Reverts policies to legacy dual-access mode and drops NOT NULL constraints.
-- Date: 2025-12-26

-- 1. DROP NOT NULL
ALTER TABLE public.properties ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE public.rooms ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE public.tickets ALTER COLUMN org_id DROP NOT NULL;
ALTER TABLE public.ideas ALTER COLUMN org_id DROP NOT NULL;

-- 2. REVERT POLICIES (Dual Access)

-- PROPERTIES
DROP POLICY IF EXISTS "Strict: Org Members view properties" ON public.properties;
CREATE POLICY "Org: Users can view properties" ON public.properties FOR SELECT USING (
  auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(org_id))
);

-- BOOKINGS
DROP POLICY IF EXISTS "Strict: Org Members view bookings" ON public.bookings;
CREATE POLICY "Org: Users can view bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.properties WHERE id = property_id) 
  OR (org_id IS NOT NULL AND public.is_org_member(org_id))
);

-- ROOMS
DROP POLICY IF EXISTS "Strict: Org Members view rooms" ON public.rooms;
CREATE POLICY "Org: Users can view rooms" ON public.rooms FOR SELECT USING (
  (SELECT user_id FROM public.properties WHERE id = property_id) = auth.uid()
  OR (org_id IS NOT NULL AND public.is_org_member(org_id))
);

-- 3. DROP TRIGGERS
DROP TRIGGER IF EXISTS tr_bookings_set_org ON public.bookings;
DROP TRIGGER IF EXISTS tr_rooms_set_org ON public.rooms;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'property_photos') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS tr_photos_set_org ON public.property_photos';
  END IF;
END $$;
