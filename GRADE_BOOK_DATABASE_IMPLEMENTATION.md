# Grade Book Database Implementation

## Overview

The Grade Book system has been enhanced to support database-backed grade storage with automatic fetching of enrolled students, editable grade cells, and persistent storage in Supabase.

## What Was Implemented

### 1. Database Schema

Created a `student_grades` table with the following structure:

- **student_id** - References the student's auth.users ID
- **course_id** - References the course
- **lecturer_id** - References the lecturer managing these grades
- **assignment1, assignment2** - Assignment scores (0-100)
- **midterm** - Midterm exam score (0-100)
- **participation** - Participation score (0-100)
- **final_exam** - Final exam score (0-100)
- **total** - Weighted total score (auto-calculated)
- **grade** - Letter grade (A+, A, B+, etc.)
- **gp** - Grade point (4.0 scale)
- **semester** - Academic semester (Spring/Fall)
- **academic_year** - Academic year (e.g., "2025-2026")
- **created_at, updated_at** - Timestamps

#### Grading Formula

The weighted average is calculated as:

- Assignment 1: 15%
- Assignment 2: 15%
- Midterm: 25%
- Participation: 10%
- Final Exam: 35%

### 2. RLS (Row Level Security) Policies

- **Students**: Can SELECT (view) their own grades
- **Lecturers**: Can SELECT, INSERT, and UPDATE grades for courses they teach

### 3. Grade Book Features

#### Automatic Student Loading

- When a lecturer selects a course from the dropdown, the system:
  1. Fetches all enrolled students with "approved" status
  2. Fetches existing grade records from `student_grades`
  3. Merges the data to show all enrolled students with their grades (or zeros if no grades exist yet)

#### Editable Grade Cells

- All grade component cells (A1, A2, Midterm, Participation, Final) are editable input fields
- Type in any number between 0-100
- Total, Grade, and GP are auto-calculated as you type
- Changes are instant in the UI but not saved until you click "Save All"

#### Save Functionality

- Click the **"Save All"** button to save all grades to the database
- Uses `upsert` operation - creates new records or updates existing ones
- Shows success/error alerts

#### Course Selection

- Dropdown shows all courses the lecturer is assigned to
- Automatically loads the first course on page load
- Switching courses fetches the students for that course

#### CSV Import/Export

- **Export**: Download current grades as CSV file
- **Import**: Upload CSV file to bulk update grades
  - Matches students by email address
  - Only updates existing enrolled students
  - Shows how many students were matched
  - Changes appear in UI immediately but require "Save All" to persist

## Setup Instructions

### Step 1: Run the Migration

You need to run the SQL migration in Supabase to create the table:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20260106000003_create_student_grades_table.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

Alternatively, if you have the Supabase CLI set up:

```bash
supabase migration up
```

### Step 2: Verify the Table

After running the migration, verify the table was created:

```sql
SELECT * FROM student_grades LIMIT 1;
```

### Step 3: Regenerate Types (Optional)

To remove the TypeScript warnings, regenerate the Supabase types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

## How to Use (Lecturer Workflow)

1. **Navigate** to Grade Book page
2. **Select a course** from the dropdown at the top right
3. The system will load all enrolled students for that course
4. **Enter grades** by clicking in the input fields and typing
5. Watch as Total, Grade, and GP are auto-calculated
6. Click **"Save All"** when you're done editing
7. Grades are now permanently stored in Supabase

### Bulk Import via CSV

1. Prepare a CSV file with this exact format:

```csv
Name,Email,A1,A2,Midterm,Participation,Final,Total,Grade,GP
John Doe,john@example.com,85,90,88,95,92,90.45,A-,3.7
```

2. Click **"Import"** button
3. Select your CSV file
4. System will match students by email and update their grades
5. Review the changes in the table
6. Click **"Save All"** to persist to database

### Exporting Grades

1. Click **"Export"** button
2. CSV file downloads with all current student grades
3. Can be used for backup or external processing

## Database Schema Details

### Indexes

- `idx_student_grades_student_id` - Fast lookup by student
- `idx_student_grades_course_id` - Fast lookup by course
- `idx_student_grades_lecturer_id` - Fast lookup by lecturer

### Unique Constraint

Prevents duplicate grade records:

```
UNIQUE (student_id, course_id, semester, academic_year)
```

### Trigger

Auto-updates `updated_at` timestamp on every UPDATE:

```sql
CREATE TRIGGER update_student_grades_updated_at
  BEFORE UPDATE ON student_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Current Status

✅ **Completed:**

- Database table created (migration file ready)
- Fetch enrolled students from database
- Editable grade input cells
- Auto-calculation of totals, grades, and GPs
- Save functionality with upsert logic
- Course selection dropdown
- CSV import/export with email matching
- Loading states and empty states
- RLS policies for students and lecturers

⚠️ **Pending:**

- Run the migration in Supabase
- Regenerate TypeScript types (optional, removes warnings)

🎯 **Future Enhancements** (Optional):

- Add semester/academic year selection (currently hardcoded to "Spring 2025-2026")
- Add grade history tracking
- Add grade analytics per course
- Allow commenting on individual grades
- Add notification when grades are posted
- Bulk grade operations (e.g., apply curve)

## TypeScript Notes

The code currently uses `@ts-ignore` comments to bypass TypeScript errors because the `student_grades` table doesn't exist in the generated types yet. Once you run the migration and regenerate types, these warnings will disappear automatically.

## Testing Checklist

After running the migration:

- [ ] Can see enrolled students when selecting a course
- [ ] Can edit grade values in input fields
- [ ] Total, Grade, and GP auto-calculate correctly
- [ ] Clicking "Save All" saves grades to database
- [ ] Refreshing the page loads saved grades
- [ ] CSV export downloads correct data
- [ ] CSV import matches and updates students
- [ ] Different lecturers see only their courses
- [ ] Students can view their own grades (need to implement Results page)

## Related Files

- **Migration**: `supabase/migrations/20260106000003_create_student_grades_table.sql`
- **Component**: `src/pages/LecturerGradeBook.tsx`
- **Next Feature**: Student Results page (to view their grades)
