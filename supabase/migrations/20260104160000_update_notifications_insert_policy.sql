-- Allow lecturers/admins to insert notifications for students (for enrollment approvals)
DROP POLICY IF EXISTS "Users can insert their notifications" ON public.notifications;
CREATE POLICY "Users can insert their notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    -- user inserting for self
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.lecturer_courses lc
      WHERE lc.lecturer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.instructor_id = auth.uid()
    )
  );
