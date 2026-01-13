import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

async function checkLecturerQuizzes() {
  try {
    console.log(
      "Checking quizzes for lecturer: db3a3753-6b97-49e8-a8c4-b3715cef56a3\n"
    );

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("lecturer_id", "db3a3753-6b97-49e8-a8c4-b3715cef56a3")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
      return;
    }

    console.log(`Found ${data.length} quizzes for this lecturer:\n`);

    data.forEach((quiz, index) => {
      console.log(`${index + 1}. Quiz Details:`);
      console.log(`   ID: ${quiz.id}`);
      console.log(`   Title: ${quiz.title}`);
      console.log(`   Description: ${quiz.description}`);
      console.log(`   Status: ${quiz.status}`);
      console.log(`   Course ID: ${quiz.course_id}`);
      console.log(`   Course Title: ${quiz.course_title}`);
      console.log(`   Start Date: ${quiz.start_date}`);
      console.log(`   End Date: ${quiz.end_date}`);
      console.log(`   Created At: ${quiz.created_at}`);
      console.log(`   Lecturer ID: ${quiz.lecturer_id}`);
      console.log("   ---");
    });
  } catch (err) {
    console.error("Script error:", err);
  }
}

checkLecturerQuizzes();
