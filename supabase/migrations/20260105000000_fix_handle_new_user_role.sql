-- Fix: Remove automatic 'student' role insertion from handle_new_user trigger
-- The role should be set explicitly during signup, not defaulted to 'student'
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
    COALESCE(new.raw_user_meta_data ->> 'role', 'student')  -- Get role from metadata if provided, default to student
  );
  
  RETURN new;
END;
$$;
