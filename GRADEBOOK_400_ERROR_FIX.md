# Grade Book 400 Error Fix - RLS Policy Issue

## Problem

When fetching lecturer courses, getting a **400 Bad Request error**:

```
oszbmaqieyemkgcqbeap.supabase.co/rest/v1/lecturer_courses?select=course_id&lecturer_id=eq...
Failed to load resource: the server responded with a status of 400 ()
```

## Root Cause

The `lecturer_courses` table likely has **Row Level Security (RLS)** enabled but **no SELECT policy** allowing lecturers to read their own course assignments.

## Solution

### Option 1: Apply RLS Policies (Recommended)

Run the SQL file in your Supabase SQL Editor:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → Click **New Query**
4. Copy the contents from `RLS_GRADEBOOK_POLICIES.sql`
5. Run the query

**What it does:**

- Creates RLS policy: "Lecturers can view their own courses"
- Allows lecturers to read lecturer_courses where `lecturer_id = auth.uid()`
- Creates public read policies for courses table

### Option 2: Disable RLS Temporarily (For Development)

If you want to test without RLS:

1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Select `lecturer_courses` table
3. Click **Disable RLS**
4. Do the same for `courses` table

⚠️ **Not recommended for production** - use proper RLS policies instead.

### Option 3: Check Existing Policies

To see what policies already exist:

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Policies**
3. Search for `lecturer_courses`
4. Check if SELECT policies exist
5. If they exist, verify the condition matches your auth setup

## How the Fix Works

**Before (Failing Query):**

```typescript
// This tries to join lecturer_courses → courses
const { data, error } = await supabase
  .from("lecturer_courses")
  .select(`course_id, courses(id, code, name)`) // ← Requires permission on related table
  .eq("lecturer_id", user.id);
```

❌ Gets 400 error because RLS blocks the related table access

**After (Working Query):**

```typescript
// Step 1: Get course IDs from lecturer_courses
const { data: lecturerCourses, error: lcError } = await supabase
  .from("lecturer_courses")
  .select("course_id")
  .eq("lecturer_id", user.id);

// Step 2: Get course details from courses table
const { data: coursesData, error: coursesError } = await supabase
  .from("courses")
  .select("id, code, name")
  .in("id", courseIds);
```

✅ Works because both queries have separate RLS policies

## Verification

After applying policies, test in browser console:

```javascript
// Should return courses for current user
const { data, error } = await supabase
  .from("lecturer_courses")
  .select("course_id")
  .eq("lecturer_id", userId);

console.log(data, error);
```

## Database Schema Check

Make sure your tables have these columns:

**lecturer_courses:**

```
- id (UUID)
- lecturer_id (UUID) ← Used in WHERE clause
- course_id (UUID)
- created_at
- updated_at
```

**courses:**

```
- id (UUID)
- code (TEXT) - e.g., "CS101"
- name (TEXT)
- semester (TEXT)
- credits (INT)
```

## Common 400 Error Causes

| Cause                 | Fix                                       |
| --------------------- | ----------------------------------------- |
| Missing RLS policy    | Apply RLS_GRADEBOOK_POLICIES.sql          |
| Wrong auth.uid()      | Ensure user is logged in with `useAuth()` |
| Table doesn't exist   | Create table migration                    |
| Column names wrong    | Check exact column names in table         |
| Foreign key violation | Ensure course_id exists in courses table  |
| Syntax error in query | Check .select() syntax                    |

## Testing Steps

1. ✅ Apply RLS policies (Option 1)
2. ✅ Refresh the browser (`F5`)
3. ✅ Open DevTools Console
4. ✅ Try selecting a lecturer account
5. ✅ Check Network tab for 200 response (not 400)
6. ✅ Verify courses appear in the dropdown

## If Still Failing

Check your browser console for more details:

```typescript
// Add this to see the full error
const { data, error } = await supabase...
if (error) {
  console.error("Full error:", {
    message: error.message,
    code: error.code,
    details: error.details
  });
}
```

## Related Files

- **Implementation**: `src/pages/LecturerGradeBook.tsx`
- **RLS Policies**: `RLS_GRADEBOOK_POLICIES.sql`
- **Documentation**: This file

## Next Steps

After fixing the 400 error:

1. Verify courses load correctly
2. Test student enrollment loading
3. Test grade save/export functionality
4. Deploy to production with proper RLS policies

---

**Status**: Ready to apply policies  
**Estimated Fix Time**: 2 minutes  
**Difficulty**: Easy ✅
