CREATE TABLE public.website_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    setting_key text NOT NULL,
    setting_value jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT website_settings_pkey PRIMARY KEY (id),
    CONSTRAINT website_settings_property_id_setting_key_key UNIQUE (property_id, setting_key)
);

ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.website_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.website_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.website_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.website_settings FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE public.website_settings ADD CONSTRAINT website_settings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');