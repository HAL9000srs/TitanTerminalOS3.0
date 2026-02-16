-- ============================================================
-- Titan OS: Registrations Audit Table + Auto-Profile Trigger
-- Migration: 20260216_registrations_and_profile_trigger
-- ============================================================
-- 1. REGISTRATIONS TABLE (Audit log of all sign-ups)
CREATE TABLE IF NOT EXISTS public.registrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    display_name text,
    ip_address text,
    user_agent text,
    status text DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'FAILED')),
    created_at timestamptz DEFAULT now()
);
-- Create index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at DESC);
-- 2. ROW LEVEL SECURITY
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
-- Users can read their own registration records
CREATE POLICY "Users read own registrations" ON public.registrations FOR
SELECT USING (auth.uid() = user_id);
-- Service role has full access (for n8n workflows)
CREATE POLICY "Service role full access on registrations" ON public.registrations FOR ALL USING (auth.role() = 'service_role');
-- 3. AUTO-PROFILE TRIGGER FUNCTION
-- Automatically creates a profile row + registration audit entry
-- when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN -- Insert profile row with defaults
INSERT INTO public.profiles (user_id, role, display_name)
VALUES (
        NEW.id,
        'OPERATOR',
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            'OPERATOR'
        )
    ) ON CONFLICT (user_id) DO NOTHING;
-- Insert registration audit record
INSERT INTO public.registrations (user_id, email, display_name)
VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            'OPERATOR'
        )
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. ATTACH TRIGGER TO auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();