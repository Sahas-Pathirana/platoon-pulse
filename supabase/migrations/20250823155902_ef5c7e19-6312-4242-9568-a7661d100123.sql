-- First, let's check what users exist and create profiles for them
INSERT INTO user_profiles (id, role)
SELECT 
  id,
  'student' as role
FROM auth.users 
WHERE id NOT IN (SELECT id FROM user_profiles);

-- Update the trigger function to handle signup properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();