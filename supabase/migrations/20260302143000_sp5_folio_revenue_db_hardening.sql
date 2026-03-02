-- SP5: Folio, Charges and Payments integrity hardening (CONNECT RLS-first)
-- Forward-only, idempotent, repo SSOT compliant.

-- 1) Create folio tables when missing (and normalize shape when existing)
CREATE TABLE IF NOT EXISTS public.folio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  category text NOT NULL DEFAULT 'service',
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.folio_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  method text NOT NULL DEFAULT 'cash',
  payment_date timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid
);

ALTER TABLE IF EXISTS public.folio_items
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE IF EXISTS public.folio_payments
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS created_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'folio_items_amount_non_negative'
  ) THEN
    ALTER TABLE public.folio_items
      ADD CONSTRAINT folio_items_amount_non_negative CHECK (amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'folio_items_category_check'
  ) THEN
    ALTER TABLE public.folio_items
      ADD CONSTRAINT folio_items_category_check CHECK (category IN ('rate', 'service', 'adjustment'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'folio_payments_amount_non_negative'
  ) THEN
    ALTER TABLE public.folio_payments
      ADD CONSTRAINT folio_payments_amount_non_negative CHECK (amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'folio_payments_method_check'
  ) THEN
    ALTER TABLE public.folio_payments
      ADD CONSTRAINT folio_payments_method_check CHECK (method IN ('cash', 'card', 'pix', 'stripe', 'local_cash', 'local_card'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_folio_items_org_property_booking
  ON public.folio_items(org_id, property_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_folio_items_booking_id
  ON public.folio_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_folio_payments_org_property_booking
  ON public.folio_payments(org_id, property_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_folio_payments_booking_id
  ON public.folio_payments(booking_id);

-- 2) Hardening for invoices and booking_charges
ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.booking_charges
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE;

UPDATE public.invoices i
SET org_id = b.org_id
FROM public.bookings b
WHERE i.org_id IS NULL
  AND i.booking_id = b.id;

UPDATE public.invoices i
SET org_id = p.org_id
FROM public.properties p
WHERE i.org_id IS NULL
  AND i.property_id = p.id;

UPDATE public.booking_charges bc
SET org_id = b.org_id,
    property_id = b.property_id
FROM public.bookings b
WHERE (bc.org_id IS NULL OR bc.property_id IS NULL)
  AND bc.booking_id = b.id;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'booking_charges' AND column_name = 'org_id')
     AND NOT EXISTS (SELECT 1 FROM public.booking_charges WHERE org_id IS NULL) THEN
    ALTER TABLE public.booking_charges ALTER COLUMN org_id SET NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'booking_charges' AND column_name = 'property_id')
     AND NOT EXISTS (SELECT 1 FROM public.booking_charges WHERE property_id IS NULL) THEN
    ALTER TABLE public.booking_charges ALTER COLUMN property_id SET NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'org_id')
     AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE org_id IS NULL) THEN
    ALTER TABLE public.invoices ALTER COLUMN org_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invoices_paid_amount_bounds'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_paid_amount_bounds CHECK (paid_amount >= 0 AND paid_amount <= total_amount);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booking_charges_amount_non_negative'
  ) THEN
    ALTER TABLE public.booking_charges
      ADD CONSTRAINT booking_charges_amount_non_negative CHECK (amount >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_org_property_status
  ON public.invoices(org_id, property_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_charges_org_property_booking
  ON public.booking_charges(org_id, property_id, booking_id);

-- 3) Enforce booking/org/property consistency for folio+charges
CREATE OR REPLACE FUNCTION public.enforce_booking_scope_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_org_id uuid;
  v_booking_property_id uuid;
BEGIN
  SELECT org_id, property_id
    INTO v_booking_org_id, v_booking_property_id
  FROM public.bookings
  WHERE id = NEW.booking_id;

  IF v_booking_org_id IS NULL OR v_booking_property_id IS NULL THEN
    RAISE EXCEPTION 'Invalid booking scope for booking_id=%', NEW.booking_id;
  END IF;

  IF NEW.org_id IS NULL THEN
    NEW.org_id := v_booking_org_id;
  ELSIF NEW.org_id <> v_booking_org_id THEN
    RAISE EXCEPTION 'org_id mismatch with booking scope';
  END IF;

  IF NEW.property_id IS NULL THEN
    NEW.property_id := v_booking_property_id;
  ELSIF NEW.property_id <> v_booking_property_id THEN
    RAISE EXCEPTION 'property_id mismatch with booking scope';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.folio_items') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_folio_items_scope_consistency ON public.folio_items;
    CREATE TRIGGER tr_folio_items_scope_consistency
      BEFORE INSERT OR UPDATE ON public.folio_items
      FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_scope_consistency();
  END IF;

  IF to_regclass('public.folio_payments') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_folio_payments_scope_consistency ON public.folio_payments;
    CREATE TRIGGER tr_folio_payments_scope_consistency
      BEFORE INSERT OR UPDATE ON public.folio_payments
      FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_scope_consistency();
  END IF;

  IF to_regclass('public.booking_charges') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_booking_charges_scope_consistency ON public.booking_charges;
    CREATE TRIGGER tr_booking_charges_scope_consistency
      BEFORE INSERT OR UPDATE ON public.booking_charges
      FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_scope_consistency();
  END IF;

  IF to_regclass('public.invoices') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_invoices_scope_consistency ON public.invoices;
    CREATE TRIGGER tr_invoices_scope_consistency
      BEFORE INSERT OR UPDATE ON public.invoices
      FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_scope_consistency();
  END IF;
END $$;

-- 4) RLS policies (explicit CRUD) for folio/invoice/charges
ALTER TABLE IF EXISTS public.folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.folio_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_charges ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
  p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['folio_items', 'folio_payments', 'invoices', 'booking_charges']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      FOR p IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = t
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
      END LOOP;

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (public.is_org_member(org_id) OR public.is_hostconnect_staff())',
        t || '_select_org_members',
        t
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_org_member(org_id) OR public.is_hostconnect_staff())',
        t || '_insert_org_members',
        t
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_org_member(org_id) OR public.is_hostconnect_staff()) WITH CHECK (public.is_org_member(org_id) OR public.is_hostconnect_staff())',
        t || '_update_org_members',
        t
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE USING (public.is_org_admin(org_id) OR public.is_hostconnect_staff())',
        t || '_delete_org_admins',
        t
      );
    END IF;
  END LOOP;
END $$;
