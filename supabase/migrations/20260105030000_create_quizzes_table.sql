-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  course_id VARCHAR(255),
  course_title VARCHAR(255),
  course_code VARCHAR(50),
  total_questions INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 10,
  time_limit INTEGER, -- in minutes
  passing_score INTEGER,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  attempts_allowed INTEGER DEFAULT 1,
  shuffle_questions BOOLEAN DEFAULT false,
  show_answers BOOLEAN DEFAULT false,
  total_attempts INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  completion_rate INTEGER DEFAULT 0,
  highest_score DECIMAL(5,2) DEFAULT 0,
  lowest_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_quizzes_lecturer_id ON quizzes(lecturer_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at DESC);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Lecturers can see only their own quizzes
CREATE POLICY "Lecturers can view own quizzes"
  ON quizzes
  FOR SELECT
  USING (lecturer_id = auth.uid());

-- Lecturers can insert their own quizzes
CREATE POLICY "Lecturers can create quizzes"
  ON quizzes
  FOR INSERT
  WITH CHECK (lecturer_id = auth.uid());

-- Lecturers can update their own quizzes
CREATE POLICY "Lecturers can update own quizzes"
  ON quizzes
  FOR UPDATE
  USING (lecturer_id = auth.uid())
  WITH CHECK (lecturer_id = auth.uid());

-- Lecturers can delete their own quizzes
CREATE POLICY "Lecturers can delete own quizzes"
  ON quizzes
  FOR DELETE
  USING (lecturer_id = auth.uid());

-- Students can view quizzes that are active
CREATE POLICY "Students can view active quizzes"
  ON quizzes
  FOR SELECT
  USING (status = 'active');

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_quizzes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quizzes_updated_at_trigger
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_quizzes_updated_at();
