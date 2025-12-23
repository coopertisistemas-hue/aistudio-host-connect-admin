CREATE TABLE IF NOT EXISTS public.booking_charges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT DEFAULT 'minibar',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.booking_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.booking_charges FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.booking_charges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
