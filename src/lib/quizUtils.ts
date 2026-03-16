import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

// Utility function to auto-close expired quizzes
export const autoCloseExpiredQuizzes = async (userId?: string) => {
  try {
    const currentTime = new Date();

    // Find all active quizzes that have expired and have auto_deactivate enabled
    const quizzesRef = collection(db, "quizzes");
    let q = query(
      quizzesRef,
      where("status", "==", "active"),
      where("auto_deactivate", "==", true),
    );

    // Filter by lecturer (for lecturer views)
    if (userId) {
      q = query(q, where("lecturer_id", "==", userId));
    }

    const querySnapshot = await getDocs(q);
    const expiredQuizzes = querySnapshot.docs.filter((d) => {
      const data = d.data();
      return data.end_date && new Date(data.end_date) < currentTime;
    });

    if (expiredQuizzes.length === 0) {
      return [];
    }

    // Update expired quizzes to closed status using a batch for atomicity
    const batch = writeBatch(db);
    expiredQuizzes.forEach((d) => {
      batch.update(d.ref, { status: "closed" });
    });

    await batch.commit();

    console.log(`Auto-closed ${expiredQuizzes.length} expired quizzes`);
    return expiredQuizzes.map((d) => d.id);
  } catch (error) {
    console.error("Error in autoCloseExpiredQuizzes:", error);
    return [];
  }
};
