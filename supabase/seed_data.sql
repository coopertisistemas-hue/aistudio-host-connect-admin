-- SQL para popular as tabelas com dados de exemplo e definir um usuário como admin.
-- Os IDs são gerados aleatoriamente ou hardcoded para este exemplo.
-- O 'ON CONFLICT (id) DO NOTHING' evita erros se você executar o script múltiplas vezes.

-- IMPORTANTE: O usuário com email 'admin@hostconnect.com' DEVE ser criado primeiro
-- através do fluxo de cadastro do seu aplicativo para que o ID exista na tabela auth.users.
-- Após o cadastro, copie o ID do usuário da tabela public.profiles e substitua 'SEU_USER_ID_AQUI'.

-- 1. Inserir uma propriedade associada ao usuário admin
INSERT INTO public.properties (id, user_id, name, description, address, city, state, country, postal_code, phone, email, total_rooms, status, created_at, updated_at)
VALUES (
    'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', -- ID de propriedade de exemplo
    'SEU_USER_ID_AQUI', -- SUBSTITUA PELO ID REAL DO USUÁRIO ADMIN CADASTRADO NO APP
    'Pousada do Sol',
    'Uma charmosa pousada com vista para a montanha, ideal para relaxar.',
    'Rua Principal, 100',
    'Urubici',
    'SC',
    'Brasil',
    '88650-000',
    '(49) 98765-4321',
    'contato@pousadadosol.com',
    15,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Inserir algumas comodidades
INSERT INTO public.amenities (id, name, icon, description, created_at, updated_at)
VALUES ('c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f', 'Wi-Fi Grátis', 'Wifi', 'Acesso à internet de alta velocidade em todas as áreas.', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.amenities (id, name, icon, description, created_at, updated_at)
VALUES ('d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a', 'Piscina Aquecida', 'SwimmingPool', 'Piscina coberta e aquecida disponível o ano todo.', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.amenities (id, name, icon, description, created_at, updated_at)
VALUES ('e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b', 'Café da Manhã', 'Coffee', 'Café da manhã completo incluso na diária.', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;

-- 3. Inserir um tipo de acomodação associado à propriedade e comodidades
INSERT INTO public.room_types (id, property_id, name, description, capacity, base_price, status, amenities_json, created_at, updated_at)
VALUES (
    'f5a6b7c8-d9e0-1f2a-3b4c-5d6e7f8a9b0c', -- ID do tipo de acomodação de exemplo
    'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', -- Referência ao ID da propriedade
    'Quarto Luxo',
    'Quarto espaçoso com cama king-size, vista panorâmica e todas as comodidades.',
    2,
    350.00,
    'active',
    ARRAY['c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f', 'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b']::text[], -- IDs das comodidades (Wi-Fi e Café da Manhã)
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Inserir uma reserva associada à propriedade
INSERT INTO public.bookings (id, property_id, guest_name, guest_email, guest_phone, check_in, check_out, total_guests, total_amount, status, notes, created_at, updated_at)
VALUES (
    '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', -- ID da reserva de exemplo
    'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', -- Referência ao ID da propriedade
    'Maria Oliveira',
    'maria.o@email.com',
    '(11) 91234-5678',
    '2024-11-10',
    '2024-11-15',
    2,
    1750.00,
    'confirmed',
    'Hóspedes solicitam berço extra para criança.',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Atualizar o papel do usuário para 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@hostconnect.com';