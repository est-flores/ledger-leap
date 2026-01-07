-- LedgerLeap Database Schema
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE (linked to auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits_balance INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CONVERSIONS TABLE (file processing logs)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  result_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON public.conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON public.conversions(status);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only view and update their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Conversions: Users can only view and insert their own conversions
CREATE POLICY "Users can view own conversions" 
  ON public.conversions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions" 
  ON public.conversions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists (for re-running migrations)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. RPC FUNCTION: ADD CREDITS (Admin only)
-- ============================================
-- This function should only be called with service_role key
CREATE OR REPLACE FUNCTION public.add_credits(target_user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET credits_balance = credits_balance + amount,
      updated_at = NOW()
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RPC FUNCTION: DECREMENT CREDIT (Atomic)
-- ============================================
-- Returns TRUE if credit was deducted, FALSE if insufficient balance
CREATE OR REPLACE FUNCTION public.decrement_credit(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Lock the row for atomic operation
  SELECT credits_balance INTO current_balance
  FROM public.profiles
  WHERE id = target_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
  
  IF current_balance > 0 THEN
    UPDATE public.profiles
    SET credits_balance = credits_balance - 1,
        updated_at = NOW()
    WHERE id = target_user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. STORAGE BUCKETS (run separately or via Dashboard)
-- ============================================
-- Note: Storage bucket creation via SQL may require additional setup.
-- It's recommended to create these via Supabase Dashboard:
--   1. "raw-files" bucket (private) - for uploaded PDFs
--   2. "results" bucket (private) - for generated XLSX files

-- Storage policies (after buckets are created):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('raw-files', 'raw-files', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('results', 'results', false);

-- CREATE POLICY "Users can upload own files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'raw-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can read own files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id IN ('raw-files', 'results') AND auth.uid()::text = (storage.foldername(name))[1]);
