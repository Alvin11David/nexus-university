import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Ban,
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface EnrollmentRow {
  id: string;
  status: "pending" | "approved" | "rejected" | "completed";
  enrolled_at: string;
  course_id: string;
  student_id: string;
  course?: {
    id: string;
    title: string;
    code: string;
    credits: number;
    semester: string | null;
    year: number | null;
  };
  student?: {
    id: string;
    full_name: string | null;
    email: string | null;
    registration_number: string | null;
    student_number: string | null;
  };
}

export default function LecturerEnrollments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);

  useEffect(() => {
    if (user) fetchEnrollments();
  }, [user]);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      // Get all courses this lecturer manages (via lecturer_courses or instructor_id)
      const [lecturerCoursesRes, instructorCoursesRes] = await Promise.all([
        supabase
          .from("lecturer_courses")
          .select(
            `course_id, courses(id, title, code, credits, semester, year)`
          )
          .eq("lecturer_id", user!.id),
        supabase
          .from("courses")
          .select("id, title, code, credits, semester, year")
          .eq("instructor_id", user!.id),
      ]);

      const courseMap = new Map<string, EnrollmentRow["course"]>();

      lecturerCoursesRes.data?.forEach((row) => {
        if (row.courses) {
          courseMap.set(row.course_id, row.courses);
        }
      });

      instructorCoursesRes.data?.forEach((row) => {
        courseMap.set(row.id, row as EnrollmentRow["course"]);
      });

      const courseIds = Array.from(courseMap.keys());

      if (courseIds.length === 0) {
        setEnrollments([]);
        return;
      }

      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          enrolled_at,
          course_id,
          student_id,
          course:courses(id, title, code, credits, semester, year)
        `
        )
        .in("course_id", courseIds)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;

      const studentIds = Array.from(
        new Set((data || []).map((e) => e.student_id).filter(Boolean))
      );

      let profileMap = new Map<string, EnrollmentRow["student"]>();
      if (studentIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, registration_number, student_number")
          .in("id", studentIds);

        if (profileError) throw profileError;
        profiles?.forEach((p) => profileMap.set(p.id, p));
      }

      const enriched = (data || []).map((row) => ({
        ...row,
        student: profileMap.get(row.student_id) || undefined,
      }));

      setEnrollments(enriched);
    } catch (error: any) {
      console.error("Error fetching enrollments", error);
      toast({
        title: "Error loading enrollments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: EnrollmentRow["status"]) => {
    const target = enrollments.find((e) => e.id === id);
    if (!target) return;

    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("enrollments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // Notify the student when their enrollment is reviewed
      if (target.student_id) {
        const { error: notifyError } = await supabase
          .from("notifications")
          .insert({
            user_id: target.student_id,
            title:
              status === "approved"
                ? "Enrollment approved"
                : "Enrollment update",
            message:
              status === "approved"
                ? `Your enrollment for ${
                    target.course?.code ?? "the course"
                  } was approved.`
                : `Your enrollment for ${
                    target.course?.code ?? "the course"
                  } was ${status}.`,
            type: "info",
            link: "/enrollment",
          });

        if (notifyError) console.error("Notification error", notifyError);
      }

      setEnrollments((prev) =>
        prev.map((enrollment) =>
          enrollment.id === id ? { ...enrollment, status } : enrollment
        )
      );

      toast({
        title:
          status === "approved" ? "Enrollment approved" : "Enrollment rejected",
        description:
          status === "approved"
            ? "Student can now access course materials"
            : "Student has been rejected for this course",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const pending = useMemo(
    () => enrollments.filter((e) => e.status === "pending"),
    [enrollments]
  );
  const approved = useMemo(
    () => enrollments.filter((e) => e.status === "approved"),
    [enrollments]
  );
  const rejected = useMemo(
    () => enrollments.filter((e) => e.status === "rejected"),
    [enrollments]
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      <LecturerHeader />
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Enrollment Approvals
              </p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Pending Enrollments
              </h1>
              <p className="text-muted-foreground mt-2">
                Review and approve students registering for your courses.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={fetchEnrollments}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                label: "Pending",
                value: pending.length,
                icon: Clock,
                color: "bg-amber-500/10 text-amber-700",
              },
              {
                label: "Approved",
                value: approved.length,
                icon: CheckCircle2,
                color: "bg-emerald-500/10 text-emerald-700",
              },
              {
                label: "Rejected",
                value: rejected.length,
                icon: Ban,
                color: "bg-destructive/10 text-destructive",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="h-5 w-5 text-muted-foreground" />
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.color}`}
                      >
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label} enrollments
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pending Approvals</span>
                <Badge variant="outline">{pending.length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading enrollments...
                </div>
              ) : pending.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3" />
                  No pending enrollments.
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.map((enrollment, idx) => (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="rounded-xl border p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {enrollment.course?.code || "Course"}
                            </Badge>
                            <Badge className="bg-primary/10 text-primary">
                              {enrollment.course?.credits ?? 0} credits
                            </Badge>
                          </div>
                          <p className="text-lg font-semibold mt-1">
                            {enrollment.course?.title || "Course Title"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.course?.semester || "Semester"} •{" "}
                            {enrollment.course?.year || "Year"}
                          </p>
                        </div>
                        <div className="text-right min-w-[180px]">
                          <p className="text-sm text-muted-foreground">
                            Student
                          </p>
                          <p className="font-medium">
                            {enrollment.student?.full_name ||
                              enrollment.student?.email ||
                              "Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Reg:{" "}
                            {enrollment.student?.registration_number || "—"} ·
                            ID: {enrollment.student?.student_number || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Enrolled{" "}
                            {new Date(
                              enrollment.enrolled_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          className="gap-2"
                          disabled={updatingId === enrollment.id}
                          onClick={() =>
                            updateStatus(enrollment.id, "approved")
                          }
                        >
                          {updatingId === enrollment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BadgeCheck className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          disabled={updatingId === enrollment.id}
                          onClick={() =>
                            updateStatus(enrollment.id, "rejected")
                          }
                        >
                          {updatingId === enrollment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <LecturerBottomNav />
    </div>
  );
}
