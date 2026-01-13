# Quick Fix: Apply Database Migration for phone_number Column

## Issue
You're getting: "Save failed could not find the phone_number column of profiles in the schema cache"

This means the TypeScript code is ready, but the database schema is missing the `phone_number` column.

## Solution: Apply the Migration

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to Supabase Console:**
   - Visit: https://app.supabase.com/
   - Select your project: "nexus-university"

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute This SQL:**
```sql
-- Add phone_number field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add comment to explain the field
COMMENT ON COLUMN profiles.phone_number IS 'User phone number for contact purposes';

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);
```

4. **Click "Run" or press Ctrl+Enter**

5. **Verify Success:**
   - You should see: "0 rows affected" (meaning the command executed)
   - The schema cache will automatically refresh

---

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed:

```bash
cd c:\Users\ALVIN\nexus-university
supabase db push
```

This will automatically apply the migration file: `supabase/migrations/20260107000000_add_phone_number_to_profiles.sql`

---

## After Applying the Migration

Once the SQL executes:

1. **Refresh your browser**
2. **Go back to LecturerSettings**
3. **Try entering a phone number and saving**
4. **It should work without errors** ✅

---

## Verification

To verify the column was added:

1. Go to Supabase Dashboard
2. Click "Database" → "profiles" table
3. Look for the `phone_number` column in the schema
4. You should see it listed with type: `varchar(20)`

---

## Why This Happened

- The TypeScript code was updated to include the `phone_number` field
- The migration file was created
- But the migration wasn't executed in the database yet
- So when the app tried to save `phone_number`, the database didn't recognize the field

Now that you know what to do, the phone number feature will work perfectly! 🎉
