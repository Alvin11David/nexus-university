-- Add phone_number field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add comment to explain the field
COMMENT ON COLUMN profiles.phone_number IS 'User phone number for contact purposes';

-- Create an index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);
