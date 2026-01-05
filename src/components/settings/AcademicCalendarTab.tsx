import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  Bell,
  ChevronLeft,
  ChevronRight,
  Flag,
  Star,
  AlertCircle,
  Sparkles,
  FileText,
  Download,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: "academic" | "exam" | "holiday" | "deadline" | "event" | "assignment";
  description?: string;
  important?: boolean;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  points: number;
  status: "pending" | "submitted" | "graded";
  type: "coding" | "lab" | "presentation" | "essay";
  instructions: string;
  attachments: Array<{
    id: string;
    name: string;
    type: "pdf" | "docx" | "xlsx" | "doc";
    url: string;
    size: string;
  }>;
  submissions: Array<{
    id: string;
    date: string;
    grade?: number;
    feedback?: string;
    fileName: string;
  }>;
}

const academicEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Semester 1 Begins",
    date: "2026-01-05",
    type: "academic",
    important: true,
  },
  {
    id: "2",
    title: "Late Registration Deadline",
    date: "2026-01-19",
    type: "deadline",
  },
  {
    id: "3",
    title: "Course Add/Drop Period Ends",
    date: "2026-01-26",
    type: "deadline",
  },
  { id: "4", title: "Martyrs Day", date: "2026-06-03", type: "holiday" },
  { id: "5", title: "Independence Day", date: "2026-10-09", type: "holiday" },
  {
    id: "6",
    title: "Mid-Semester Examinations",
    date: "2026-03-09",
    endDate: "2026-03-20",
    type: "exam",
    important: true,
  },
  {
    id: "7",
    title: "Easter Break",
    date: "2026-04-03",
    endDate: "2026-04-06",
    type: "holiday",
  },
  {
    id: "8",
    title: "End of Semester Examinations",
    date: "2026-05-18",
    endDate: "2026-06-05",
    type: "exam",
    important: true,
  },
  {
    id: "9",
    title: "Semester 1 Ends",
    date: "2026-06-05",
    type: "academic",
    important: true,
  },
  {
    id: "10",
    title: "Semester Break",
    date: "2026-06-06",
    endDate: "2026-08-02",
    type: "holiday",
  },
  {
    id: "11",
    title: "Semester 2 Begins",
    date: "2026-08-03",
    type: "academic",
    important: true,
  },
  {
    id: "12",
    title: "Graduation Ceremony",
    date: "2026-02-27",
    type: "event",
    important: true,
  },
];

