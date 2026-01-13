import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

// Manually insert the quizzes that the user created
async function insertUserQuizzes() {
  try {
    console.log("Attempting to manually insert user-created quizzes...\n");

    // First, let's get a course ID to use
    const { data: courses, error: courseError } = await supabase
      .from("courses")
      .select("id, title, code")
      .limit(1);

    if (courseError || !courses || courses.length === 0) {
      console.log("No courses found:", courseError);
      return;
    }

    const courseId = courses[0].id;
    console.log("Using course:", courses[0]);

    // Mock user ID - we'll need to replace this with actual user ID
    // For now, let's try with a placeholder
    const mockUserId = "placeholder-user-id";

    const quiz1 = {
      title: "ALGORITHMSN",
      description: "HEY YOU WILL LOVE IT",
      course_id: courseId,
      course_title: courses[0].title,
      course_code: courses[0].code,
      total_questions: 10,
      total_points: 20,
      time_limit: 30,
      passing_score: 12,
      start_date: "2026-01-09T01:10:00.000Z", // 09/01/2026 01:10
      end_date: "2026-01-23T01:09:00.000Z", // 23/01/2026 01:09
      status: "active",
      attempts_allowed: 1,
      shuffle_questions: false,
      show_answers: false,
      lecturer_id: mockUserId,
      created_at: new Date().toISOString(),
    };

    const quiz2 = {
      title: "AI",
      description: "treees",
      course_id: courseId,
      course_title: courses[0].title,
      course_code: courses[0].code,
      total_questions: 10,
      total_points: 20,
      time_limit: 30,
      passing_score: 12,
      start_date: "2026-01-09T01:10:00.000Z",
      end_date: "2026-01-23T01:09:00.000Z",
      status: "active",
      attempts_allowed: 1,
      shuffle_questions: false,
      show_answers: false,
      lecturer_id: mockUserId,
      created_at: new Date().toISOString(),
    };

    console.log("Inserting quiz 1:", quiz1.title);
    const { data: data1, error: error1 } = await supabase
      .from("quizzes")
      .insert([quiz1])
      .select();

    if (error1) {
      console.log("Quiz 1 insert error:", error1);
    } else {
      console.log("Quiz 1 inserted successfully:", data1);
    }

    console.log("Inserting quiz 2:", quiz2.title);
    const { data: data2, error: error2 } = await supabase
      .from("quizzes")
      .insert([quiz2])
      .select();

    if (error2) {
      console.log("Quiz 2 insert error:", error2);
    } else {
      console.log("Quiz 2 inserted successfully:", data2);
    }
  } catch (err) {
    console.error("Script error:", err);
  }
}

insertUserQuizzes();
