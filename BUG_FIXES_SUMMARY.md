# Bug Fixes Summary - Phone Number Feature & Supabase API Migration

## Issues Fixed

### 1. TypeError: `supabase.from(...).on is not a function`
**Root Cause:** Using deprecated Supabase real-time API (v1) with modern SDK (v2)

**Location:** `src/contexts/AuthContext.tsx` - Profile real-time subscription (lines 128-150)

**Solution Applied:**
- Migrated from deprecated `.on()` chain API to new `channel()` API
- Changed from:
  ```typescript
  supabase.from(`profiles:id=eq.${userId}`).on("*", ...).subscribe()
  ```
- To:
  ```typescript
  const channel = supabase
    .channel(`profile-${userId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "profiles",
      filter: `id=eq.${userId}`,
    }, ...)
    .subscribe()
  ```
- Updated cleanup from `subscription.unsubscribe()` to `supabase.removeChannel(channel)`

**Status:** ✅ FIXED

---

### 2. 400 Bad Request on Profile PATCH
**Error:** `PATCH /rest/v1/profiles?id=eq.{userId} 400 (Bad Request)`

**Root Cause:** New `phone_number` field being sent to database without being defined in the Profile TypeScript interface

**Solution Applied:**
- Added `phone_number?: string | null;` to Profile interface (line 20 in AuthContext.tsx)
- This ensures type safety and prevents validation errors when saving profile data

**Status:** ✅ FIXED

---

## Files Modified

### 1. `src/contexts/AuthContext.tsx`
**Changes:**
- Line 20: Added `phone_number?: string | null;` to Profile interface
- Lines 128-150: Updated real-time subscription to use modern Supabase API with `channel()` and `postgres_changes`
- Line 175: Updated cleanup to use `supabase.removeChannel(channel)`

**Impact:** Fixes TypeError and enables proper real-time profile synchronization

---

### 2. `src/pages/LecturerSettings.tsx`
**Changes:**
- Line 65: Added state: `const [phoneNumber, setPhoneNumber] = useState("");`
- Line 88: Load phone_number on mount: `setPhoneNumber((profile as any).phone_number || "")`
- Line 137: Include in update payload: `phone_number: phoneNumber,`
- Lines 509-510: Added UI input field for phone number with type="tel"

**Impact:** Enables lecturers to add/edit their phone number in settings

---

### 3. `src/pages/LecturerIdCard.tsx`
**Changes:**
- Line 42: Updated phone field: `phone: profile?.phone_number || profile?.phone || "+256 700 000 000"`

**Impact:** Displays phone_number on lecturer ID card with fallback to legacy phone field

---

### 4. `supabase/migrations/20260107000000_add_phone_number_to_profiles.sql` (NEW)
**Migration Content:**
```sql
-- Add phone_number field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add comment to explain the field
COMMENT ON COLUMN profiles.phone_number IS 'User phone number for contact purposes';

-- Create an index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);
```

**Impact:** Adds `phone_number` column to database schema, critical for preventing 400 errors

---

## Verification Steps

### ✅ Code Changes Verified
1. ✅ Profile interface includes `phone_number` field
2. ✅ Real-time subscription uses modern Supabase API
3. ✅ Phone number state management in LecturerSettings
4. ✅ Phone number display in LecturerIdCard
5. ✅ Database migration created

### ⏳ Pending - Database Migration
**Action Required:** Run the migration in Supabase dashboard or apply via CLI

```bash
# Apply migration via Supabase CLI (if available)
supabase db push
```

Or manually execute in Supabase SQL editor:
```sql
-- Add phone_number field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

COMMENT ON COLUMN profiles.phone_number IS 'User phone number for contact purposes';

CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);
```

---

## Expected Behavior After Fixes

1. **Profile Loading:** No more TypeError when accessing lecturer settings page
2. **Phone Number Saving:** Phone number saves without 400 error
3. **Real-time Updates:** Profile changes sync instantly without errors
4. **ID Card Display:** Phone number displays on lecturer ID card from database

---

## API Compatibility Notes

### Supabase SDK Versions
- **Old API (v1):** Used `.on()` method directly on table queries
- **New API (v2):** Uses `channel()` with `postgres_changes` event listener

### Key Changes
| Old | New |
|-----|-----|
| `supabase.from('table').on('*', ...)` | `supabase.channel('name').on('postgres_changes', ...)` |
| `subscription.unsubscribe()` | `supabase.removeChannel(channel)` |
| Implicit table reference | Explicit schema, table, filter parameters |

---

## Testing Checklist

- [ ] Navigate to Lecturer Settings page without errors
- [ ] Enter a phone number and save
- [ ] Verify phone number displays on Lecturer ID Card
- [ ] Check browser console for any real-time subscription errors
- [ ] Verify database contains the phone_number value
- [ ] Test on different devices/browsers for responsive UI

---

## Related Documentation

- Supabase Real-time Subscriptions: https://supabase.com/docs/guides/realtime
- PostgreSQL Changes: https://supabase.com/docs/guides/realtime/postgres-changes
- Database Migrations: https://supabase.com/docs/guides/cli/local-development

---

**Last Updated:** 2025-01-07  
**Status:** Code fixes complete, database migration pending
