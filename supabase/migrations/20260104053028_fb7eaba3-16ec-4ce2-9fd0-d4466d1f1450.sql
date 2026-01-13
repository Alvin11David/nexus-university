-- Add missing columns to existing assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS lecturer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'graded')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_date TIMESTAMPTZ,
  score DECIMAL(5,2),
  feedback TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment_submissions
CREATE POLICY "Students can manage their own submissions"
ON public.assignment_submissions
FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Lecturers can view submissions for their assignments"
ON public.assignment_submissions
FOR SELECT
USING (
  assignment_id IN (
    SELECT id FROM public.assignments WHERE lecturer_id = auth.uid()
  )
);

CREATE POLICY "Lecturers can update submissions for their assignments"
ON public.assignment_submissions
FOR UPDATE
USING (
  assignment_id IN (
    SELECT id FROM public.assignments WHERE lecturer_id = auth.uid()
  )
)
WITH CHECK (
  assignment_id IN (
    SELECT id FROM public.assignments WHERE lecturer_id = auth.uid()
  )
);