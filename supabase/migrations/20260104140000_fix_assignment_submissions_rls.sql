-- Additional RLS policies for assignment_submissions table to support lecturer_courses
DROP POLICY IF EXISTS "Lecturers can view submissions for their assignments" ON public.assignment_submissions;

CREATE POLICY "Lecturers can view submissions for their assignments"
ON public.assignment_submissions
FOR SELECT
USING (
  assignment_id IN (
    SELECT id FROM public.assignments a
    WHERE a.lecturer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lecturer_courses
      WHERE lecturer_id = auth.uid()
      AND course_id = a.course_id
    )
  )
);

DROP POLICY IF EXISTS "Lecturers can update submissions for their assignments" ON public.assignment_submissions;

CREATE POLICY "Lecturers can update submissions for their assignments"
ON public.assignment_submissions
FOR UPDATE
USING (
  assignment_id IN (
    SELECT id FROM public.assignments a
    WHERE a.lecturer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lecturer_courses
      WHERE lecturer_id = auth.uid()
      AND course_id = a.course_id
    )
  )
)
WITH CHECK (
  assignment_id IN (
    SELECT id FROM public.assignments a
    WHERE a.lecturer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.lecturer_courses
      WHERE lecturer_id = auth.uid()
      AND course_id = a.course_id
    )
  )
);
