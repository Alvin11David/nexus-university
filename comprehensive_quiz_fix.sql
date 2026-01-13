-- Comprehensive quiz fix - run all of this in Supabase SQL Editor

-- 1. Check all quizzes
SELECT id, title, status, start_date, end_date, lecturer_id FROM quizzes;

-- 2. Make ALL quizzes active with proper dates (for testing)
UPDATE quizzes 
SET 
  status = 'active',
  start_date = NOW() - INTERVAL '1 day',  -- Available from yesterday
  end_date = NOW() + INTERVAL '7 days'    -- Available until next week
WHERE status != 'active' OR start_date IS NULL OR end_date IS NULL;

-- 3. Check the updated quizzes
SELECT id, title, status, start_date, end_date FROM quizzes WHERE status = 'active';

-- 4. If still no quizzes show, check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'quizzes';

-- 5. Temporarily disable RLS for testing (run this if needed)
-- ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;

-- 6. Re-enable RLS after testing (run this after testing)
-- ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
