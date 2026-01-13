-- Insert a test quiz for debugging
INSERT INTO public.quizzes (
  id,
  title,
  description,
  course_id,
  time_limit_minutes,
  max_attempts,
  passing_score,
  is_published,
  start_date,
  end_date,
  created_at
) VALUES (
  gen_random_uuid(),
  'Test Quiz - Introduction to Programming',
  'A sample quiz to test the student quiz functionality',
  (SELECT id FROM public.courses WHERE code = 'CS101' LIMIT 1),
  30,
  2,
  70,
  true,
  now(),
  now() + interval '7 days',
  now()
);

-- Insert some sample quiz questions
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
  gen_random_uuid(),
  (SELECT id FROM public.quizzes WHERE title = 'Test Quiz - Introduction to Programming' LIMIT 1),
  'What is the capital of France?',
  '["London", "Berlin", "Paris", "Madrid"]'::jsonb,
  2,
  10,
  0
),
(
  gen_random_uuid(),
  (SELECT id FROM public.quizzes WHERE title = 'Test Quiz - Introduction to Programming' LIMIT 1),
  'Which of the following is a programming language?',
  '["HTML", "CSS", "JavaScript", "XML"]'::jsonb,
  2,
  10,
  1
),
(
  gen_random_uuid(),
  (SELECT id FROM public.quizzes WHERE title = 'Test Quiz - Introduction to Programming' LIMIT 1),
  'What does CPU stand for?',
  '["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Utility"]'::jsonb,
  0,
  10,
  2
);