-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB, -- For multiple choice options
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_type ON quiz_questions(type);

-- Enable RLS
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Lecturers can manage questions for their own quizzes
CREATE POLICY \
Lecturers
can
view
own
quiz
questions\
  ON quiz_questions
  FOR SELECT
  USING (quiz_id IN (
    SELECT id FROM quizzes WHERE lecturer_id = auth.uid()
  ));

CREATE POLICY \Lecturers
can
create
questions
for
own
quizzes\
  ON quiz_questions
  FOR INSERT
  WITH CHECK (quiz_id IN (
    SELECT id FROM quizzes WHERE lecturer_id = auth.uid()
  ));

CREATE POLICY \Lecturers
can
update
questions
for
own
quizzes\
  ON quiz_questions
  FOR UPDATE
  USING (quiz_id IN (
    SELECT id FROM quizzes WHERE lecturer_id = auth.uid()
  ))
  WITH CHECK (quiz_id IN (
    SELECT id FROM quizzes WHERE lecturer_id = auth.uid()
  ));

CREATE POLICY \Lecturers
can
delete
questions
for
own
quizzes\
  ON quiz_questions
  FOR DELETE
  USING (quiz_id IN (
    SELECT id FROM quizzes WHERE lecturer_id = auth.uid()
  ));

-- Students can view questions for active quizzes
CREATE POLICY \Students
can
view
questions
for
active
quizzes\
  ON quiz_questions
  FOR SELECT
  USING (quiz_id IN (
    SELECT id FROM quizzes 
    WHERE status = 'active' 
    AND start_date <= now() 
    AND end_date >= now()
  ));

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_quiz_questions_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER quiz_questions_updated_at_trigger
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_questions_updated_at();

-- Create quiz_attempts table for tracking student quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  total_points DECIMAL(5,2) NOT NULL,
  answers JSONB, -- Store student answers
  time_taken INTEGER, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at DESC);

-- Enable RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own attempts
CREATE POLICY \Students
can
view
own
quiz
attempts\
  ON quiz_attempts
  FOR SELECT
  USING (student_id = auth.uid());

-- Students can create their own attempts
CREATE POLICY \Students
can
create
quiz
attempts\
  ON quiz_attempts
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Lecturers can view attempts for their quizzes
CREATE POLICY \Lecturers
can
view
attempts
for
own
quizzes\
  ON quiz_attempts
  FOR SELECT
  USING (quiz_id IN (
    SELECT id FROM quizzes WHERE lecturer_id = auth.uid()
  ));

-- Prevent duplicate attempts (one per student per quiz)
CREATE UNIQUE INDEX idx_quiz_attempts_unique_attempt 
ON quiz_attempts(quiz_id, student_id);
