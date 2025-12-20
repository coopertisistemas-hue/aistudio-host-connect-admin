CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    is_per_person boolean DEFAULT false NOT NULL,
    is_per_day boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT services_pkey PRIMARY KEY (id),
    CONSTRAINT services_status_check CHECK (status IN ('active', 'inactive'))
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.services FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.services FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users who own the property" ON public.services FOR UPDATE USING (EXISTS ( SELECT 1 FROM public.properties WHERE (properties.id = services.property_id) AND (properties.user_id = auth.uid())));

CREATE POLICY "Enable delete for users who own the property" ON public.services FOR DELETE USING (EXISTS ( SELECT 1 FROM public.properties WHERE (properties.id = services.property_id) AND (properties.user_id = auth.uid())));

ALTER TABLE public.services ADD CONSTRAINT services_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

CREATE INDEX services_property_id_idx ON public.services USING btree (property_id);

-- Trigger to update 'updated_at' column
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');