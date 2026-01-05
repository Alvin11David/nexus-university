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
  Upload as UploadIcon,
  X,
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
  courseTitle?: string;
  instructionDocumentUrl?: string;
  instructionDocumentName?: string;
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
  const [viewing, setViewing] = useState<Assignment | null>(null);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalPoints: 100,
    instructionDocument: null as File | null,
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalPoints: 100,
    courseId: "",
    instructionDocument: null as File | null,
  });
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Load assignments created by this lecturer from Supabase
  useEffect(() => {
    if (!user) return;

    const loadAssignments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `id, title, description, due_date, total_points, status, course_id,
           lecturer_id,
           assignment_submissions(count),
           courses:course_id(title, code)
          `
        )
        .eq("lecturer_id", user.id)
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error loading assignments", error);
        toast({
          title: "Could not load assignments",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const mapped: Assignment[] = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description || "",
        dueDate: a.due_date,
        totalPoints: a.total_points ?? 100,
        submissions: a.assignment_submissions?.[0]?.count ?? 0,
        totalStudents: 0, // Unknown here; could be filled from enrollment later
        status: (a.status as Assignment["status"]) || "draft",
        courseTitle: a.courses?.title,
        instructionDocumentUrl: a.instruction_document_url,
        instructionDocumentName: a.instruction_document_name,
      }));

      setAssignments(mapped);
      setLoading(false);
    };

    loadAssignments();
  }, [user, toast]);

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
    averageSubmissionRate: assignments.length
      ? (
          assignments.reduce((acc, a) => {
            if (!a.totalStudents || a.totalStudents === 0) return acc;
            return acc + a.submissions / a.totalStudents;
          }, 0) /
            assignments.filter((a) => a.totalStudents && a.totalStudents > 0)
              .length || 0
        ).toFixed(1)
      : "0.0",
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
      let instructionDocUrl: string | null = null;
      let instructionDocName: string | null = null;

      // Upload instruction document if provided
      if (formData.instructionDocument) {
        setUploadingDocument(true);
        const fileName = `${user.id}/${Date.now()}-${
          formData.instructionDocument.name
        }`;
        const { data, error } = await supabase.storage
          .from("assignment-documents")
          .upload(fileName, formData.instructionDocument);

        if (error) throw new Error(`Document upload failed: ${error.message}`);

        if (data) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("assignment-documents")
            .getPublicUrl(fileName);
          instructionDocUrl = publicUrl;
          instructionDocName = formData.instructionDocument.name;
        }
        setUploadingDocument(false);
      }

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
          instruction_document_url: instructionDocUrl,
          instruction_document_name: instructionDocName,
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
      const course = courses.find((c) => c.id === selectedCourse);
      const newAssignment: Assignment = {
        id: assignmentData.id,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        totalPoints: formData.totalPoints,
        submissions: 0,
        totalStudents: enrolledStudents?.length || 0,
        status: "draft",
        courseTitle: course?.title,
        instructionDocumentUrl: instructionDocUrl || undefined,
        instructionDocumentName: instructionDocName || undefined,
      };

      setAssignments((prev) => [...prev, newAssignment]);
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        totalPoints: 100,
        instructionDocument: null,
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
      setUploadingDocument(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!user) return;
    const confirmed = window.confirm("Delete this assignment?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId)
      .eq("lecturer_id", user.id);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    toast({ title: "Assignment deleted" });
  };

  const handleOpenEdit = (assignment: Assignment) => {
    const course = courses.find((c) => c.title === assignment.courseTitle);
    setEditing(assignment);
    setEditFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate.slice(0, 10),
      totalPoints: assignment.totalPoints,
      courseId: course?.id || selectedCourse || courses[0]?.id || "",
      instructionDocument: null,
    });
  };

  const handleUpdateAssignment = async () => {
    if (!editing || !user) return;
    if (
      !editFormData.title ||
      !editFormData.dueDate ||
      !editFormData.courseId
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let instructionDocUrl = editing.instructionDocumentUrl;
      let instructionDocName = editing.instructionDocumentName;

      // Upload new instruction document if provided
      if (editFormData.instructionDocument) {
        setUploadingDocument(true);
        const fileName = `${user.id}/${Date.now()}-${
          editFormData.instructionDocument.name
        }`;
        const { data, error } = await supabase.storage
          .from("assignment-documents")
          .upload(fileName, editFormData.instructionDocument);

        if (error) throw new Error(`Document upload failed: ${error.message}`);

        if (data) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("assignment-documents")
            .getPublicUrl(fileName);
          instructionDocUrl = publicUrl;
          instructionDocName = editFormData.instructionDocument.name;
        }
        setUploadingDocument(false);
      }

      const { error, data } = await supabase
        .from("assignments")
        .update({
          title: editFormData.title,
          description: editFormData.description,
          due_date: new Date(editFormData.dueDate).toISOString(),
          total_points: editFormData.totalPoints,
          course_id: editFormData.courseId,
          instruction_document_url: instructionDocUrl,
          instruction_document_name: instructionDocName,
        })
        .eq("id", editing.id)
        .eq("lecturer_id", user.id)
        .select(
          `id, title, description, due_date, total_points, status, course_id,
           instruction_document_url, instruction_document_name,
           assignment_submissions(count),
           courses:course_id(title, code)`
        )
        .single();

      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const updated: Assignment = {
        id: (data as any).id,
        title: (data as any).title,
        description: (data as any).description || "",
        dueDate: (data as any).due_date,
        totalPoints: (data as any).total_points ?? 100,
        submissions: (data as any).assignment_submissions?.[0]?.count ?? 0,
        totalStudents: editing.totalStudents,
        status: ((data as any).status as Assignment["status"]) || "draft",
        courseTitle: (data as any).courses?.title,
        instructionDocumentUrl: instructionDocUrl,
        instructionDocumentName: instructionDocName,
      };

      setAssignments((prev) =>
        prev.map((a) => (a.id === editing.id ? updated : a))
      );
      setEditing(null);
      toast({ title: "Assignment updated" });
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingDocument(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-orange-900/20 to-background pb-28">
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
              <div className="p-3 bg-gradient-to-br from-orange-500 to-black rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Assignments</h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage course assignments
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-orange-500 to-black text-white hover:shadow-lg gap-2"
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
              <Card className="bg-gradient-to-br from-orange-500/15 to-black/15 border-orange-500/40">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Avg Submission Rate
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
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
                  ? "bg-gradient-to-r from-orange-500 to-black text-white"
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
              <Card className="border-orange-500/40 bg-gradient-to-br from-orange-900/10 to-black/10 backdrop-blur-lg hover:shadow-lg hover:border-orange-500/60 transition-all">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-orange-500" />
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
                          {assignment.courseTitle && (
                            <Badge variant="secondary" className="gap-1">
                              <FileText className="h-3 w-3" />
                              {assignment.courseTitle}
                            </Badge>
                          )}
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setViewing(assignment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleOpenEdit(assignment)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
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
                          {assignment.totalStudents > 0
                            ? (
                                (assignment.submissions /
                                  assignment.totalStudents) *
                                100
                              ).toFixed(0)
                            : "0"}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              assignment.totalStudents > 0
                                ? (assignment.submissions /
                                    assignment.totalStudents) *
                                  100
                                : 0
                            }%`,
                          }}
                          transition={{ delay: 0.5, duration: 1 }}
                          className="h-full bg-gradient-to-r from-orange-500 to-black"
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

              <div>
                <label className="text-sm font-medium block mb-1">
                  Instruction Document (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf,.txt"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instructionDocument: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    disabled={uploadingDocument}
                  />
                </div>
                {formData.instructionDocument && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">
                      {formData.instructionDocument.name}
                    </span>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          instructionDocument: null,
                        })
                      }
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: .doc, .docx, .pdf, .txt
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                  disabled={loading || uploadingDocument}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAssignment}
                  disabled={loading || uploadingDocument}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  {uploadingDocument
                    ? "Uploading..."
                    : loading
                    ? "Creating..."
                    : "Create"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* View Assignment Modal */}
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border/60 rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold">{viewing.title}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewing.description}
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Due: </span>
                  {new Date(viewing.dueDate).toLocaleString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Points: </span>
                  {viewing.totalPoints}
                </p>
                {viewing.courseTitle && (
                  <p>
                    <span className="text-muted-foreground">Course: </span>
                    {viewing.courseTitle}
                  </p>
                )}
              </div>

              {viewing.instructionDocumentUrl && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">
                    Instruction Document
                  </p>
                  <a
                    href={viewing.instructionDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    {viewing.instructionDocumentName || "Download Instructions"}
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setViewing(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleOpenEdit(viewing);
                    setViewing(null);
                  }}
                >
                  Edit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Assignment Modal */}
        {editing && (
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
              <h2 className="text-2xl font-bold">Edit Assignment</h2>

              <div>
                <label className="text-sm font-medium block mb-1">Course</label>
                <select
                  value={editFormData.courseId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      courseId: e.target.value,
                    })
                  }
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
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
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
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
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
                    value={editFormData.dueDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        dueDate: e.target.value,
                      })
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
                    value={editFormData.totalPoints}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        totalPoints: parseInt(e.target.value || "0"),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Instruction Document (Optional)
                </label>
                {editing?.instructionDocumentUrl && (
                  <div className="mb-2 p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Current document:
                    </p>
                    <a
                      href={editing.instructionDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-primary hover:text-primary/80"
                    >
                      <Download className="h-3 w-3" />
                      {editing.instructionDocumentName || "Download Current"}
                    </a>
                  </div>
                )}
                <div className="relative">
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf,.txt"
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        instructionDocument: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    disabled={uploadingDocument}
                  />
                </div>
                {editFormData.instructionDocument && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">
                      {editFormData.instructionDocument.name}
                    </span>
                    <button
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          instructionDocument: null,
                        })
                      }
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Upload to replace current document (optional)
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditing(null)}
                  className="flex-1"
                  disabled={loading || uploadingDocument}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAssignment}
                  disabled={loading || uploadingDocument}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  {uploadingDocument
                    ? "Uploading..."
                    : loading
                    ? "Saving..."
                    : "Save"}
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
