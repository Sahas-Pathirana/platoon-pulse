-- Just create profiles for existing users with proper data
INSERT INTO user_profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  'student'::user_role
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM user_profiles)
AND au.email IS NOT NULL;