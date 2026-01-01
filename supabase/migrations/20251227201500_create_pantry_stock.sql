-- Create Item Stock Table (Central Inventory)
CREATE TABLE IF NOT EXISTS public.item_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    location TEXT DEFAULT 'pantry' NOT NULL, -- 'pantry', 'laundry', 'maintenance_storage'
    quantity INTEGER DEFAULT 0 NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(item_id, location)
);

-- RLS for item_stock
ALTER TABLE public.item_stock ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view stock (Staff, Managers, Admins)
CREATE POLICY "Authenticated users can view stock" ON public.item_stock
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update stock (simplified for MVP)
CREATE POLICY "Authenticated users can update stock" ON public.item_stock
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify stock" ON public.item_stock
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete stock" ON public.item_stock
    FOR DELETE USING (auth.role() = 'authenticated');