// Mock assignment data - kept for reference but not used; real data comes from Supabase
/*
const assignmentsData: Assignment[] = [
  {
    id: "asg-1",
    title: "Binary Trees Implementation",
    course: "Advanced Data Structures",
    dueDate: "2026-01-08",
    points: 30,
    status: "pending",
    type: "coding",
    instructions:
      "Implement a complete binary search tree with insert, delete, and search operations. Include AVL tree self-balancing. Submit your code with comprehensive comments.",
    attachments: [
      {
        id: "att-1",
        name: "BST_Template.java",
        type: "doc",
        url: "https://example.com/bst-template.java",
        size: "12 KB",
      },
      {
        id: "att-2",
        name: "Assignment_Rubric.pdf",
        type: "pdf",
        url: "https://example.com/rubric.pdf",
        size: "245 KB",
      },
    ],
    submissions: [],
  },
  {
    id: "asg-2",
    title: "SQL Replication Lab",
    course: "Database Systems & Cloud",
    dueDate: "2026-01-09",
    points: 25,
    status: "pending",
    type: "lab",
    instructions:
      "Set up master-slave replication in MySQL. Document the configuration steps and test failover scenarios.",
    attachments: [
      {
        id: "att-3",
        name: "Replication_Guide.pdf",
        type: "pdf",
        url: "https://example.com/replication-guide.pdf",
        size: "567 KB",
      },
      {
        id: "att-4",
        name: "Lab_Sheet.docx",
        type: "docx",
        url: "https://example.com/lab-sheet.docx",
        size: "134 KB",
      },
    ],
    submissions: [
      {
        id: "sub-1",
        date: "2026-01-08T14:30:00",
        fileName: "SQL_Replication_Solution.zip",
      },
    ],
  },
  {
    id: "asg-3",
    title: "Design Review: Sprint 2",
    course: "Software Engineering Studio",
    dueDate: "2026-01-12",
    points: 20,
    status: "graded",
    type: "presentation",
    instructions:
      "Present your design mockups and architecture decisions. Include wireframes, user flows, and technical architecture diagrams.",
    attachments: [
      {
        id: "att-5",
        name: "Design_Template.pptx",
        type: "doc",
        url: "https://example.com/design-template.pptx",
        size: "8.2 MB",
      },
    ],
    submissions: [
      {
        id: "sub-2",
        date: "2026-01-12T10:00:00",
        grade: 95,
        feedback:
          "Excellent presentation! The architecture is well-thought-out and scalable.",
        fileName: "Sprint2_Design_Review.pdf",
      },
    ],
  },
];
*/

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AcademicCalendarTab() {
  const { user } = useAuth();
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    today.toISOString().split("T")[0]
  );
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "assignments">(
    "calendar"
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dynamicAssignments, setDynamicAssignments] = useState<CalendarEvent[]>(
    []
  );
  const [supabaseAssignments, setSupabaseAssignments] = useState<
    Array<{
      id: string;
      title: string;
      due_date: string;
      total_points: number | null;
      description: string | null;
      status: string | null;
      course_id: string;
      courses?: { code: string; title: string };
    }>
  >([]);
  const [submissionStatuses, setSubmissionStatuses] = useState<
    Map<string, string>
  >(new Map());
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  // Fetch assignments from Supabase and convert to calendar events
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) {
        setAssignmentsLoading(false);
        return;
      }

      try {
        setAssignmentsLoading(true);

        // Get student's enrolled courses
        const { data: enrollments, error: enrollError } = await supabase
          .from("enrollments")
          .select("course_id, status")
          .eq("student_id", user.id)
          .in("status", ["approved", "pending"]);

        if (enrollError) throw enrollError;

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map((e) => e.course_id);

          // Fetch assignments for enrolled courses with course info
          const { data: assignmentsResult, error: assignmentsError } =
            await supabase
              .from("assignments")
              .select(
                "id, title, due_date, total_points, description, status, course_id, courses(code, title)"
              )
              .in("course_id", courseIds);

          if (assignmentsError) throw assignmentsError;

          if (assignmentsResult) {
            setSupabaseAssignments(
              assignmentsResult as typeof supabaseAssignments
            );

            // Fetch submission statuses for each assignment
            const assignmentIds = assignmentsResult.map((a) => a.id);
            if (assignmentIds.length > 0) {
              const { data: submissions, error: subError } = await supabase
                .from("submissions")
                .select("assignment_id, status")
                .eq("student_id", user.id)
                .in("assignment_id", assignmentIds);

              if (subError) throw subError;

              const statusMap = new Map<string, string>();
              (submissions || []).forEach((sub) => {
                statusMap.set(sub.assignment_id, sub.status || "pending");
              });
              setSubmissionStatuses(statusMap);
            }

            // Convert assignments to calendar events
            const assignmentEvents: CalendarEvent[] = (
              assignmentsResult as any[]
            ).map((a) => ({
              id: `assign-${a.id}`,
              title: a.title,
              date: new Date(a.due_date).toISOString().split("T")[0],
              type: "assignment" as const,
              description: a.description || "",
              important: false,
            }));

            setDynamicAssignments(assignmentEvents);
          }
        } else {
          setSupabaseAssignments([]);
          setDynamicAssignments([]);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setSupabaseAssignments([]);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();

    // Set up real-time listener for new assignments
    const subscription = supabase
      .channel("assignment-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Convert Supabase assignments to mock Assignment format for display
  const displayAssignments: Assignment[] = supabaseAssignments.map(
    (supaAsg) => {
      const submissionStatus = submissionStatuses.get(supaAsg.id) || "pending";
      return {
        id: supaAsg.id,
        title: supaAsg.title,
        course: supaAsg.courses?.title || "Unknown Course",
        dueDate: supaAsg.due_date,
        points: supaAsg.total_points || 0,
        status:
          submissionStatus === "submitted"
            ? "submitted"
            : submissionStatus === "graded"
            ? "graded"
            : "pending",
        type: "coding" as const, // Default type; could be enhanced with db field
        instructions: supaAsg.description || "No instructions provided",
        attachments: [],
        submissions:
          submissionStatus === "graded"
            ? [{ id: "sub", date: new Date().toISOString(), fileName: "" }]
            : submissionStatus === "submitted"
            ? [{ id: "sub", date: new Date().toISOString(), fileName: "" }]
            : [],
      };
    }
  );

  // Combine static academic events with dynamic assignments
  const allEvents = [...academicEvents, ...dynamicAssignments];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "academic":
        return "bg-primary/10 text-primary border-primary/20";
      case "exam":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "holiday":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "deadline":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "assignment":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "event":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEventTypeDot = (type: string) => {
    switch (type) {
      case "academic":
        return "bg-primary";
      case "exam":
        return "bg-destructive";
      case "holiday":
        return "bg-emerald-500";
      case "deadline":
        return "bg-amber-500";
      case "assignment":
        return "bg-purple-500";
      case "event":
        return "bg-secondary";
      default:
        return "bg-muted-foreground";
    }
  };

  // Generate calendar grid
  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const getAssignmentsForDate = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    return displayAssignments.filter((assignment) => {
      const assignDate = new Date(assignment.dueDate);
      const currentDate = new Date(dateStr);
      return (
        assignDate.getDate() === currentDate.getDate() &&
        assignDate.getMonth() === currentDate.getMonth() &&
        assignDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    return allEvents.filter((event) => {
      const eventStart = new Date(event.date);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      const currentDate = new Date(dateStr);
      return currentDate >= eventStart && currentDate <= eventEnd;
    });
  };

  const monthEvents = allEvents.filter((event) => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getMonth() === selectedMonth &&
      eventDate.getFullYear() === selectedYear
    );
  });

  const upcomingEvents = allEvents
    .filter((event) => new Date(event.date) >= new Date())
    .slice(0, 5);

  // Remove duplicate important dates (same date + title)
  const importantDates = Array.from(
    new Map(
      allEvents
        .filter((event) => event.important)
        .map((event) => [`${event.date}-${event.title}`, event])
    ).values()
  );

  const selectedDateEvents = selectedDate
    ? allEvents.filter((event) => {
        const eventDate = new Date(event.date).toDateString();
        return eventDate === new Date(selectedDate).toDateString();
      })
    : [];

  // File upload handler
  const handleFileSelect = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
    ];
    if (validTypes.includes(file.type)) {
      setUploadedFile(file);
    } else {
      alert("Please upload a valid file type: PDF, Word, Excel, or ZIP");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadSubmission = async () => {
    if (!uploadedFile || !selectedAssignment) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      // In a real app, you would upload to a server here
      console.log("Uploading file:", uploadedFile.name);
      alert(`File "${uploadedFile.name}" uploaded successfully!`);
      setUploadedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file. Please try again.");
      setIsUploading(false);
    }
  };

  const handleDownloadFile = (url: string, fileName: string) => {
    // Simulate file download
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Downloading:", fileName);
  };

  return (
    <div className="space-y-6">
      {/* Assignment Detail Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setSelectedAssignment(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border/50 md:border-border"
            >
              {/* Detail Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-6 flex items-start justify-between z-20">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                      {selectedAssignment.type}
                    </Badge>
                    <Badge variant="outline">
                      {selectedAssignment.points} pts
                    </Badge>
                    {selectedAssignment.status === "graded" && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Graded
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-1">
                    {selectedAssignment.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssignment.course}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Due Date & Status */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="bg-muted/50 border-0">
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Due Date
                      </p>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {new Date(
                          selectedAssignment.dueDate
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50 border-0">
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Points
                      </p>
                      <p className="font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        {selectedAssignment.points}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50 border-0">
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Status
                      </p>
                      <p
                        className={`font-semibold text-sm capitalize flex items-center gap-1 ${
                          selectedAssignment.status === "graded"
                            ? "text-emerald-600"
                            : selectedAssignment.status === "submitted"
                            ? "text-blue-600"
                            : "text-amber-600"
                        }`}
                      >
                        {selectedAssignment.status === "graded" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : selectedAssignment.status === "submitted" ? (
                          <Upload className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {selectedAssignment.status}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Instructions
                  </h3>
                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {selectedAssignment.instructions}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                {selectedAssignment.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Download className="h-5 w-5 text-primary" />
                      Download Resources (
                      {selectedAssignment.attachments.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedAssignment.attachments.map((att) => {
                        const getFileColor = (type: string) => {
                          switch (type) {
                            case "pdf":
                              return "from-red-500/10 to-rose-500/10 border-red-500/20";
                            case "docx":
                            case "doc":
                              return "from-blue-500/10 to-cyan-500/10 border-blue-500/20";
                            case "xlsx":
                              return "from-emerald-500/10 to-teal-500/10 border-emerald-500/20";
                            default:
                              return "from-primary/10 to-accent/10 border-primary/20";
                          }
                        };

                        const getFileIcon = (type: string) => {
                          switch (type) {
                            case "pdf":
                              return "text-red-600";
                            case "docx":
                            case "doc":
                              return "text-blue-600";
                            case "xlsx":
                              return "text-emerald-600";
                            default:
                              return "text-primary";
                          }
                        };

                        const getBgColor = (type: string) => {
                          switch (type) {
                            case "pdf":
                              return "bg-red-500/20";
                            case "docx":
                            case "doc":
                              return "bg-blue-500/20";
                            case "xlsx":
                              return "bg-emerald-500/20";
                            default:
                              return "bg-primary/20";
                          }
                        };

                        return (
                          <motion.div
                            key={att.id}
                            whileHover={{ y: -2 }}
                            className={`bg-gradient-to-r ${getFileColor(
                              att.type
                            )} border rounded-xl p-4 transition-all group cursor-pointer hover:shadow-lg`}
                            onClick={() =>
                              handleDownloadFile(att.url, att.name)
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                  className={`h-12 w-12 rounded-lg ${getBgColor(
                                    att.type
                                  )} flex items-center justify-center flex-shrink-0`}
                                >
                                  <FileText
                                    className={`h-6 w-6 ${getFileIcon(
                                      att.type
                                    )}`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">
                                    {att.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {att.size}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                  {att.type.toUpperCase()}
                                </span>
                                <Download className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:translate-y-0.5" />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submissions */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Your Submissions
                  </h3>
                  {selectedAssignment.submissions.length > 0 ? (
                    <div className="space-y-4">
                      {selectedAssignment.submissions.map((sub, idx) => (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-xl p-5 hover:border-emerald-500/50 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">
                                  {sub.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Submitted on{" "}
                                  {new Date(sub.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                            {sub.grade !== undefined && (
                              <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-700 border-emerald-500/30 font-semibold">
                                {sub.grade}%
                              </Badge>
                            )}
                          </div>

                          {sub.feedback && (
                            <div className="mt-4 pt-4 border-t border-emerald-500/20">
                              <div className="bg-white/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">
                                  📝 Lecturer Feedback
                                </p>
                                <p className="text-sm text-foreground/85 leading-relaxed">
                                  {sub.feedback}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-dashed border-amber-500/30 rounded-xl p-8 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <AlertTriangle className="h-8 w-8 text-amber-600" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-amber-700 mb-1">
                        No submissions yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload your work before the deadline
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Section */}
                {selectedAssignment.status === "pending" && (
                  <div className="space-y-4">
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-primary/40 rounded-2xl p-8 text-center hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer group"
                    >
                      <input
                        ref={(input) => (
                          input?.addEventListener(
                            "change",
                            handleFileInputChange as any
                          ),
                          input
                        )}
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={handleFileInputChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer block"
                      >
                        <div className="flex justify-center mb-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold mb-1">
                          Drag and drop your file here
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          or click to browse (PDF, Word, Excel, ZIP)
                        </p>
                      </label>
                    </div>
                    {uploadedFile && (
                      <div className="bg-muted/60 rounded-lg p-4 border border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">
                              {uploadedFile.name}
                            </p>
                          </div>
                          <button
                            onClick={() => setUploadedFile(null)}
                            disabled={isUploading}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                          >
                            Clear
                          </button>
                        </div>
                        {isUploading && (
                          <div className="space-y-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">
                              {uploadProgress}% uploading...
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      onClick={handleUploadSubmission}
                      disabled={!uploadedFile || isUploading}
                      className="w-full h-12 bg-gradient-to-r from-primary via-accent to-secondary text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {isUploading
                        ? `Uploading... ${uploadProgress}%`
                        : "Upload Submission"}
                    </Button>
                  </div>
                )}

                {/* Submitted/Graded Info */}
                {selectedAssignment.status !== "pending" && (
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-xl p-4 text-center">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-700">
                      {selectedAssignment.status === "graded"
                        ? "Assignment Graded ✓"
                        : "Assignment Submitted ✓"}
                    </p>
                    {selectedAssignment.submissions[0]?.grade && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Your score: {selectedAssignment.submissions[0].grade}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs for Calendar and Assignments */}
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-accent/10 border-b">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "calendar" | "assignments")}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-2">
                <FileText className="h-4 w-4" />
                Assignments
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Calendar Header */}
          <Card className="bg-gradient-to-r from-primary/10 via-transparent to-accent/10 border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Calendar className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      Academic Calendar 2026
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Key dates and academic events
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSelectedMonth((m) => (m === 0 ? 11 : m - 1))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-32 text-center font-semibold">
                    {months[selectedMonth]} {selectedYear}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setSelectedMonth((m) => (m === 11 ? 0 : m + 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Monthly Calendar Grid */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden border-2 border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
                    {months[selectedMonth]} {selectedYear}
                  </CardTitle>
                  <CardDescription>
                    Click on dates to view events
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center font-semibold text-sm text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      const dayEvents = day ? getEventsForDate(day) : [];
                      const dayAssignments = day
                        ? getAssignmentsForDate(day)
                        : [];
                      const allItems = [...dayEvents, ...dayAssignments];
                      const isSelected =
                        selectedDate ===
                        `${selectedYear}-${String(selectedMonth + 1).padStart(
                          2,
                          "0"
                        )}-${String(day).padStart(2, "0")}`;
                      const today = new Date();
                      const isToday =
                        day &&
                        today.getDate() === day &&
                        today.getMonth() === selectedMonth &&
                        today.getFullYear() === selectedYear;
                      const hasImportant = dayEvents.some((e) => e.important);

                      return (
                        <motion.button
                          key={idx}
                          whileHover={day ? { scale: 1.05 } : {}}
                          whileTap={day ? { scale: 0.95 } : {}}
                          onClick={() => {
                            if (day) {
                              const dateStr = `${selectedYear}-${String(
                                selectedMonth + 1
                              ).padStart(2, "0")}-${String(day).padStart(
                                2,
                                "0"
                              )}`;
                              setSelectedDate(dateStr);

                              // If there's an assignment on this date, open it
                              if (dayAssignments.length > 0) {
                                setSelectedAssignment(dayAssignments[0]);
                              }
                            }
                          }}
                          className={`aspect-square rounded-xl p-2 text-sm font-medium transition-all relative group ${
                            !day
                              ? "cursor-default"
                              : isToday
                              ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg ring-2 ring-primary/50"
                              : isSelected
                              ? "bg-primary/20 border-2 border-primary text-primary"
                              : allItems.length > 0
                              ? "bg-gradient-to-br from-secondary/30 to-accent/20 border-2 border-secondary/40 text-foreground hover:border-secondary/60"
                              : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                          }`}
                        >
                          <div className="flex flex-col h-full">
                            <span className="text-base font-bold">{day}</span>
                            {allItems.length > 0 && (
                              <div className="flex gap-0.5 mt-auto justify-center flex-wrap">
                                {allItems.slice(0, 3).map((item, i) => (
                                  <div
                                    key={i}
                                    className={`h-1.5 w-1.5 rounded-full ${getEventTypeDot(
                                      "type" in item ? item.type : "event"
                                    )} shadow-sm`}
                                  />
                                ))}
                                {allItems.length > 3 && (
                                  <div className="text-xs opacity-70 w-full">
                                    +{allItems.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                            {allItems.length > 0 && (
                              <div className="mt-1 text-[10px] leading-tight text-center text-foreground/80 max-h-8 overflow-hidden">
                                {dayAssignments.length > 0
                                  ? dayAssignments[0].title
                                  : (allItems[0] as CalendarEvent).title}
                              </div>
                            )}
                            {hasImportant && (
                              <Star className="h-3 w-3 absolute top-1 right-1 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 justify-center mt-6 py-4 border-t border-border/50">
                    {[
                      { type: "academic", label: "Academic" },
                      { type: "exam", label: "Exams" },
                      { type: "holiday", label: "Holidays" },
                      { type: "deadline", label: "Deadlines" },
                      { type: "assignment", label: "Assignments" },
                      { type: "event", label: "Events" },
                    ].map((item) => (
                      <div key={item.type} className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${getEventTypeDot(
                            item.type
                          )}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Selected Date Details */}
                  {selectedDateEvents.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 pt-6 border-t border-border"
                    >
                      <h4 className="font-semibold mb-3">
                        Events on{" "}
                        {new Date(selectedDate!).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h4>
                      <div className="space-y-2">
                        {selectedDateEvents.map((event, i) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-3 rounded-lg border ${getEventTypeColor(
                              event.type
                            )}`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${getEventTypeDot(
                                  event.type
                                )}`}
                              />
                              <span className="font-medium text-sm">
                                {event.title}
                              </span>
                              {event.important && (
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs mt-1 opacity-70">
                                {event.description}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <Card className="overflow-hidden border-2 border-secondary/20">
                <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-secondary animate-bounce" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {upcomingEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all border border-transparent hover:border-primary/20"
                      >
                        <div
                          className={`h-3 w-3 rounded-full flex-shrink-0 ${getEventTypeDot(
                            event.type
                          )}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-1">
                            {event.title}
                            {event.important && (
                              <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Important Dates */}
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flag className="h-4 w-4 text-amber-500" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {importantDates.slice(0, 6).map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <span className="truncate font-medium">
                          {event.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs ml-2 flex-shrink-0 bg-white/50"
                        >
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm mb-1">
                        Academic Year
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The current academic year runs from August 2024 to July
                        2025. Check important deadlines to avoid penalties.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          {/* Assignments Header */}
          <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-accent/10 border-purple-500/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">My Assignments</h3>
                  <p className="text-sm text-muted-foreground">
                    {displayAssignments.length} total assignments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-amber-600">
                      {
                        displayAssignments.filter((a) => a.status === "pending")
                          .length
                      }
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Submitted
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {
                        displayAssignments.filter(
                          (a) => a.status === "submitted"
                        ).length
                      }
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Graded</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {
                        displayAssignments.filter((a) => a.status === "graded")
                          .length
                      }
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assignments List */}
          {assignmentsLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading assignments…</p>
            </div>
          )}

          {!assignmentsLoading && displayAssignments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No assignments yet for your enrolled courses.
              </p>
            </div>
          )}

          {!assignmentsLoading && displayAssignments.length > 0 && (
            <div className="grid gap-4">
              {displayAssignments.map((assignment, idx) => {
                const daysUntilDue = Math.ceil(
                  (new Date(assignment.dueDate).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysUntilDue < 0;
                const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedAssignment(assignment)}
                    className="relative overflow-hidden rounded-2xl cursor-pointer group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <Card className="border-2 relative group-hover:border-primary/50 transition-all backdrop-blur-sm bg-gradient-to-r from-card/80 to-card/60">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Icon & Type */}
                          <div
                            className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              assignment.status === "graded"
                                ? "bg-emerald-500/20"
                                : assignment.status === "submitted"
                                ? "bg-blue-500/20"
                                : "bg-purple-500/20"
                            }`}
                          >
                            <FileText
                              className={`h-6 w-6 ${
                                assignment.status === "graded"
                                  ? "text-emerald-600"
                                  : assignment.status === "submitted"
                                  ? "text-blue-600"
                                  : "text-purple-600"
                              }`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {assignment.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.course}
                                </p>
                              </div>

                              {/* Badges */}
                              <div className="flex gap-2 flex-wrap justify-end">
                                <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 capitalize text-xs">
                                  {assignment.type}
                                </Badge>
                                {isOverdue ? (
                                  <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
                                    Overdue
                                  </Badge>
                                ) : isDueSoon ? (
                                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                                    {daysUntilDue === 0
                                      ? "Due Today"
                                      : `Due in ${daysUntilDue}d`}
                                  </Badge>
                                ) : null}
                                {assignment.status === "graded" &&
                                  assignment.submissions[0]?.grade && (
                                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-xs">
                                      {assignment.submissions[0].grade}%
                                    </Badge>
                                  )}
                              </div>
                            </div>

                            {/* Progress & Details */}
                            <div className="space-y-3">
                              {assignment.status === "submitted" ||
                              assignment.status === "graded" ? (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Submission Status
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-600">
                                      {assignment.submissions[0]?.date &&
                                        new Date(
                                          assignment.submissions[0].date
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                    </span>
                                  </div>
                                  <Progress
                                    value={100}
                                    className="h-2 bg-muted"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Due:{" "}
                                      {new Date(
                                        assignment.dueDate
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    <span className="text-xs font-semibold text-amber-600">
                                      {assignment.points} pts
                                    </span>
                                  </div>
                                  <Progress
                                    value={0}
                                    className="h-2 bg-muted"
                                  />
                                </div>
                              )}

                              {/* Description Preview */}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {assignment.instructions}
                              </p>

                              {/* Action Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full group-hover:border-primary/50 group-hover:text-primary"
                              >
                                View Assignment Details
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
