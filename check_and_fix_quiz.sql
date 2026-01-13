-- Check current quiz status and update if needed
-- Run this in your Supabase SQL editor

-- First, let's see what quizzes exist
SELECT id, title, status, start_date, end_date, created_at FROM quizzes;

-- Update the ARRAYS quiz to be active and have proper dates
UPDATE quizzes 
SET 
  status = 'active',
  start_date = NOW(),
  end_date = NOW() + INTERVAL '7 days'
WHERE title = 'ARRAYS' AND status != 'active';

-- Verify the update
SELECT id, title, status, start_date, end_date FROM quizzes WHERE title = 'ARRAYS';
