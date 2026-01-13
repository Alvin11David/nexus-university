// Utility function to auto-close expired quizzes
export const autoCloseExpiredQuizzes = async (
  supabase: any,
  userId?: string
) => {
  try {
    const currentTime = new Date();

    // Find all active quizzes that have expired
    let query = supabase
      .from("quizzes")
      .select("id, end_date")
      .eq("status", "active")
      .not("end_date", "is", null);

    // If userId is provided, filter by lecturer (for lecturer views)
    if (userId) {
      query = query.eq("lecturer_id", userId);
    }

    const { data: activeQuizzes, error } = await query;

    if (error) {
      console.error("Error fetching active quizzes for auto-close:", error);
      return [];
    }

    if (!activeQuizzes || activeQuizzes.length === 0) {
      return [];
    }

    // Filter expired quizzes
    const expiredQuizzes = activeQuizzes.filter(
      (quiz: any) => new Date(quiz.end_date) < currentTime
    );

    if (expiredQuizzes.length === 0) {
      return [];
    }

    // Update expired quizzes to closed status
    const updatePromises = expiredQuizzes.map((quiz: any) =>
      supabase.from("quizzes").update({ status: "closed" }).eq("id", quiz.id)
    );

    await Promise.all(updatePromises);

    console.log(`Auto-closed ${expiredQuizzes.length} expired quizzes`);
    return expiredQuizzes.map((quiz: any) => quiz.id);
  } catch (error) {
    console.error("Error in autoCloseExpiredQuizzes:", error);
    return [];
  }
};
