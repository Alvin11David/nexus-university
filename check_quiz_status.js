import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

async function checkQuizStatus() {
  try {
    console.log("Checking current quiz status...\n");

    // Get the quiz data
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", "edf5eaf5-c24c-4785-a70d-f5eb3425143e")
      .single();

    if (error) {
      console.error("Error fetching quiz:", error);
      return;
    }

    console.log("Current quiz data:");
    console.log("Title:", data.title);
    console.log("Status:", data.status);
    console.log("Start Date:", data.start_date);
    console.log("End Date:", data.end_date);
    console.log("Created At:", data.created_at);

    // Check current time
    const now = new Date();
    console.log("\nCurrent time (now):", now.toISOString());

    // Check if quiz should be visible to students
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    console.log("\nDate comparison:");
    console.log(
      "Start <= Now:",
      startDate <= now,
      `(Start: ${startDate.toISOString()}, Now: ${now.toISOString()})`
    );
    console.log(
      "End >= Now:",
      endDate >= now,
      `(End: ${endDate.toISOString()}, Now: ${now.toISOString()})`
    );
    console.log("Status is active:", data.status === "active");

    const shouldBeVisible =
      data.status === "active" && startDate <= now && endDate >= now;
    console.log("\nShould be visible to students:", shouldBeVisible);
  } catch (err) {
    console.error("Script error:", err);
  }
}

checkQuizStatus();
