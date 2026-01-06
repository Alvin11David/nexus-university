-- Run this in Supabase SQL Editor to check the data

-- 1. Check what's in student_grades table
SELECT 
  student_id,
  course_id,
  assignment1,
  assignment2,
  midterm,
  total,
  grade,
  gp,
  semester,
  academic_year
FROM public.student_grades
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check student's auth.users ID
SELECT id, email FROM auth.users WHERE email = 'alvin69david@gmail.com';

-- 3. Check if student can see their own grades (simulates RLS)
-- This should return rows if RLS is working correctly
SELECT * FROM public.student_grades 
WHERE student_id = (SELECT id FROM auth.users WHERE email = 'alvin69david@gmail.com');
