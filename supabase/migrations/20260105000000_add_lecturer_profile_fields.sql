-- Add lecturer-specific fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS office_location TEXT,
ADD COLUMN IF NOT EXISTS office_hours TEXT,
ADD COLUMN IF NOT EXISTS office_phone TEXT,
ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT 'Auto',
ADD COLUMN IF NOT EXISTS dashboard_layout TEXT DEFAULT 'Compact',
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS show_sidebar BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS animate_transitions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS compact_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_tooltips BOOLEAN DEFAULT true;

-- Add comments to explain the fields
COMMENT ON COLUMN profiles.specialization IS 'Lecturer area of specialization';
COMMENT ON COLUMN profiles.office_location IS 'Lecturer office location';
COMMENT ON COLUMN profiles.office_hours IS 'Lecturer office hours';
COMMENT ON COLUMN profiles.office_phone IS 'Lecturer office phone number';
COMMENT ON COLUMN profiles.color_theme IS 'User preferred color theme (Auto, Light, Dark)';
COMMENT ON COLUMN profiles.dashboard_layout IS 'Dashboard layout preference (Compact, Comfortable, Spacious)';
COMMENT ON COLUMN profiles.font_size IS 'Preferred font size (Small, Medium, Large)';
COMMENT ON COLUMN profiles.language IS 'User interface language';
COMMENT ON COLUMN profiles.show_sidebar IS 'Show sidebar on home page';
COMMENT ON COLUMN profiles.animate_transitions IS 'Enable UI transition animations';
COMMENT ON COLUMN profiles.compact_mode IS 'Enable compact UI mode';
COMMENT ON COLUMN profiles.show_tooltips IS 'Show helper tooltips';
