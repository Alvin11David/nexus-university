-- Quick fix: Update existing courses to Semester 1 2025
-- Run this directly in Supabase SQL Editor

UPDATE public.courses
SET 
  semester = 'Semester 1',
  year = 2025,
  updated_at = now()
WHERE code IN ('CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302');

-- Verify the update
SELECT code, title, semester, year, status
FROM public.courses
WHERE code IN ('CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302')
ORDER BY code;
