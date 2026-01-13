import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key
const supabaseUrl = "https://oszbmaqieyemkgcqbeap.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error("Error: SUPABASE_SERVICE_KEY environment variable not set");
  console.error(
    "Please set the service role key from your Supabase project settings"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log("Applying migration: Rewriting registrar policies...");

    const { error } = await supabase.rpc("exec", {
      sql: `
-- First, create the academic_calendar_events table if it doesn't exist
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

-- Trigger
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

-- Enable RLS
ALTER TABLE academic_calendar_events ENABLE ROW LEVEL SECURITY;

-- Rewrite registrar policies from scratch
-- Create a function to check if user is registrar
CREATE OR REPLACE FUNCTION public.is_registrar(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'registrar'
  );
$$;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "registrar_select_calendar" ON academic_calendar_events;
DROP POLICY IF EXISTS "registrar_insert_calendar" ON academic_calendar_events;
DROP POLICY IF EXISTS "registrar_update_calendar" ON academic_calendar_events;
DROP POLICY IF EXISTS "registrar_select_programs" ON programs;
DROP POLICY IF EXISTS "registrar_insert_programs" ON programs;
DROP POLICY IF EXISTS "registrar_update_programs" ON programs;
DROP POLICY IF EXISTS "Registrars can view all transcript requests" ON transcript_requests;

-- Create new policies using the function
CREATE POLICY "registrar_select_calendar" ON academic_calendar_events
FOR SELECT TO authenticated
USING (is_registrar(auth.uid()) OR visibility = 'public');

CREATE POLICY "registrar_insert_calendar" ON academic_calendar_events
FOR INSERT TO authenticated
WITH CHECK (is_registrar(auth.uid()));

CREATE POLICY "registrar_update_calendar" ON academic_calendar_events
FOR UPDATE TO authenticated
USING (is_registrar(auth.uid()))
WITH CHECK (is_registrar(auth.uid()));

CREATE POLICY "registrar_select_programs" ON programs
FOR SELECT TO authenticated
USING (is_registrar(auth.uid()));

CREATE POLICY "registrar_insert_programs" ON programs
FOR INSERT TO authenticated
WITH CHECK (is_registrar(auth.uid()));

CREATE POLICY "registrar_update_programs" ON programs
FOR UPDATE TO authenticated
USING (is_registrar(auth.uid()))
WITH CHECK (is_registrar(auth.uid()));

CREATE POLICY "registrar_view_transcripts" ON transcript_requests
FOR SELECT TO authenticated
USING (is_registrar(auth.uid()));
      `,
    });

    if (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }

    console.log("✅ Migration applied successfully!");
    console.log("✅ Registrar policies rewritten");
    console.log("✅ Academic calendar table created");
  } catch (error) {
    console.error("Error applying migration:", error.message);
    process.exit(1);
  }
}

applyMigration();
