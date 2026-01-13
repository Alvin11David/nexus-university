import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Clock,
  Award,
  Users,
  Sparkles,
  Save,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CourseOption {
  id: string;
  title: string;
  code: string;
}

interface QuizQuestion {
  id?: string;
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
}

export default function EditQuiz() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses] = useState<CourseOption[]>([
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Data Structures 101",
      code: "CS201",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      title: "Algorithms",
      code: "CS202",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      title: "Programming Fundamentals",
      code: "CS101",
    },
  ]);

  // Quiz form data
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    courseId: "",
    courseTitle: "",
    courseCode: "",
    timeLimit: 30,
    passingScore: 70,
    startDate: "",
    endDate: "",
    status: "draft" as "draft" | "active" | "closed",
    attemptsAllowed: 1,
    shuffleQuestions: false,
    showAnswers: false,
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Load quiz data
  useEffect(() => {
    if (id && user?.id) {
      loadQuiz();
    }
  }, [id, user?.id]);

  const loadQuiz = async () => {
    try {
      setLoading(true);

      // Load quiz data
      // @ts-ignore - Supabase type instantiation issue
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .eq("lecturer_id", user?.id)
        .single();

      if (quizError) throw quizError;

      // Type assertion to handle schema differences
      const quizData = quiz as any;

      setQuizData({
        title: quizData.title || "",
        description: quizData.description || "",
        courseId: quizData.course_id || "",
        courseTitle: quizData.course_title || "",
        courseCode: quizData.course_code || "",
        timeLimit: quizData.time_limit || quizData.time_limit_minutes || 30,
        passingScore: quizData.passing_score || 70,
        startDate: quizData.start_date
          ? new Date(quizData.start_date).toISOString().split("T")[0]
          : "",
        endDate: quizData.end_date
          ? new Date(quizData.end_date).toISOString().split("T")[0]
          : "",
        status: quizData.status || "draft",
        attemptsAllowed:
          quizData.attempts_allowed || quizData.max_attempts || 1,
        shuffleQuestions: quizData.shuffle_questions || false,
        showAnswers: quizData.show_answers || false,
      });

      // Load questions
      try {
        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", id)
          .order("created_at", { ascending: true });

        if (!questionsError && questionsData) {
          const formattedQuestions = questionsData.map((q: any) => ({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options ? JSON.parse(JSON.stringify(q.options)) : [],
            correct_answer: String(q.correct_answer), // Ensure it's a string
            points: q.points,
            explanation: q.explanation || "",
          }));
          setQuestions(formattedQuestions);
        } else {
          // Try to load from localStorage as fallback
          const storageKey = `quiz_questions_${id}`;
          const storedQuestions = localStorage.getItem(storageKey);
          if (storedQuestions) {
            setQuestions(JSON.parse(storedQuestions));
          }
        }
      } catch (questionsError) {
        console.log("Error loading questions:", questionsError);
        // Try localStorage fallback
        const storageKey = `quiz_questions_${id}`;
        const storedQuestions = localStorage.getItem(storageKey);
        if (storedQuestions) {
          setQuestions(JSON.parse(storedQuestions));
        }
      }
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load quiz",
        variant: "destructive",
      });
      navigate("/lecturer/quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!user?.id || !id) return;

    try {
      setSaving(true);

      // Update quiz data
      const { error: quizError } = await supabase
        .from("quizzes")
        .update({
          title: quizData.title,
          description: quizData.description,
          course_id: quizData.courseId,
          course_title: quizData.courseTitle,
          course_code: quizData.courseCode,
          time_limit: quizData.timeLimit,
          passing_score: quizData.passingScore,
          start_date: quizData.startDate
            ? new Date(quizData.startDate).toISOString()
            : null,
          end_date: quizData.endDate
            ? new Date(quizData.endDate).toISOString()
            : null,
          status: quizData.status,
          attempts_allowed: quizData.attemptsAllowed,
          shuffle_questions: quizData.shuffleQuestions,
          show_answers: quizData.showAnswers,
        })
        .eq("id", id)
        .eq("lecturer_id", user.id);

      if (quizError) throw quizError;

      // Handle questions - delete existing and insert new ones
      try {
        // Delete existing questions
        const { error: deleteError } = await supabase
          .from("quiz_questions")
          .delete()
          .eq("quiz_id", id);

        if (deleteError) {
          console.log(
            "Error deleting existing questions:",
            deleteError.message
          );
        }

        // Insert new questions
        if (questions.length > 0) {
          const questionInserts = questions.map((q) => ({
            quiz_id: id,
            question: q.question,
            type: q.type,
            options: q.options,
            correct_answer: q.correct_answer,
            points: q.points,
            explanation: q.explanation,
          }));

          const { error: questionsError } = await supabase
            .from("quiz_questions")
            .insert(questionInserts as any);

          if (questionsError) {
            console.log(
              "Database question save failed, storing locally:",
              questionsError.message
            );
            // Store in localStorage as fallback
            const storageKey = `quiz_questions_${id}`;
            localStorage.setItem(storageKey, JSON.stringify(questions));
          }
        }
      } catch (questionsError) {
        console.log("Question save failed, storing locally:", questionsError);
        // Store in localStorage as fallback
        const storageKey = `quiz_questions_${id}`;
        localStorage.setItem(storageKey, JSON.stringify(questions));
      }

      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });

      navigate("/lecturer/quiz");
    } catch (error: any) {
      console.error("Error saving quiz:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save quiz",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correct_answer: "",
        points: 1,
        explanation: "",
      },
    ]);
  };

  const updateQuestion = (
    index: number,
    field: keyof QuizQuestion,
    value: any
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options) {
      question.options[optionIndex] = value;
      setQuestions(updatedQuestions);
    }
  };

  const addQuestionOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options) {
      question.options.push("");
      setQuestions(updatedQuestions);
    }
  };

  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    if (question.options && question.options.length > 2) {
      question.options.splice(optionIndex, 1);
      setQuestions(updatedQuestions);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 text-foreground">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl rounded-full opacity-60" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-bl from-secondary/15 via-primary/10 to-transparent blur-3xl rounded-full opacity-40" />
      </div>

      <LecturerHeader />

      <main className="px-4 pb-28 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto pt-6 lg:pt-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/lecturer/quiz")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Quizzes
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-foreground">
                Edit Quiz
              </h1>
              <p className="text-muted-foreground">
                Modify quiz settings and questions
              </p>
            </div>
          </div>

          {/* Quiz Settings */}
          <Card className="mb-8 border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Quiz Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title *</Label>
                  <Input
                    id="title"
                    value={quizData.title}
                    onChange={(e) =>
                      setQuizData({ ...quizData, title: e.target.value })
                    }
                    placeholder="Enter quiz title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select
                    value={quizData.courseId}
                    onValueChange={(value) => {
                      const course = courses.find((c) => c.id === value);
                      setQuizData({
                        ...quizData,
                        courseId: value,
                        courseTitle: course?.title || "",
                        courseCode: course?.code || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={quizData.description}
                  onChange={(e) =>
                    setQuizData({ ...quizData, description: e.target.value })
                  }
                  placeholder="Enter quiz description"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={quizData.timeLimit}
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        timeLimit: parseInt(e.target.value) || 30,
                      })
                    }
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    value={quizData.passingScore}
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        passingScore: parseInt(e.target.value) || 70,
                      })
                    }
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attempts">Attempts Allowed</Label>
                  <Input
                    id="attempts"
                    type="number"
                    value={quizData.attemptsAllowed}
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        attemptsAllowed: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={quizData.startDate}
                    onChange={(e) =>
                      setQuizData({ ...quizData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={quizData.endDate}
                    onChange={(e) =>
                      setQuizData({ ...quizData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={quizData.status}
                  onValueChange={(value: "draft" | "active" | "closed") =>
                    setQuizData({ ...quizData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shuffle"
                    checked={quizData.shuffleQuestions}
                    onCheckedChange={(checked) =>
                      setQuizData({ ...quizData, shuffleQuestions: checked })
                    }
                  />
                  <Label htmlFor="shuffle">Shuffle Questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showAnswers"
                    checked={quizData.showAnswers}
                    onCheckedChange={(checked) =>
                      setQuizData({ ...quizData, showAnswers: checked })
                    }
                  />
                  <Label htmlFor="showAnswers">
                    Show Answers After Submission
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card className="mb-8 border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Questions ({questions.length})
                </CardTitle>
                <Button
                  onClick={addQuestion}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No questions added yet</p>
                  <Button
                    onClick={addQuestion}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Question
                  </Button>
                </div>
              ) : (
                questions.map((question, index) => (
                  <Card key={index} className="border-border/40">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Question {index + 1}
                            </span>
                            <Select
                              value={question.type}
                              onValueChange={(
                                value:
                                  | "multiple_choice"
                                  | "true_false"
                                  | "short_answer"
                              ) => updateQuestion(index, "type", value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">
                                  Multiple Choice
                                </SelectItem>
                                <SelectItem value="true_false">
                                  True/False
                                </SelectItem>
                                <SelectItem value="short_answer">
                                  Short Answer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            value={question.question}
                            onChange={(e) =>
                              updateQuestion(index, "question", e.target.value)
                            }
                            placeholder="Enter your question"
                          />
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Input
                            type="number"
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(
                                index,
                                "points",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20"
                            min="1"
                          />
                          <span className="text-sm text-muted-foreground">
                            pts
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {question.type === "multiple_choice" && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          {question.options?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-2"
                            >
                              <Input
                                value={option}
                                onChange={(e) =>
                                  updateQuestionOption(
                                    index,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  removeQuestionOption(index, optionIndex)
                                }
                                disabled={question.options?.length <= 2}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestionOption(index)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      )}

                      {question.type === "true_false" && (
                        <div className="space-y-2">
                          <Label>Correct Answer</Label>
                          <Select
                            value={question.correct_answer}
                            onValueChange={(value) =>
                              updateQuestion(index, "correct_answer", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {question.type === "short_answer" && (
                        <div className="space-y-2">
                          <Label>Correct Answer</Label>
                          <Input
                            value={question.correct_answer}
                            onChange={(e) =>
                              updateQuestion(
                                index,
                                "correct_answer",
                                e.target.value
                              )
                            }
                            placeholder="Enter the correct answer"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                          value={question.explanation}
                          onChange={(e) =>
                            updateQuestion(index, "explanation", e.target.value)
                          }
                          placeholder="Explain why this is the correct answer"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/lecturer/quiz")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuiz}
              disabled={saving || !quizData.title.trim()}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
