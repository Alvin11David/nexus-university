-- Create student_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.student_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  student_number TEXT NOT NULL UNIQUE,
  email TEXT,
  is_registered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_records ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Anyone can create student records" ON public.student_records;
DROP POLICY IF EXISTS "Anyone can update student records" ON public.student_records;

-- Allow anyone to insert student records during signup
CREATE POLICY "Anyone can create student records"
ON public.student_records
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update student records during signup (to mark as registered and update name/email)
CREATE POLICY "Anyone can update student records"
ON public.student_records
FOR UPDATE
USING (true)
WITH CHECK (true);

