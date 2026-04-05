import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Survey {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  instructor: string;
  deadline: string;
  status: "pending" | "completed" | "expired";
  questions: number;
  assigned_to?: string; 
}

export function useEvaluations() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setSurveys([]);
      setLoading(false);
      return;
    }

    const fetchEvaluations = async () => {
      try {
        // In a real app, evaluations might be assigned per course or per student.
        // For this implementation, we query an 'evaluations' collection for documents
        // that are assigned to this specific student.
        const evalsRef = collection(db, "evaluations");
        const q = query(evalsRef, where("assigned_to", "==", user.uid));
        
        const querySnapshot = await getDocs(q);
        const fetchedSurveys: Survey[] = [];
        
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedSurveys.push({
            id: docSnap.id,
            title: data.title || "Course Evaluation",
            course: data.course || "Unknown Course",
            courseCode: data.courseCode || "N/A",
            instructor: data.instructor || "Unknown Instructor",
            deadline: data.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: data.status || "pending",
            questions: data.questions || 6,
            assigned_to: data.assigned_to,
          });
        });

        // Filter out expired ones dynamically if needed
        const processedSurveys = fetchedSurveys.map(survey => {
          if (survey.status === "pending" && new Date(survey.deadline) < new Date()) {
            return { ...survey, status: "expired" as const };
          }
          return survey;
        });

        setSurveys(processedSurveys);
      } catch (err: any) {
        console.error("Error fetching evaluations:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [user]);

  const submitEvaluation = async (surveyId: string, ratings: Record<string, number>, feedback: string) => {
    if (!user) throw new Error("Must be logged in to submit evaluation");

    try {
      // 1. Add response to evaluation_responses
      await addDoc(collection(db, "evaluation_responses"), {
        survey_id: surveyId,
        student_id: user.uid,
        ratings,
        feedback,
        submitted_at: serverTimestamp(),
      });

      // 2. Mark the survey as completed for this student.
      // Depending on data structure, we might update the evaluation doc itself, 
      // or if it's a shared doc, we add to a "completed_by" array.
      // Assuming 'evaluations' holds student-specific instances for now.
      const surveyRef = doc(db, "evaluations", surveyId);
      await updateDoc(surveyRef, {
        status: "completed",
        completed_at: serverTimestamp()
      });

      // Update local state
      setSurveys(prev => 
        prev.map(s => 
          s.id === surveyId ? { ...s, status: "completed" } : s
        )
      );

      return { error: null };
    } catch (err: any) {
      console.error("Error submitting evaluation:", err);
      return { error: err };
    }
  };

  return { surveys, loading, error, submitEvaluation };
}
