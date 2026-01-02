-- Drop policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Anyone can create student records" ON public.student_records;
DROP POLICY IF EXISTS "Anyone can update student records" ON public.student_records;

-- Allow anyone to insert student records during signup
CREATE POLICY "Anyone can create student records"
ON public.student_records
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update student records during signup (to mark as registered and update name/email)
CREATE POLICY "Anyone can update student records"
ON public.student_records
FOR UPDATE
USING (true)
WITH CHECK (true);


