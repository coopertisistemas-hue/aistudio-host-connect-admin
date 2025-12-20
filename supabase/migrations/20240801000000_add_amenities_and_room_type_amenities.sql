-- Create the amenities table
CREATE TABLE public.amenities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.amenities OWNER TO postgres;

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.amenities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.amenities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.amenities FOR DELETE USING (auth.role() = 'authenticated');

-- Add amenities_json column to room_types table
ALTER TABLE public.room_types
ADD COLUMN amenities_json jsonb DEFAULT '[]'::jsonb;

-- Update updated_at column automatically
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.amenities FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.room_types FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');