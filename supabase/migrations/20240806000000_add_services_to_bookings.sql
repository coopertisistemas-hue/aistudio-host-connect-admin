ALTER TABLE public.bookings
ADD COLUMN services_json jsonb DEFAULT '[]'::jsonb;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN public.bookings.services_json IS 'JSON array of service IDs associated with the booking.';