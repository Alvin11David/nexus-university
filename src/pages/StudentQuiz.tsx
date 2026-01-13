import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Clock,
  BookOpen,
  Calendar,
  Award,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  Star,
  Zap,
  Trophy,
  Timer,
  BarChart3,
} from "lucide-react";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { autoCloseExpiredQuizzes } from "@/lib/quizUtils";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  time_limit_minutes: number | null;
  max_attempts: number;
  passing_score: number | null;
  status: "draft" | "active" | "closed";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  points: number;
  explanation?: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, number>;
  score: number;
  total_points: number;
  completed_at: string;
  time_taken: number;
}

export default function StudentQuiz() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0 && !showResults) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            // Auto-submit when time runs out
            if (prev === 1) {
              submitQuiz();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft, showResults]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      console.log("StudentQuiz: Current user:", user);
      console.log("StudentQuiz: Current time (now):", now);

      const { data, error } = await supabase
        .from("quizzes")
        .select(
          `
          id,
          title,
          description,
          course_id,
          time_limit_minutes,
          max_attempts,
          passing_score,
          status,
          start_date,
          end_date,
          created_at
        `
        )
        .eq("status", "active")
        .lte("start_date", now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order("created_at", { ascending: false });

      console.log("Fetching quizzes with query params:", {
        status: "active",
        start_date_lte: now,
        end_date_condition: `end_date.is.null,end_date.gte.${now}`,
      });

      console.log("Fetching quizzes with query params:", {
        status: "active",
        start_date_lte: now,
        end_date_condition: `end_date.is.null,end_date.gte.${now}`,
      });

      if (error) {
        console.error("Error loading quizzes:", error);
        throw error;
      }

      console.log("Fetched quizzes:", data);
      console.log("Number of quizzes found:", data?.length || 0);

      // Debug date comparisons
      if (data && data.length > 0) {
        data.forEach((quiz, index) => {
          const startDate = new Date(quiz.start_date);
          const endDate = new Date(quiz.end_date);
          const currentTime = new Date(now);

          console.log(`Quiz ${index + 1} date check:`);
          console.log(`  Title: ${quiz.title}`);
          console.log(`  Start: ${quiz.start_date} (${startDate})`);
          console.log(`  End: ${quiz.end_date} (${endDate})`);
          console.log(`  Now: ${now} (${currentTime})`);
          console.log(`  Start <= Now: ${startDate <= currentTime}`);
          console.log(`  End >= Now: ${endDate >= currentTime}`);
        });
      }

      // Check for any expired active quizzes and auto-close them
      await autoCloseExpiredQuizzes(supabase);

      setQuizzes(data || []);
    } catch (error: any) {
      console.error("Error loading quizzes:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load quizzes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const takeQuiz = async (quiz: Quiz) => {
    try {
      // For now, we'll simulate quiz questions since the questions table might not exist yet
      // In a real implementation, you'd fetch questions from a quiz_questions table
      const mockQuestions: QuizQuestion[] = [
        {
          id: "1",
          quiz_id: quiz.id,
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correct_answer: 2,
          points: 10,
          explanation: "Paris is the capital and most populous city of France.",
        },
        {
          id: "2",
          quiz_id: quiz.id,
          question:
            "Which programming language is known as the 'mother of all languages'?",
          options: ["Python", "C", "Java", "JavaScript"],
          correct_answer: 1,
          points: 10,
          explanation:
            "C is often called the mother of all languages because many modern languages are derived from it.",
        },
        {
          id: "3",
          quiz_id: quiz.id,
          question: "What does CPU stand for?",
          options: [
            "Central Processing Unit",
            "Computer Personal Unit",
            "Central Program Utility",
            "Computer Processing Utility",
          ],
          correct_answer: 0,
          points: 10,
          explanation:
            "CPU stands for Central Processing Unit, which is the brain of the computer.",
        },
      ];

      setQuizQuestions(mockQuestions);
      setTakingQuiz(quiz);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setQuizStartTime(new Date());
      setTimeLeft(quiz.time_limit_minutes * 60); // Convert minutes to seconds
      setShowResults(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start quiz",
        variant: "destructive",
      });
    }
  };

  const submitQuiz = async () => {
    if (!takingQuiz || !quizStartTime) return;

    try {
      const timeTaken = Math.floor(
        (new Date().getTime() - quizStartTime.getTime()) / 1000
      );
      let totalScore = 0;

      // Calculate score
      quizQuestions.forEach((question) => {
        const userAnswer = answers[question.id];
        if (userAnswer === question.correct_answer) {
          totalScore += question.points;
        }
      });

      setQuizScore(totalScore);
      setShowResults(true);

      // Here you would save the attempt to the database
      // For now, we'll just show the results

      toast({
        title: "Quiz Completed!",
        description: `You scored ${totalScore} out of 10 points`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
    }
  };
  const resetQuiz = () => {
    setTakingQuiz(null);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(null);
    setQuizStartTime(null);
    setShowResults(false);
    setQuizScore(0);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 text-foreground">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl rounded-full opacity-60" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-bl from-secondary/15 via-primary/10 to-transparent blur-3xl rounded-full opacity-40" />
      </div>

      <StudentHeader />

      <main className="px-4 pb-28 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto pt-6 lg:pt-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Target className="h-4 w-4" />
              Quiz Center
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Available Quizzes
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Test your knowledge and track your progress with interactive quizzes designed by your instructors
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full p-6">
                  <BookOpen className="h-12 w-12 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-xl font-semibold">Loading Quizzes</h3>
                <p className="text-muted-foreground">Fetching available quizzes...</p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* No Quizzes */}
          {!loading && quizzes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full p-8 w-32 h-32 mx-auto flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-primary/60" />
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                No Active Quizzes Yet
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Your lecturers haven't published any quizzes yet. Check back later or contact your instructor.
              </p>

              <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl p-6 mb-8 max-w-lg mx-auto border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground">
                    What makes a quiz appear here?
                  </h4>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Lecturer creates and publishes the quiz</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Quiz status is set to "active"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Current date is within quiz timeframe</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You have access to the course</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View My Progress
                </Button>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Contact Instructor
                </Button>
              </div>
            </motion.div>
          )}

          {/* Quizzes Grid */}
          {!loading && quizzes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="h-full border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-card/80 backdrop-blur-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden relative">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardHeader className="pb-4 relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Target className="h-4 w-4 text-primary" />
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20"
                            >
                              Active Quiz
                            </Badge>
                          </div>
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {quiz.title}
                          </CardTitle>
                        </div>
                      </div>

                      {quiz.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {quiz.description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4 relative">
                      {/* Course info */}
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {quiz.course_id || "General Course"}
                        </span>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <Timer className="h-4 w-4 text-blue-600" />
                          <div className="text-xs">
                            <div className="font-semibold text-blue-700 dark:text-blue-300">
                              {quiz.time_limit_minutes} min
                            </div>
                            <div className="text-blue-600/70 dark:text-blue-400/70">
                              Time Limit
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <Award className="h-4 w-4 text-green-600" />
                          <div className="text-xs">
                            <div className="font-semibold text-green-700 dark:text-green-300">
                              {quiz.passing_score}
                            </div>
                            <div className="text-green-600/70 dark:text-green-400/70">
                              To Pass
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                          <Users className="h-4 w-4 text-purple-600" />
                          <div className="text-xs">
                            <div className="font-semibold text-purple-700 dark:text-purple-300">
                              {quiz.max_attempts}
                            </div>
                            <div className="text-purple-600/70 dark:text-purple-400/70">
                              Attempts
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <Trophy className="h-4 w-4 text-orange-600" />
                          <div className="text-xs">
                            <div className="font-semibold text-orange-700 dark:text-orange-300">
                              10
                            </div>
                            <div className="text-orange-600/70 dark:text-orange-400/70">
                              Points
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Deadline */}
                      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <div className="text-xs flex-1">
                          <div className="font-medium text-amber-800 dark:text-amber-200">
                            Due Date
                          </div>
                          <div className="text-amber-700/80 dark:text-amber-300/80">
                            {quiz.end_date
                              ? formatDateTime(quiz.end_date)
                              : "No deadline"}
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
                        size="sm"
                        onClick={() => takeQuiz(quiz)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Quiz
                        <Zap className="h-3 w-3 ml-2 opacity-70" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Quiz Taking Modal */}
      {takingQuiz && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && resetQuiz()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Quiz Header */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">{takingQuiz.title}</h2>
                  <p className="text-blue-100 text-sm">
                    {takingQuiz.course_id || "Course"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {timeLeft !== null && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm ${
                      timeLeft < 300 ? 'bg-red-500/20 border border-red-400/30' : 'bg-white/20'
                    }`}>
                      <Timer className={`h-4 w-4 ${timeLeft < 300 ? 'text-red-300' : ''}`} />
                      <span className={`font-mono text-sm font-semibold ${
                        timeLeft < 300 ? 'text-red-200' : ''
                      }`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetQuiz}
                    className="text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative mt-4">
                <div className="flex items-center justify-between text-xs text-blue-100 mb-2">
                  <span>Progress</span>
                  <span>{currentQuestionIndex + 1} of {quizQuestions.length}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-500 ease-out"
                    style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quiz Content */}
            <div className="p-6">
              {!showResults ? (
                <>
                  {/* Question */}
                  {quizQuestions[currentQuestionIndex] && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-6 border border-border/50">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {currentQuestionIndex + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2 leading-relaxed">
                              {quizQuestions[currentQuestionIndex].question}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Award className="h-4 w-4" />
                              <span>{quizQuestions[currentQuestionIndex].points} points</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {quizQuestions[currentQuestionIndex].options.map(
                          (option, index) => {
                            const isSelected = answers[quizQuestions[currentQuestionIndex].id] === index;
                            return (
                              <label
                                key={index}
                                className={`group flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground group-hover:border-primary'
                                }`}>
                                  {isSelected && (
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <input
                                  type="radio"
                                  name={`question-${quizQuestions[currentQuestionIndex].id}`}
                                  value={index}
                                  checked={isSelected}
                                  onChange={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [quizQuestions[currentQuestionIndex].id]: index,
                                    }))
                                  }
                                  className="sr-only"
                                />
                                <span className={`flex-1 text-sm leading-relaxed ${
                                  isSelected ? 'font-medium text-primary' : ''
                                }`}>
                                  {option}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                )}
                              </label>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                      {/* Navigation */}
                      <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                        <div className="flex items-center justify-between mb-4">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setCurrentQuestionIndex((prev) =>
                                Math.max(0, prev - 1)
                              )
                            }
                            disabled={currentQuestionIndex === 0}
                            className="gap-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>

                          <div className="flex flex-col items-center gap-2">
                            <div className="text-sm font-medium text-muted-foreground">
                              Question {currentQuestionIndex + 1} of {quizQuestions.length}
                            </div>
                            <div className="flex gap-1">
                              {quizQuestions.map((_, index) => {
                                const isAnswered = answers[quizQuestions[index].id] !== undefined;
                                const isCurrent = index === currentQuestionIndex;
                                return (
                                  <button
                                    key={index}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={`w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200 ${
                                      isCurrent
                                        ? 'bg-primary text-white shadow-lg scale-110'
                                        : isAnswered
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                                  >
                                    {index + 1}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {currentQuestionIndex === quizQuestions.length - 1 ? (
                            <Button
                              onClick={submitQuiz}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 gap-2 shadow-lg"
                              size="lg"
                            >
                              <Trophy className="h-4 w-4" />
                              Submit Quiz
                            </Button>
                          ) : (
                            <Button
                              onClick={() =>
                                setCurrentQuestionIndex((prev) =>
                                  Math.min(quizQuestions.length - 1, prev + 1)
                                )
                              }
                              className="gap-2"
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Progress summary */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/50">
                          <span>
                            Answered: {Object.keys(answers).length} of {quizQuestions.length}
                          </span>
                          <span>
                            {Math.round((Object.keys(answers).length / quizQuestions.length) * 100)}% complete
                          </span>
                        </div>
                      </div>
                  y i 
                </>
              ) : (
                /* Results */
                <div className="text-center space-y-8">
                  {/* Result icon */}
                  <div className="relative">
                    <div className={`text-8xl ${quizScore >= takingQuiz.passing_score ? 'animate-bounce' : 'animate-pulse'}`}>
                      {quizScore >= takingQuiz.passing_score ? "🎉" : "💪"}
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Star className={`h-8 w-8 ${quizScore >= takingQuiz.passing_score ? 'text-yellow-400' : 'text-gray-400'}`} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {quizScore >= takingQuiz.passing_score ? "Congratulations!" : "Keep Trying!"}
                    </h3>
                    <p className="text-muted-foreground text-lg">
                      You scored <span className="font-bold text-foreground">{quizScore}</span> out of <span className="font-bold text-foreground">10</span> points
                    </p>
                  </div>

                  {/* Score breakdown */}
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-6 border border-border/50">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">{quizScore}</div>
                        <div className="text-sm text-muted-foreground">Your Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-muted-foreground mb-1">{takingQuiz.passing_score}</div>
                        <div className="text-sm text-muted-foreground">Passing Score</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{Math.round((quizScore / 10) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            quizScore >= takingQuiz.passing_score
                              ? 'bg-gradient-to-r from-green-400 to-green-500'
                              : 'bg-gradient-to-r from-orange-400 to-orange-500'
                          }`}
                          style={{ width: `${(quizScore / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Result badge */}
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold ${
                      quizScore >= takingQuiz.passing_score
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                    }`}>
                      {quizScore >= takingQuiz.passing_score ? (
                        <>
                          <Trophy className="h-4 w-4" />
                          Passed Successfully!
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4" />
                          Keep Practicing
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={resetQuiz} size="lg" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      View Results
                    </Button>
                    <Button variant="outline" onClick={resetQuiz} size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      Take Another Quiz
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      <StudentBottomNav />
    </div>
  );
}
