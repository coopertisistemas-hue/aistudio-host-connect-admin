-- Adiciona a coluna 'phone' à tabela 'profiles' se ela ainda não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Cria ou substitui a função que lida com a criação de novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria ou substitui o trigger que chama a função 'handle_new_user'
-- após a inserção de um novo usuário na tabela 'auth.users'
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
