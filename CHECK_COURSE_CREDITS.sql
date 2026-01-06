-- Check course credits and student grades data

-- 1. Check the course details
SELECT id, code, title, credits 
FROM public.courses 
WHERE code = 'CS101';

-- 2. Check if student_grades has the correct course_id reference
SELECT 
  sg.student_id,
  sg.course_id,
  sg.total,
  sg.grade,
  sg.gp,
  c.code,
  c.title,
  c.credits
FROM public.student_grades sg
LEFT JOIN public.courses c ON sg.course_id = c.id
ORDER BY sg.created_at DESC
LIMIT 5;

-- 3. Verify the student can query their grades via RLS
-- (Run this while authenticated as the student to test RLS)
-- SELECT * FROM public.student_grades WHERE student_id = auth.uid();
