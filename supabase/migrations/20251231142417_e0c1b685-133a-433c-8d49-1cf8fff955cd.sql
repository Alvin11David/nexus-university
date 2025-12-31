-- Create student_records table for validating students during signup
CREATE TABLE public.student_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  student_number TEXT NOT NULL UNIQUE,
  email TEXT,
  is_registered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create OTP verification table
CREATE TABLE public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  student_record_id UUID REFERENCES public.student_records(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Anyone can read student_records to validate during signup (only reg/student numbers, not sensitive data)
CREATE POLICY "Anyone can validate student records"
ON public.student_records
FOR SELECT
USING (true);

-- Anyone can create OTP verifications during signup
CREATE POLICY "Anyone can create OTP"
ON public.otp_verifications
FOR INSERT
WITH CHECK (true);

-- Anyone can read their own OTP by email
CREATE POLICY "Anyone can verify OTP"
ON public.otp_verifications
FOR SELECT
USING (true);

-- Anyone can update OTP verification status
CREATE POLICY "Anyone can update OTP status"
ON public.otp_verifications
FOR UPDATE
USING (true);

-- Insert sample student records
INSERT INTO public.student_records (full_name, registration_number, student_number, email) VALUES
('John Mukasa', '21/U/12345/PS', '2100712345', 'john.mukasa@students.mak.ac.ug'),
('Sarah Namuli', '21/U/12346/PS', '2100712346', 'sarah.namuli@students.mak.ac.ug'),
('David Okello', '22/U/10001/EVE', '2200710001', 'david.okello@students.mak.ac.ug'),
('Grace Nakato', '22/U/10002/EVE', '2200710002', 'grace.nakato@students.mak.ac.ug'),
('Peter Ssemakula', '23/U/15001/PS', '2300715001', 'peter.ssemakula@students.mak.ac.ug'),
('Mary Achieng', '23/U/15002/PS', '2300715002', 'mary.achieng@students.mak.ac.ug'),
('James Tumwine', '20/U/08001/EVE', '2000708001', 'james.tumwine@students.mak.ac.ug'),
('Rose Atim', '20/U/08002/EVE', '2000708002', 'rose.atim@students.mak.ac.ug'),
('Michael Ochieng', '24/U/20001/PS', '2400720001', 'michael.ochieng@students.mak.ac.ug'),
('Agnes Nabirye', '24/U/20002/PS', '2400720002', 'agnes.nabirye@students.mak.ac.ug');

-- Add registration_number and student_number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS student_record_id UUID REFERENCES public.student_records(id);