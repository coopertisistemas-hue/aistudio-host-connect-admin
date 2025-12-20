-- Create storage bucket for property photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true);

-- Create property_photos table
CREATE TABLE public.property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_photos
CREATE POLICY "Users can view photos for own properties"
ON public.property_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert photos for own properties"
ON public.property_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update photos for own properties"
ON public.property_photos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete photos for own properties"
ON public.property_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_photos.property_id
    AND properties.user_id = auth.uid()
  )
);

-- Storage policies for property-photos bucket
CREATE POLICY "Users can view property photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-photos');

CREATE POLICY "Users can upload photos to own properties"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own property photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own property photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger for updated_at
CREATE TRIGGER update_property_photos_updated_at
BEFORE UPDATE ON public.property_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();