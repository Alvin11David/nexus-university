-- Add RLS policies for assignments table to allow lecturers to create assignments
-- Drop old policy if it exists
DROP POLICY IF EXISTS "Instructors can manage assignments" ON public.assignments;

-- Create new policies that support both instructor_id and lecturer_courses table
CREATE POLICY "Instructors can manage assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (
    -- Allow if user is the instructor in the course
    public.is_instructor(auth.uid(), course_id) 
    OR 
    -- Allow if user is a lecturer for this course in lecturer_courses table
    EXISTS (
      SELECT 1 FROM public.lecturer_courses
      WHERE lecturer_id = auth.uid()
      AND course_id = assignments.course_id
    )
    OR 
    -- Allow admins
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    -- Allow if user is the instructor in the course
    public.is_instructor(auth.uid(), course_id)
    OR
    -- Allow if user is a lecturer for this course in lecturer_courses table
    EXISTS (
      SELECT 1 FROM public.lecturer_courses
      WHERE lecturer_id = auth.uid()
      AND course_id = assignments.course_id
    )
    OR
    -- Allow admins
    public.has_role(auth.uid(), 'admin')
  );

-- Also update the SELECT policy
DROP POLICY IF EXISTS "Enrolled users can view assignments" ON public.assignments;

CREATE POLICY "Enrolled users can view assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is enrolled in the course
    public.is_enrolled(auth.uid(), course_id)
    OR 
    -- Allow if user is the instructor in the course
    public.is_instructor(auth.uid(), course_id)
    OR
    -- Allow if user is a lecturer for this course
    EXISTS (
      SELECT 1 FROM public.lecturer_courses
      WHERE lecturer_id = auth.uid()
      AND course_id = assignments.course_id
    )
    OR
    -- Allow admins
    public.has_role(auth.uid(), 'admin')
  );
