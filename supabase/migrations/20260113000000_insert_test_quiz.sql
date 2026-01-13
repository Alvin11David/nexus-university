-- Migration: Insert test quiz for debugging
-- This will create a quiz that students can access

INSERT INTO public.quizzes (
  id,
  title,
  description,
  time_limit_minutes,
  max_attempts,
  passing_score,
  is_published,
  start_date,
  end_date,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Sample Quiz - Test Student Access',
  'This is a test quiz to verify that students can see and access quizzes',
  30,
  2,
  70,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Insert sample questions for the quiz
INSERT INTO public.quiz_questions (
  id,
  quiz_id,
  question,
  options,
  correct_answer,
  points,
  order_index
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'What is the capital of France?',
  '["London", "Berlin", "Paris", "Madrid"]',
  2,
  10,
  0
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'Which programming language is primarily used for web development?',
  '["Python", "Java", "JavaScript", "C++"]',
  2,
  10,
  1
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'What does CPU stand for?',
  '["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Utility"]',
  0,
  10,
  2
) ON CONFLICT (id) DO NOTHING;