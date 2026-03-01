-- SP0-A / DR0-A Path A remediation
-- Purpose:
-- 1) Ensure critical tables exist in STAGING-reproducible schema: booking_groups, property_photos
-- 2) Enforce RLS + explicit CRUD policies on pre_checkin_sessions / pre_checkin_submissions
-- 3) Remove "RLS enabled with zero policies" findings by adding explicit lock-down policies
-- Safety: idempotent, forward-only, no dashboard/manual edits required.

-- -----------------------------------------------------------------------------
-- Utility guards
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE EXCEPTION 'Required table public.organizations not found';
  END IF;
  IF to_regclass('public.properties') IS NULL THEN
    RAISE EXCEPTION 'Required table public.properties not found';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- A) Ensure public.booking_groups exists and is protected
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  group_name text NOT NULL,
  leader_name text,
  leader_phone text,
  estimated_participants integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_groups_org_property_booking
  ON public.booking_groups(org_id, property_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_groups_org_property_name
  ON public.booking_groups(org_id, property_id, group_name);

ALTER TABLE public.booking_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view booking_groups in their org" ON public.booking_groups;
DROP POLICY IF EXISTS "Staff can insert booking_groups" ON public.booking_groups;
DROP POLICY IF EXISTS "Staff can update booking_groups" ON public.booking_groups;
DROP POLICY IF EXISTS "Admins can delete booking_groups" ON public.booking_groups;

CREATE POLICY "sp0a_booking_groups_select"
ON public.booking_groups
FOR SELECT
USING (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
);

CREATE POLICY "sp0a_booking_groups_insert"
ON public.booking_groups
FOR INSERT
WITH CHECK (
  (public.is_org_member(org_id) OR public.is_hostconnect_staff())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = booking_groups.property_id
      AND p.org_id = booking_groups.org_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_groups.booking_id
      AND b.org_id = booking_groups.org_id
      AND b.property_id = booking_groups.property_id
  )
);

CREATE POLICY "sp0a_booking_groups_update"
ON public.booking_groups
FOR UPDATE
USING (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
)
WITH CHECK (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
);

CREATE POLICY "sp0a_booking_groups_delete"
ON public.booking_groups
FOR DELETE
USING (
  public.is_org_admin(org_id) OR public.is_hostconnect_staff()
);

DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_updated_at_booking_groups ON public.booking_groups';
    EXECUTE 'CREATE TRIGGER set_updated_at_booking_groups BEFORE UPDATE ON public.booking_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- A) Ensure public.property_photos exists and is protected
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;
ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE;
ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.property_photos
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.property_photos pp
SET org_id = p.org_id
FROM public.properties p
WHERE pp.org_id IS NULL
  AND pp.property_id = p.id;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.property_photos WHERE org_id IS NULL) THEN
    RAISE NOTICE 'property_photos.org_id has NULLs; leaving nullable until data is fully reconciled';
  ELSE
    ALTER TABLE public.property_photos ALTER COLUMN org_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_property_photos_org_id
  ON public.property_photos(org_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_property_id
  ON public.property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_org_property
  ON public.property_photos(org_id, property_id);

ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Property photos are viewable by property owners." ON public.property_photos;
DROP POLICY IF EXISTS "Property owners can insert photos." ON public.property_photos;
DROP POLICY IF EXISTS "Property owners can update photos." ON public.property_photos;
DROP POLICY IF EXISTS "Property owners can delete photos." ON public.property_photos;
DROP POLICY IF EXISTS "Users can view photos for own properties" ON public.property_photos;
DROP POLICY IF EXISTS "Users can insert photos for own properties" ON public.property_photos;
DROP POLICY IF EXISTS "Users can update photos for own properties" ON public.property_photos;
DROP POLICY IF EXISTS "Users can delete photos for own properties" ON public.property_photos;
DROP POLICY IF EXISTS "Org: Users can view photos" ON public.property_photos;
DROP POLICY IF EXISTS "Org: Users can manage photos" ON public.property_photos;

CREATE POLICY "sp0a_property_photos_select"
ON public.property_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_photos.property_id
      AND (public.is_org_member(p.org_id) OR p.user_id = auth.uid() OR public.is_hostconnect_staff())
  )
);

CREATE POLICY "sp0a_property_photos_insert"
ON public.property_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_photos.property_id
      AND (public.is_org_member(p.org_id) OR p.user_id = auth.uid() OR public.is_hostconnect_staff())
  )
);

CREATE POLICY "sp0a_property_photos_update"
ON public.property_photos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_photos.property_id
      AND (public.is_org_member(p.org_id) OR p.user_id = auth.uid() OR public.is_hostconnect_staff())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_photos.property_id
      AND (public.is_org_member(p.org_id) OR p.user_id = auth.uid() OR public.is_hostconnect_staff())
  )
);

CREATE POLICY "sp0a_property_photos_delete"
ON public.property_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_photos.property_id
      AND (public.is_org_admin(p.org_id) OR p.user_id = auth.uid() OR public.is_hostconnect_staff())
  )
);

DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_property_photos_updated_at ON public.property_photos';
    EXECUTE 'DROP TRIGGER IF EXISTS handle_property_photos_updated_at ON public.property_photos';
    EXECUTE 'CREATE TRIGGER update_property_photos_updated_at BEFORE UPDATE ON public.property_photos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  ELSIF to_regprocedure('public.moddatetime()') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_property_photos_updated_at ON public.property_photos';
    EXECUTE 'DROP TRIGGER IF EXISTS handle_property_photos_updated_at ON public.property_photos';
    EXECUTE 'CREATE TRIGGER update_property_photos_updated_at BEFORE UPDATE ON public.property_photos FOR EACH ROW EXECUTE FUNCTION public.moddatetime()';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.set_org_id_from_property()') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS tr_photos_set_org ON public.property_photos';
    EXECUTE 'CREATE TRIGGER tr_photos_set_org BEFORE INSERT ON public.property_photos FOR EACH ROW EXECUTE FUNCTION public.set_org_id_from_property()';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- B) Fix RLS-disabled pre_checkin tables
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.pre_checkin_sessions
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.pre_checkin_submissions
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.pre_checkin_sessions pcs
SET org_id = b.org_id
FROM public.bookings b
WHERE pcs.org_id IS NULL
  AND pcs.booking_id = b.id;

