-- Add missing columns to student_records table for registrar management
ALTER TABLE public.student_records
ADD COLUMN IF NOT EXISTS enrollment_status TEXT DEFAULT 'active' CHECK (enrollment_status IN ('active', 'inactive', 'graduated', 'suspended')),
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS program TEXT,
ADD COLUMN IF NOT EXISTS year_of_study INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS date_of_admission TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_student_records_enrollment_status ON public.student_records(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_student_records_department ON public.student_records(department);
CREATE INDEX IF NOT EXISTS idx_student_records_student_number ON public.student_records(student_number);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_records_updated_at_trigger ON public.student_records;
CREATE TRIGGER student_records_updated_at_trigger
BEFORE UPDATE ON public.student_records
FOR EACH ROW
EXECUTE FUNCTION update_student_records_updated_at();

-- Update RLS policies for registrar access
DROP POLICY IF EXISTS "Registrars can view all student records" ON public.student_records;
DROP POLICY IF EXISTS "Registrars can update student records" ON public.student_records;
DROP POLICY IF EXISTS "Registrars can delete student records" ON public.student_records;

-- Allow registrars to read student records
CREATE POLICY "Registrars can view all student records"
ON public.student_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'registrar'
  )
);

-- Allow registrars to update student records
CREATE POLICY "Registrars can update student records"
ON public.student_records
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'registrar'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'registrar'
  )
);

-- Allow registrars to delete student records
CREATE POLICY "Registrars can delete student records"
ON public.student_records
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'registrar'
  )
);

-- Allow registrars to insert student records
CREATE POLICY "Registrars can create student records"
ON public.student_records
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'registrar'
  )
);
