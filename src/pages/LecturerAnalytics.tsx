import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Users,
  BookOpen,
  Trophy,
  Award,
} from "lucide-react";

import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

interface CourseAnalytics {
  id: string;
  name: string;
  enrollment: number;
  avgGPA: number;
  attendanceRate: number;
  assignmentCompletion: number;
  trend: "up" | "down" | "stable";
}

interface StudentInsight {
  name: string;
  status: "excellent" | "good" | "warning" | "at-risk";
  score: number;
  attendance: number;
  trend: "up" | "down";
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [timeRange, setTimeRange] = useState("semester");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  const handleViewCourseDetails = (courseId: string) => {
    // Navigate to gradebook with the specific course pre-selected
    navigate(`/lecturer/gradebook?course=${courseId}`);
  };

  const calculateTrend = (
    avgGPA: number,
    attendanceRate: number,
    assignmentCompletion: number,
  ): "up" | "down" | "stable" => {
    // Simple trend calculation based on performance metrics
    const performanceScore =
      (avgGPA / 4) * 0.4 +
      (attendanceRate / 100) * 0.3 +
      (assignmentCompletion / 100) * 0.3;

    if (performanceScore >= 0.8) return "up";
    if (performanceScore <= 0.5) return "down";
    return "stable";
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        break;
      case "semester":
      default:
        // Assuming semester is 6 months
        startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return {
      startDate,
      endDate,
    };
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch lecturer's courses
      const courses = await fetchLecturerCourses();

      // Fetch analytics for each course
      const courseAnalytics = await Promise.all(
        courses.map(async (course) => {
          const enrollmentCount = await fetchEnrollmentCount(course.id);
          const avgGPA = await fetchAverageGPA(course.id);
          const attendanceRate = await fetchAttendanceRate(course.id);
          const assignmentCompletion = await fetchAssignmentCompletion(
            course.id,
          );

          return {
            id: course.id,
            name: `${course.code} - ${course.title}`,
            enrollment: enrollmentCount,
            avgGPA: avgGPA,
            attendanceRate: attendanceRate,
            assignmentCompletion: assignmentCompletion,
            trend: calculateTrend(avgGPA, attendanceRate, assignmentCompletion),
          };
        }),
      );

      setAnalytics(courseAnalytics);

      // Fetch student insights
      const studentInsights = await fetchStudentInsights(courses);
      setInsights(studentInsights);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturerCourses = async () => {
    if (!user?.uid) return [];

    try {
      const profileDoc = await getDoc(doc(db, "profiles", user.uid));
      if (!profileDoc.exists()) return [];

      const profileData = profileDoc.data();
      const assignedCourseUnits = profileData.assigned_course_units || [];

      if (assignedCourseUnits.length === 0) return [];

      const courses: any[] = [];

      // Query course_units in chunks (Firestore 'in' supports up to 30 values)
      const chunks = [];
      for (let i = 0; i < assignedCourseUnits.length; i += 30) {
        chunks.push(assignedCourseUnits.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const courseUnitsQuery = query(
          collection(db, "course_units"),
          where("__name__", "in", chunk),
        );
        const courseUnitsSnapshot = await getDocs(courseUnitsQuery);
        courseUnitsSnapshot.docs.forEach((doc) => {
          const courseData = doc.data();
          courses.push({
            id: doc.id,
            code: courseData.code || courseData.course_unit_code || "Unknown",
            title:
              courseData.name ||
              courseData.course_unit_name ||
              "Unknown Course",
          });
        });
      }

      return courses;
    } catch (error) {
      console.error("Error fetching lecturer courses:", error);
      return [];
    }
  };

  const fetchEnrollmentCount = async (courseId: string): Promise<number> => {
    try {
      const enrollQuery = query(
        collection(db, "enrollments"),
        where("course_id", "==", courseId),
        where("status", "==", "approved"),
      );
      const enrollSnap = await getDocs(enrollQuery);
      return enrollSnap.size;
    } catch (error) {
      console.error("Error fetching enrollment count:", error);
      return 0;
    }
  };

  const fetchAverageGPA = async (courseId: string): Promise<number> => {
    try {
      const { startDate, endDate } = getDateRange();
      const gradesQuery = query(
        collection(db, "student_grades"),
        where("course_id", "==", courseId),
        where("created_at", ">=", Timestamp.fromDate(startDate)),
        where("created_at", "<=", Timestamp.fromDate(endDate)),
      );
      const gradesSnap = await getDocs(gradesQuery);

      if (gradesSnap.empty) return 0;

      const gpas = gradesSnap.docs
        .map((doc) => doc.data().gp)
        .filter((gp) => gp != null) as number[];

      if (gpas.length === 0) return 0;

      const avgGPA = gpas.reduce((sum, gp) => sum + gp, 0) / gpas.length;
      return Math.round(avgGPA * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error("Error fetching average GPA:", error);
      return 0;
    }
  };

  const fetchAttendanceRate = async (courseId: string): Promise<number> => {
    try {
      const { startDate, endDate } = getDateRange();

      const attendanceQuery = query(
        collection(db, "attendance"),
        where("course_id", "==", courseId),
        where("attendance_date", ">=", startDate),
        where("attendance_date", "<=", endDate),
      );
      const attendanceSnap = await getDocs(attendanceQuery);

      if (attendanceSnap.empty) return 0;

      const presentCount = attendanceSnap.docs.filter(
        (doc) => doc.data().status === "present",
      ).length;
      const totalRecords = attendanceSnap.size;

      return Math.round((presentCount / totalRecords) * 100);
    } catch (error) {
      console.error("Error fetching attendance rate:", error);
      return 0;
    }
  };

  const fetchAssignmentCompletion = async (
    courseId: string,
  ): Promise<number> => {
    try {
      const { startDate, endDate } = getDateRange();
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate + "T23:59:59"));

      const gradesQuery = query(
        collection(db, "student_grades"),
        where("course_id", "==", courseId),
        where("created_at", ">=", startTimestamp),
        where("created_at", "<=", endTimestamp),
      );
      const gradesSnap = await getDocs(gradesQuery);

      if (gradesSnap.empty) return 0;

      // Calculate completion based on non-null assignment grades
      const assignments = gradesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          assignment1: data.assignment1 != null,
          assignment2: data.assignment2 != null,
        };
      });

