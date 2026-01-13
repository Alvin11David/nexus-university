-- Add role column to profiles and ensure handle_new_user stays aligned
BEGIN;

-- Add role column typed to existing user_role enum
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.user_role;

-- Backfill existing rows and enforce defaults/not-null
UPDATE public.profiles
  SET role = 'student'
  WHERE role IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'student';

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL;

-- Keep handle_new_user trigger in sync with the schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url',
    COALESCE((new.raw_user_meta_data ->> 'role')::public.user_role, 'student'::public.user_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      role = COALESCE(EXCLUDED.role, public.profiles.role);

  RETURN new;
END;
$$;

COMMIT;
