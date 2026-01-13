import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

async function checkDatabase() {
  try {
    // Check quizzes
    const { count: quizCount, error: quizError } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true });

    console.log("Quizzes in database:", quizCount);

    // Check courses
    const { count: courseCount, error: courseError } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    console.log("Courses in database:", courseCount);

    if (courseCount > 0) {
      console.log(
        "Courses exist, so lecturers should be able to create quizzes"
      );
    } else {
      console.log("No courses found - this might be why no quizzes exist");
    }
  } catch (err) {
    console.error("Script error:", err);
  }
}

checkDatabase();
