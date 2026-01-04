-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'lecturer', 'admin');

-- Create enum for course status
CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');

-- Create enum for enrollment status
CREATE TYPE public.enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create enum for assignment status
CREATE TYPE public.assignment_status AS ENUM ('pending', 'submitted', 'graded', 'late');

-- Profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  student_number TEXT UNIQUE,
  department TEXT,
  college TEXT,
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Colleges table
CREATE TABLE public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  credits INTEGER DEFAULT 3,
  semester TEXT,
  year INTEGER,
  thumbnail_url TEXT,
  status course_status DEFAULT 'draft',
  max_students INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Course enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status enrollment_status DEFAULT 'pending',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  grade DECIMAL(4,2),
  UNIQUE (course_id, student_id)
);

-- Course materials/resources
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  week_number INTEGER,
  order_index INTEGER DEFAULT 0,
  is_downloadable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Assignments
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_score INTEGER DEFAULT 100,
  weight DECIMAL(5,2) DEFAULT 10,
  allow_late_submission BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Assignment submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT,
  content TEXT,
  status assignment_status DEFAULT 'pending',
  score DECIMAL(5,2),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (assignment_id, student_id)
);

-- Quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 1,
  passing_score INTEGER DEFAULT 50,
  is_published BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0
);

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB,
  score DECIMAL(5,2),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  attempt_number INTEGER DEFAULT 1
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Discussion forums
CREATE TABLE public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Discussion replies
CREATE TABLE public.discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Live sessions (Google Meet integration)
CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  meet_link TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  recording_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Student timetable/schedule
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  building TEXT
);

-- Tuition fees and payments
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  due_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Payment transactions
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID REFERENCES public.fees(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  transaction_ref TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Exam results
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  marks DECIMAL(5,2) NOT NULL,
  grade TEXT,
  grade_point DECIMAL(3,2),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Student progress/badges
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is enrolled in a course
CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE student_id = _user_id
      AND course_id = _course_id
      AND status = 'approved'
  )
$$;

-- Function to check if user is instructor of a course
CREATE OR REPLACE FUNCTION public.is_instructor(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.courses
    WHERE id = _course_id
      AND instructor_id = _user_id
  )
$$;

-- Profile policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own role during signup"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Colleges/Departments policies (public read)
CREATE POLICY "Anyone can view colleges"
  ON public.colleges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage colleges"
  ON public.colleges FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Course policies
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (status = 'published' OR instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage their courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Enrollment policies
CREATE POLICY "Students can view their enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can enroll themselves"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors can manage enrollments"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

-- Materials policies
CREATE POLICY "Enrolled users can view materials"
  ON public.materials FOR SELECT
  TO authenticated
  USING (public.is_enrolled(auth.uid(), course_id) OR public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage materials"
  ON public.materials FOR ALL
  TO authenticated
  USING (public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

-- Assignment policies
CREATE POLICY "Enrolled users can view assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (public.is_enrolled(auth.uid(), course_id) OR public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

-- Submission policies
CREATE POLICY "Students can view their own submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can view course submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments a 
    WHERE a.id = assignment_id AND public.is_instructor(auth.uid(), a.course_id)
  ));

CREATE POLICY "Students can create submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND status = 'pending');

CREATE POLICY "Instructors can grade submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments a 
    WHERE a.id = assignment_id AND public.is_instructor(auth.uid(), a.course_id)
  ));

-- Quiz policies
CREATE POLICY "Enrolled users can view quizzes"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING ((is_published AND public.is_enrolled(auth.uid(), course_id)) OR public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

-- Quiz questions policies
CREATE POLICY "Enrolled users can view questions during quiz"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quizzes q 
    WHERE q.id = quiz_id AND q.is_published AND public.is_enrolled(auth.uid(), q.course_id)
  ) OR EXISTS (
    SELECT 1 FROM public.quizzes q 
    WHERE q.id = quiz_id AND public.is_instructor(auth.uid(), q.course_id)
  ));

