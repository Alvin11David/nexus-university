-- Allow lecturers (via lecturer_courses) to view and update enrollments

-- Replace select policy to include lecturer_courses membership
DROP POLICY IF EXISTS "Students can view their enrollments" ON public.enrollments;
CREATE POLICY "Students can view their enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_instructor(auth.uid(), course_id)
    OR EXISTS (
      SELECT 1 FROM public.lecturer_courses lc
      WHERE lc.lecturer_id = auth.uid()
        AND lc.course_id = enrollments.course_id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Replace update policy to allow lecturer_courses membership
DROP POLICY IF EXISTS "Instructors can manage enrollments" ON public.enrollments;
CREATE POLICY "Instructors can manage enrollments"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (
    public.is_instructor(auth.uid(), course_id)
    OR EXISTS (
      SELECT 1 FROM public.lecturer_courses lc
      WHERE lc.lecturer_id = auth.uid()
        AND lc.course_id = enrollments.course_id
    )
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.is_instructor(auth.uid(), course_id)
    OR EXISTS (
      SELECT 1 FROM public.lecturer_courses lc
      WHERE lc.lecturer_id = auth.uid()
        AND lc.course_id = enrollments.course_id
    )
    OR public.has_role(auth.uid(), 'admin')
  );
