import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

async function checkStudentQuizQuery() {
  try {
    console.log("Simulating StudentQuiz query...\n");

    const now = new Date().toISOString();
    console.log("Current time (now):", now);

    // This is the exact query from StudentQuiz.tsx
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        description,
        course_id,
        time_limit_minutes,
        max_attempts,
        passing_score,
        status,
        start_date,
        end_date,
        created_at
      `
      )
      .eq("status", "active")
      .lte("start_date", now)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order("created_at", { ascending: false });

    console.log("StudentQuiz query result:");
    console.log("Error:", error);
    console.log("Data count:", data?.length || 0);

    if (data && data.length > 0) {
      console.log("\nQuizzes that match student criteria:");
      data.forEach((quiz, index) => {
        console.log(`${index + 1}. ${quiz.title} (${quiz.status})`);
        console.log(`   Start: ${quiz.start_date}`);
        console.log(`   End: ${quiz.end_date}`);
        console.log(`   Course ID: ${quiz.course_id}`);
      });
    } else {
      console.log("No quizzes match the student criteria");
    }
  } catch (err) {
    console.error("Script error:", err);
  }
}

checkStudentQuizQuery();