UPDATE public.pre_checkin_submissions psub
SET org_id = pcs.org_id
FROM public.pre_checkin_sessions pcs
WHERE psub.org_id IS NULL
  AND psub.session_id = pcs.id;

DO $$
BEGIN
  IF to_regclass('public.pre_checkin_sessions') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.pre_checkin_sessions WHERE org_id IS NULL) THEN
      ALTER TABLE public.pre_checkin_sessions ALTER COLUMN org_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'pre_checkin_sessions.org_id still has NULLs; NOT NULL skipped for safety';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.pre_checkin_submissions') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.pre_checkin_submissions WHERE org_id IS NULL) THEN
      ALTER TABLE public.pre_checkin_submissions ALTER COLUMN org_id SET NOT NULL;
    ELSE
      RAISE NOTICE 'pre_checkin_submissions.org_id still has NULLs; NOT NULL skipped for safety';
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pre_checkin_sessions_org_id
  ON public.pre_checkin_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_pre_checkin_submissions_org_id
  ON public.pre_checkin_submissions(org_id);

ALTER TABLE IF EXISTS public.pre_checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pre_checkin_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sp0a_pre_checkin_sessions_select" ON public.pre_checkin_sessions;
DROP POLICY IF EXISTS "sp0a_pre_checkin_sessions_insert" ON public.pre_checkin_sessions;
DROP POLICY IF EXISTS "sp0a_pre_checkin_sessions_update" ON public.pre_checkin_sessions;
DROP POLICY IF EXISTS "sp0a_pre_checkin_sessions_delete" ON public.pre_checkin_sessions;
DROP POLICY IF EXISTS "Users can view own org precheckin sessions" ON public.precheckin_sessions;

CREATE POLICY "sp0a_pre_checkin_sessions_select"
ON public.pre_checkin_sessions
FOR SELECT
USING (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
);

CREATE POLICY "sp0a_pre_checkin_sessions_insert"
ON public.pre_checkin_sessions
FOR INSERT
WITH CHECK (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
);

CREATE POLICY "sp0a_pre_checkin_sessions_update"
ON public.pre_checkin_sessions
FOR UPDATE
USING (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
)
WITH CHECK (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
);

CREATE POLICY "sp0a_pre_checkin_sessions_delete"
ON public.pre_checkin_sessions
FOR DELETE
USING (
  public.is_org_admin(org_id) OR public.is_hostconnect_staff()
);

DROP POLICY IF EXISTS "sp0a_pre_checkin_submissions_select" ON public.pre_checkin_submissions;
DROP POLICY IF EXISTS "sp0a_pre_checkin_submissions_insert" ON public.pre_checkin_submissions;
DROP POLICY IF EXISTS "sp0a_pre_checkin_submissions_update" ON public.pre_checkin_submissions;
DROP POLICY IF EXISTS "sp0a_pre_checkin_submissions_delete" ON public.pre_checkin_submissions;

CREATE POLICY "sp0a_pre_checkin_submissions_select"
ON public.pre_checkin_submissions
FOR SELECT
USING (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
);

CREATE POLICY "sp0a_pre_checkin_submissions_insert"
ON public.pre_checkin_submissions
FOR INSERT
WITH CHECK (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
);

CREATE POLICY "sp0a_pre_checkin_submissions_update"
ON public.pre_checkin_submissions
FOR UPDATE
USING (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
)
WITH CHECK (
  public.is_org_member(org_id) OR public.is_hostconnect_staff()
);

CREATE POLICY "sp0a_pre_checkin_submissions_delete"
ON public.pre_checkin_submissions
FOR DELETE
USING (
  public.is_org_admin(org_id) OR public.is_hostconnect_staff()
);

-- -----------------------------------------------------------------------------
-- C) Resolve zero-policy findings with explicit lock-down policies
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  locked_tables text[] := ARRAY[
    'departments',
    'hostconnect_staff',
    'lead_timeline_events',
    'reservation_leads',
    'reservation_quotes',
    'shift_assignments',
    'shift_handoffs',
    'shifts',
    'staff_profiles',
    'stock_check_items',
    'stock_daily_checks',
    'stock_items',
    'stock_locations',
    'stock_movements'
  ];
BEGIN
  FOREACH t IN ARRAY locked_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t AND policyname = 'sp0a_lock_select'
      ) THEN
        EXECUTE format('CREATE POLICY sp0a_lock_select ON public.%I FOR SELECT USING (false)', t);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t AND policyname = 'sp0a_lock_insert'
      ) THEN
        EXECUTE format('CREATE POLICY sp0a_lock_insert ON public.%I FOR INSERT WITH CHECK (false)', t);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t AND policyname = 'sp0a_lock_update'
      ) THEN
        EXECUTE format('CREATE POLICY sp0a_lock_update ON public.%I FOR UPDATE USING (false) WITH CHECK (false)', t);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t AND policyname = 'sp0a_lock_delete'
      ) THEN
        EXECUTE format('CREATE POLICY sp0a_lock_delete ON public.%I FOR DELETE USING (false)', t);
      END IF;
    END IF;
  END LOOP;
END $$;

