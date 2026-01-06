-- ========================================
-- DEPLOY student_grades and notifications tables
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Create student_grades table
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

-- Create indexes for student_grades
CREATE INDEX IF NOT EXISTS idx_student_grades_student ON public.student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_course ON public.student_grades(course_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_lecturer ON public.student_grades(lecturer_id);

-- Enable RLS for student_grades
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own grades" ON public.student_grades;
DROP POLICY IF EXISTS "Lecturers can view grades for their courses" ON public.student_grades;
DROP POLICY IF EXISTS "Lecturers can insert grades for their courses" ON public.student_grades;
DROP POLICY IF EXISTS "Lecturers can update grades for their courses" ON public.student_grades;

-- RLS Policies for student_grades
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

-- Create trigger for student_grades (if update_updated_at_column function exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_student_grades_updated_at ON public.student_grades;
        CREATE TRIGGER update_student_grades_updated_at
          BEFORE UPDATE ON public.student_grades
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- ========================================
-- 2. Create notifications table
-- ========================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, type, related_id, created_at)
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ========================================
-- Verification queries (optional - comment out if needed)
-- ========================================

-- Check if tables were created
SELECT 'student_grades table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_grades');

SELECT 'notifications table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications');

-- Show counts
SELECT COUNT(*) as student_grades_count FROM public.student_grades;
SELECT COUNT(*) as notifications_count FROM public.notifications;
