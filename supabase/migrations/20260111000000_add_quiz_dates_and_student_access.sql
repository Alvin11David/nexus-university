-- Migration: Add start_date and end_date to quizzes table
-- Run this in your Supabase SQL editor

-- Add start_date and end_date columns
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Update existing quizzes to have reasonable dates (start immediately, end in 7 days)
UPDATE quizzes SET start_date = created_at WHERE start_date IS NULL;
UPDATE quizzes SET end_date = start_date + INTERVAL '7 days' WHERE end_date IS NULL;

-- Drop the existing student policy and recreate with date filtering
DROP POLICY IF EXISTS \
Students
can
view
active
quizzes\ ON quizzes;
CREATE POLICY \Students
can
view
active
quizzes\
  ON quizzes
  FOR SELECT
  USING (status = 'active' AND start_date <= now() AND end_date >= now());
