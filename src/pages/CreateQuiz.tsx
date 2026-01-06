import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CourseOption {
  id: string;
  title: string;
  code: string;
}

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [courses] = useState<CourseOption[]>([
    { id: "1", title: "Data Structures 101", code: "CS201" },
    { id: "2", title: "Algorithms", code: "CS202" },
    { id: "3", title: "Programming Fundamentals", code: "CS101" },
    { id: "4", title: "Digital Logic", code: "CS150" },
  ]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    totalQuestions: 10,
    totalPoints: 20,
    timeLimit: 30,
    passingScore: 12,
    dueDate: "",
    status: "draft" as "draft" | "active" | "closed",
    attemptsAllowed: 1,
    shuffleQuestions: false,
    showAnswers: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Quiz title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.courseId) {
      newErrors.courseId = "Please select a course";
    }
    if (formData.totalQuestions < 1) {
      newErrors.totalQuestions = "Must have at least 1 question";
    }
    if (formData.totalPoints < 1) {
      newErrors.totalPoints = "Must have at least 1 point";
    }
    if (formData.timeLimit < 1) {
      newErrors.timeLimit = "Time limit must be at least 1 minute";
    }
    if (formData.passingScore > formData.totalPoints) {
      newErrors.passingScore = "Passing score cannot exceed total points";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }
    if (formData.attemptsAllowed < 1) {
      newErrors.attemptsAllowed = "Must allow at least 1 attempt";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const selectedCourse = courses.find((c) => c.id === formData.courseId);

      const { data, error } = await supabase
        .from("quizzes")
        .insert([
          {
            title: formData.title,
            description: formData.description,
            course_id: formData.courseId,
            course_title: selectedCourse?.title,
            course_code: selectedCourse?.code,
            total_questions: formData.totalQuestions,
            total_points: formData.totalPoints,
            time_limit: formData.timeLimit,
            passing_score: formData.passingScore,
            due_date: formData.dueDate,
            status: formData.status,
            attempts_allowed: formData.attemptsAllowed,
            shuffle_questions: formData.shuffleQuestions,
            show_answers: formData.showAnswers,
            lecturer_id: user.id,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz created successfully!",
      });

      navigate("/lecturer/quiz");
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === formData.courseId);

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
          <div className="mb-8 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/lecturer/quiz")}
              className="rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Quiz</h1>
              <p className="text-muted-foreground">
                Set up a new quiz for your course
              </p>
            </div>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreateQuiz}
            className="space-y-6"
          >
            {/* Basic Information */}
            <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>Basic Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Chapter 5 Quiz - Data Structures"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe what this quiz covers..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      handleInputChange("courseId", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.code})
                      </option>
                    ))}
                  </select>
                  {errors.courseId && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.courseId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      handleInputChange("dueDate", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.dueDate}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quiz Settings */}
            <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <CardTitle>Quiz Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Questions *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalQuestions}
                      onChange={(e) =>
                        handleInputChange(
                          "totalQuestions",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.totalQuestions && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.totalQuestions}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Total Points *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalPoints}
                      onChange={(e) =>
                        handleInputChange(
                          "totalPoints",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.totalPoints && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.totalPoints}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Time Limit (minutes) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.timeLimit}
                      onChange={(e) =>
                        handleInputChange("timeLimit", parseInt(e.target.value))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.timeLimit && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.timeLimit}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Passing Score *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.totalPoints}
                      value={formData.passingScore}
                      onChange={(e) =>
                        handleInputChange(
                          "passingScore",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.passingScore && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.passingScore}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Attempts Allowed *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.attemptsAllowed}
                      onChange={(e) =>
                        handleInputChange(
                          "attemptsAllowed",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {errors.attemptsAllowed && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.attemptsAllowed}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange(
                          "status",
                          e.target.value as "draft" | "active" | "closed"
                        )
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card className="border-border/60 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Options</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.shuffleQuestions}
                    onChange={(e) =>
                      handleInputChange("shuffleQuestions", e.target.checked)
                    }
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium">Shuffle Questions</p>
                    <p className="text-sm text-muted-foreground">
                      Randomize question order for each student
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showAnswers}
                    onChange={(e) =>
                      handleInputChange("showAnswers", e.target.checked)
                    }
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium">Show Answers After Submission</p>
                    <p className="text-sm text-muted-foreground">
                      Allow students to see correct answers
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/lecturer/quiz")}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Quiz
                  </>
                )}
              </Button>
            </div>
          </motion.form>
        </div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
