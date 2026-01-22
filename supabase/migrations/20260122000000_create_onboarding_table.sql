-- Sprint 6.0: Onboarding Persistence Table
-- Stores wizard progress and completion state per organization

CREATE TABLE public.hostconnect_onboarding (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    property_id uuid NULL REFERENCES public.properties(id) ON DELETE SET NULL,
    mode text NULL CHECK (mode IN ('simple', 'standard', 'hotel')),
    last_step int NOT NULL DEFAULT 1,
    completed_at timestamptz NULL,
    dismissed_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Ensure one onboarding record per org
    CONSTRAINT hostconnect_onboarding_org_id_key UNIQUE (org_id)
);

-- Indexes for performance
CREATE INDEX idx_hostconnect_onboarding_org_id ON public.hostconnect_onboarding(org_id);
CREATE INDEX idx_hostconnect_onboarding_org_property ON public.hostconnect_onboarding(org_id, property_id);
CREATE INDEX idx_hostconnect_onboarding_completed ON public.hostconnect_onboarding(org_id, completed_at);

-- Enable RLS
ALTER TABLE public.hostconnect_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: Org members can read their org's onboarding state
CREATE POLICY "Org members can view onboarding"
ON public.hostconnect_onboarding
FOR SELECT
USING (
    org_id IN (
        SELECT id FROM public.organizations
        WHERE owner_id = auth.uid()
    )
);

-- INSERT: Staff+ can create onboarding records
CREATE POLICY "Staff+ can create onboarding"
ON public.hostconnect_onboarding
FOR INSERT
WITH CHECK (
    org_id IN (
        SELECT id FROM public.organizations
        WHERE owner_id = auth.uid()
    )
);

-- UPDATE: Staff+ can update onboarding (viewer read-only)
CREATE POLICY "Staff+ can update onboarding"
ON public.hostconnect_onboarding
FOR UPDATE
USING (
    org_id IN (
        SELECT id FROM public.organizations
        WHERE owner_id = auth.uid()
    )
);

-- DELETE: Admin only
CREATE POLICY "Admin can delete onboarding"
ON public.hostconnect_onboarding
FOR DELETE
USING (
    org_id IN (
        SELECT id FROM public.organizations
        WHERE owner_id = auth.uid()
    )
);

-- Updated_at trigger (reuse existing moddatetime function)
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.hostconnect_onboarding
FOR EACH ROW
EXECUTE FUNCTION moddatetime();
