-- Create transcript_requests table
CREATE TABLE IF NOT EXISTS transcript_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_records(id) ON DELETE CASCADE,
  student_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  
  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('official', 'unofficial', 'certified_copy')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'issued', 'rejected', 'cancelled')),
  purpose TEXT,
  delivery_method TEXT CHECK (delivery_method IN ('pickup', 'email', 'courier', 'postal')),
  delivery_address TEXT,
  
  -- Academic information
  program TEXT,
  graduation_date TIMESTAMPTZ,
  cumulative_gpa NUMERIC(3,2),
  total_credits INTEGER,
  
  -- Request processing
  requested_date TIMESTAMPTZ DEFAULT now(),
  processed_by UUID REFERENCES auth.users(id),
  processed_date TIMESTAMPTZ,
  issued_date TIMESTAMPTZ,
  
  -- Financial
  fees_paid BOOLEAN DEFAULT false,
  fee_amount NUMERIC(10,2),
  payment_reference TEXT,
  
  -- Confidentiality & tracking
  copies_issued INTEGER DEFAULT 0,
  verification_code TEXT UNIQUE,
  notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_transcript_requests_student_id ON transcript_requests(student_id);
CREATE INDEX idx_transcript_requests_student_number ON transcript_requests(student_number);
CREATE INDEX idx_transcript_requests_status ON transcript_requests(status);
CREATE INDEX idx_transcript_requests_request_type ON transcript_requests(request_type);
CREATE INDEX idx_transcript_requests_requested_date ON transcript_requests(requested_date DESC);
CREATE INDEX idx_transcript_requests_verification_code ON transcript_requests(verification_code);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transcript_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transcript_requests_updated_at
  BEFORE UPDATE ON transcript_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_transcript_requests_updated_at();

-- Function to generate unique verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate verification code on insert
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transcript_requests_verification_code
  BEFORE INSERT ON transcript_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_code();

-- RLS Policies for transcript_requests
ALTER TABLE transcript_requests ENABLE ROW LEVEL SECURITY;

-- Registrars can view all transcript requests
CREATE POLICY "Registrars can view all transcript requests"
  ON transcript_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'registrar'
    )
  );

-- Registrars can insert transcript requests
CREATE POLICY "Registrars can insert transcript requests"
  ON transcript_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'registrar'
    )
  );

-- Registrars can update transcript requests
CREATE POLICY "Registrars can update transcript requests"
  ON transcript_requests
  FOR UPDATE
  TO authenticated
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

-- Students can view their own transcript requests
CREATE POLICY "Students can view own transcript requests"
  ON transcript_requests
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM student_records
      WHERE email = auth.email()
    )
  );

-- Students can insert their own transcript requests
CREATE POLICY "Students can insert own transcript requests"
  ON transcript_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM student_records
      WHERE email = auth.email()
    )
  );

-- Students can update their own pending requests (e.g., cancel)
CREATE POLICY "Students can update own pending requests"
  ON transcript_requests
  FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM student_records
      WHERE email = auth.email()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM student_records
      WHERE email = auth.email()
    )
    AND status IN ('pending', 'cancelled')
  );
