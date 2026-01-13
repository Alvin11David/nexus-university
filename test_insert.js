import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oszbmaqieyemkgcqbeap.supabase.co",
  "sb_publishable_BFaFrQY16mkqYHF5mri5ow_f94fPHjF"
);

async function testInsert() {
  try {
    console.log("Testing quiz insertion...\n");

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.log("Auth error:", authError);
      return;
    }

    if (!user) {
      console.log("No authenticated user");
      return;
    }

    console.log("Authenticated user:", user.id, user.email);

    // Check user role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.log("Profile error:", profileError);
    } else {
      console.log("User role:", profile.role);
    }

    // Try to insert a test quiz
    const testQuiz = {
      title: "TEST QUIZ - PLEASE DELETE",
      description: "Test quiz to check insertion",
      course_id: "test-course-id", // This might fail but let's see
      lecturer_id: user.id,
      status: "draft",
      total_questions: 1,
      total_points: 10,
      time_limit: 30,
      passing_score: 5,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    };

    console.log("Attempting to insert test quiz:", testQuiz);

    const { data, error } = await supabase
      .from("quizzes")
      .insert([testQuiz])
      .select();

    if (error) {
      console.log("Insert error:", error);
      console.log("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("Insert successful! Data:", data);

      // Clean up - delete the test quiz
      if (data && data[0]) {
        await supabase.from("quizzes").delete().eq("id", data[0].id);
        console.log("Test quiz deleted");
      }
    }
  } catch (err) {
    console.error("Script error:", err);
  }
}

testInsert();
