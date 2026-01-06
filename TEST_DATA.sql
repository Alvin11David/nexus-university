-- Quick test to see which table has data

-- Check exam_results
SELECT COUNT(*) as exam_results_count 
FROM public.exam_results 
WHERE student_id = (SELECT id FROM auth.users WHERE email = 'alvin69david@gmail.com');

-- Check student_grades
SELECT COUNT(*) as student_grades_count 
FROM public.student_grades 
WHERE student_id = (SELECT id FROM auth.users WHERE email = 'alvin69david@gmail.com');

-- Show actual data from both
SELECT 'exam_results' as source, id, student_id, total, grade, gp FROM public.exam_results 
WHERE student_id = (SELECT id FROM auth.users WHERE email = 'alvin69david@gmail.com')
LIMIT 3
UNION ALL
SELECT 'student_grades', id, student_id, total, grade, gp FROM public.student_grades 
WHERE student_id = (SELECT id FROM auth.users WHERE email = 'alvin69david@gmail.com')
LIMIT 3;
