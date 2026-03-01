-- ============================================================================
-- UPH Property PRD - Urubici Park Hotel (Real Property)
-- ============================================================================
-- Org ID: b729534c-753b-48b0-ab4f-0756cc1cd271
-- Admin User ID: d94701c4-30cd-45c7-b642-40b35ef8894c
-- 
-- This script creates the REAL UPH property to replace the seed data.
-- It is IDEMPOTENT - safe to run multiple times.
-- ============================================================================

-- Constants
-- :uph_org_id: b729534c-753b-48b0-ab4f-0756cc1cd271
-- :uph_admin_user_id: d94701c4-30cd-45c7-b642-40b35ef8894c

-- Step 1: Delete existing seed property (if exists) for this org
-- We only delete rooms and room_types first to maintain referential integrity
DELETE FROM public.rooms 
WHERE property_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.room_types 
WHERE property_id = '11111111-1111-1111-1111-111111111111';

-- Step 2: Delete the seed property itself
DELETE FROM public.properties 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Step 3: Insert the REAL UPH property
INSERT INTO public.properties (
    id,
    user_id,
    name,
    description,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    email,
    total_rooms,
    status,
    org_id
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'd94701c4-30cd-45c7-b642-40b35ef8894c',
    'Urubici Park Hotel',
    'Hotel de referência em Urubici/SC, localizado na Serra da Boa Vista com vista para os cânions e natureza preservada. Estrutura completa para famílias, casais e grupos.',
    'Estrada do Rio Rindo, S/N - Cerro dos Liberal',
    'Urubici',
    'SC',
    'Brasil',
    '88650-000',
    '(49) 3278-1234',
    'reservas@urubiciparkhotel.com.br',
    44,
    'active',
    'b729534c-753b-48b0-ab4f-0756cc1cd271'
) ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    postal_code = EXCLUDED.postal_code,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    total_rooms = EXCLUDED.total_rooms,
    status = EXCLUDED.status,
    org_id = EXCLUDED.org_id;

-- Step 4: Update hostconnect_onboarding to link to the new property
UPDATE public.hostconnect_onboarding
SET property_id = '22222222-2222-2222-2222-222222222222',
    updated_at = now()
WHERE org_id = 'b729534c-753b-48b0-ab4f-0756cc1cd271'
  AND (property_id IS NULL OR property_id = '11111111-1111-1111-1111-111111111111');

-- Verification (run separately)
-- SELECT p.id, p.name, p.city, p.state, p.org_id, ho.property_id as onboarding_property
-- FROM public.properties p
-- LEFT JOIN public.hostconnect_onboarding ho ON ho.org_id = p.org_id
-- WHERE p.org_id = 'b729534c-753b-48b0-ab4f-0756cc1cd271';
