-- Update Alvin's profile to lecturer role
UPDATE public.profiles
SET role = 'lecturer',
    department = 'Computer Science'
WHERE email = 'alvin69david@gmail.com';
