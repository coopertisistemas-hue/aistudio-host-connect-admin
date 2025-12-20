-- Create the 'profiles' table
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    email text UNIQUE NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create the 'properties' table
CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL, -- Temporarily without FK to avoid circular dependency if profiles is not fully ready
    name text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    country text DEFAULT 'Brasil' NOT NULL,
    postal_code text,
    phone text,
    email text,
    total_rooms integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create the 'property_photos' table
CREATE TABLE public.property_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    property_id uuid NOT NULL, -- Temporarily without FK
    photo_url text NOT NULL,
    is_primary boolean DEFAULT false,
    display_order integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create the 'bookings' table
CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    property_id uuid NOT NULL, -- Temporarily without FK
    guest_name text NOT NULL,
    guest_email text NOT NULL,
    guest_phone text,
    check_in date NOT NULL,
    check_out date NOT NULL,
    total_guests integer DEFAULT 1 NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status text DEFAULT 'pending' NOT NULL, -- 'pending', 'confirmed', 'cancelled', 'completed'
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add Foreign Key constraints after all tables are created
ALTER TABLE public.properties ADD CONSTRAINT properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.property_photos ADD CONSTRAINT property_photos_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for 'profiles'
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own profile." ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS policies for 'properties'
CREATE POLICY "Users can view their own properties." ON public.properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own properties." ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own properties." ON public.properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own properties." ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for 'property_photos'
CREATE POLICY "Property photos are viewable by property owners." ON public.property_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_photos.property_id AND user_id = auth.uid())
);
CREATE POLICY "Property owners can insert photos." ON public.property_photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_photos.property_id AND user_id = auth.uid())
);
CREATE POLICY "Property owners can update photos." ON public.property_photos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_photos.property_id AND user_id = auth.uid())
);
CREATE POLICY "Property owners can delete photos." ON public.property_photos FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_photos.property_id AND user_id = auth.uid())
);

-- RLS policies for 'bookings'
CREATE POLICY "Bookings are viewable by property owners." ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = bookings.property_id AND user_id = auth.uid())
);
CREATE POLICY "Property owners can insert bookings." ON public.bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties WHERE id = bookings.property_id AND user_id = auth.uid())
);
CREATE POLICY "Property owners can update bookings." ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = bookings.property_id AND user_id = auth.uid())
);
CREATE POLICY "Property owners can delete bookings." ON public.bookings FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = bookings.property_id AND user_id = auth.uid())
);

-- Create a trigger to update 'updated_at' timestamp for 'profiles'
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION moddatetime();
CREATE TRIGGER handle_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION moddatetime();
CREATE TRIGGER handle_property_photos_updated_at BEFORE UPDATE ON public.property_photos FOR EACH ROW EXECUTE FUNCTION moddatetime();
CREATE TRIGGER handle_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION moddatetime();

-- Create a function to create a profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call 'handle_new_user' function on auth.users inserts
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();