CREATE POLICY "Instructors can manage questions"
  ON public.quiz_questions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quizzes q 
    WHERE q.id = quiz_id AND public.is_instructor(auth.uid(), q.course_id)
  ));

-- Quiz attempts policies
CREATE POLICY "Students can view their attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create attempts"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their attempts"
  ON public.quiz_attempts FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid());

-- Announcements policies
CREATE POLICY "Enrolled users can view announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (is_global OR course_id IS NULL OR public.is_enrolled(auth.uid(), course_id) OR public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Discussion policies
CREATE POLICY "Enrolled users can view discussions"
  ON public.discussions FOR SELECT
  TO authenticated
  USING (public.is_enrolled(auth.uid(), course_id) OR public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can create discussions"
  ON public.discussions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_enrolled(auth.uid(), course_id) OR public.is_instructor(auth.uid(), course_id));

CREATE POLICY "Authors can update discussions"
  ON public.discussions FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Discussion replies policies
CREATE POLICY "Users can view replies"
  ON public.discussion_replies FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.discussions d 
    WHERE d.id = discussion_id AND (public.is_enrolled(auth.uid(), d.course_id) OR public.is_instructor(auth.uid(), d.course_id))
  ));

CREATE POLICY "Users can create replies"
  ON public.discussion_replies FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.discussions d 
    WHERE d.id = discussion_id AND (public.is_enrolled(auth.uid(), d.course_id) OR public.is_instructor(auth.uid(), d.course_id))
  ));

-- Live sessions policies
CREATE POLICY "Enrolled users can view live sessions"
  ON public.live_sessions FOR SELECT
  TO authenticated
  USING (public.is_enrolled(auth.uid(), course_id) OR public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage live sessions"
  ON public.live_sessions FOR ALL
  TO authenticated
  USING (instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Schedule policies
CREATE POLICY "Enrolled users can view schedules"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (public.is_enrolled(auth.uid(), course_id) OR public.is_instructor(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage schedules"
  ON public.schedules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fees policies
CREATE POLICY "Students can view their fees"
  ON public.fees FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage fees"
  ON public.fees FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Payments policies
CREATE POLICY "Students can view their payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Exam results policies
CREATE POLICY "Students can view their results"
  ON public.exam_results FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage results"
  ON public.exam_results FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_instructor(auth.uid(), course_id));

-- Achievements policies
CREATE POLICY "Students can view their achievements"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can grant achievements"
  ON public.achievements FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Default role is student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample colleges and departments
INSERT INTO public.colleges (name, code, description) VALUES
  ('College of Computing and Information Sciences', 'COCIS', 'Leading college for technology and computing education'),
  ('College of Engineering, Design, Art and Technology', 'CEDAT', 'Excellence in engineering and design'),
  ('College of Business and Management Sciences', 'COBAMS', 'Shaping future business leaders'),
  ('College of Health Sciences', 'CHS', 'Training healthcare professionals'),
  ('College of Humanities and Social Sciences', 'CHUSS', 'Exploring human experience and society');

INSERT INTO public.departments (college_id, name, code, description) 
SELECT c.id, 'Computer Science', 'CS', 'Department of Computer Science' FROM public.colleges c WHERE c.code = 'COCIS'
UNION ALL
SELECT c.id, 'Information Technology', 'IT', 'Department of Information Technology' FROM public.colleges c WHERE c.code = 'COCIS'
UNION ALL
SELECT c.id, 'Software Engineering', 'SE', 'Department of Software Engineering' FROM public.colleges c WHERE c.code = 'COCIS'
UNION ALL
SELECT c.id, 'Civil Engineering', 'CE', 'Department of Civil Engineering' FROM public.colleges c WHERE c.code = 'CEDAT'
UNION ALL
SELECT c.id, 'Electrical Engineering', 'EE', 'Department of Electrical Engineering' FROM public.colleges c WHERE c.code = 'CEDAT'
UNION ALL
SELECT c.id, 'Business Administration', 'BA', 'Department of Business Administration' FROM public.colleges c WHERE c.code = 'COBAMS';