import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Zap,
  Award,
  Target,
  Calendar,
} from "lucide-react";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ResultCourse {
  title: string;
  code: string;
  credits: number | null;
}

interface ExamResultRow {
  id: string;
  course_id: string;
  academic_year: string;
  semester: string;
  marks: number;
  grade: string | null;
  grade_point: number | null;
  courses?: ResultCourse;
}

interface TermResult {
  term: string;
  gpa: number;
  totalCredits: number;
  remark?: string;
  entries: Array<
    ExamResultRow & { courseTitle: string; courseCode: string; credits: number }
  >;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
    },
  },
};

const getGradeColor = (grade: string | null | undefined) => {
  if (!grade) return "bg-gray-100 text-gray-700";
  const gradeUpper = grade.toUpperCase();
  if (gradeUpper.startsWith("A")) return "bg-emerald-100 text-emerald-700";
  if (gradeUpper.startsWith("B")) return "bg-blue-100 text-blue-700";
  if (gradeUpper.startsWith("C")) return "bg-amber-100 text-amber-700";
  if (gradeUpper.startsWith("D")) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
};

export default function Results() {
  const { user } = useAuth();
  const [resultsLoading, setResultsLoading] = useState(true);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [cgpa, setCgpa] = useState(0);

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

  const getPerformanceLevel = (
    gpa: number
  ): { label: string; color: string; bgColor: string } => {
    if (gpa >= 4.5)
      return {
        label: "Excellent",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
      };
    if (gpa >= 4.0)
      return {
        label: "Very Good",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
      };
    if (gpa >= 3.5)
      return { label: "Good", color: "text-cyan-700", bgColor: "bg-cyan-50" };
    if (gpa >= 3.0)
      return {
        label: "Satisfactory",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
      };
    return {
      label: "Needs Improvement",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-20 md:pb-0 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-20 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 blur-3xl" />
        <div className="absolute top-40 -right-24 w-80 h-80 bg-gradient-to-bl from-purple-500/10 via-pink-500/5 to-blue-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 blur-3xl" />
      </div>

      <StudentHeader />

      <main className="container py-8 space-y-8 relative">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-xs font-bold uppercase tracking-wide">
              <Trophy className="h-4 w-4" /> Academic Performance
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Your Results
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Complete academic transcript with detailed course marks, grades,
              and comprehensive GPA analysis
            </p>
          </div>

          {/* Overall Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            {/* CGPA Card */}
            <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    CGPA
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-primary">
                    {resultsLoading ? "—" : cgpa.toFixed(2)}
                  </p>
                  <span className="text-sm text-muted-foreground">/5.00</span>
                </div>
                {!resultsLoading && (
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-2 flex-1 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-primary to-secondary"
                        style={{ width: `${(cgpa / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      {((cgpa / 5) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Level */}
            {!resultsLoading && cgpa > 0 && (
              <div
                className={`rounded-3xl ${
                  getPerformanceLevel(cgpa).bgColor
                } border border-current/20 p-6 relative overflow-hidden`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        getPerformanceLevel(cgpa).bgColor
                      }`}
                    >
                      <Zap
                        className={`h-5 w-5 ${getPerformanceLevel(cgpa).color}`}
                      />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Performance
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-black ${
                      getPerformanceLevel(cgpa).color
                    }`}
                  >
                    {getPerformanceLevel(cgpa).label}
                  </p>
                </div>
              </div>
            )}

            {/* Semesters Completed */}
            <div className="rounded-3xl bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent border border-secondary/30 p-6 relative overflow-hidden group hover:border-secondary/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    <Calendar className="h-5 w-5 text-secondary" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Semesters
                  </span>
                </div>
                <p className="text-4xl font-black text-secondary">
                  {resultsLoading ? "—" : termResults.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Results by Semester */}
        {resultsLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-muted/30 p-6 h-96 animate-pulse"
              />
            ))}
          </motion.div>
        ) : termResults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-border/50 p-12 text-center space-y-3"
          >
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <p className="text-muted-foreground">
              No results available yet. Check back soon!
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {termResults.map((term, termIdx) => {
              const perfLevel = getPerformanceLevel(term.gpa);
              return (
                <motion.div
                  key={term.term}
                  variants={itemVariants}
                  className="space-y-3"
                >
                  {/* Semester Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/30">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {term.term}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Academic semester results
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                          GPA
                        </p>
                        <p className="text-3xl font-black text-primary">
                          {term.gpa.toFixed(2)}
                        </p>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-xl ${perfLevel.bgColor} border border-current/20`}
                      >
                        <p className={`text-xs font-bold ${perfLevel.color}`}>
                          {perfLevel.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Courses Table */}
                  <div className="rounded-2xl overflow-hidden border border-border/50 bg-card/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    {/* Table Header - Desktop */}
                    <div className="hidden md:grid md:grid-cols-12 gap-3 px-6 py-4 bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/5 border-b border-border/50 font-bold text-xs text-muted-foreground uppercase tracking-wider">
                      <div className="md:col-span-3">Code & Title</div>
                      <div className="md:col-span-1 text-center">Mark</div>
                      <div className="md:col-span-1 text-center">CUs</div>
                      <div className="md:col-span-1 text-center">Grade</div>
                      <div className="md:col-span-1 text-center">GP</div>
                      <div className="md:col-span-2 text-center">Remark</div>
                      <div className="md:col-span-2 text-right">Status</div>
                    </div>

                    {/* Courses */}
                    <div className="divide-y divide-border/30">
                      {term.entries.map((course, courseIdx) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: courseIdx * 0.05 }}
                          className="group p-4 md:p-6 hover:bg-primary/5 transition-colors duration-200 cursor-default"
                        >
                          {/* Mobile Layout */}
                          <div className="md:hidden space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-bold text-sm text-foreground">
                                  {course.courseTitle}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">
                                  {course.courseCode}
                                </p>
                              </div>
                              <div
                                className={`px-2 py-1 rounded-lg font-bold text-xs ${getGradeColor(
                                  course.grade
                                )}`}
                              >
                                {course.grade || "—"}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-muted/50 rounded-lg p-2">
                                <p className="text-muted-foreground">Mark</p>
                                <p className="font-bold text-primary text-lg">
                                  {course.marks.toFixed(1)}
                                </p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2">
                                <p className="text-muted-foreground">CUs</p>
                                <p className="font-bold text-secondary text-lg">
                                  {course.credits}
                                </p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2">
                                <p className="text-muted-foreground">GP</p>
                                <p className="font-bold text-accent text-lg">
                                  {course.grade_point?.toFixed(2) || "0.00"}
                                </p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2">
                                <p className="text-muted-foreground">Remark</p>
                                <p className="font-bold text-emerald-600">NP</p>
                              </div>
                            </div>

                            <div className="h-2 rounded-full bg-border/50 overflow-hidden">
                              <div
                                className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (course.marks / 100) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-3">
                              <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                {course.courseTitle}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                                {course.courseCode}
                              </p>
                            </div>

                            <div className="md:col-span-1 text-center">
                              <p className="font-black text-primary text-lg">
                                {course.marks.toFixed(1)}
                              </p>
                              <div className="h-1 rounded-full bg-border/50 overflow-hidden mt-1">
                                <div
                                  className="h-1 bg-gradient-to-r from-primary to-secondary"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (course.marks / 100) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="md:col-span-1 text-center">
                              <p className="font-bold text-secondary">
                                {course.credits}
                              </p>
                            </div>

                            <div className="md:col-span-1 text-center">
                              <span
                                className={`px-2 py-1 rounded-lg font-bold text-xs inline-block ${getGradeColor(
                                  course.grade
                                )}`}
                              >
                                {course.grade || "—"}
                              </span>
                            </div>

                            <div className="md:col-span-1 text-center">
                              <p className="font-bold text-accent">
                                {course.grade_point?.toFixed(2) || "0.00"}
                              </p>
                            </div>

                            <div className="md:col-span-2 text-center">
                              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-full">
                                NP
                              </p>
                            </div>

                            <div className="md:col-span-2 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Award className="h-4 w-4 text-primary" />
                                <span className="text-xs font-semibold text-primary">
                                  Passed
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Semester Summary Footer */}
                    <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-t border-border/50 px-4 md:px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                            Total CUs
                          </p>
                          <p className="text-xl font-black text-primary mt-1">
                            {term.totalCredits}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                            Semester GPA
                          </p>
                          <p className="text-xl font-black text-secondary mt-1">
                            {term.gpa.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                            Grade Status
                          </p>
                          <p className="text-xl font-black text-accent mt-1">
                            NP
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                            Courses Completed
                          </p>
                          <p className="text-xl font-black text-emerald-600 mt-1">
                            {term.entries.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Overall Performance Summary */}
        {!resultsLoading && termResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 border border-primary/30 p-6 md:p-8"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Academic Summary</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    Overall CGPA
                  </p>
                  <p className="text-3xl font-black text-primary">
                    {cgpa.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    Total Semesters
                  </p>
                  <p className="text-3xl font-black text-secondary">
                    {termResults.length}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    Total Credits
                  </p>
                  <p className="text-3xl font-black text-accent">
                    {termResults.reduce((sum, t) => sum + t.totalCredits, 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                    Total Courses
                  </p>
                  <p className="text-3xl font-black text-emerald-600">
                    {termResults.reduce((sum, t) => sum + t.entries.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
}
