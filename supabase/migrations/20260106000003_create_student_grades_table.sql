-- Create student grades table
CREATE TABLE IF NOT EXISTS public.student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lecturer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assignment1 DECIMAL(5,2) DEFAULT 0,
  assignment2 DECIMAL(5,2) DEFAULT 0,
  midterm DECIMAL(5,2) DEFAULT 0,
  participation DECIMAL(5,2) DEFAULT 0,
  final_exam DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(5,2) DEFAULT 0,
  grade VARCHAR(5),
  gp DECIMAL(3,2) DEFAULT 0,
  semester VARCHAR(20),
  academic_year VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(student_id, course_id, semester, academic_year)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_grades_student ON public.student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_course ON public.student_grades(course_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_lecturer ON public.student_grades(lecturer_id);

-- Enable RLS
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own grades"
  ON public.student_grades FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Lecturers can view grades for their courses"
  ON public.student_grades FOR SELECT
  TO authenticated
  USING (
    lecturer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.lecturer_courses lc
      WHERE lc.lecturer_id = auth.uid() AND lc.course_id = student_grades.course_id
    )
  );

CREATE POLICY "Lecturers can insert grades for their courses"
  ON public.student_grades FOR INSERT
  TO authenticated
  WITH CHECK (
    lecturer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.lecturer_courses lc
      WHERE lc.lecturer_id = auth.uid() AND lc.course_id = student_grades.course_id
    )
  );

CREATE POLICY "Lecturers can update grades for their courses"
  ON public.student_grades FOR UPDATE
  TO authenticated
  USING (
    lecturer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.lecturer_courses lc
      WHERE lc.lecturer_id = auth.uid() AND lc.course_id = student_grades.course_id
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_student_grades_updated_at
  BEFORE UPDATE ON public.student_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
