import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

async function checkTableStructure() {
  try {
    console.log("Checking quizzes table structure...\n");

    // Try to get column information by attempting an insert with invalid data
    // This will show us the expected columns
    const { error } = await supabase.from("quizzes").insert([
      {
        invalid_column: "test",
      },
    ]);

    if (error) {
      console.log("Insert error (expected):", error.message);
      console.log("This shows us what columns are expected");
    }

    // Try a simple select to see if table exists
    const { data, error: selectError } = await supabase
      .from("quizzes")
      .select("id")
      .limit(1);

    if (selectError) {
      console.log("Select error:", selectError);
    } else {
      console.log("Table exists and is accessible");
    }
  } catch (err) {
    console.error("Script error:", err);
  }
}

checkTableStructure();
