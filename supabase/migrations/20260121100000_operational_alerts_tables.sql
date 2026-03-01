-- Sprint 3.3 Task 1: Supabase Tables Verification Script (FIXED)
-- Este script verifica e cria (se necessário) as tabelas usadas pelos alertas operacionais

-- ====================================
-- TABELA: precheckin_sessions
-- ====================================
-- Verificar se a tabela existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'precheckin_sessions'
  ) THEN
    
    -- Criar tabela precheckin_sessions
    CREATE TABLE public.precheckin_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
      org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('pending', 'incomplete', 'complete')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    RAISE NOTICE 'Tabela precheckin_sessions criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela precheckin_sessions já existe';
  END IF;
END$$;

-- Índices para precheckin_sessions (criar se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'precheckin_sessions' 
    AND indexname = 'idx_precheckin_sessions_booking_id'
  ) THEN
    CREATE INDEX idx_precheckin_sessions_booking_id ON public.precheckin_sessions(booking_id);
    RAISE NOTICE 'Índice idx_precheckin_sessions_booking_id criado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'precheckin_sessions' 
    AND indexname = 'idx_precheckin_sessions_org_id'
  ) THEN
    CREATE INDEX idx_precheckin_sessions_org_id ON public.precheckin_sessions(org_id);
    RAISE NOTICE 'Índice idx_precheckin_sessions_org_id criado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'precheckin_sessions' 
    AND indexname = 'idx_precheckin_sessions_status'
  ) THEN
    CREATE INDEX idx_precheckin_sessions_status ON public.precheckin_sessions(status);
    RAISE NOTICE 'Índice idx_precheckin_sessions_status criado';
  END IF;
END$$;

-- RLS para precheckin_sessions
ALTER TABLE public.precheckin_sessions ENABLE ROW LEVEL SECURITY;

-- Policy (drop se existir, depois cria)
DROP POLICY IF EXISTS "Users can view own org precheckin sessions" ON public.precheckin_sessions;
CREATE POLICY "Users can view own org precheckin sessions"
  ON public.precheckin_sessions
  FOR SELECT
  USING (org_id = (SELECT current_setting('app.current_org_id', TRUE)::UUID));

-- ====================================
-- TABELA: booking_guests
-- ====================================
-- Verificar se a tabela existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'booking_guests'
  ) THEN
    
    -- Criar tabela booking_guests
    CREATE TABLE public.booking_guests (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
      org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      is_primary BOOLEAN DEFAULT FALSE,
      guest_name TEXT,
      guest_email TEXT,
      guest_document TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    RAISE NOTICE 'Tabela booking_guests criada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela booking_guests já existe';
  END IF;
END$$;

-- Índices para booking_guests (criar se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'booking_guests' 
    AND indexname = 'idx_booking_guests_booking_id'
  ) THEN
    CREATE INDEX idx_booking_guests_booking_id ON public.booking_guests(booking_id);
    RAISE NOTICE 'Índice idx_booking_guests_booking_id criado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'booking_guests' 
    AND indexname = 'idx_booking_guests_org_id'
  ) THEN
    CREATE INDEX idx_booking_guests_org_id ON public.booking_guests(org_id);
    RAISE NOTICE 'Índice idx_booking_guests_org_id criado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'booking_guests' 
    AND indexname = 'idx_booking_guests_is_primary'
  ) THEN
    CREATE INDEX idx_booking_guests_is_primary ON public.booking_guests(is_primary);
    RAISE NOTICE 'Índice idx_booking_guests_is_primary criado';
  END IF;
END$$;

-- RLS para booking_guests
ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;

-- Policy (drop se existir, depois cria)
DROP POLICY IF EXISTS "Users can view own org booking guests" ON public.booking_guests;
CREATE POLICY "Users can view own org booking guests"
  ON public.booking_guests
  FOR SELECT
  USING (org_id = (SELECT current_setting('app.current_org_id', TRUE)::UUID));

-- ====================================
-- VERIFICAÇÃO FINAL
-- ====================================
SELECT 
  'precheckin_sessions' AS table_name,
  COUNT(*) AS row_count
FROM public.precheckin_sessions;

SELECT 
  'booking_guests' AS table_name,
  COUNT(*) AS row_count
FROM public.booking_guests;
