-- Programs table for registrar program management
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department TEXT,
  level TEXT DEFAULT 'undergraduate',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','running','paused','closed','archived')),
  description TEXT,
  credits_required INTEGER DEFAULT 120,
  duration_years INTEGER DEFAULT 4,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department);
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_programs_updated_at();

-- RLS policies
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Registrars: full access
CREATE POLICY "registrar_select_programs" ON programs
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'registrar')
  OR status IN ('active','running')
);

CREATE POLICY "registrar_insert_programs" ON programs
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'registrar')
);

CREATE POLICY "registrar_update_programs" ON programs
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'registrar')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'registrar')
);
