-- Fix the auto_link_cadet_by_regiment function to properly access user metadata
CREATE OR REPLACE FUNCTION public.auto_link_cadet_by_regiment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  matched_cadet_id UUID;
  regiment_num TEXT;
  user_metadata JSONB;
BEGIN
  -- Get user metadata from auth.users table
  SELECT raw_user_meta_data INTO user_metadata
  FROM auth.users 
  WHERE id = NEW.id;
  
  -- Extract regiment number from metadata
  regiment_num := user_metadata ->> 'regiment_number';
  
  -- If no regiment number provided, don't link
  IF regiment_num IS NULL OR regiment_num = '' THEN
    RETURN NEW;
  END IF;
  
  -- Find cadet with matching regiment number
  SELECT id INTO matched_cadet_id
  FROM public.cadets 
  WHERE regiment_no = regiment_num
  LIMIT 1;
  
  -- If match found, update the user profile with cadet_id
  IF matched_cadet_id IS NOT NULL THEN
    UPDATE public.user_profiles
    SET cadet_id = matched_cadet_id, updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;