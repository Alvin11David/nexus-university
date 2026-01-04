-- Create lecturer_courses junction table (lecturer teaches which courses)
CREATE TABLE public.lecturer_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lecturer_id, course_id, semester, academic_year)
);

-- Create course_marks table for different types of marks
CREATE TABLE public.course_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coursework_marks DECIMAL(5,2),
  coursework_total DECIMAL(5,2) DEFAULT 30,
  test_marks DECIMAL(5,2),
  test_total DECIMAL(5,2) DEFAULT 10,
  quiz_marks DECIMAL(5,2),
  quiz_total DECIMAL(5,2) DEFAULT 10,
  assignment_marks DECIMAL(5,2),
  assignment_total DECIMAL(5,2) DEFAULT 20,
  mid_exam_marks DECIMAL(5,2),
  mid_exam_total DECIMAL(5,2) DEFAULT 15,
  final_exam_marks DECIMAL(5,2),
  final_exam_total DECIMAL(5,2) DEFAULT 100,
  continuous_assessment_marks DECIMAL(5,2),
  continuous_assessment_total DECIMAL(5,2) DEFAULT 40,
  total_marks DECIMAL(5,2),
  grade TEXT,
  grade_point DECIMAL(3,2),
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  last_updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course_id, semester, academic_year)
);

-- Create attendance table for lecturer to track class attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  session_id UUID,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, student_id, attendance_date)
);

-- Create google_classroom_sessions table for lecturer managing classes
CREATE TABLE public.google_classroom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  classroom_name TEXT NOT NULL,
  classroom_id TEXT,
  classroom_code TEXT UNIQUE,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  meeting_link TEXT,
  recording_link TEXT,
  attendance_marked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create grading_rubrics for consistent marking
CREATE TABLE public.grading_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('coursework', 'test', 'quiz', 'assignment', 'exam')),
  total_marks DECIMAL(5,2) NOT NULL,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lecturer_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_classroom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_rubrics ENABLE ROW LEVEL SECURITY;

-- Policies for lecturer_courses
CREATE POLICY "Lecturers can manage their own courses"
ON public.lecturer_courses
FOR ALL
USING (lecturer_id = auth.uid())
WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Students and admins can view lecturer courses"
ON public.lecturer_courses
FOR SELECT
USING (true);

-- Policies for course_marks
CREATE POLICY "Lecturers can manage marks for their courses"
ON public.course_marks
FOR ALL
USING (lecturer_id = auth.uid() OR auth.uid() IN (SELECT lecturer_id FROM lecturer_courses WHERE course_id = course_id))
WITH CHECK (lecturer_id = auth.uid() OR auth.uid() IN (SELECT lecturer_id FROM lecturer_courses WHERE course_id = course_id));

CREATE POLICY "Students can view their own marks"
ON public.course_marks
FOR SELECT
USING (student_id = auth.uid());

-- Policies for attendance
CREATE POLICY "Lecturers can manage attendance for their courses"
ON public.attendance
FOR ALL
USING (lecturer_id = auth.uid())
WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Students can view their own attendance"
ON public.attendance
FOR SELECT
USING (student_id = auth.uid());

-- Policies for google_classroom_sessions
CREATE POLICY "Lecturers can manage their own classroom sessions"
ON public.google_classroom_sessions
FOR ALL
USING (lecturer_id = auth.uid())
WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Students can view classroom sessions"
ON public.google_classroom_sessions
FOR SELECT
USING (true);

-- Policies for grading_rubrics
CREATE POLICY "Lecturers can manage their own rubrics"
ON public.grading_rubrics
FOR ALL
USING (lecturer_id = auth.uid())
WITH CHECK (lecturer_id = auth.uid());

CREATE POLICY "Students can view grading rubrics"
ON public.grading_rubrics
FOR SELECT
USING (true);

-- Function to calculate total marks and grade
CREATE OR REPLACE FUNCTION calculate_course_grade(marks DECIMAL) 
RETURNS TABLE(grade TEXT, grade_point DECIMAL) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE 
      WHEN marks >= 80 THEN 'A'
      WHEN marks >= 75 THEN 'A-'
      WHEN marks >= 70 THEN 'B+'
      WHEN marks >= 65 THEN 'B'
      WHEN marks >= 60 THEN 'B-'
      WHEN marks >= 55 THEN 'C+'
      WHEN marks >= 50 THEN 'C'
      WHEN marks >= 45 THEN 'C-'
      WHEN marks >= 40 THEN 'D'
      ELSE 'F'
    END as grade,
    CASE 
      WHEN marks >= 80 THEN 4.0
      WHEN marks >= 75 THEN 3.7
      WHEN marks >= 70 THEN 3.3
      WHEN marks >= 65 THEN 3.0
      WHEN marks >= 60 THEN 2.7
      WHEN marks >= 55 THEN 2.3
      WHEN marks >= 50 THEN 2.0
      WHEN marks >= 45 THEN 1.7
      WHEN marks >= 40 THEN 1.0
      ELSE 0.0
    END as grade_point;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update total_marks and grade when individual marks change
CREATE OR REPLACE FUNCTION update_course_total_marks()
RETURNS TRIGGER AS $$
DECLARE
  v_total DECIMAL;
  v_grade_data RECORD;
BEGIN
  -- Calculate total marks (simplified: sum of all components)
  v_total := COALESCE(NEW.coursework_marks, 0) + 
             COALESCE(NEW.test_marks, 0) + 
             COALESCE(NEW.quiz_marks, 0) + 
             COALESCE(NEW.assignment_marks, 0) + 
             COALESCE(NEW.mid_exam_marks, 0) + 
             COALESCE(NEW.final_exam_marks, 0);
  
  NEW.total_marks := v_total;
  
  -- Get grade and grade_point
  SELECT * INTO v_grade_data FROM calculate_course_grade(v_total);
  NEW.grade := v_grade_data.grade;
  NEW.grade_point := v_grade_data.grade_point;
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_marks
BEFORE INSERT OR UPDATE ON public.course_marks
FOR EACH ROW
EXECUTE FUNCTION update_course_total_marks();
