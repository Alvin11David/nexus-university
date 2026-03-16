import { useEffect, useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
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
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  setDoc,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
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

type DashboardAssignment = {
  id: string;
  title: string;
  dueDate: string | null;
  courseTitle: string;
  courseCode: string;
  totalPoints: number | null;
  status: "submitted" | "pending";
  rawStatus: string | null;
};

interface LiveSession {
  id: string;
  title: string;
  courseName?: string | null;
  scheduledAt: string;
  durationMinutes?: number | null;
  meetLink?: string | null;
  isLive: boolean;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.displayName || "Student";
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
  const [assignments, setAssignments] = useState<DashboardAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [liveSessionsLoading, setLiveSessionsLoading] = useState(true);

  const classroomCourses: any[] = [];
  const classroomStream: any[] = [];

  const formatDueDate = (date: string | null) => {
    if (!date) return "No due date";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "No due date";

    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        setLoadingStats(true);

        const enrollmentsRef = collection(db, "enrollments");
        const qEnroll = query(
          enrollmentsRef,
          where("student_id", "==", user.uid),
        );
        const enrollSnapshot = await getDocs(qEnroll);
        const enrollments = enrollSnapshot.docs.map((d) => d.data());

        const enrolledCoursesCount = enrollments.length;
        const completedCoursesCount = enrollments.filter(
          (e: any) => e.status === "completed",
        ).length;

        const courseIds = enrollments
          .map((e: any) => e.course_id)
          .filter(Boolean);

        let pendingAssignmentsCount = 0;
        if (courseIds.length > 0) {
          // Note: Firestore 'in' queries are limited to 10 items.
          // For more, we'd need to chunk the request.
          const assignmentsRef = collection(db, "Assignments");
          const qAssign = query(
            assignmentsRef,
            where("course_id", "in", courseIds.slice(0, 10)),
            // Note: Cloud Firestore does not support inequality on one field and equality on another easily without index
          );
          const assignSnapshot = await getDocs(qAssign);
          const assignments = assignSnapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter(
              (a: any) => a.due_date && new Date(a.due_date) >= new Date(),
            );

          const assignmentIds = assignments.map((a) => a.id);
          let submissions: any[] = [];

          if (assignmentIds.length > 0) {
            const subsRef = collection(db, "submissions");
            const qSubs = query(
              subsRef,
              where("student_id", "==", user.uid),
              where("assignment_id", "in", assignmentIds.slice(0, 10)),
            );
            const subsSnapshot = await getDocs(qSubs);
            submissions = subsSnapshot.docs.map((d) => d.data());
          }

          pendingAssignmentsCount = assignments.filter((a: any) => {
            const submission = submissions.find(
              (s) => s.assignment_id === a.id,
            );
            return !submission || submission.status !== "submitted";
          }).length;
        }

        setStats((prev) => ({
          ...prev,
          enrolled: enrolledCoursesCount,
          completed: completedCoursesCount,
          assignments: pendingAssignmentsCount,
        }));
      } catch (error) {
        console.error("Error loading dashboard stats", error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [user]);

  useEffect(() => {
    const loadLiveSessions = async () => {
      try {
        setLiveSessionsLoading(true);
        const sessionsRef = collection(db, "live_sessions");
        const snapshot = await getDocs(sessionsRef);
        const now = new Date();

        const sessions: LiveSession[] = snapshot.docs
          .map((d) => {
            const data = d.data() as any;
            const scheduledAt: string = data.scheduled_at;
            if (!scheduledAt) return null;
            const start = new Date(scheduledAt);
            if (Number.isNaN(start.getTime())) return null;

            const duration = data.duration_minutes ?? 60;
            const end = new Date(start.getTime() + duration * 60000);
            const isLive = now >= start && now <= end;

            return {
              id: d.id,
              title: data.title || "Online Class",
              courseName: data.course_name || null,
              scheduledAt,
              durationMinutes: data.duration_minutes ?? null,
              meetLink: data.meet_link || null,
              isLive,
            } as LiveSession;
          })
          .filter(Boolean) as LiveSession[];

        sessions.sort((a, b) =>
          a.scheduledAt.localeCompare(b.scheduledAt),
        );

        setLiveSessions(sessions);

        const liveCount = sessions.filter((s) => s.isLive).length;
        setStats((prev) => ({
          ...prev,
          liveMeets: liveCount,
        }));
      } catch (error) {
        console.error("Error loading live sessions", error);
      } finally {
        setLiveSessionsLoading(false);
      }
    };

    loadLiveSessions();
  }, []);

  const activeMeetsCount = useMemo(
    () => liveSessions.filter((s) => s.isLive).length,
    [liveSessions],
  );

  const formattedLiveSessions = useMemo(
    () =>
      liveSessions.map((session) => {
        const start = new Date(session.scheduledAt);
        const now = new Date();
        const isToday = start.toDateString() === now.toDateString();

        const timeLabel = start.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });

        const dayLabel = isToday
          ? "Today"
          : start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

        return {
          ...session,
          displayTime: `${dayLabel} · ${timeLabel}`,
          displayDay: session.isLive ? "Live" : dayLabel,
        };
      }),
    [liveSessions],
  );

  useEffect(() => {
    if (!user) return;

    let isActive = true;

    const loadAssignments = async () => {
      try {
        setAssignmentsLoading(true);
        setAssignmentsError(null);

        const enrollmentsRef = collection(db, "enrollments");
        const qEnroll = query(
          enrollmentsRef,
          where("student_id", "==", user.uid),
          where("status", "in", ["approved", "pending"]),
        );
        const enrollSnapshot = await getDocs(qEnroll);
        const enrollmentsData = enrollSnapshot.docs.map((d) => d.data());

        const courseIds = enrollmentsData
          .map((enrollment: any) => enrollment.course_id)
          .filter(Boolean);

        if (!courseIds.length) {
          if (isActive) {
            setAssignments([]);
            setAssignmentsLoading(false);
          }
          return;
        }

        const assignmentsRef = collection(db, "Assignments");
        const qAssign = query(
          assignmentsRef,
          where("course_id", "in", courseIds.slice(0, 10)),
          orderBy("due_date", "asc"),
        );
        const assignSnapshot = await getDocs(qAssign);
        const assignmentsData = assignSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const assignmentIds = assignmentsData.map((a) => a.id);
        let submissions: any[] = [];

        if (assignmentIds.length > 0) {
          const subsRef = collection(db, "submissions");
          const qSubs = query(
            subsRef,
            where("student_id", "==", user.uid),
            where("assignment_id", "in", assignmentIds.slice(0, 10)),
          );
          const subsSnapshot = await getDocs(qSubs);
          submissions = subsSnapshot.docs.map((d) => d.data());
        }

        const mappedAssignments = await Promise.all(
          assignmentsData.map(async (assignment: any) => {
            const submission = submissions.find(
              (s) => s.assignment_id === assignment.id,
            );

            const courseDoc = await getDoc(
              doc(db, "courses", assignment.course_id),
            );
            const courseInfo = courseDoc.exists()
              ? courseDoc.data()
              : { title: "Course", code: "" };

            return {
              id: assignment.id,
              title: assignment.title,
              dueDate: assignment.due_date,
              courseTitle: courseInfo.title || "Course",
              courseCode: courseInfo.code || "",
              totalPoints: assignment.total_points,
              status:
                submission?.status === "submitted" ? "submitted" : "pending",
              rawStatus: assignment.status,
            } as DashboardAssignment;
          }),
        );

        if (isActive) setAssignments(mappedAssignments);
      } catch (error) {
        console.error("Error loading dashboard assignments", error);
        if (isActive) setAssignmentsError("Failed to load assignments.");
      } finally {
        if (isActive) setAssignmentsLoading(false);
      }
    };

    loadAssignments();

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadResults = async () => {
      try {
        setResultsLoading(true);

        const studentId = user.uid;
        let data: any[] | null = null;

        // Try lecturer-side grade book first (student_grades)
        try {
          const gradesRef = collection(db, "student_grades");
          const qGrades = query(
            gradesRef,
            where("student_id", "==", studentId),
            orderBy("academic_year", "desc"),
            orderBy("semester", "desc"),
          );
          const gradesSnapshot = await getDocs(qGrades);

          if (!gradesSnapshot.empty) {
            data = await Promise.all(
              gradesSnapshot.docs.map(async (d) => {
                const gradeData = d.data();
                const courseDoc = await getDoc(
                  doc(db, "courses", gradeData.course_id),
                );
                const courseInfo = courseDoc.exists() ? courseDoc.data() : {};
                return { id: d.id, ...gradeData, courses: courseInfo };
              }),
            );
          } else {
            throw new Error("No student_grades rows");
          }
        } catch (sgError) {
          // Fallback to exam_results
          const resultsRef = collection(db, "exam_results");
          const qResults = query(
            resultsRef,
            where("student_id", "==", studentId),
            orderBy("academic_year", "desc"),
            orderBy("semester", "desc"),
          );
          const resultsSnapshot = await getDocs(qResults);
          data = await Promise.all(
            resultsSnapshot.docs.map(async (d) => {
              const resultData = d.data();
              const courseDoc = await getDoc(
                doc(db, "courses", resultData.course_id),
              );
              const courseInfo = courseDoc.exists() ? courseDoc.data() : {};
              return { id: d.id, ...resultData, courses: courseInfo };
            }),
          );
        }

        const normalized = (data as any[] | null)?.map((row) => ({
          ...row,
          courseTitle: row.courses?.title || "Course",
          courseCode: row.courses?.code || "",
          credits: row.courses?.credits || 3,
          marks: row.total || row.marks || 0,
          grade_point: row.gp || row.grade_point || 0,
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
          0,
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
      const classroomsRef = collection(db, "classrooms");
      const q = query(
        classroomsRef,
        where("join_code", "==", joinCode.trim()),
        limit(1),
      );
      const qSnapshot = await getDocs(q);

      if (qSnapshot.empty) {
        alert("Invalid class code. Please check and try again.");
        return;
      }

      const classroomDoc = qSnapshot.docs[0];
      const classroom = { id: classroomDoc.id, ...classroomDoc.data() } as any;

      // Check if student is already enrolled
      const enrollmentRef = collection(db, "classroom_enrollments");
      const qEnroll = query(
        enrollmentRef,
        where("classroom_id", "==", classroom.id),
        where("student_id", "==", user.uid),
        limit(1),
      );
      const enrollSnapshot = await getDocs(qEnroll);

      if (!enrollSnapshot.empty) {
        alert("You are already enrolled in this class");
        setShowClassDialog(false);
        setJoinCode("");
        return;
      }

      // Add student to classroom
      await addDoc(collection(db, "classroom_enrollments"), {
        classroom_id: classroom.id,
        student_id: user.uid,
        role: "student",
        enrolled_at: new Date().toISOString(),
      });

      alert(`Successfully joined "${classroom.name}"!`);
      setShowClassDialog(false);
      setJoinCode("");

      // Refresh the page
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
      const joinCodeGenerated = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      // Create the classroom
      const newClassroomData = {
        name: className.trim(),
        join_code: joinCodeGenerated,
        instructor_id: user.uid,
        created_at: new Date().toISOString(),
      };

      const classroomRef = await addDoc(
        collection(db, "classrooms"),
        newClassroomData,
      );

      // Add the creator as instructor
      await addDoc(collection(db, "classroom_enrollments"), {
        classroom_id: classroomRef.id,
        student_id: user.uid,
        role: "instructor",
        enrolled_at: new Date().toISOString(),
      });

      alert(
        `Class "${className}" created successfully!\nClass Code: ${joinCodeGenerated}`,
      );
      setShowClassDialog(false);
      setClassName("");

      // Refresh the page
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
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-card/70 backdrop-blur-lg border border-border/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              Mindblowing Workspace
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Welcome back, <span className="gradient-text">{firstName}</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Your Google Classrooms, live Meets, and assignments—all in one
              cinematic view.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ProgressRing progress={72} size={80} strokeWidth={6}>
              <div className="text-center">
                <span className="text-lg sm:text-xl font-bold">72%</span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground block">
                  Overall
                </span>
              </div>
            </ProgressRing>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs uppercase text-muted-foreground tracking-wide">
                Live Attendance
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">
                  {activeMeetsCount} active Meet
                  {activeMeetsCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 lg:grid-cols-4">
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
            value={loadingStats && liveSessionsLoading ? "…" : stats.liveMeets.toString()}
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
          className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
                <Trophy className="h-4 w-4" /> View My Results
              </div>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                Exam Results, GPA & CGPA
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Coursework, finals, and weighted GPA per semester. CGPA is
                auto-computed across all results.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 text-center min-w-[90px] sm:min-w-[110px]">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  CGPA
                </p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {resultsLoading ? "…" : cgpa.toFixed(2)}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/10 border border-secondary/20 text-center min-w-[90px] sm:min-w-[110px]">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Terms
                </p>
                <p className="text-base sm:text-lg font-semibold text-secondary">
                  {resultsLoading ? "…" : termResults.length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {resultsLoading && (
              <div className="col-span-full text-xs sm:text-sm text-muted-foreground">
                Loading results…
              </div>
            )}

            {!resultsLoading && termResults.length === 0 && (
              <div className="col-span-full text-xs sm:text-sm text-muted-foreground">
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
            {/* Google Classrooms (placeholder, can be wired to real data later) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                <h2 className="font-display text-lg sm:text-xl font-semibold">
                  Google Classrooms
                </h2>
              </div>
              <button
                onClick={() => setShowClassDialog(true)}
                className="flex items-center gap-2 text-xs sm:text-sm text-secondary hover:text-secondary/80 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Join or create class
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              {formattedLiveSessions.length === 0 && !liveSessionsLoading && (
                <div className="col-span-full text-xs sm:text-sm text-muted-foreground">
                  When your lecturers schedule Google Meet classes, they will
                  appear here with join links.
                </div>
              )}

              {formattedLiveSessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg shadow-lg"
                >
                  <div className="h-20 sm:h-24 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 opacity-90" />
                  <div className="p-4 sm:p-5 space-y-3 -mt-8 sm:-mt-10 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {session.courseName || "Online Class"}
                        </p>
                        <h3 className="font-semibold text-base sm:text-lg">
                          {session.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          {session.displayTime}
                        </p>
                      </div>
                      {session.isLive && (
                        <span className="px-3 py-1 rounded-full text-[11px] bg-destructive/10 text-destructive font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-destructive rounded-full animate-pulse" />{" "}
                          Live
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">
                          Join from any device
                        </span>
                        <span className="sm:hidden">Online</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">
                          Live participation
                        </span>
                        <span className="sm:hidden">Live</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground w-full sm:w-auto">
                        <div className="h-2 w-16 sm:w-24 rounded-full bg-muted/60 overflow-hidden flex-shrink-0">
                          <div
                            className="h-2 bg-gradient-to-r from-primary to-secondary"
                            style={{ width: session.isLive ? "100%" : "40%" }}
                          />
                        </div>
                        <span className="font-semibold text-foreground">
                          {session.isLive ? "In progress" : "Scheduled"}
                        </span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          className="px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl text-xs bg-primary text-primary-foreground hover:opacity-90 flex-1 sm:flex-none disabled:opacity-60"
                          onClick={() =>
                            session.meetLink &&
                            window.open(session.meetLink, "_blank")
                          }
                          disabled={!session.isLive || !session.meetLink}
                        >
                          {session.isLive ? "Join Live Class" : "Join (when live)"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Assignments & Stream */}
            <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-secondary" />
                    <h3 className="font-display text-base sm:text-lg font-semibold">
                      Assignments
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs"
                  >
                    <RouterLink to="/assignments">View All</RouterLink>
                  </Button>
                </div>
                <div className="space-y-3">
                  {assignmentsLoading && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Loading assignments…
                    </p>
                  )}

                  {!assignmentsLoading && assignmentsError && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {assignmentsError}
                    </p>
                  )}

                  {!assignmentsLoading &&
                    !assignmentsError &&
                    assignments.length === 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No assignments yet.
                      </p>
                    )}

                  {!assignmentsLoading &&
                    !assignmentsError &&
                    assignments.map((item, i) => {
                      const isSubmitted = item.status === "submitted";
                      const dueLabel = formatDueDate(item.dueDate);

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm font-semibold">
                              {item.title}
                            </p>
                            <p className="text-[11px] sm:text-xs text-muted-foreground">
                              {item.courseTitle}
                              {item.courseCode ? ` · ${item.courseCode}` : ""}
                            </p>
                            <p className="text-[11px] sm:text-xs font-semibold text-amber-600">
                              Due {dueLabel}
                            </p>
                          </div>
                          <div className="text-right space-y-1 flex-shrink-0">
                            <span
                              className={`text-[10px] sm:text-[11px] px-2 py-1 rounded-full border block w-fit ml-auto ${
                                isSubmitted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {isSubmitted ? "Submitted" : "Pending"}
                            </span>
                            <p className="text-[11px] sm:text-xs text-muted-foreground">
                              {item.totalPoints != null
                                ? `${item.totalPoints} pts`
                                : "Points N/A"}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-base sm:text-lg font-semibold">
                    Classroom Stream
                  </h3>
                </div>
                <div className="space-y-3">
                  {formattedLiveSessions.length === 0 && !liveSessionsLoading && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      When there are scheduled Google Meet classes, they will show
                      up here with a clear status and join button.
                    </p>
                  )}
                  {formattedLiveSessions.map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/60 bg-muted/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                        <div className="space-y-1 flex-1">
                          <p className="text-xs sm:text-sm font-semibold">
                            {session.title}
                          </p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground">
                            {session.courseName || "Online Class"}
                          </p>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground flex-shrink-0">
                          {session.displayTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] sm:text-[11px] text-muted-foreground">
                        {session.isLive && (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />{" "}
                            Live now
                          </>
                        )}
                        {!session.isLive && (
                          <>
                            <Clock className="h-3 w-3" />
                            Starts at {session.displayTime}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live & Upcoming */}
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <h3 className="font-display text-base sm:text-lg font-semibold">
                  Upcoming
                </h3>
              </div>
              <div className="space-y-3">
                {formattedLiveSessions.length === 0 && !liveSessionsLoading && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    No upcoming online classes yet. When your lecturers schedule
                    Google Meet sessions, they will appear here.
                  </p>
                )}
                {formattedLiveSessions.map((session, i) => (
                  <UpcomingCard
                    key={session.id}
                    type={"class" as const}
                    title={session.title}
                    course={session.courseName || "Online Class"}
                    time={session.displayTime}
                    date={session.isLive ? "Live" : session.displayDay}
                    meetLink={session.meetLink || undefined}
                    isUrgent={session.isLive}
                    delay={i * 0.1}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base sm:text-lg font-semibold">
                  Live Meets
                </h3>
              </div>
              <div className="space-y-3">
                {formattedLiveSessions.length === 0 && !liveSessionsLoading && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    No classes are live right now. When a Google Meet class is
                    in progress, you will see a Join button here.
                  </p>
                )}
                {formattedLiveSessions.map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-semibold">
                        {session.title}
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground">
                        {session.displayTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {session.isLive && session.meetLink && (
                        <span className="px-2 py-1 rounded-full text-[10px] sm:text-[11px] bg-destructive/10 text-destructive font-semibold flex items-center gap-1">
                          <Mic className="h-3 w-3" /> Live
                        </span>
                      )}
                      <button
                        className="px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl text-xs bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1 flex-shrink-0 disabled:opacity-60"
                        onClick={() =>
                          session.meetLink &&
                          window.open(session.meetLink, "_blank")
                        }
                        disabled={!session.isLive || !session.meetLink}
                      >
                        <Play className="h-4 w-4" />{" "}
                        {session.isLive ? "Join" : "Join (when live)"}
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
