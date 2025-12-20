-- Habilitar RLS para as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para a tabela 'profiles'
-- Permite que usuários autenticados vejam e atualizem seu próprio perfil
DROP POLICY IF EXISTS "Allow authenticated users to view their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Nota: A política de INSERT para 'profiles' geralmente é gerenciada por um trigger automático do Supabase
-- que cria um perfil quando um novo usuário é registrado em auth.users.

-- 2. Políticas para a tabela 'properties'
-- Permite que usuários autenticados gerenciem suas próprias propriedades
DROP POLICY IF EXISTS "Allow authenticated users to manage their own properties" ON public.properties;
CREATE POLICY "Allow authenticated users to manage their own properties" ON public.properties
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Políticas para a tabela 'bookings'
-- Permite que usuários autenticados gerenciem reservas associadas às SUAS propriedades
DROP POLICY IF EXISTS "Allow authenticated users to manage bookings for their properties" ON public.bookings;
CREATE POLICY "Allow authenticated users to manage bookings for their properties" ON public.bookings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()));

-- 4. Políticas para a tabela 'room_types'
-- Permite que usuários autenticados gerenciem tipos de acomodação associados às SUAS propriedades
DROP POLICY IF EXISTS "Allow authenticated users to manage room types for their properties" ON public.room_types;
CREATE POLICY "Allow authenticated users to manage room types for their properties" ON public.room_types
  FOR ALL USING (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()));

-- 5. Políticas para a tabela 'amenities'
-- Permite que usuários autenticados gerenciem TODAS as comodidades (consideradas recursos globais)
DROP POLICY IF EXISTS "Allow authenticated users to manage all amenities" ON public.amenities;
CREATE POLICY "Allow authenticated users to manage all amenities" ON public.amenities
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 6. Políticas para a tabela 'property_photos'
-- Permite que usuários autenticados gerenciem fotos associadas às SUAS propriedades
DROP POLICY IF EXISTS "Allow authenticated users to manage photos for their properties" ON public.property_photos;
CREATE POLICY "Allow authenticated users to manage photos for their properties" ON public.property_photos
  FOR ALL USING (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND user_id = auth.uid()));