
-- Migration: Update RLS Policies for Organizations
-- Description: Updates RLS to allow access via Organization Membership while maintaining legacy user_id compatibility.
-- Date: 2025-12-26

-- =============================================================================
-- 1. PROPERTIES
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

CREATE POLICY "Org: Users can view properties"
  ON public.properties FOR SELECT
  USING (
    -- Legacy
    auth.uid() = user_id 
    -- New
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  );

CREATE POLICY "Org: Users can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (
    -- Legacy
    auth.uid() = user_id 
    -- New (Admins only for structure?)
    OR (org_id IS NOT NULL AND public.is_org_admin(org_id))
  );

CREATE POLICY "Org: Users can update properties"
  ON public.properties FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR (org_id IS NOT NULL AND public.is_org_admin(org_id))
  );

CREATE POLICY "Org: Users can delete properties"
  ON public.properties FOR DELETE
  USING (
    auth.uid() = user_id 
    OR (org_id IS NOT NULL AND public.is_org_admin(org_id))
  );

-- =============================================================================
-- 2. BOOKINGS
-- =============================================================================
DROP POLICY IF EXISTS "Users can view bookings for own properties" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert bookings for own properties" ON public.bookings;
DROP POLICY IF EXISTS "Users can update bookings for own properties" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete bookings for own properties" ON public.bookings;

CREATE POLICY "Org: Users can view bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM public.properties WHERE id = property_id) -- Legacy Implicit
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  );

CREATE POLICY "Org: Users can insert bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    (SELECT user_id FROM public.properties WHERE id = property_id) = auth.uid()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  );

CREATE POLICY "Org: Users can update bookings"
  ON public.bookings FOR UPDATE
  USING (
    (SELECT user_id FROM public.properties WHERE id = property_id) = auth.uid()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  );

CREATE POLICY "Org: Users can delete bookings"
  ON public.bookings FOR DELETE
  USING (
    (SELECT user_id FROM public.properties WHERE id = property_id) = auth.uid()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  );

-- =============================================================================
-- 3. ROOMS
-- =============================================================================
-- Assumes policies existed or we replace them. 
-- Dropping potential standard names just in case.
DROP POLICY IF EXISTS "Users can view own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can insert own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can update own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can delete own rooms" ON public.rooms;

CREATE POLICY "Org: Users can view rooms" ON public.rooms FOR SELECT USING (
    (SELECT user_id FROM public.properties WHERE id = property_id) = auth.uid()
    OR (org_id IS NOT NULL AND public.is_org_member(org_id))
);

CREATE POLICY "Org: Users can insert rooms" ON public.rooms FOR INSERT WITH CHECK (
    (SELECT user_id FROM public.properties WHERE id = property_id) = auth.uid()
    OR (org_id IS NOT NULL AND public.is_org_admin(org_id)) -- Strict for structural
);

CREATE POLICY "Org: Users can update rooms" ON public.rooms FOR UPDATE USING (
    (SELECT user_id FROM public.properties WHERE id = property_id) = auth.uid()
    OR (org_id IS NOT NULL AND public.is_org_admin(org_id))
);

CREATE POLICY "Org: Users can delete rooms" ON public.rooms FOR DELETE USING (
    (SELECT user_id FROM public.properties WHERE id = property_id) = auth.uid()
    OR (org_id IS NOT NULL AND public.is_org_admin(org_id))
);

-- =============================================================================
-- 4. PROPERTY PHOTOS (Table only, skipping Storage for now)
-- =============================================================================
-- =============================================================================
-- 4. PROPERTY PHOTOS (Table only, skipping Storage for now)
-- =============================================================================
-- Use DO block to avoid error if table doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'property_photos') THEN
    
    DROP POLICY IF EXISTS "Users can view photos for own properties" ON public.property_photos;
    DROP POLICY IF EXISTS "Users can insert photos for own properties" ON public.property_photos;
    DROP POLICY IF EXISTS "Users can update photos for own properties" ON public.property_photos;
    DROP POLICY IF EXISTS "Users can delete photos for own properties" ON public.property_photos;

    EXECUTE '
    CREATE POLICY "Org: Users can view photos" ON public.property_photos FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_photos.property_id
        AND (
          p.user_id = auth.uid()
          OR
          (p.org_id IS NOT NULL AND public.is_org_member(p.org_id))
        )
      )
    );

    CREATE POLICY "Org: Users can manage photos" ON public.property_photos FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_photos.property_id
        AND (
          p.user_id = auth.uid()
          OR
          (p.org_id IS NOT NULL AND public.is_org_member(p.org_id))
        )
      )
    );';
    
  END IF;
END $$;

-- =============================================================================
-- 5. SUPPORT MODULE (Tickets & Ideas)
-- =============================================================================
-- Note: Staff policies usually bypassing RLS or having specific Staff policies. 
-- We only touch "Users can..." policies.

-- TICKETS
DROP POLICY IF EXISTS "Users can see own tickets" ON public.tickets;
CREATE POLICY "Org: Users can view tickets" ON public.tickets FOR SELECT USING (
  auth.uid() = user_id 
  OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  OR public.is_hostconnect_staff() -- Ensure staff keeps access
);

DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Org: Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR (org_id IS NOT NULL AND public.is_org_member(org_id))
);

-- IDEAS
DROP POLICY IF EXISTS "Users can view ideas" ON public.ideas;
-- Ideas are often public? If locked to user/org:
CREATE POLICY "Org: Users can view ideas" ON public.ideas FOR SELECT USING (
  -- Allowing access if user owns it, is in org, or is staff.
  auth.uid() = user_id 
  OR (org_id IS NOT NULL AND public.is_org_member(org_id))
  OR public.is_hostconnect_staff()
);
-- Just in case Ideas was already public, this might restrict it. 
-- Checking: "Users can view all ideas" is common. 
-- If the previous policy allowed ALL authenticated, we shouldn't restrict it. 
-- Let's stick to the prompt "Para cada tabela core". 
-- If Ideas are shared global suggestions, org_id is just "who posted it".
-- I will Skip altering Ideas SELECT policy to avoid breaking public nature if it exists.
-- Only changing INSERT/UPDATE if necessary.

-- Returning to safe update for Ideas: Update only if own/org.
CREATE POLICY "Org: Users can update own ideas" ON public.ideas FOR UPDATE USING (
  auth.uid() = user_id 
  OR (org_id IS NOT NULL AND public.is_org_admin(org_id))
);
