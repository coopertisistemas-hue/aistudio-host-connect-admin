-- SP1: Property-scope amenities for operational CRUD
-- Forward-only and idempotent.

ALTER TABLE IF EXISTS public.amenities
ADD COLUMN IF NOT EXISTS property_id uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'amenities'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'amenities'
      AND constraint_name = 'amenities_property_id_fkey'
  ) THEN
    ALTER TABLE public.amenities
      ADD CONSTRAINT amenities_property_id_fkey
      FOREIGN KEY (property_id)
      REFERENCES public.properties(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_amenities_org_property
  ON public.amenities(org_id, property_id);

-- Best-effort backfill for legacy rows (first property in org)
UPDATE public.amenities a
SET property_id = (
  SELECT p.id
  FROM public.properties p
  WHERE p.org_id = a.org_id
  ORDER BY p.created_at ASC, p.id ASC
  LIMIT 1
)
WHERE a.property_id IS NULL;

-- Recreate policies with property-scoped guard
DROP POLICY IF EXISTS "org_members_select_amenities" ON public.amenities;
DROP POLICY IF EXISTS "org_admins_insert_amenities" ON public.amenities;
DROP POLICY IF EXISTS "org_admins_update_amenities" ON public.amenities;
DROP POLICY IF EXISTS "org_admins_delete_amenities" ON public.amenities;

CREATE POLICY "org_members_select_amenities" ON public.amenities
FOR SELECT
USING (
  property_id IS NOT NULL
  AND (
    public.is_hostconnect_staff()
    OR (
      public.is_org_member(org_id)
      AND EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = amenities.property_id
          AND p.org_id = amenities.org_id
      )
    )
  )
);

CREATE POLICY "org_admins_insert_amenities" ON public.amenities
FOR INSERT
WITH CHECK (
  property_id IS NOT NULL
  AND (
    public.is_hostconnect_staff()
    OR (
      public.is_org_admin(org_id)
      AND EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = amenities.property_id
          AND p.org_id = amenities.org_id
      )
    )
  )
);

CREATE POLICY "org_admins_update_amenities" ON public.amenities
FOR UPDATE
USING (
  property_id IS NOT NULL
  AND (
    public.is_hostconnect_staff()
    OR (
      public.is_org_admin(org_id)
      AND EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = amenities.property_id
          AND p.org_id = amenities.org_id
      )
    )
  )
)
WITH CHECK (
  property_id IS NOT NULL
  AND (
    public.is_hostconnect_staff()
    OR (
      public.is_org_admin(org_id)
      AND EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = amenities.property_id
          AND p.org_id = amenities.org_id
      )
    )
  )
);

CREATE POLICY "org_admins_delete_amenities" ON public.amenities
FOR DELETE
USING (
  property_id IS NOT NULL
  AND (
    public.is_hostconnect_staff()
    OR (
      public.is_org_admin(org_id)
      AND EXISTS (
        SELECT 1
        FROM public.properties p
        WHERE p.id = amenities.property_id
          AND p.org_id = amenities.org_id
      )
    )
  )
);
