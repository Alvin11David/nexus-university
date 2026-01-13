import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Users,
  TrendingUp,
  Award,
  Clock,
  Target,
  BookOpen,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface QuizAttempt {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  score: number;
  total_points: number;
  percentage: number;
  time_taken: number;
  completed_at: string;
  passed: boolean;
}

interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  averagePercentage: number;
  completionRate: number;
  highestScore: number;
  lowestScore: number;
  averageTime: number;
  passRate: number;
}

export default function QuizResults() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    totalAttempts: 0,
    averageScore: 0,
    averagePercentage: 0,
    completionRate: 0,
    highestScore: 0,
    lowestScore: 0,
    averageTime: 0,
    passRate: 0,
  });

  useEffect(() => {
    if (user?.id && id) {
      loadQuiz();
      loadResults();
    }
  }, [user?.id, id]);

  const loadQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .eq("lecturer_id", user?.id)
        .single();

      if (error) throw error;
      setQuiz(data);
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load quiz",
        variant: "destructive",
      });
    }
  };

  const loadResults = async () => {
    try {
      // Load quiz attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", id)
        .order("completed_at", { ascending: false });

      if (attemptsError) {
        // If table doesn't exist or has issues, set empty results
        console.log(
          "Quiz attempts table not available:",
          attemptsError.message
        );
        setAttempts([]);
        setStats({
          totalAttempts: 0,
          averageScore: 0,
          averagePercentage: 0,
          completionRate: 0,
          highestScore: 0,
          lowestScore: 0,
          averageTime: 0,
          passRate: 0,
        });
        return;
      }

      if (!attemptsData || attemptsData.length === 0) {
        setAttempts([]);
        setStats({
          totalAttempts: 0,
          averageScore: 0,
          averagePercentage: 0,
          completionRate: 0,
          highestScore: 0,
          lowestScore: 0,
          averageTime: 0,
          passRate: 0,
        });
        return;
      }

      // Load student profiles separately
      const studentIds = attemptsData.map((attempt) => attempt.student_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", studentIds);

      // Create a map of student profiles
      const profilesMap = new Map();
      if (!profilesError && profilesData) {
        profilesData.forEach((profile) => {
          profilesMap.set(profile.id, profile);
        });
      }

      const formattedAttempts: QuizAttempt[] = attemptsData.map((attempt) => {
        const profile = profilesMap.get(attempt.student_id);
        // Calculate time taken from started_at and completed_at if available
        const timeTaken =
          attempt.completed_at && attempt.started_at
            ? Math.round(
                (new Date(attempt.completed_at).getTime() -
                  new Date(attempt.started_at).getTime()) /
                  1000
              )
            : 0;

        return {
          id: attempt.id,
          student_id: attempt.student_id,
          student_name: profile?.full_name || "Unknown Student",
          student_email: profile?.email || "",
          score: attempt.score || 0,
          total_points: quiz?.total_points || 0, // Get from quiz data since not stored in attempt
          percentage:
            quiz?.total_points && quiz.total_points > 0
              ? Math.round((attempt.score / quiz.total_points) * 100)
              : 0,
          time_taken: timeTaken,
          completed_at:
            attempt.completed_at ||
            attempt.started_at ||
            new Date().toISOString(),
          passed: (attempt.score || 0) >= (quiz?.passing_score || 0),
        };
      });

      setAttempts(formattedAttempts);

      // Calculate stats
      if (formattedAttempts.length > 0) {
        const totalAttempts = formattedAttempts.length;
        const averageScore =
          formattedAttempts.reduce((sum, a) => sum + a.score, 0) /
          totalAttempts;
        const averagePercentage =
          formattedAttempts.reduce((sum, a) => sum + a.percentage, 0) /
          totalAttempts;
        const highestScore = Math.max(...formattedAttempts.map((a) => a.score));
        const lowestScore = Math.min(...formattedAttempts.map((a) => a.score));
        const averageTime =
          formattedAttempts.reduce((sum, a) => sum + a.time_taken, 0) /
          totalAttempts;
        const passRate =
          (formattedAttempts.filter((a) => a.passed).length / totalAttempts) *
          100;

        setStats({
          totalAttempts,
          averageScore: Math.round(averageScore * 10) / 10,
          averagePercentage: Math.round(averagePercentage),
          completionRate: 100, // All loaded attempts are completed
          highestScore,
          lowestScore,
          averageTime: Math.round(averageTime),
          passRate: Math.round(passRate),
        });
      }
    } catch (error: any) {
      console.error("Error loading results:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <LecturerHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
        <LecturerBottomNav />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <LecturerHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              Quiz not found
            </h2>
            <Button onClick={() => navigate("/lecturer/quiz")}>
              Back to Quizzes
            </Button>
          </div>
        </div>
        <LecturerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 text-foreground">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl rounded-full opacity-60" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-bl from-secondary/15 via-primary/10 to-transparent blur-3xl rounded-full opacity-40" />
      </div>

      <LecturerHeader />

      <main className="px-4 pb-28 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto pt-6 lg:pt-10">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/lecturer/quiz/${id}`)}
                className="rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{quiz.title}</h1>
                <p className="text-muted-foreground">
                  Quiz Results & Analytics
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              {
                label: "Total Attempts",
                value: stats.totalAttempts,
                icon: Users,
                color: "primary",
              },
              {
                label: "Average Score",
                value: `${stats.averageScore}/${quiz.total_points}`,
                icon: Target,
                color: "emerald",
              },
              {
                label: "Pass Rate",
                value: `${stats.passRate}%`,
                icon: Award,
                color: "blue",
              },
              {
                label: "Avg Time",
                value: formatTime(stats.averageTime),
                icon: Clock,
                color: "amber",
              },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm text-muted-foreground font-semibold">
                      {stat.label}
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Results Table */}
          <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-lg">
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-3 px-4 font-semibold">
                          Student
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Score
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Percentage
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Time Taken
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Completed
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((attempt) => (
                        <tr
                          key={attempt.id}
                          className="border-b border-border/20 hover:bg-muted/20"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">
                                {attempt.student_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {attempt.student_email}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">
                              {attempt.score}/{attempt.total_points}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-medium ${
                                attempt.percentage >= 70
                                  ? "text-emerald-600"
                                  : attempt.percentage >= 50
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                            >
                              {attempt.percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-muted-foreground">
                              {formatTime(attempt.time_taken)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                attempt.passed ? "default" : "destructive"
                              }
                              className={
                                attempt.passed
                                  ? "bg-emerald-500/20 text-emerald-700"
                                  : ""
                              }
                            >
                              {attempt.passed ? "Passed" : "Failed"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">
                              {new Date(
                                attempt.completed_at
                              ).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No attempts recorded yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Students need to take the quiz for results to appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
