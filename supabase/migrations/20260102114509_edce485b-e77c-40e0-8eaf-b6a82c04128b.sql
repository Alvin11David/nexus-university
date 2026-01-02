-- Fix student_records permissions
DROP POLICY IF EXISTS "Anyone can create student records" ON public.student_records;
DROP POLICY IF EXISTS "Anyone can update student records" ON public.student_records;

CREATE POLICY "Anyone can create student records"
ON public.student_records
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update student records"
ON public.student_records
FOR UPDATE
USING (true)
WITH CHECK (true);