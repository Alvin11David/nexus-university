import { useEffect, useState, useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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
  AlarmClock,
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
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { StatCard } from "@/components/dashboard/StatCard";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { UpcomingCard } from "@/components/dashboard/UpcomingCard";
import { AnnouncementCard } from "@/components/dashboard/AnnouncementCard";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

interface DashboardQuiz {
  id: string;
  title: string;
  courseTitle?: string | null;
  courseCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isLive: boolean;
  isScheduled: boolean;
}

interface MeetingLink {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  meetingType: "googlemeet" | "zoom" | "other";
  meetingLink: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  lecturerName?: string;
  isExpired: boolean;
}

interface MeetingLauncherState {
  title: string;
  platform: string;
  course: string;
  description?: string;
  dueLabel?: string;
  link: string;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<DashboardQuiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [meetingLinks, setMeetingLinks] = useState<MeetingLink[]>([]);
  const [meetingLinksLoading, setMeetingLinksLoading] = useState(true);
  const [showMeetingLauncher, setShowMeetingLauncher] = useState(false);
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingLauncherState | null>(null);

  // Debug logging for dialog state
  useEffect(() => {
    console.log("showClassDialog changed:", showClassDialog);
  }, [showClassDialog]);

  const classroomCourses: any[] = [];
  const classroomStream: any[] = [];

  const openMeetingLauncher = (meeting: MeetingLauncherState) => {
    setSelectedMeeting(meeting);
    setShowMeetingLauncher(true);
  };

  const handleJoinFromLauncher = () => {
    if (!selectedMeeting?.link) return;
    // Keep flow in-app until user confirms launch.
    window.location.href = selectedMeeting.link;
  };

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

  const formatRelativeTime = (value: any) => {
    const rawDate = value?.toDate?.() ?? (value ? new Date(value) : null);
    if (!(rawDate instanceof Date) || Number.isNaN(rawDate.getTime())) {
      return "Recently";
    }

    const diffMs = Date.now() - rawDate.getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatSessionLabel = (value: any) => {
    const rawDate = value?.toDate?.() ?? (value ? new Date(value) : null);
    if (!(rawDate instanceof Date) || Number.isNaN(rawDate.getTime())) {
      return "Scheduled";
    }

    return rawDate.toLocaleString("en-US", {
      weekday: "short",
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
      if (!user) {
        setLiveSessions([]);
        setStats((prev) => ({ ...prev, liveMeets: 0 }));
        return;
      }

      try {
        setLiveSessionsLoading(true);

        // 1. Fetch student's enrolled course IDs
        const enrollmentsRef = collection(db, "enrollments");
        const qEnroll = query(
          enrollmentsRef,
          where("student_id", "==", user.uid),
          where("status", "in", ["approved", "pending"]),
        );
        const enrollSnapshot = await getDocs(qEnroll);
        const enrolledCourseIds = enrollSnapshot.docs
          .map((d) => (d.data() as any).course_id)
          .filter(Boolean);

        if (!enrolledCourseIds.length) {
          setLiveSessions([]);
          setStats((prev) => ({ ...prev, liveMeets: 0 }));
          return;
        }

        // 2. Fetch live sessions only for enrolled courses (chunked for Firestore 'in' limit)
        const sessions: LiveSession[] = [];
        const sessionsRef = collection(db, "live_sessions");
        const now = new Date();

        for (let i = 0; i < enrolledCourseIds.length; i += 10) {
          const chunk = enrolledCourseIds.slice(i, i + 10);
          const qSessions = query(sessionsRef, where("course_id", "in", chunk));
          const snapshot = await getDocs(qSessions);

          snapshot.docs.forEach((d) => {
            const data = d.data() as any;
            const scheduledAt: string = data.scheduled_at;
            if (!scheduledAt) return;
            const start = new Date(scheduledAt);
            if (Number.isNaN(start.getTime())) return;

            const duration = data.duration_minutes ?? 60;
            const end = new Date(start.getTime() + duration * 60000);
            const isLive = now >= start && now <= end;

            sessions.push({
              id: d.id,
              title: data.title || "Online Class",
              courseName: data.course_name || null,
              scheduledAt,
              durationMinutes: data.duration_minutes ?? null,
              meetLink: data.meet_link || null,
              isLive,
            });
          });
        }

        sessions.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
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
  }, [user]);

  const activeMeetsCount = useMemo(() => {
    const liveSessionKeys = liveSessions
      .filter((s) => s.isLive)
      .map((s) => `live:${s.id}`);
    const meetingLinkKeys = meetingLinks
      .filter((m) => !m.isExpired)
      .map((m) => `meeting:${m.id}`);

    return new Set([...liveSessionKeys, ...meetingLinkKeys]).size;
  }, [liveSessions, meetingLinks]);

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
    const loadMeetingLinks = async () => {
      if (!user) {
        setMeetingLinks([]);
        return;
      }

      try {
        setMeetingLinksLoading(true);

        const enrollmentsRef = collection(db, "enrollments");
        const qEnroll = query(
          enrollmentsRef,
          where("student_id", "==", user.uid),
          where("status", "in", ["approved", "pending"]),
        );
        const enrollSnapshot = await getDocs(qEnroll);
        const enrolledCourseIds = enrollSnapshot.docs
          .map((d) => (d.data() as any).course_id)
          .filter(Boolean);

        if (!enrolledCourseIds.length) {
          setMeetingLinks([]);
          return;
        }

        const links: MeetingLink[] = [];
        const meetingsRef = collection(db, "lecturer_meetings");
        const now = new Date();

        for (let i = 0; i < enrolledCourseIds.length; i += 10) {
          const chunk = enrolledCourseIds.slice(i, i + 10);
          const qMeetings = query(meetingsRef, where("course_id", "in", chunk));
          const snapshot = await getDocs(qMeetings);

          snapshot.docs.forEach((d) => {
            const data = d.data() as any;
            if (!data.meeting_link) return;

            let isExpired = false;
            if (data.due_date && data.due_time) {
              const expiryTime = new Date(`${data.due_date}T${data.due_time}`);
              if (!Number.isNaN(expiryTime.getTime())) {
                isExpired = now > expiryTime;
              }
            }

            if (!isExpired) {
              links.push({
                id: d.id,
                courseId: data.course_id,
                courseTitle: data.course_title || "Course",
                courseCode: data.course_code || "",
                meetingType: data.meeting_type || "other",
                meetingLink: data.meeting_link,
                description: data.description,
                dueDate: data.due_date,
                dueTime: data.due_time,
                lecturerName: data.lecturer_name,
                isExpired,
              });
            }
          });
        }

        setMeetingLinks(links);
      } catch (error) {
        console.error("Error loading meeting links", error);
      } finally {
        setMeetingLinksLoading(false);
      }
    };

    loadMeetingLinks();
  }, [user]);

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!user) {
        setUpcomingQuizzes([]);
        return;
      }

      try {
        setQuizzesLoading(true);

        // 1. Fetch student's enrolled course IDs
        const enrollmentsRef = collection(db, "enrollments");
        const qEnroll = query(
          enrollmentsRef,
          where("student_id", "==", user.uid),
          where("status", "in", ["approved", "pending"]),
        );
        const enrollSnapshot = await getDocs(qEnroll);
        const enrolledCourseIds = enrollSnapshot.docs
          .map((d) => (d.data() as any).course_id)
          .filter(Boolean);

        if (!enrolledCourseIds.length) {
          setUpcomingQuizzes([]);
          return;
        }

        // 2. Fetch quizzes for those courses
        const quizzes: DashboardQuiz[] = [];
        const quizzesRef = collection(db, "quizzes");
        const now = new Date();

        for (let i = 0; i < enrolledCourseIds.length; i += 10) {
          const chunk = enrolledCourseIds.slice(i, i + 10);
          const qQuizzes = query(
            quizzesRef,
            where("course_id", "in", chunk),
            where("status", "==", "active"),
          );
          const quizSnapshot = await getDocs(qQuizzes);

          quizSnapshot.docs.forEach((d) => {
            const data = d.data() as any;
            const startRaw = data.start_date ?? null;
            const endRaw = data.end_date ?? null;

            const start = startRaw ? new Date(startRaw) : null;
            const end = endRaw ? new Date(endRaw) : null;

            const isLive =
              (!!start ? now >= start : true) && (!!end ? now <= end : true);
            const isScheduled = !!start && now < start;

            // Hide quizzes that have fully closed
            if (end && now > end) return;

            quizzes.push({
              id: d.id,
              title: data.title || "Quiz",
              courseTitle: data.course_title || null,
              courseCode: data.course_code || null,
              startDate: startRaw,
              endDate: endRaw,
              isLive,
              isScheduled,
            });
          });
        }

        quizzes.sort((a, b) => {
          const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
          const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
          return aTime - bTime;
        });

        setUpcomingQuizzes(quizzes);
      } catch (error) {
        console.error("Error loading upcoming quizzes", error);
      } finally {
        setQuizzesLoading(false);
      }
    };

    loadQuizzes();
  }, [user]);

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
        let data: any[] = [];
        const gradesRef = collection(db, "student_grades");

        try {
          const qGrades = query(
            gradesRef,
            where("student_id", "==", studentId),
            orderBy("academic_year", "desc"),
            orderBy("semester", "desc"),
          );
          const gradesSnapshot = await getDocs(qGrades);
          data = gradesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (sgError) {
          const qGradesSimple = query(
            gradesRef,
            where("student_id", "==", studentId),
          );
          const gradesSnapshotSimple = await getDocs(qGradesSimple);
          data = gradesSnapshotSimple.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
        }

        if (data.length === 0) {
          const resultsRef = collection(db, "exam_results");
          try {
            const qResults = query(
              resultsRef,
              where("student_id", "==", studentId),
              orderBy("academic_year", "desc"),
              orderBy("semester", "desc"),
            );
            const resultsSnapshot = await getDocs(qResults);
            data = resultsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          } catch (erError) {
            const qResultsSimple = query(
              resultsRef,
              where("student_id", "==", studentId),
            );
            const resultsSnapshotSimple = await getDocs(qResultsSimple);
            data = resultsSnapshotSimple.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
          }
        }

        const uniqueCourseIds = Array.from(
          new Set(data.map((r) => r.course_id).filter(Boolean)),
        );
        const courseMap = new Map<string, any>();

        for (let i = 0; i < uniqueCourseIds.length; i += 10) {
          const chunk = uniqueCourseIds.slice(i, i + 10);
          const qCourseUnits = query(
            collection(db, "course_units"),
            where("__name__", "in", chunk),
          );
          const courseUnitsSnap = await getDocs(qCourseUnits);
          courseUnitsSnap.docs.forEach((d) => courseMap.set(d.id, d.data()));

          const missingIds = chunk.filter((id) => !courseMap.has(id));
          if (missingIds.length > 0) {
            const qCourses = query(
              collection(db, "courses"),
              where("__name__", "in", missingIds),
            );
            const coursesSnap = await getDocs(qCourses);
            coursesSnap.docs.forEach((d) => courseMap.set(d.id, d.data()));
          }
        }

        const normalized = data.map((row) => {
          const course = courseMap.get(row.course_id);
          return {
            ...row,
            courseTitle: course?.name || course?.title || "Course",
            courseCode: course?.code || "",
            credits: course?.credits || 3,
            marks: row.total || row.marks || 0,
            grade_point: row.gp || row.grade_point || 0,
          };
        });

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
      toast({
        title: "Error",
        description: "Please enter a valid join code",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to join a class",
        variant: "destructive",
      });
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
        toast({
          title: "Invalid Code",
          description: "Invalid class code. Please check and try again.",
          variant: "destructive",
        });
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
        toast({
          title: "Already Enrolled",
          description: "You are already enrolled in this class",
          variant: "destructive",
        });
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

      toast({
        title: "Success",
        description: `Successfully joined "${classroom.name}"!`,
      });
      setShowClassDialog(false);
      setJoinCode("");

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Error joining class:", error);
      toast({
        title: "Error",
        description: "Failed to join class. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a class",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: `Class "${className}" created successfully!\nClass Code: ${joinCodeGenerated}`,
      });
      setShowClassDialog(false);
      setClassName("");

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Error creating class:", error);
      toast({
        title: "Error",
        description: "Failed to create class. Please try again.",
        variant: "destructive",
      });
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
            value={
              loadingStats && liveSessionsLoading && meetingLinksLoading
                ? "…"
                : activeMeetsCount.toString()
            }
            subtitle="Happening now"
            icon={Video}
            delay={0.4}
            trend={{ value: activeMeetsCount, isPositive: true }}
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
                onClick={() => {
                  console.log("Join or create class button clicked");
                  alert("Button clicked! Dialog state: " + showClassDialog);
                  setShowClassDialog(true);
                }}
                className="flex items-center gap-2 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-md"
              >
                <Plus className="h-4 w-4" />
                Join or create class
              </button>
            </div>

            {/* Announcements Section */}
            <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-base sm:text-lg font-semibold">
                    Announcements
                  </h3>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={() =>
                    navigate(
                      profile?.role === "lecturer"
                        ? "/lecturer/announcements"
                        : "/announcements",
                    )
                  }
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </div>
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No announcements posted yet. Click "New" to create your first
                  announcement and push it to cohorts instantly.
                </p>
              </div>
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
                          onClick={() => {
                            if (!session.meetLink) return;
                            openMeetingLauncher({
                              title: session.title,
                              platform: "googlemeet",
                              course: session.courseName || "Online Class",
                              description: "Live class session",
                              dueLabel: session.displayTime,
                              link: session.meetLink,
                            });
                          }}
                          disabled={!session.isLive || !session.meetLink}
                        >
                          {session.isLive
                            ? "Join Live Class"
                            : "Join (when live)"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-base sm:text-lg font-semibold">
                    Meeting Links
                  </h3>
                </div>
              </div>

              {meetingLinksLoading && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Loading meeting links...
                </p>
              )}

              {!meetingLinksLoading && meetingLinks.length === 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No active meeting links yet.
                </p>
              )}

              {!meetingLinksLoading && meetingLinks.length > 0 && (
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  {meetingLinks.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/60 bg-muted/30 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm font-semibold">
                          {item.courseTitle}
                        </p>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground uppercase">
                          {item.courseCode}
                        </span>
                      </div>

                      <p className="text-[11px] sm:text-xs text-muted-foreground capitalize">
                        {item.meetingType === "googlemeet"
                          ? "Google Meet"
                          : item.meetingType === "zoom"
                            ? "Zoom"
                            : "Meeting"}
                      </p>

                      {item.description && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}

                      {item.dueDate && item.dueTime && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          Expires{" "}
                          {new Date(
                            `${item.dueDate}T${item.dueTime}`,
                          ).toLocaleDateString()}{" "}
                          at {item.dueTime}
                        </p>
                      )}

                      <button
                        className="w-full px-3 py-2 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1"
                        onClick={() =>
                          openMeetingLauncher({
                            title:
                              item.meetingType === "googlemeet"
                                ? "Google Meet"
                                : item.meetingType === "zoom"
                                  ? "Zoom Meeting"
                                  : "Online Meeting",
                            platform: item.meetingType,
                            course: `${item.courseTitle}${item.courseCode ? ` (${item.courseCode})` : ""}`,
                            description: item.description,
                            dueLabel:
                              item.dueDate && item.dueTime
                                ? `${new Date(`${item.dueDate}T${item.dueTime}`).toLocaleDateString()} at ${item.dueTime}`
                                : undefined,
                            link: item.meetingLink,
                          })
                        }
                      >
                        <Link className="h-3 w-3" />
                        Open Link
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignments */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
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
                {formattedLiveSessions.length === 0 &&
                  upcomingQuizzes.length === 0 &&
                  !liveSessionsLoading &&
                  !quizzesLoading && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      No upcoming online classes or quizzes yet. When your
                      lecturers schedule Google Meet sessions or quizzes, they
                      will appear here.
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
                {upcomingQuizzes.map((quiz, i) => {
                  const startLabel = quiz.startDate
                    ? new Date(quiz.startDate).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Any time";

                  return (
                    <UpcomingCard
                      key={quiz.id}
                      type={"quiz" as const}
                      title={quiz.title}
                      course={
                        quiz.courseTitle || quiz.courseCode || "Course Quiz"
                      }
                      time={startLabel}
                      date={
                        quiz.isLive
                          ? "Live"
                          : quiz.isScheduled
                            ? "Scheduled"
                            : "Open"
                      }
                      isUrgent={quiz.isLive}
                      delay={formattedLiveSessions.length * 0.1 + i * 0.1}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showMeetingLauncher} onOpenChange={setShowMeetingLauncher}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Meeting Launcher</DialogTitle>
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Session:</span>{" "}
                  {selectedMeeting.title}
                </p>
                <p>
                  <span className="font-semibold">Course:</span>{" "}
                  {selectedMeeting.course}
                </p>
                <p className="capitalize">
                  <span className="font-semibold">Platform:</span>{" "}
                  {selectedMeeting.platform === "googlemeet"
                    ? "Google Meet"
                    : selectedMeeting.platform === "zoom"
                      ? "Zoom"
                      : "Online Meeting"}
                </p>
                {selectedMeeting.description && (
                  <p>
                    <span className="font-semibold">Details:</span>{" "}
                    {selectedMeeting.description}
                  </p>
                )}
                {selectedMeeting.dueLabel && (
                  <p>
                    <span className="font-semibold">Time:</span>{" "}
                    {selectedMeeting.dueLabel}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs break-all text-muted-foreground">
                {selectedMeeting.link}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedMeeting?.link) return;
                    navigator.clipboard.writeText(selectedMeeting.link);
                    toast({
                      title: "Copied",
                      description: "Meeting link copied to clipboard",
                    });
                  }}
                >
                  Copy Link
                </Button>
                <Button onClick={handleJoinFromLauncher}>Join Now</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showClassDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Test Dialog</h2>
            <p>This is a test dialog to see if the button works.</p>
            <button
              onClick={() => setShowClassDialog(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <StudentBottomNav />
    </div>
  );
}
