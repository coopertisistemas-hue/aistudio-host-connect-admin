CREATE TABLE public.pricing_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    room_type_id uuid REFERENCES public.room_types(id) ON DELETE CASCADE, -- Optional, for property-wide rules
    start_date date NOT NULL,
    end_date date NOT NULL,
    base_price_override numeric(10, 2), -- Direct price override
    price_modifier numeric(5, 2), -- Percentage modifier (e.g., 1.10 for +10%, 0.90 for -10%)
    min_stay integer DEFAULT 1,
    max_stay integer,
    promotion_name text,
    status text DEFAULT 'active' NOT NULL, -- 'active', 'inactive'
    CONSTRAINT pricing_rules_check_dates CHECK (end_date >= start_date),
    CONSTRAINT pricing_rules_check_price_or_modifier CHECK (base_price_override IS NOT NULL OR price_modifier IS NOT NULL)
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.pricing_rules FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.properties WHERE id = property_id));
CREATE POLICY "Enable update for users who own property" ON public.pricing_rules FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.properties WHERE id = property_id));
CREATE POLICY "Enable delete for users who own property" ON public.pricing_rules FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.properties WHERE id = property_id));

-- Trigger to update 'updated_at' column
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');