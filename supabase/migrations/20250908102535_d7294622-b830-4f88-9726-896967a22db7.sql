-- Create function to automatically link cadet during user profile creation
CREATE OR REPLACE FUNCTION public.auto_link_cadet_by_regiment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  matched_cadet_id UUID;
  regiment_num TEXT;
BEGIN
  -- Get regiment number from user metadata
  regiment_num := (NEW.id::TEXT || '.raw_user_meta_data')::JSONB ->> 'regiment_number';
  
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

-- Create trigger to auto-link cadets on profile creation
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.auto_link_cadet_by_regiment();