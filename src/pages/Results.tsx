import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Sparkles,
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
  entries: Array<
    ExamResultRow & { courseTitle: string; courseCode: string; credits: number }
  >;
}

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-20 md:pb-0 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute -top-32 -left-16 w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-bl from-secondary/15 via-accent/10 to-primary/10 blur-3xl" />
      </div>

      <Header />

      <main className="container py-6 space-y-8 relative">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
              <Sparkles className="h-4 w-4" /> Results
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              My Results
            </h1>
            <p className="text-sm text-muted-foreground">
              Course work, finals, GPA by semester, and your cumulative CGPA—all
              in a mindblowing view.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center min-w-[130px]">
              <p className="text-xs text-muted-foreground">CGPA</p>
              <p className="text-2xl font-bold text-primary">
                {resultsLoading ? "…" : cgpa.toFixed(2)}
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
              className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-lg p-5 space-y-3 shadow-xl"
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
                    className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-2"
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

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
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

                    <div className="h-2 w-full rounded-full bg-border/60 overflow-hidden">
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
      </main>

      <StudentBottomNav />
    </div>
  );
}
