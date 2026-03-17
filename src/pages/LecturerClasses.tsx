import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PlayCircle,
  Plus,
  Video,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface ClassSession {
  id: string;
  courseCode: string;
  courseName: string;
  title: string;
  scheduledTime: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  meetingLink?: string;
  attendees: number;
  duration?: number;
  recordingUrl?: string;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerClasses() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "scheduled" | "ongoing" | "completed"
  >("all");

  useEffect(() => {
    if (!user?.uid) {
      setSessions([]);
      setLoadingSessions(false);
      return;
    }

    const loadSessions = async () => {
      try {
        setLoadingSessions(true);

        const sessionsQuery = query(
          collection(db, "google_classroom_sessions"),
          where("lecturer_id", "==", user.uid),
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const rawSessions = sessionsSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Array<Record<string, any>>;

        if (rawSessions.length === 0) {
          setSessions([]);
          return;
        }

        const courseIds = Array.from(
          new Set(
            rawSessions.map((session) => session.course_id).filter(Boolean),
          ),
        );
        const classroomIds = Array.from(
          new Set(
            rawSessions.map((session) => session.classroom_id).filter(Boolean),
          ),
        );

        const courseMap = new Map<string, any>();
        for (let i = 0; i < courseIds.length; i += 10) {
          const chunk = courseIds.slice(i, i + 10);
          const unitQuery = query(
            collection(db, "course_units"),
            where("__name__", "in", chunk),
          );
          const unitSnap = await getDocs(unitQuery);
          unitSnap.docs.forEach((d) => courseMap.set(d.id, d.data()));

          const missing = chunk.filter((id) => !courseMap.has(id));
          if (missing.length > 0) {
            const coursesQuery = query(
              collection(db, "courses"),
              where("__name__", "in", missing),
            );
            const courseSnap = await getDocs(coursesQuery);
            courseSnap.docs.forEach((d) => courseMap.set(d.id, d.data()));
          }
        }

        const attendeeMap = new Map<string, number>();
        for (let i = 0; i < classroomIds.length; i += 10) {
          const chunk = classroomIds.slice(i, i + 10);
          const enrollmentsQuery = query(
            collection(db, "classroom_enrollments"),
            where("classroom_id", "in", chunk),
          );
          const enrollmentSnap = await getDocs(enrollmentsQuery);
          enrollmentSnap.docs.forEach((d) => {
            const classroomId = d.data().classroom_id;
            attendeeMap.set(
              classroomId,
              (attendeeMap.get(classroomId) || 0) + 1,
            );
          });
        }

        const mappedSessions: ClassSession[] = rawSessions
          .map((session) => {
            const course = courseMap.get(session.course_id);
            const startTime = session.start_time
              ? new Date(session.start_time)
              : null;
            const endTime = session.end_time
              ? new Date(session.end_time)
              : null;
            const duration =
              startTime && endTime
                ? Math.max(
                    0,
                    Math.round(
                      (endTime.getTime() - startTime.getTime()) / (1000 * 60),
                    ),
                  )
                : undefined;

            return {
              id: session.id,
              courseCode: course?.code || session.classroom_code || "CLASS",
              courseName:
                course?.name ||
                course?.title ||
                session.classroom_name ||
                "Classroom Session",
              title:
                session.description ||
                session.classroom_name ||
                "Class Session",
              scheduledTime: startTime
                ? startTime.toLocaleString()
                : session.created_at || "Unscheduled",
              status:
                session.status === "ongoing" ||
                session.status === "completed" ||
                session.status === "cancelled"
                  ? session.status
                  : "scheduled",
              meetingLink: session.meeting_link || undefined,
              attendees: attendeeMap.get(session.classroom_id) || 0,
              duration,
              recordingUrl: session.recording_link || undefined,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.scheduledTime).getTime() -
              new Date(a.scheduledTime).getTime(),
          );

        setSessions(mappedSessions);
      } catch (error) {
        console.error("Error loading class sessions:", error);
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };

    loadSessions();
  }, [user?.uid]);

  const filteredSessions =
    filter === "all" ? sessions : sessions.filter((s) => s.status === filter);

  const stats = {
    scheduled: sessions.filter((s) => s.status === "scheduled").length,
    ongoing: sessions.filter((s) => s.status === "ongoing").length,
    completed: sessions.filter((s) => s.status === "completed").length,
    totalAttendees: sessions.reduce((acc, s) => acc + s.attendees, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-700 border-blue-300/30";
      case "ongoing":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-300/30 animate-pulse";
      case "completed":
        return "bg-muted/60 text-muted-foreground border-border/60";
      case "cancelled":
        return "bg-red-500/20 text-red-700 border-red-300/30";
      default:
        return "bg-muted/60";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return Clock;
      case "ongoing":
        return PlayCircle;
      case "completed":
        return CheckCircle;
      case "cancelled":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard.",
    });
  };

  const handleStartSession = (link: string) => {
    window.open(link, "_blank");
  };

  const handleOpenRecording = (url: string) => {
    window.open(url, "_blank");
  };

  const handleNewSession = () => {
    toast({
      title: "New Session",
      description:
        "Create a session from your classroom tools once scheduling details are available.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">
      <LecturerHeader />

      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Virtual Classes</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and conduct online class sessions
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-primary to-secondary gap-2"
              onClick={handleNewSession}
            >
              <Plus className="h-4 w-4" /> New Session
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-blue-500/10 border-blue-300/30">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Scheduled</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {stats.scheduled}
                      </p>
                    </div>
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-emerald-500/10 border-emerald-300/30">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Live Now</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {stats.ongoing}
                      </p>
                    </div>
                    <PlayCircle className="h-5 w-5 text-emerald-600 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-purple-500/10 border-purple-300/30">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {stats.completed}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Attendees
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {stats.totalAttendees}
                      </p>
                    </div>
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 flex-wrap"
        >
          {(["all", "scheduled", "ongoing", "completed"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground hover:bg-muted"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ),
          )}
        </motion.div>

        {/* Sessions Grid */}
        <div className="space-y-3">
          {loadingSessions ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
              <p className="text-muted-foreground">Loading sessions...</p>
            </motion.div>
          ) : filteredSessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No sessions found</p>
            </motion.div>
          ) : (
            filteredSessions.map((session, i) => {
              const StatusIcon = getStatusIcon(session.status);
              return (
                <motion.div
                  key={session.id}
                  variants={rise}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  <Card className="border-border/60 bg-card/70 backdrop-blur-lg hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="grid gap-4 lg:grid-cols-4 lg:items-center">
                        <div className="lg:col-span-2">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${getStatusColor(
                                session.status,
                              )}`}
                            >
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {session.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.courseCode} - {session.courseName}
                              </p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {session.scheduledTime}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {session.attendees} attendees
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-1 flex items-center justify-between lg:justify-start gap-3">
                          <Badge className={getStatusColor(session.status)}>
                            {session.status.charAt(0).toUpperCase() +
                              session.status.slice(1)}
                          </Badge>
                          {session.duration && (
                            <Badge variant="outline" className="text-xs">
                              {session.duration}m
                            </Badge>
                          )}
                        </div>

                        <div className="lg:col-span-1 flex gap-2 justify-end">
                          {session.status === "ongoing" && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-emerald-600 to-emerald-700"
                              onClick={() => window.open(session.meetingLink)}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" /> Join Now
                            </Button>
                          )}
                          {session.status === "scheduled" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  session.meetingLink &&
                                  handleCopyLink(session.meetingLink)
                                }
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-primary to-secondary"
                                onClick={() =>
                                  session.meetingLink &&
                                  handleStartSession(session.meetingLink)
                                }
                              >
                                <PlayCircle className="h-4 w-4 mr-1" /> Start
                              </Button>
                            </>
                          )}
                          {session.status === "completed" &&
                            session.recordingUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleOpenRecording(session.recordingUrl!)
                                }
                              >
                                <Download className="h-4 w-4 mr-1" /> Recording
                              </Button>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
