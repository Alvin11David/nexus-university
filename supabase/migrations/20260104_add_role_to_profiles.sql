-- Add role column to profiles table (if it doesn't exist)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'lecturer'));

-- Create an index on role for faster queries (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
