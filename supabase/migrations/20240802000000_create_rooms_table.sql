CREATE TABLE public.rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    room_type_id uuid NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
    room_number text NOT NULL,
    status text DEFAULT 'available'::text NOT NULL, -- e.g., 'available', 'occupied', 'maintenance'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT rooms_room_number_property_id_key UNIQUE (room_number, property_id)
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users who own property" ON public.rooms FOR UPDATE USING (EXISTS ( SELECT 1 FROM public.properties WHERE properties.id = rooms.property_id AND properties.user_id = auth.uid() ));
CREATE POLICY "Enable delete for users who own property" ON public.rooms FOR DELETE USING (EXISTS ( SELECT 1 FROM public.properties WHERE properties.id = rooms.property_id AND properties.user_id = auth.uid() ));

-- Trigger para atualizar 'updated_at'
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION moddatetime();