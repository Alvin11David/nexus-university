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
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CourseAnalytics {
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
  const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [timeRange, setTimeRange] = useState("semester");

  const mockCourseAnalytics: CourseAnalytics[] = [
    {
      name: "CS101 - Algorithms",
      enrollment: 30,
      avgGPA: 3.6,
      attendanceRate: 92,
      assignmentCompletion: 95,
      trend: "up",
    },
    {
      name: "CS201 - Systems Design",
      enrollment: 25,
      avgGPA: 3.4,
      attendanceRate: 88,
      assignmentCompletion: 88,
      trend: "stable",
    },
    {
      name: "CS301 - Data Mining",
      enrollment: 22,
      avgGPA: 3.2,
      attendanceRate: 85,
      assignmentCompletion: 82,
      trend: "down",
    },
  ];

  const mockStudentInsights: StudentInsight[] = [
    {
      name: "Alex Brown",
      status: "excellent",
      score: 94,
      attendance: 98,
      trend: "up",
    },
    {
      name: "Emma Davis",
      status: "excellent",
      score: 92,
      attendance: 100,
      trend: "up",
    },
    {
      name: "John Doe",
      status: "good",
      score: 85,
      attendance: 95,
      trend: "up",
    },
    {
      name: "Jane Smith",
      status: "warning",
      score: 72,
      attendance: 88,
      trend: "down",
    },
    {
      name: "Mike Johnson",
      status: "at-risk",
      score: 58,
      attendance: 72,
      trend: "down",
    },
  ];

  useEffect(() => {
    setAnalytics(mockCourseAnalytics);
    setInsights(mockStudentInsights);
  }, []);

  const overallStats = {
    avgEnrollment: Math.round(
      analytics.reduce((acc, a) => acc + a.enrollment, 0) / analytics.length
    ),
    avgGPA: (
      analytics.reduce((acc, a) => acc + a.avgGPA, 0) / analytics.length
    ).toFixed(2),
    avgAttendance: Math.round(
      analytics.reduce((acc, a) => acc + a.attendanceRate, 0) / analytics.length
    ),
    atRiskStudents: insights.filter((s) => s.status === "at-risk").length,
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
                    {overallStats.avgEnrollment}
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
                    {overallStats.avgGPA}
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
                    {overallStats.avgAttendance}%
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
                    {overallStats.atRiskStudents}
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
              {analytics.map((course, i) => (
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
                        <span className="font-semibold">{course.avgGPA}</span>
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
                          animate={{ width: `${course.assignmentCompletion}%` }}
                          transition={{ delay: 0.5, duration: 1 }}
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
