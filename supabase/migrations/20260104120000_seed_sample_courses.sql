-- Seed sample courses for testing
-- First, get a department ID (or create one if needed)
INSERT INTO public.departments (id, code, name, college_id, created_at)
SELECT 
  gen_random_uuid(),
  'CS',
  'Computer Science',
  (SELECT id FROM public.colleges LIMIT 1),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE code = 'CS');

-- Insert sample courses for Semester 1 2025
INSERT INTO public.courses (id, code, title, credits, department_id, description, status, semester, year, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'CS101', 'Introduction to Programming', 3, (SELECT id FROM public.departments WHERE code = 'CS' LIMIT 1), 'Learn the fundamentals of programming', 'published', 'Semester 1', 2025, now(), now()),
  (gen_random_uuid(), 'CS102', 'Data Structures', 4, (SELECT id FROM public.departments WHERE code = 'CS' LIMIT 1), 'Study essential data structures and algorithms', 'published', 'Semester 1', 2025, now(), now()),
  (gen_random_uuid(), 'CS201', 'Web Development', 3, (SELECT id FROM public.departments WHERE code = 'CS' LIMIT 1), 'Build modern web applications', 'published', 'Semester 1', 2025, now(), now()),
  (gen_random_uuid(), 'CS202', 'Database Systems', 4, (SELECT id FROM public.departments WHERE code = 'CS' LIMIT 1), 'Design and manage databases', 'published', 'Semester 1', 2025, now(), now()),
  (gen_random_uuid(), 'CS301', 'Software Engineering', 3, (SELECT id FROM public.departments WHERE code = 'CS' LIMIT 1), 'Learn software development best practices', 'published', 'Semester 1', 2025, now(), now()),
  (gen_random_uuid(), 'CS302', 'Machine Learning', 4, (SELECT id FROM public.departments WHERE code = 'CS' LIMIT 1), 'Introduction to machine learning concepts', 'published', 'Semester 1', 2025, now(), now())
ON CONFLICT DO NOTHING;