      if (assignments.length === 0) return 0;

      const totalAssignments = assignments.length * 2; // 2 assignments per student
      const completedAssignments = assignments.reduce(
        (sum, student) =>
          sum + (student.assignment1 ? 1 : 0) + (student.assignment2 ? 1 : 0),
        0,
      );

      return Math.round((completedAssignments / totalAssignments) * 100);
    } catch (error) {
      console.error("Error fetching assignment completion:", error);
      return 0;
    }
  };

  const fetchStudentInsights = async (
    courses: any[],
  ): Promise<StudentInsight[]> => {
    try {
      const allInsights: StudentInsight[] = [];

      for (const course of courses) {
        // Get enrolled students
        const enrollQuery = query(
          collection(db, "enrollments"),
          where("course_id", "==", course.id),
          where("status", "==", "approved"),
        );
        const enrollSnap = await getDocs(enrollQuery);

        for (const enrollDoc of enrollSnap.docs) {
          const studentId = enrollDoc.data().student_id;

          // Get student profile
          const studentDoc = await getDoc(doc(db, "profiles", studentId));
          if (!studentDoc.exists()) continue;

          const studentData = studentDoc.data();

          // Get student grades for this course
          const { startDate, endDate } = getDateRange();
          const startTimestamp = Timestamp.fromDate(new Date(startDate));
          const endTimestamp = Timestamp.fromDate(
            new Date(endDate + "T23:59:59"),
          );

          const gradesQuery = query(
            collection(db, "student_grades"),
            where("course_id", "==", course.id),
            where("student_id", "==", studentId),
            where("created_at", ">=", startTimestamp),
            where("created_at", "<=", endTimestamp),
          );
          const gradesSnap = await getDocs(gradesQuery);

          let score = 0;
          let attendance = 0;

          if (!gradesSnap.empty) {
            const gradeData = gradesSnap.docs[0].data();
            score = gradeData.total || 0;
          }

          // Get attendance for this course
          const attendanceQuery = query(
            collection(db, "attendance"),
            where("course_id", "==", course.id),
            where("student_id", "==", studentId),
            where("attendance_date", ">=", startDate),
            where("attendance_date", "<=", endDate),
          );
          const attendanceSnap = await getDocs(attendanceQuery);

          if (!attendanceSnap.empty) {
            const presentCount = attendanceSnap.docs.filter(
              (doc) => doc.data().status === "present",
            ).length;
            attendance = Math.round((presentCount / attendanceSnap.size) * 100);
          }

          // Determine status based on score
          let status: "excellent" | "good" | "warning" | "at-risk";
          if (score >= 85) status = "excellent";
          else if (score >= 70) status = "good";
          else if (score >= 60) status = "warning";
          else status = "at-risk";

          // Check if student already exists in insights (avoid duplicates)
          const existingIndex = allInsights.findIndex(
            (insight) => insight.name === studentData.full_name,
          );
          if (existingIndex === -1) {
            allInsights.push({
              name: studentData.full_name || "Unknown Student",
              status,
              score,
              attendance,
              trend: score >= 70 ? "up" : "down", // Simple trend calculation
            });
          }
        }
      }

      // Prioritize at-risk students, then show top performers
      const atRiskStudents = allInsights.filter(
        (student) => student.status === "at-risk",
      );
      const otherStudents = allInsights.filter(
        (student) => student.status !== "at-risk",
      );

      // Sort at-risk students by score (lowest first to show most concerning)
      const sortedAtRisk = atRiskStudents.sort((a, b) => a.score - b.score);

      // Sort other students by score (highest first)
      const sortedOthers = otherStudents.sort((a, b) => b.score - a.score);

      // Combine: show up to 4 at-risk students, then fill with top performers
      const prioritizedInsights = [
        ...sortedAtRisk.slice(0, 4),
        ...sortedOthers.slice(0, 4),
      ];

      return prioritizedInsights.slice(0, 8); // Ensure max 8 students
    } catch (error) {
      console.error("Error fetching student insights:", error);
      return [];
    }
  };

  const overallStats =
    analytics.length > 0
      ? {
          avgEnrollment: Math.round(
            analytics.reduce((acc, a) => acc + (a.enrollment || 0), 0) /
              analytics.length || 0,
          ),
          avgGPA: (
            analytics.reduce((acc, a) => acc + (a.avgGPA || 0), 0) /
              analytics.length || 0
          ).toFixed(2),
          avgAttendance: Math.round(
            analytics.reduce((acc, a) => acc + (a.attendanceRate || 0), 0) /
              analytics.length || 0,
          ),
          atRiskStudents: insights.filter((s) => s.status === "at-risk").length,
        }
      : {
          avgEnrollment: 0,
          avgGPA: "0.00",
          avgAttendance: 0,
          atRiskStudents: 0,
        };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-300/30";
      case "good":
        return "bg-blue-500/20 text-blue-700 border-blue-300/30";
      case "warning":
        return "bg-amber-500/20 text-amber-700 border-amber-300/30";
      case "at-risk":
        return "bg-red-500/20 text-red-700 border-red-300/30";
      default:
        return "bg-muted/60";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">


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
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Analytics & Insights</h1>
                <p className="text-sm text-muted-foreground">
                  Track performance across your courses
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {["week", "month", "semester"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    timeRange === range
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-300/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Key Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Avg Enrollment
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {loading ? "..." : overallStats.avgEnrollment}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-emerald-500/10 border-emerald-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Class Avg GPA</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {loading ? "..." : overallStats.avgGPA}
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
                  <p className="text-sm text-muted-foreground">
                    Avg Attendance
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {loading ? "..." : `${overallStats.avgAttendance}%`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-red-500/10 border-red-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    At-Risk Students
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    {loading ? "..." : overallStats.atRiskStudents}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Course Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Course Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Loading course analytics...
                  </p>
                </div>
              ) : analytics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No courses assigned yet.
                  </p>
                </div>
              ) : (
                analytics.map((course, i) => (
                  <motion.div
                    key={course.name}
                    variants={rise}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    className="rounded-lg border border-border/60 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {course.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {course.enrollment} students
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          course.trend === "up"
                            ? "bg-emerald-500/20 text-emerald-700 border-emerald-300/30"
                            : course.trend === "down"
                              ? "bg-red-500/20 text-red-700 border-red-300/30"
                              : "bg-amber-500/20 text-amber-700 border-amber-300/30"
                        }
                      >
                        {course.trend === "up"
                          ? "↑"
                          : course.trend === "down"
                            ? "↓"
                            : "→"}{" "}
                        {course.trend}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Avg GPA</span>
                          <span className="font-semibold">
                            {course.avgGPA.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(course.avgGPA / 4) * 100}%` }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            Attendance
                          </span>
                          <span className="font-semibold">
                            {course.attendanceRate}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.attendanceRate}%` }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            Assignment Completion
                          </span>
                          <span className="font-semibold">
                            {course.assignmentCompletion}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${course.assignmentCompletion}%`,
                            }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleViewCourseDetails(course.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Student Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Student Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Loading student insights...
                  </p>
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No student data available.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((student, i) => (
                    <motion.div
                      key={student.name}
                      variants={rise}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground">
                            {student.name}
                          </p>
                          {student.status === "at-risk" && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Score: {student.score}%
                          </span>
                          <span className="text-muted-foreground">
                            Attendance: {student.attendance}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(student.status)}>
                          {student.status.charAt(0).toUpperCase() +
                            student.status.slice(1)}
                        </Badge>
                        {student.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <motion.div
                            animate={{ y: [0, 2, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-amber-300/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Award className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 p-3 rounded-lg bg-muted/40">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    Follow up with at-risk students
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Consider reaching out to Mike Johnson who is at risk. Offer
                    additional support.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-muted/40">
                <Trophy className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    Recognize top performers
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Alex Brown and Emma Davis are excelling. Consider them for
                    peer mentoring roles.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-muted/40">
                <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    CS101 showing positive trend
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your CS101 course is performing well with upward trajectory.
                    Keep the momentum!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
