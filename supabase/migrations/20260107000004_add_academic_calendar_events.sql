-- Academic calendar events for registrar scheduling
CREATE TABLE IF NOT EXISTS academic_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'academic' CHECK (category IN ('academic','registration','enrollment','exams','graduation','holiday','deadline','other')),
  semester TEXT,
  academic_year TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','close','current','completed')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','internal')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_status ON academic_calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_visibility ON academic_calendar_events(visibility);
CREATE INDEX IF NOT EXISTS idx_calendar_dates ON academic_calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_category ON academic_calendar_events(category);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON academic_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- RLS policies
ALTER TABLE academic_calendar_events ENABLE ROW LEVEL SECURITY;

-- Registrars: full access
CREATE POLICY "registrar_select_calendar" ON academic_calendar_events
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'registrar')
  OR visibility = 'public'
);

CREATE POLICY "registrar_insert_calendar" ON academic_calendar_events
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'registrar')
);

CREATE POLICY "registrar_update_calendar" ON academic_calendar_events
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'registrar')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'registrar')
);
