-- SP8: Reservation orchestration idempotency ledger
-- Forward-only, idempotent, RLS-first (CONNECT governance)

CREATE TABLE IF NOT EXISTS public.reservation_orchestration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid NULL REFERENCES public.bookings(id) ON DELETE SET NULL,
  source_system text NOT NULL DEFAULT 'reserve',
  event_type text NOT NULL,
  idempotency_key text NOT NULL,
  external_reservation_id text NULL,
  status text NOT NULL DEFAULT 'received',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload jsonb NULL,
  processed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reservation_orchestration_events_status_ck
    CHECK (status IN ('received', 'processing', 'processed', 'failed')),
  CONSTRAINT reservation_orchestration_events_key_uq
    UNIQUE (org_id, event_type, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_reservation_orchestration_events_org_id
  ON public.reservation_orchestration_events(org_id);

CREATE INDEX IF NOT EXISTS idx_reservation_orchestration_events_property_id
  ON public.reservation_orchestration_events(property_id);

CREATE INDEX IF NOT EXISTS idx_reservation_orchestration_events_booking_id
  ON public.reservation_orchestration_events(booking_id);

CREATE INDEX IF NOT EXISTS idx_reservation_orchestration_events_event_type
  ON public.reservation_orchestration_events(event_type);

CREATE INDEX IF NOT EXISTS idx_reservation_orchestration_events_created_at
  ON public.reservation_orchestration_events(created_at DESC);

ALTER TABLE public.reservation_orchestration_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reservation_orchestration_events'
      AND policyname = 'reservation_orchestration_events_select'
  ) THEN
    CREATE POLICY reservation_orchestration_events_select
      ON public.reservation_orchestration_events
      FOR SELECT
      USING (public.is_org_member(org_id) OR public.is_hostconnect_staff());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reservation_orchestration_events'
      AND policyname = 'reservation_orchestration_events_insert'
  ) THEN
    CREATE POLICY reservation_orchestration_events_insert
      ON public.reservation_orchestration_events
      FOR INSERT
      WITH CHECK (public.is_org_member(org_id) OR public.is_hostconnect_staff());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reservation_orchestration_events'
      AND policyname = 'reservation_orchestration_events_update'
  ) THEN
    CREATE POLICY reservation_orchestration_events_update
      ON public.reservation_orchestration_events
      FOR UPDATE
      USING (public.is_org_member(org_id) OR public.is_hostconnect_staff())
      WITH CHECK (public.is_org_member(org_id) OR public.is_hostconnect_staff());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reservation_orchestration_events'
      AND policyname = 'reservation_orchestration_events_delete'
  ) THEN
    CREATE POLICY reservation_orchestration_events_delete
      ON public.reservation_orchestration_events
      FOR DELETE
      USING (public.is_org_admin(org_id) OR public.is_hostconnect_staff());
  END IF;
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS set_updated_at_reservation_orchestration_events
      ON public.reservation_orchestration_events;

    CREATE TRIGGER set_updated_at_reservation_orchestration_events
      BEFORE UPDATE ON public.reservation_orchestration_events
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.claim_reservation_orchestration_event(
  p_org_id uuid,
  p_property_id uuid,
  p_event_type text,
  p_idempotency_key text,
  p_source_system text DEFAULT 'reserve',
  p_external_reservation_id text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(event_id uuid, is_new boolean, existing_response jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.reservation_orchestration_events (
    org_id,
    property_id,
    event_type,
    idempotency_key,
    source_system,
    external_reservation_id,
    payload,
    status
  )
  VALUES (
    p_org_id,
    p_property_id,
    p_event_type,
    p_idempotency_key,
    COALESCE(NULLIF(trim(p_source_system), ''), 'reserve'),
    p_external_reservation_id,
    COALESCE(p_payload, '{}'::jsonb),
    'processing'
  )
  ON CONFLICT (org_id, event_type, idempotency_key) DO NOTHING;

  RETURN QUERY
  SELECT e.id,
         (e.status = 'processing' AND e.response_payload IS NULL),
         e.response_payload
    FROM public.reservation_orchestration_events e
   WHERE e.org_id = p_org_id
     AND e.event_type = p_event_type
     AND e.idempotency_key = p_idempotency_key
   ORDER BY e.created_at ASC
   LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_reservation_orchestration_event(
  p_event_id uuid,
  p_status text,
  p_booking_id uuid DEFAULT NULL,
  p_response_payload jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reservation_orchestration_events
     SET status = CASE
                    WHEN p_status IN ('processed', 'failed', 'processing', 'received')
                      THEN p_status
                    ELSE status
                  END,
         booking_id = COALESCE(p_booking_id, booking_id),
         response_payload = COALESCE(p_response_payload, response_payload),
         processed_at = CASE
                          WHEN p_status = 'processed' THEN now()
                          ELSE processed_at
                        END,
         updated_at = now()
   WHERE id = p_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_reservation_orchestration_event(uuid, uuid, text, text, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_reservation_orchestration_event(uuid, text, uuid, jsonb) TO authenticated, service_role;

COMMENT ON TABLE public.reservation_orchestration_events IS
  'SP8 idempotency ledger for Reserve <-> Host reservation orchestration events.';
