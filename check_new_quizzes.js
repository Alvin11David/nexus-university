import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

async function checkNewQuizzes() {
  try {
    console.log("Checking for newly created quizzes...\n");

    // Get all quizzes
    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quizzes:", error);
      return;
    }

    console.log(`Found ${quizzes.length} quizzes in database:\n`);

    quizzes.forEach((quiz, index) => {
      console.log(`${index + 1}. Quiz Details:`);
      console.log(`   ID: ${quiz.id}`);
      console.log(`   Title: ${quiz.title}`);
      console.log(`   Description: ${quiz.description}`);
      console.log(`   Status: ${quiz.status}`);
      console.log(`   Course ID: ${quiz.course_id}`);
      console.log(`   Course Title: ${quiz.course_title}`);
      console.log(`   Course Code: ${quiz.course_code}`);
      console.log(`   Start Date: ${quiz.start_date}`);
      console.log(`   End Date: ${quiz.end_date}`);
      console.log(
        `   Time Limit: ${quiz.time_limit || quiz.time_limit_minutes} minutes`
      );
      console.log(`   Total Questions: ${quiz.total_questions}`);
      console.log(`   Total Points: ${quiz.total_points}`);
      console.log(`   Passing Score: ${quiz.passing_score}`);
      console.log(`   Created At: ${quiz.created_at}`);
      console.log(`   Lecturer ID: ${quiz.lecturer_id}`);
      console.log("   ---");
    });

    // Check specifically for the quizzes mentioned
    const algorithmsQuiz = quizzes.find((q) => q.title === "ALGORITHMSN");
    const aiQuiz = quizzes.find((q) => q.title === "AI");

    console.log("\nSpecific Quiz Check:");
    console.log("ALGORITHMSN quiz found:", !!algorithmsQuiz);
    console.log("AI quiz found:", !!aiQuiz);

    if (algorithmsQuiz) {
      console.log(
        "ALGORITHMSN start_date type:",
        typeof algorithmsQuiz.start_date
      );
      console.log("ALGORITHMSN end_date type:", typeof algorithmsQuiz.end_date);
    }

    if (aiQuiz) {
      console.log("AI start_date type:", typeof aiQuiz.start_date);
      console.log("AI end_date type:", typeof aiQuiz.end_date);
    }
  } catch (err) {
    console.error("Script error:", err);
  }
}

checkNewQuizzes();
