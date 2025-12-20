-- Drop existing policies first to avoid conflicts, using both old and new names where applicable
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to manage bookings for their properties" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated users to manage room types for their properties" ON public.room_types;
DROP POLICY IF EXISTS "Allow authenticated users to manage all amenities" ON public.amenities;
DROP POLICY IF EXISTS "Allow authenticated users to manage photos for their entities" ON public.entity_photos;

-- Drop tables if they exist to ensure a clean recreation
-- Drop tables in reverse order of dependencies to avoid FK constraint errors
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.room_types CASCADE;
DROP TABLE IF EXISTS public.entity_photos CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.amenities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Habilitar a extensão uuid-ossp para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    role text DEFAULT 'user' NOT NULL, -- Adicionada a coluna 'role' com valor padrão 'user'
    plan text DEFAULT 'free' NOT NULL, -- Adicionada a coluna 'plan' com valor padrão 'free'
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Tabela: properties
CREATE TABLE public.properties (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
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
    CONSTRAINT properties_pkey PRIMARY KEY (id)
);

-- Tabela: amenities
CREATE TABLE public.amenities (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    icon text,
    description text,
    CONSTRAINT amenities_pkey PRIMARY KEY (id)
);

-- Tabela: room_types
CREATE TABLE public.room_types (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    capacity integer DEFAULT 1 NOT NULL,
    base_price numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    amenities_json text[], -- Armazena IDs de comodidades como um array de texto
    CONSTRAINT room_types_pkey PRIMARY KEY (id)
);

-- Tabela: bookings
CREATE TABLE public.bookings (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    guest_name text NOT NULL,
    guest_email text NOT NULL,
    guest_phone text,
    check_in date NOT NULL,
    check_out date NOT NULL,
    total_guests integer DEFAULT 1 NOT NULL,
    total_amount numeric DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    notes text,
    CONSTRAINT bookings_pkey PRIMARY KEY (id)
);

-- Tabela: entity_photos (renamed from property_photos)
CREATE TABLE public.entity_photos (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    entity_id uuid NOT NULL, -- Changed from property_id, removed FK for polymorphism
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    photo_url text NOT NULL,
    is_primary boolean DEFAULT false,
    display_order integer DEFAULT 0,
    CONSTRAINT entity_photos_pkey PRIMARY KEY (id)
);

-- Configurar RLS para as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_photos ENABLE ROW LEVEL SECURITY;

-- Function to get the current user's role from the profiles table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Important for RLS to access profiles table
AS $$
  DECLARE
    user_role text;
  BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN user_role;
  END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- 1. Políticas para a tabela 'profiles'
CREATE POLICY "Allow authenticated users to view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Políticas para a tabela 'properties'
CREATE POLICY "Allow admins to manage all properties or owner to manage their own" ON public.properties
  FOR ALL USING ((public.get_user_role() = 'admin') OR (auth.uid() = user_id))
  WITH CHECK ((public.get_user_role() = 'admin') OR (auth.uid() = user_id));

-- 3. Políticas para a tabela 'bookings'
CREATE POLICY "Allow admins to manage all bookings or owner of property to manage" ON public.bookings
  FOR ALL USING ((public.get_user_role() = 'admin') OR (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())))
  WITH CHECK ((public.get_user_role() = 'admin') OR (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())));

-- 4. Políticas para a tabela 'room_types'
CREATE POLICY "Allow admins to manage all room types or owner of property to manage" ON public.room_types
  FOR ALL USING ((public.get_user_role() = 'admin') OR (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())))
  WITH CHECK ((public.get_user_role() = 'admin') OR (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid())));

-- 5. Políticas para a tabela 'amenities'
CREATE POLICY "Allow admins to manage all amenities" ON public.amenities
  FOR ALL USING (public.get_user_role() = 'admin') WITH CHECK (public.get_user_role() = 'admin');

-- 6. Políticas para a tabela 'entity_photos'
CREATE POLICY "Allow admins to manage all photos or owner of entity to manage" ON public.entity_photos
  FOR ALL USING (
    (public.get_user_role() = 'admin')
    OR
    (EXISTS (SELECT 1 FROM public.properties WHERE id = entity_id AND user_id = auth.uid()))
    OR
    (EXISTS (SELECT 1 FROM public.room_types rt JOIN public.properties p ON rt.property_id = p.id WHERE rt.id = entity_id AND p.user_id = auth.uid()))
  )
  WITH CHECK (
    (public.get_user_role() = 'admin')
    OR
    (EXISTS (SELECT 1 FROM public.properties WHERE id = entity_id AND user_id = auth.uid()))
    OR
    (EXISTS (SELECT 1 FROM public.room_types rt JOIN public.properties p ON rt.property_id = p.id WHERE rt.id = entity_id AND p.user_id = auth.uid()))
  );