import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Trophy,
  Clock,
  TrendingUp,
  Calendar,
  Video,
  Users,
  Link,
  Plus,
  Clipboard,
  Mic,
  Play,
  FileText,
  Folder,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { StatCard } from "@/components/dashboard/StatCard";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { UpcomingCard } from "@/components/dashboard/UpcomingCard";
import { AnnouncementCard } from "@/components/dashboard/AnnouncementCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAuth } from "@/contexts/AuthContext";

type ResultCourse = {
  title: string;
  code: string;
  credits: number | null;
};

type ExamResultRow = {
  id: string;
  course_id: string;
  academic_year: string;
  semester: string;
  marks: number;
  grade: string | null;
  grade_point: number | null;
  courses?: ResultCourse;
};

type TermResult = {
  term: string;
  gpa: number;
  totalCredits: number;
  entries: Array<
    ExamResultRow & { courseTitle: string; courseCode: string; credits: number }
  >;
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || "Student";
  const firstName = displayName.split(" ")[0];
  const [stats, setStats] = useState({
    enrolled: 0,
    completed: 0,
    assignments: 0,
    liveMeets: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [cgpa, setCgpa] = useState(0);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [classAction, setClassAction] = useState<"join" | "create">("join");
  const [joinCode, setJoinCode] = useState("");
  const [className, setClassName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const classroomCourses = [
    {
      id: "gclass-1",
      title: "Advanced Data Structures",
      code: "GCL-ADS-2026",
      instructor: "Dr. Sarah Chen",
      room: "Main Campus - Lab 4",
      students: 156,
      banner: "from-indigo-500 via-blue-500 to-cyan-400",
      joinCode: "ads-26-x2z",
      meetLink: "https://meet.google.com/ads-26-x2z",
      progress: 72,
      unread: 3,
    },
    {
      id: "gclass-2",
      title: "Database Systems & Cloud",
      code: "GCL-DBS-2026",
      instructor: "Prof. James Okonkwo",
      room: "Innovation Hub",
      students: 189,
      banner: "from-emerald-500 via-teal-500 to-cyan-400",
      joinCode: "dbs-26-r7m",
      meetLink: "https://meet.google.com/dbs-26-r7m",
      progress: 54,
      unread: 1,
      isLive: true,
    },
    {
      id: "gclass-3",
      title: "Software Engineering Studio",
      code: "GCL-SE-2026",
      instructor: "Dr. Emily Nakamura",
      room: "SE Studio",
      students: 120,
      banner: "from-purple-500 via-fuchsia-500 to-pink-500",
      joinCode: "se-26-wip",
      meetLink: "https://meet.google.com/se-26-wip",
      progress: 86,
      unread: 0,
    },
  ];

  const classroomStream = [
    {
      course: "Advanced Data Structures",
      message: "Posted Lecture 5 slides + code samples on AVL Trees.",
      author: "Dr. Sarah Chen",
      time: "18m ago",
      type: "material",
    },
    {
      course: "Database Systems & Cloud",
      message:
        "Reminder: Live lab on replication + sharding starts at 10:00 AM (Meet).",
      author: "Prof. James Okonkwo",
      time: "1h ago",
      type: "live",
    },
    {
      course: "Software Engineering Studio",
      message:
        "Sprint 2 backlog is updated. Please check your tickets and story points.",
      author: "Dr. Emily Nakamura",
      time: "3h ago",
      type: "announcement",
    },
  ];

  const classroomAssignments = [
    {
      title: "Binary Trees Implementation",
      course: "Advanced Data Structures",
      due: "Due Today, 11:59 PM",
      points: 30,
      status: "pending",
      type: "coding",
    },
    {
      title: "SQL Replication Lab",
      course: "Database Systems & Cloud",
      due: "Due Tomorrow, 5:00 PM",
      points: 25,
      status: "pending",
      type: "lab",
    },
    {
      title: "Design Review: Sprint 2",
      course: "Software Engineering Studio",
      due: "Jan 12, 10:00 AM",
      points: 20,
      status: "completed",
      type: "presentation",
    },
  ];

  const meetSessions = [
    {
      course: "Database Systems & Cloud",
      starts: "Today · 10:00 AM",
      link: "https://meet.google.com/dbs-26-r7m",
      isLive: true,
    },
    {
      course: "Advanced Data Structures",
      starts: "Today · 2:00 PM",
      link: "https://meet.google.com/ads-26-x2z",
      isLive: false,
    },
  ];

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        setLoadingStats(true);

        const { data: enrollments, error: enrollError } = await supabase
          .from("enrollments")
          .select("status, course_id")
          .eq("student_id", user.id);

        if (enrollError) throw enrollError;

        const enrolledCourses = enrollments?.length || 0;
        const completedCourses =
          enrollments?.filter((e) => e.status === "completed").length || 0;

        const courseIds = (enrollments || [])
          .map((e) => e.course_id)
          .filter(Boolean);

        let pendingAssignments = 0;
        if (courseIds.length) {
          const { data: assignments, error: assignError } = await supabase
            .from("assignments")
            .select("id, due_date, course_id")
            .in("course_id", courseIds)
            .gte("due_date", new Date().toISOString());

          if (assignError) throw assignError;

          const assignmentIds = (assignments || []).map((a) => a.id);
          let submissions: { assignment_id: string; status: string }[] = [];

          if (assignmentIds.length) {
            const { data: subs, error: subError } = await supabase
              .from("submissions")
              .select("assignment_id, status")
              .eq("student_id", user.id)
              .in("assignment_id", assignmentIds);

            if (subError) throw subError;
            submissions = subs || [];
          }

          pendingAssignments = (assignments || []).filter((a) => {
            const submission = submissions.find(
              (s) => s.assignment_id === a.id
            );
            return !submission || submission.status !== "submitted";
          }).length;
        }

        setStats({
          enrolled: enrolledCourses,
          completed: completedCourses,
          assignments: pendingAssignments,
          liveMeets: meetSessions.filter((m) => m.isLive).length,
        });
      } catch (error) {
        console.error("Error loading dashboard stats", error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadResults = async () => {
      try {
        setResultsLoading(true);

        const { data, error } = await supabase
          .from("exam_results")
          .select(
            "id, course_id, academic_year, semester, marks, grade, grade_point, courses(title, code, credits)"
          )
          .eq("student_id", user.id)
          .order("academic_year", { ascending: false })
          .order("semester", { ascending: false });

        if (error) throw error;

        const normalized = (data as ExamResultRow[] | null)?.map((row) => ({
          ...row,
          courseTitle: row.courses?.title || "Course",
          courseCode: row.courses?.code || "",
          credits: row.courses?.credits || 3,
        }));

        const termMap = new Map<string, TermResult>();

        (normalized || []).forEach((row) => {
          const term = `${row.academic_year} · ${row.semester}`;
          const existing = termMap.get(term) || {
            term,
            gpa: 0,
            totalCredits: 0,
            entries: [],
          };

          const credits = row.credits || 3;
          const gradePoint = row.grade_point ?? 0;

          existing.entries.push(row);
          existing.totalCredits += credits;
          existing.gpa += gradePoint * credits;

          termMap.set(term, existing);
        });

        const terms = Array.from(termMap.values()).map((t) => ({
          ...t,
          gpa: t.totalCredits ? Number((t.gpa / t.totalCredits).toFixed(2)) : 0,
        }));

        // Compute CGPA
        const totalCredits = terms.reduce((sum, t) => sum + t.totalCredits, 0);
        const totalPoints = terms.reduce(
          (sum, t) => sum + t.gpa * t.totalCredits,
          0
        );
        const computedCgpa = totalCredits
          ? Number((totalPoints / totalCredits).toFixed(2))
          : 0;

        setTermResults(terms);
        setCgpa(computedCgpa);
      } catch (err) {
        console.error("Error loading exam results", err);
      } finally {
        setResultsLoading(false);
      }
    };

    loadResults();
  }, [user]);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      alert("Please enter a valid join code");
      return;
    }

    if (!user) {
      alert("You must be logged in to join a class");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, find the classroom by join code
      const { data: classroom, error: classroomError } = await supabase
        .from("classrooms")
        .select("id, name")
        .eq("join_code", joinCode.trim())
        .single();

      if (classroomError || !classroom) {
        alert("Invalid class code. Please check and try again.");
        return;
      }

      // Check if student is already enrolled
      const { data: existingEnrollment } = await supabase
        .from("classroom_enrollments")
        .select("id")
        .eq("classroom_id", classroom.id)
        .eq("student_id", user.id)
        .single();

      if (existingEnrollment) {
        alert("You are already enrolled in this class");
        setShowClassDialog(false);
        setJoinCode("");
        return;
      }

      // Add student to classroom
      const { error: enrollError } = await supabase
        .from("classroom_enrollments")
        .insert({
          classroom_id: classroom.id,
          student_id: user.id,
          role: "student",
          enrolled_at: new Date().toISOString(),
        });

      if (enrollError) throw enrollError;

      alert(`Successfully joined "${classroom.name}"!`);
      setShowClassDialog(false);
      setJoinCode("");

      // Refresh the page to show new classroom
      window.location.reload();
    } catch (error) {
      console.error("Error joining class:", error);
      alert("Failed to join class. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      alert("Please enter a class name");
      return;
    }

    if (!user) {
      alert("You must be logged in to create a class");
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a unique join code
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the classroom
      const { data: newClassroom, error: createError } = await supabase
        .from("classrooms")
        .insert({
          name: className.trim(),
          join_code: joinCode,
          instructor_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add the creator as instructor
      const { error: enrollError } = await supabase
        .from("classroom_enrollments")
        .insert({
          classroom_id: newClassroom.id,
          student_id: user.id,
          role: "instructor",
          enrolled_at: new Date().toISOString(),
        });

      if (enrollError) throw enrollError;

      alert(
        `Class "${className}" created successfully!\nClass Code: ${joinCode}`
      );
      setShowClassDialog(false);
      setClassName("");

      // Refresh the page to show new classroom
      window.location.reload();
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Failed to create class. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-20 md:pb-0 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute -top-32 -left-16 w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-bl from-secondary/15 via-accent/10 to-primary/10 blur-3xl" />
      </div>

      <StudentHeader />

      <main className="container py-6 space-y-8 relative">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 backdrop-blur-lg border border-border/60 rounded-2xl p-6 shadow-xl"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              Mindblowing Workspace
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back, <span className="gradient-text">{firstName}</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Your Google Classrooms, live Meets, and assignments—all in one
              cinematic view.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing progress={72} size={90} strokeWidth={6}>
              <div className="text-center">
                <span className="text-xl font-bold">72%</span>
                <span className="text-[11px] text-muted-foreground block">
                  Overall
                </span>
              </div>
            </ProgressRing>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground tracking-wide">
                Live Attendance
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">2 active Meets</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Enrolled Courses"
            value={loadingStats ? "…" : stats.enrolled.toString()}
            icon={Users}
            delay={0.1}
          />
          <StatCard
            title="Completed"
            value={loadingStats ? "…" : stats.completed.toString()}
            subtitle="Courses"
            icon={Trophy}
            variant="secondary"
            delay={0.2}
          />
          <StatCard
            title="Pending Assignments"
            value={loadingStats ? "…" : stats.assignments.toString()}
            subtitle="Across classrooms"
            icon={BookOpen}
            delay={0.3}
          />
          <StatCard
            title="Live Meets"
            value={loadingStats ? "…" : stats.liveMeets.toString()}
            subtitle="Happening now"
            icon={Video}
            delay={0.4}
            trend={{ value: stats.liveMeets, isPositive: true }}
          />
        </div>

        {/* Results */}
        <motion.div
          id="results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-6 shadow-2xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
                <Trophy className="h-4 w-4" /> View My Results
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Exam Results, GPA & CGPA
              </h2>
              <p className="text-sm text-muted-foreground">
                Coursework, finals, and weighted GPA per semester. CGPA is
                auto-computed across all results.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center min-w-[110px]">
                <p className="text-xs text-muted-foreground">CGPA</p>
                <p className="text-2xl font-bold text-primary">
                  {resultsLoading ? "…" : cgpa.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-center min-w-[110px]">
                <p className="text-xs text-muted-foreground">Terms</p>
                <p className="text-lg font-semibold text-secondary">
                  {resultsLoading ? "…" : termResults.length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resultsLoading && (
              <div className="col-span-full text-sm text-muted-foreground">
                Loading results…
              </div>
            )}

            {!resultsLoading && termResults.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground">
                No results available yet.
              </div>
            )}

            {termResults.map((term, idx) => (
              <motion.div
                key={term.term}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Semester</p>
                    <p className="font-semibold">{term.term}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">GPA</p>
                    <p className="text-xl font-bold text-primary">
                      {term.gpa.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-border/60 overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"
                    style={{ width: `${Math.min(100, (term.gpa / 5) * 100)}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {term.entries.map((res) => (
                    <div
                      key={res.id}
                      className="p-3 rounded-xl border border-border/50 bg-card/70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            {res.courseTitle}
                          </p>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                            {res.courseCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-muted-foreground">
                            Marks
                          </p>
                          <p className="text-lg font-bold">
                            {res.marks.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold text-center">
                          Grade: {res.grade || "N/A"}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary font-semibold text-center">
                          GP: {res.grade_point?.toFixed(2) || "0.00"}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-center">
                          Credits: {res.credits}
                        </span>
                      </div>

                      <div className="mt-2 h-2 w-full rounded-full bg-border/60 overflow-hidden">
                        <div
                          className="h-2 bg-gradient-to-r from-emerald-500 to-primary"
                          style={{
                            width: `${Math.min(100, (res.marks / 100) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid xl:grid-cols-3 gap-6">
          {/* Classrooms & Assignments */}
          <div className="xl:col-span-2 space-y-6">
            {/* Google Classrooms */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                <h2 className="font-display text-xl font-semibold">
                  Google Classrooms
                </h2>
              </div>
              <button
                onClick={() => setShowClassDialog(true)}
                className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Join or create class
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {classroomCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg shadow-lg"
                >
                  <div
                    className={`h-24 w-full bg-gradient-to-r ${course.banner} opacity-90`}
                  />
                  <div className="p-5 space-y-3 -mt-10 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {course.code}
                        </p>
                        <h3 className="font-semibold text-lg">
                          {course.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {course.instructor} · {course.room}
                        </p>
                      </div>
                      {course.isLive && (
                        <span className="px-3 py-1 rounded-full text-[11px] bg-destructive/10 text-destructive font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-destructive rounded-full animate-pulse" />{" "}
                          Live
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {course.students} students
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        {course.unread} new posts
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2">
                        <Link className="h-4 w-4 text-primary" />
                        <span className="truncate">{course.meetLink}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/10 flex items-center gap-2">
                        <Clipboard className="h-4 w-4 text-secondary" />
                        <span className="font-semibold">{course.joinCode}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-2 w-24 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-2 bg-gradient-to-r from-primary to-secondary"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="font-semibold text-foreground">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-2 rounded-xl text-xs bg-primary text-primary-foreground hover:opacity-90"
                          onClick={() => window.open(course.meetLink, "_blank")}
                        >
                          Join Meet
                        </button>
                        <button className="px-3 py-2 rounded-xl text-xs border border-border hover:border-primary/50 hover:text-primary">
                          View Stream
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Assignments & Stream */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  <h3 className="font-display text-lg font-semibold">
                    Assignments
                  </h3>
                </div>
                <div className="space-y-3">
                  {classroomAssignments.map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.course}
                        </p>
                        <p className="text-xs font-semibold text-amber-600">
                          {item.due}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <span
                          className={`text-[11px] px-2 py-1 rounded-full border ${
                            item.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {item.status === "completed"
                            ? "Submitted"
                            : "Pending"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {item.points} pts
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-semibold">
                    Classroom Stream
                  </h3>
                </div>
                <div className="space-y-3">
                  {classroomStream.map((post, i) => (
                    <motion.div
                      key={`${post.course}-${i}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl border border-border/60 bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{post.course}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.author}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {post.time}
                        </span>
                      </div>
                      <p className="text-sm mt-2">{post.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />{" "}
                        {post.type}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live & Upcoming */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <h3 className="font-display text-lg font-semibold">Upcoming</h3>
              </div>
              <div className="space-y-3">
                {meetSessions.map((meet, i) => (
                  <UpcomingCard
                    key={meet.course}
                    type={"class" as const}
                    title={meet.course}
                    course={meet.course}
                    time={meet.starts}
                    date={meet.isLive ? "Live" : "Today"}
                    meetLink={meet.link}
                    isUrgent={meet.isLive}
                    delay={i * 0.1}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-semibold">
                  Live Meets
                </h3>
              </div>
              <div className="space-y-3">
                {meetSessions.map((session, i) => (
                  <motion.div
                    key={session.link}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold">{session.course}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.starts}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.isLive && (
                        <span className="px-2 py-1 rounded-full text-[11px] bg-destructive/10 text-destructive font-semibold flex items-center gap-1">
                          <Mic className="h-3 w-3" /> Live
                        </span>
                      )}
                      <button
                        className="px-3 py-2 rounded-xl text-xs bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1"
                        onClick={() => window.open(session.link, "_blank")}
                      >
                        <Play className="h-4 w-4" /> Join
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-secondary" />
                <h3 className="font-display text-lg font-semibold">
                  Resources
                </h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
                  <span>Slides, code samples, labs</span>
                  <span className="text-xs text-primary">Google Drive</span>
                </div>
                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
                  <span>Recorded lectures & Meet links</span>
                  <span className="text-xs text-primary">Drive / Meet</span>
                </div>
                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
                  <span>Assignments & rubrics</span>
                  <span className="text-xs text-primary">Classroom</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Join or Create Class Dialog */}
      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Join or Create a Class</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Toggle between Join and Create */}
            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              <button
                onClick={() => {
                  setClassAction("join");
                  setJoinCode("");
                  setClassName("");
                }}
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                  classAction === "join"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Join Class
              </button>
              <button
                onClick={() => {
                  setClassAction("create");
                  setJoinCode("");
                  setClassName("");
                }}
                className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                  classAction === "create"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Create Class
              </button>
            </div>

            {/* Join Class Form */}
            {classAction === "join" && (
              <div className="grid gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Class Code
                  </label>
                  <Input
                    placeholder="Enter the class code (e.g., abc-1234-xyz)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Ask your instructor for the class code to join
                  </p>
                </div>
                <Button
                  onClick={handleJoinClass}
                  className="w-full mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Joining..." : "Join Class"}
                </Button>
              </div>
            )}

            {/* Create Class Form */}
            {classAction === "create" && (
              <div className="grid gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Class Name
                  </label>
                  <Input
                    placeholder="Enter class name (e.g., Advanced Data Structures)"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Give your class a clear, descriptive name
                  </p>
                </div>
                <Button
                  onClick={handleCreateClass}
                  className="w-full mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Class"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <StudentBottomNav />
    </div>
  );
}
