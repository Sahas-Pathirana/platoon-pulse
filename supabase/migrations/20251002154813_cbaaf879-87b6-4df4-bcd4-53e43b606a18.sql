-- Add auth_user_id to pending_cadets to track the unconfirmed auth account
ALTER TABLE public.pending_cadets 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Remove password column if it exists (not needed anymore - Supabase handles it)
ALTER TABLE public.pending_cadets 
DROP COLUMN IF EXISTS password;

-- Add comment
COMMENT ON COLUMN public.pending_cadets.auth_user_id IS 'Reference to the unconfirmed Supabase auth user created during registration';

-- Update user_profiles to allow service role to manage profiles for account confirmation
-- This policy already exists, just ensuring it's correct