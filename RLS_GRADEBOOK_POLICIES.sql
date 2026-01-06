-- RLS Policies for Grade Book Access
-- These policies allow lecturers to read courses they teach

-- Enable RLS on lecturer_courses if not already enabled
ALTER TABLE public.lecturer_courses ENABLE ROW LEVEL SECURITY;

-- Policy: Lecturers can view their own course assignments
CREATE POLICY "Lecturers can view their own courses"
ON public.lecturer_courses
FOR SELECT
USING (
  lecturer_id = auth.uid()
);

-- Policy: Enable anonymous reads for the profile check (if needed)
CREATE POLICY "Enable read access for lecturer_courses"
ON public.lecturer_courses
FOR SELECT
USING (true);

-- Enable RLS on courses if not already enabled
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view courses
CREATE POLICY "Anyone can view courses"
ON public.courses
FOR SELECT
USING (true);

-- Policy: Enable read access for courses table
CREATE POLICY "Enable course reads for dashboard"
ON public.courses
FOR SELECT
USING (true);
