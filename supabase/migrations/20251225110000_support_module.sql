-- Migration: Support Module (Tickets & Ideas)
-- Description: Implements database schema for Support Tickets and Ideas with strict Owner-Based RLS and Staff privileges.
-- Date: 2025-12-25

-- 0. Ensure Utility Functions Exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Helper Function & Staff Table
-- We create a table to explicitly list who is "HostConnect Staff".
CREATE TABLE public.hostconnect_staff (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'support', -- e.g., 'support', 'admin', 'developer'
    created_at timestamptz DEFAULT now()
);

-- RLS for hostconnect_staff: Only admins or the staff themselves can view/edit? 
-- Actually, for the system to work, we mostly check existence. 
-- We'll strict it down.
ALTER TABLE public.hostconnect_staff ENABLE ROW LEVEL SECURITY;
-- For now, no public policies needed on this table if we only use the Security Definer function.

-- Helper Function: is_hostconnect_staff()
CREATE OR REPLACE FUNCTION public.is_hostconnect_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.hostconnect_staff WHERE user_id = auth.uid()
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_hostconnect_staff() TO authenticated;


-- 2. Schema: Tickets
CREATE TABLE public.tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    severity text NOT NULL DEFAULT 'low', -- low, medium, high, critical
    category text DEFAULT 'general', -- bug, billing, general
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Schema: Ticket Comments
CREATE TABLE public.ticket_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_staff_reply boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 4. Schema: Ideas
CREATE TABLE public.ideas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'under_review', -- under_review, planned, in_progress, completed, declined
    votes integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Schema: Idea Comments
CREATE TABLE public.idea_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_staff_reply boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);


-- 6. Indexes
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);

CREATE INDEX idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX idx_ideas_status ON public.ideas(status);
CREATE INDEX idx_idea_comments_idea_id ON public.idea_comments(idea_id);


-- 7. RLS Policies

-- Tabela: tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff views all tickets" ON public.tickets FOR SELECT
    USING (public.is_hostconnect_staff());

CREATE POLICY "Users view own tickets" ON public.tickets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users inset own tickets" ON public.tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff updates tickets" ON public.tickets FOR UPDATE
    USING (public.is_hostconnect_staff());

-- Tabela: ticket_comments
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff views all comments" ON public.ticket_comments FOR SELECT
    USING (public.is_hostconnect_staff());

CREATE POLICY "Users view comments on own tickets" ON public.ticket_comments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_id AND user_id = auth.uid()));

CREATE POLICY "Staff inserts comments" ON public.ticket_comments FOR INSERT
    WITH CHECK (public.is_hostconnect_staff());

CREATE POLICY "Users comment on own tickets" ON public.ticket_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_id AND user_id = auth.uid())
    );

-- Tabela: ideas
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff views all ideas" ON public.ideas FOR SELECT
    USING (public.is_hostconnect_staff());

CREATE POLICY "Users view own ideas" ON public.ideas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ideas" ON public.ideas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff updates ideas" ON public.ideas FOR UPDATE
    USING (public.is_hostconnect_staff());

-- Tabela: idea_comments
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff views all idea comments" ON public.idea_comments FOR SELECT
    USING (public.is_hostconnect_staff());

CREATE POLICY "Users view comments on own ideas" ON public.idea_comments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid()));

CREATE POLICY "Staff inserts idea comments" ON public.idea_comments FOR INSERT
    WITH CHECK (public.is_hostconnect_staff());

CREATE POLICY "Users comment on own ideas" ON public.idea_comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
    );


-- 8. Trigger for updated_at (Assuming moddatetime exists from previous migrations)
-- If not, create it or use simple trigger
CREATE TRIGGER update_tickets_modtime BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ideas_modtime BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
