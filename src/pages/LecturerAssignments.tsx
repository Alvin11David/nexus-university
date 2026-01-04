import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Download,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  submissions: number;
  totalStudents: number;
  status: "draft" | "active" | "closed" | "graded";
  rubric?: string;
  averageScore?: number;
}

interface CourseOption {
  id: string;
  title: string;
  code: string;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "closed" | "graded"
  >("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalPoints: 100,
  });

  const mockAssignments: Assignment[] = [
    {
      id: "1",
      title: "Algorithm Design Challenge",
      description: "Implement sorting algorithms and analyze their complexity",
      dueDate: "2025-01-10",
      totalPoints: 100,
      submissions: 28,
      totalStudents: 30,
      status: "active",
      averageScore: 82,
    },
    {
      id: "2",
      title: "Data Structure Project",
      description: "Build a binary search tree with operations",
      dueDate: "2025-01-05",
      totalPoints: 100,
      submissions: 25,
      totalStudents: 30,
      status: "closed",
      averageScore: 78,
    },
    {
      id: "3",
      title: "Midterm Exam",
      description: "Comprehensive exam covering weeks 1-7",
      dueDate: "2025-01-15",
      totalPoints: 200,
      submissions: 0,
      totalStudents: 30,
      status: "draft",
    },
    {
      id: "4",
      title: "Code Review Assignment",
      description: "Peer review and improve given code samples",
      dueDate: "2024-12-28",
      totalPoints: 50,
      submissions: 29,
      totalStudents: 30,
      status: "graded",
      averageScore: 85,
    },
    {
      id: "5",
      title: "Research Paper",
      description: "Write a paper on latest AI technologies",
      dueDate: "2025-01-20",
      totalPoints: 150,
      submissions: 5,
      totalStudents: 30,
      status: "active",
      averageScore: 88,
    },
  ];

  useEffect(() => {
    setAssignments(mockAssignments);
  }, []);

  // Load lecturer courses from Supabase so we use real UUIDs, not placeholders
  useEffect(() => {
    if (!user) return;
    const loadCourses = async () => {
      const currentAcademicYear = new Date().getFullYear().toString();
      const currentSemester = "1";

      const { data, error } = await supabase
        .from("lecturer_courses")
        .select("id, course_id, courses(id, title, code)")
        .eq("lecturer_id", user.id)
        .eq("academic_year", currentAcademicYear)
        .eq("semester", currentSemester);

      if (error) {
        console.error("Error loading courses", error);
        return;
      }

      const mapped = (data || []).map((lc: any) => ({
        id: lc.course_id,
        title: lc.courses?.title || "Untitled Course",
        code: lc.courses?.code || "",
      }));
      setCourses(mapped);

      // Preselect first course to reduce friction
      if (mapped.length > 0) {
        setSelectedCourse(mapped[0].id);
      }
    };

    loadCourses();
  }, [user]);

  const filteredAssignments =
    selectedFilter === "all"
      ? assignments
      : assignments.filter((a) => a.status === selectedFilter);

  const stats = {
    activeCount: assignments.filter((a) => a.status === "active").length,
    closedCount: assignments.filter((a) => a.status === "closed").length,
    gradedCount: assignments.filter((a) => a.status === "graded").length,
    averageSubmissionRate: (
      (assignments.reduce(
        (acc, a) => acc + a.submissions / a.totalStudents,
        0
      ) /
        assignments.length) *
      100
    ).toFixed(1),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-300/30";
      case "closed":
        return "bg-amber-500/20 text-amber-700 border-amber-300/30";
      case "graded":
        return "bg-blue-500/20 text-blue-700 border-blue-300/30";
      case "draft":
        return "bg-gray-500/20 text-gray-700 border-gray-300/30";
      default:
        return "bg-muted/60";
    }
  };

  const handleCreateAssignment = async () => {
    if (!formData.title || !formData.dueDate || !selectedCourse || !user) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select a course",
        variant: "destructive",
      });
      return;
    }

    // Ensure the selected course looks like a UUID to avoid invalid input errors
    if (selectedCourse && selectedCourse.includes("course-")) {
      toast({
        title: "Invalid course selection",
        description: "Please choose a real course from the list.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create assignment in database
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          course_id: selectedCourse,
          lecturer_id: user.id,
          title: formData.title,
          description: formData.description,
          due_date: new Date(formData.dueDate).toISOString(),
          total_points: formData.totalPoints,
          status: "draft",
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Get all enrolled students for this course
      const { data: enrolledStudents, error: enrollError } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("course_id", selectedCourse);

      if (enrollError) throw enrollError;

      // Send notifications to all enrolled students
      if (enrolledStudents && enrolledStudents.length > 0) {
        const notifications = enrolledStudents.map((enrollment) => ({
          user_id: enrollment.student_id,
          title: `New Assignment: ${formData.title}`,
          message: `A new assignment has been added to your course. Due: ${new Date(
            formData.dueDate
          ).toLocaleDateString()}`,
          type: "assignment",
          related_id: assignmentData.id,
          is_read: false,
        }));

        const { error: notifError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notifError)
          console.error("Error sending notifications:", notifError);
      }

      // Add to local state
      const newAssignment: Assignment = {
        id: assignmentData.id,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        totalPoints: formData.totalPoints,
        submissions: 0,
        totalStudents: enrolledStudents?.length || 0,
        status: "draft",
      };

      setAssignments([...assignments, newAssignment]);
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        totalPoints: 100,
      });
      setShowCreateModal(false);

      toast({
        title: "Success",
        description: `Assignment created and notifications sent to ${
          enrolledStudents?.length || 0
        } students`,
      });
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">
      <LecturerHeader />

      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* No Courses Message */}
        {courses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-300/30 rounded-xl p-6 text-center"
          >
            <p className="text-foreground mb-3">
              You haven't selected any courses yet. Please select the courses
              you teach to create assignments.
            </p>
            <Button
              className="bg-gradient-to-r from-primary to-secondary"
              onClick={() => navigate("/lecturer/courses")}
            >
              Select Courses
            </Button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Assignments</h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage course assignments
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-primary to-secondary gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" /> New Assignment
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="bg-emerald-500/10 border-emerald-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {stats.activeCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-amber-500/10 border-amber-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Closed</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {stats.closedCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-blue-500/10 border-blue-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Graded</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.gradedCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Avg Submission Rate
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.averageSubmissionRate}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex gap-2 flex-wrap"
        >
          {(["all", "active", "closed", "graded"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground hover:bg-muted"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Assignments List */}
        <div className="space-y-3">
          {filteredAssignments.map((assignment, i) => (
            <motion.div
              key={assignment.id}
              variants={rise}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <Card className="border-border/60 bg-card/70 backdrop-blur-lg hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">
                            {assignment.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {assignment.description}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={getStatusColor(assignment.status)}
                          >
                            {assignment.status.charAt(0).toUpperCase() +
                              assignment.status.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {assignment.submissions}/{assignment.totalStudents}{" "}
                            submitted
                          </Badge>
                          <Badge variant="secondary">
                            {assignment.totalPoints} points
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Submission Progress
                        </span>
                        <span className="font-semibold">
                          {(
                            (assignment.submissions /
                              assignment.totalStudents) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              (assignment.submissions /
                                assignment.totalStudents) *
                              100
                            }%`,
                          }}
                          transition={{ delay: 0.5, duration: 1 }}
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                        />
                      </div>
                    </div>

                    {/* Average Score if graded */}
                    {assignment.averageScore && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">
                            Average Score:{" "}
                          </span>
                          <span className="font-semibold text-foreground">
                            {assignment.averageScore}%
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Create Assignment Modal */}
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border/60 rounded-2xl p-6 max-w-md w-full space-y-4"
            >
              <h2 className="text-2xl font-bold">Create Assignment</h2>

              <div>
                <label className="text-sm font-medium block mb-1">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code
                        ? `${course.code} - ${course.title}`
                        : course.title}
                    </option>
                  ))}
                </select>
                {courses.length === 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No courses found. Please select the courses you teach.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/lecturer/courses")}
                      className="w-full"
                    >
                      Select Courses
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Assignment title"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Assignment description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Total Points
                  </label>
                  <input
                    type="number"
                    value={formData.totalPoints}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalPoints: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAssignment}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  {loading ? "Creating..." : "Create"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

      <LecturerBottomNav />
    </div>
  );
}
