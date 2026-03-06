-- ============================================================================
-- UPH Room Types PRD - 9 Room Types for Urubici Park Hotel
-- ============================================================================
-- Property ID: 22222222-2222-2222-2222-222222222222
-- Org ID: b729534c-753b-48b0-ab4f-0756cc1cd271
-- 
-- This script creates 9 room types with correct capacities for the inventory.
-- It is IDEMPOTENT - safe to run multiple times.
-- ============================================================================

-- Constants
-- :uph_property_id: 22222222-2222-2222-2222-222222222222
-- :uph_org_id: b729534c-753b-48b0-ab4f-0756cc1cd271

-- Delete existing room types for this property (to ensure clean slate)
DELETE FROM public.room_types 
WHERE property_id = '22222222-2222-2222-2222-222222222222';

-- Insert 9 Room Types
INSERT INTO public.room_types (
    id,
    property_id,
    name,
    description,
    capacity,
    base_price,
    status,
    category,
    abbreviation,
    occupation_label,
    occupation_abbr
) VALUES 
(
    '33000000-0001-0001-0001-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'Standard Casal',
    'Quarto Standard com cama de casal, ideal para casais em busca de conforto básico.',
    2,
    280.00,
    'active',
    'standard',
    'STD',
    'Standard Casal',
    'STD C'
),
(
    '33000000-0001-0001-0001-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'Turismo Casal',
    'Quarto Tourism com cama de casal, perfeito para casais que buscam mais espaço e conforto.',
    2,
    350.00,
    'active',
    'tourism',
    'TUR',
    'Turismo Casal',
    'TUR C'
),
(
    '33000000-0001-0001-0001-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'Turismo Casal +1',
    'Quarto Tourism com cama de casal e sofá-cama, accommodates até 3 hóspedes.',
    3,
    420.00,
    'active',
    'tourism',
    'TUR+1',
    'Turismo Casal +1',
    'TUR C+1'
),
(
    '33000000-0001-0001-0001-000000000004',
    '22222222-2222-2222-2222-222222222222',
    'Turismo Casal +2',
    'Quarto Tourism com cama de casal e dois sofá-camas, para até 4 hóspedes.',
    4,
    490.00,
    'active',
    'tourism',
    'TUR+2',
    'Turismo Casal +2',
    'TUR C+2'
),
(
    '33000000-0001-0001-0001-000000000005',
    '22222222-2222-2222-2222-222222222222',
    'Turismo Casal +3',
    'Quarto Tourism amplo com cama de casal e três sofá-camas, para famílias maiores.',
    5,
    560.00,
    'active',
    'tourism',
    'TUR+3',
    'Turismo Casal +3',
    'TUR C+3'
),
(
    '33000000-0001-0001-0001-000000000006',
    '22222222-2222-2222-2222-222222222222',
    'Alpino Casal',
    'Quarto Alpino com vista para as montanhas, cama de casal e decoração rustica.',
    2,
    420.00,
    'active',
    'alpino',
    'ALP',
    'Alpino Casal',
    'ALP C'
),
(
    '33000000-0001-0001-0001-000000000007',
    '22222222-2222-2222-2222-222222222222',
    'Alpino Casal +2',
    'Quarto Alpino amplo com vista panorâmica, cama de casal e dois sofá-camas.',
    4,
    580.00,
    'active',
    'alpino',
    'ALP+2',
    'Alpino Casal +2',
    'ALP C+2'
),
(
    '33000000-0001-0001-0001-000000000008',
    '22222222-2222-2222-2222-222222222222',
    'Master Casal',
    'Suíte Master com cama king size, varanda com vista, ambiente exclusivo e sofisticato.',
    2,
    680.00,
    'active',
    'master',
    'MST',
    'Master Casal',
    'MST C'
),
(
    '33000000-0001-0001-0001-000000000009',
    '22222222-2222-2222-2222-222222222222',
    'Master Casal +1',
    'Suíte Master com cama king size, sofá-cama e varanda com vista para os cânions.',
    3,
    780.00,
    'active',
    'master',
    'MST+1',
    'Master Casal +1',
    'MST C+1'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capacity = EXCLUDED.capacity,
    base_price = EXCLUDED.base_price,
    status = EXCLUDED.status,
    category = EXCLUDED.category,
    abbreviation = EXCLUDED.abbreviation,
    occupation_label = EXCLUDED.occupation_label,
    occupation_abbr = EXCLUDED.occupation_abbr;

-- Verification (run separately)
-- SELECT id, name, capacity, base_price, category 
-- FROM public.room_types 
-- WHERE property_id = '22222222-2222-2222-2222-222222222222'
-- ORDER BY base_price;
