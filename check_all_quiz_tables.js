import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

async function checkAllQuizTables() {
  try {
    console.log("Checking all quiz-related tables...\n");

    // Check quizzes table
    const { data: quizzes, error: quizError } = await supabase
      .from("quizzes")
      .select("*");

    console.log("Quizzes table:");
    console.log("Count:", quizzes?.length || 0);
    if (quizError) console.log("Error:", quizError.message);

    // Check quiz_questions table
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("*");

    console.log("\nQuiz questions table:");
    console.log("Count:", questions?.length || 0);
    if (questionsError) console.log("Error:", questionsError.message);

    // Check quiz_attempts table
    const { data: attempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("*");

    console.log("\nQuiz attempts table:");
    console.log("Count:", attempts?.length || 0);
    if (attemptsError) console.log("Error:", attemptsError.message);

    // Check if there are any tables with 'quiz' in the name
    console.log("\nChecking for any tables with quiz in name...");
    // We can't easily list all tables, but let's check a few possibilities
  } catch (err) {
    console.error("Script error:", err);
  }
}

checkAllQuizTables();
