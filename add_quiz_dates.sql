-- Add start_date and end_date columns to quizzes table
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Update existing quizzes to have reasonable dates (start immediately, end in 7 days)
UPDATE quizzes SET start_date = created_at WHERE start_date IS NULL;
UPDATE quizzes SET end_date = start_date + INTERVAL '7 days' WHERE end_date IS NULL;
