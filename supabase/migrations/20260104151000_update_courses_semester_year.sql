-- Update existing CS sample courses to Semester 1 2025
UPDATE public.courses
SET
  semester = 'Semester 1',
  year = 2025,
  updated_at = now()
WHERE code IN ('CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302');

-- Ensure status is published for visibility
UPDATE public.courses
SET status = 'published'
WHERE code IN ('CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302')
  AND status IS DISTINCT FROM 'published';
