import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Printer, GraduationCap, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  semester_remark?: string;
  remarks?: string | null;
  courses?: ResultCourse;
}

interface TermResult {
  term: string;
  gpa: number;
  cgpa: number;
  totalCredits: number;
  remark?: string;
  entries: Array<
    ExamResultRow & { courseTitle: string; courseCode: string; credits: number }
  >;
}

const getGradeColor = (grade: string | null | undefined) => {
  if (!grade) return "text-gray-700";
  const gradeUpper = grade.toUpperCase();
  if (gradeUpper.startsWith("A")) return "text-emerald-700";
  if (gradeUpper.startsWith("B")) return "text-blue-700";
  if (gradeUpper.startsWith("C")) return "text-amber-700";
  if (gradeUpper.startsWith("D")) return "text-orange-700";
  return "text-red-700";
};

const calculateSemesterRemark = (gp: number, grade: string | null): string => {
  if (!grade) return "—";
  if (gp >= 3.5) return "Excellent";
  if (gp >= 3.0) return "Very Good";
  if (gp >= 2.5) return "Good";
  if (gp >= 2.0) return "Satisfactory";
  if (gp >= 1.0) return "Pass";
  return "Fail";
};

export default function Results() {
  const { user, profile } = useAuth();
  const [resultsLoading, setResultsLoading] = useState(true);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [cgpa, setCgpa] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadResults = async () => {
      try {
        setResultsLoading(true);

        // First, try to load from student_grades (newer system)
        // Only query with valid UUID student_id values to avoid 22P02 errors
        const isValidUuid = (value: string | undefined | null) =>
          !!value &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value
          );
        const studentId = isValidUuid(user.id) ? user.id : null;
        if (!studentId) {
          setResultsLoading(false);
          return;
        }

        console.log("Loading results for student:", studentId);

        let data: any[] | null = null;
        let error: any = null;

        // First try lecturer-side student_grades (grade book)
        try {
          const sgResponse = await (supabase as any)
            .from("student_grades")
            .select(
              "id, course_id, academic_year, semester, assignment1, assignment2, midterm, participation, final_exam, total, grade, gp, courses(title, code, credits)"
            )
            .eq("student_id", studentId)
            .order("academic_year", { ascending: false })
            .order("semester", { ascending: false });

          console.log("student_grades response:", sgResponse);

          if (
            !sgResponse.error &&
            sgResponse.data &&
            sgResponse.data.length > 0
          ) {
            data = sgResponse.data;
          } else {
            throw new Error("No student_grades rows");
          }
        } catch (sgError) {
          console.log("Falling back to exam_results due to:", sgError);

          const { data: examData, error: examError } = await supabase
            .from("exam_results")
            .select(
              "id, course_id, academic_year, semester, marks, grade, grade_point, remarks, courses(title, code, credits)"
            )
            .eq("student_id", studentId)
            .order("academic_year", { ascending: false })
            .order("semester", { ascending: false });

          console.log("exam_results response:", {
            data: examData,
            error: examError,
          });

          data = examData;
          error = examError;
        }

        if (error) {
          console.error("Error in results loading:", error);
          throw error;
        }

        // Normalize data from both sources
        const normalized = (data as any[] | null)?.map((row) => ({
          ...row,
          courseTitle: row.courses?.title || "Course",
          courseCode: row.courses?.code || "",
          credits: row.courses?.credits || 3,
          marks: row.total || row.marks || 0,
          grade_point: row.gp || row.grade_point || 0,
          semester_remark:
            row.semester_remark ||
            calculateSemesterRemark(row.gp || row.grade_point || 0, row.grade),
          a1: row.assignment1 || 0,
          a2: row.assignment2 || 0,
          mid: row.midterm || 0,
          part: row.participation || 0,
          final: row.final_exam || 0,
        }));

        console.log("Normalized data:", normalized);

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

        const terms = Array.from(termMap.values()).map((t) => {
          const gpa = t.totalCredits
            ? Number((t.gpa / t.totalCredits).toFixed(2))
            : 0;
          return {
            ...t,
            gpa,
            remark: calculateSemesterRemark(gpa, t.entries[0]?.grade || null),
          };
        });

        console.log("Terms:", terms);

        const totalCredits = terms.reduce((sum, t) => sum + t.totalCredits, 0);
        const totalPoints = terms.reduce(
          (sum, t) => sum + t.gpa * t.totalCredits,
          0
        );
        const computedCgpa = totalCredits
          ? Number((totalPoints / totalCredits).toFixed(2))
          : 0;

        console.log("CGPA:", computedCgpa);

        setTermResults(terms);
        setCgpa(computedCgpa);
      } catch (err) {
        console.error("Error loading exam results", err);
      } finally {
        setResultsLoading(false);
      }
    };

    loadResults();
  }, [user, profile]);

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
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <StudentHeader />

      <main className="container py-6 md:py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Section with Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Academic Transcript
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your complete academic record and grades
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const html = document.documentElement.innerHTML;
                  const blob = new Blob([html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `academic-transcript-${user?.id}.html`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowQRModal(true)}
              >
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>
            </div>
          </div>

          {resultsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse h-96 bg-muted/20" />
              ))}
            </div>
          ) : termResults.length === 0 ? (
            <Card className="p-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No results available yet. Check back soon!
              </p>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Student Information Card */}
              <Card className="p-4 md:p-6 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Full Name
                    </p>
                    <p className="font-semibold text-foreground">
                      {profile?.full_name || "Not Available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Student Number
                    </p>
                    <p className="font-semibold text-foreground">
                      {profile?.student_number || "Not Available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Programme
                    </p>
                    <p className="font-semibold text-foreground">
                      {profile?.programme || "Not Available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Department
                    </p>
                    <p className="font-semibold text-foreground">
                      {profile?.department || "Not Available"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Transcript Results */}
              {termResults.map((term, idx) => (
                <motion.div
                  key={term.term}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-2"
                >
                  {/* Semester Header */}
                  <h2 className="text-base md:text-lg font-bold text-foreground">
                    {term.term}
                  </h2>

                  {/* Responsive Table Container */}
                  <div className="overflow-x-auto">
                    <Card className="p-0 border">
                      {/* Desktop Table */}
                      <div className="hidden sm:block">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                              <th className="px-4 py-2 text-left font-bold text-xs uppercase text-muted-foreground">
                                Code
                              </th>
                              <th className="px-4 py-2 text-left font-bold text-xs uppercase text-muted-foreground">
                                Title
                              </th>
                              <th className="px-4 py-2 text-center font-bold text-xs uppercase text-muted-foreground">
                                Mark
                              </th>
                              <th className="px-4 py-2 text-center font-bold text-xs uppercase text-muted-foreground">
                                CUs
                              </th>
                              <th className="px-4 py-2 text-center font-bold text-xs uppercase text-muted-foreground">
                                Grade
                              </th>
                              <th className="px-4 py-2 text-center font-bold text-xs uppercase text-muted-foreground">
                                GD Pt
                              </th>
                              <th className="px-4 py-2 text-center font-bold text-xs uppercase text-muted-foreground">
                                Remark
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {term.entries.map((course) => (
                              <tr key={course.id} className="hover:bg-muted/50">
                                <td className="px-4 py-3 font-mono text-xs font-bold text-primary">
                                  {course.courseCode}
                                </td>
                                <td className="px-4 py-3 text-foreground">
                                  {course.courseTitle}
                                </td>
                                <td className="px-4 py-3 text-center font-semibold">
                                  {course.marks.toFixed(1)}
                                </td>
                                <td className="px-4 py-3 text-center font-semibold">
                                  {course.credits}
                                </td>
                                <td
                                  className={`px-4 py-3 text-center font-bold ${getGradeColor(
                                    course.grade
                                  )}`}
                                >
                                  {course.grade || "—"}
                                </td>
                                <td className="px-4 py-3 text-center font-semibold">
                                  {course.grade_point?.toFixed(1) || "0.0"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-xs font-bold text-emerald-600">
                                    {course.semester_remark || "—"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card Layout */}
                      <div className="sm:hidden divide-y divide-border/30">
                        {term.entries.map((course) => (
                          <div key={course.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs text-primary font-mono">
                                  {course.courseCode}
                                </p>
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {course.courseTitle}
                                </p>
                              </div>
                              <div
                                className={`font-bold ${getGradeColor(
                                  course.grade
                                )}`}
                              >
                                {course.grade || "—"}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Mark</p>
                                <p className="font-semibold">
                                  {course.marks.toFixed(1)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">CUs</p>
                                <p className="font-semibold">
                                  {course.credits}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">GD Pt</p>
                                <p className="font-semibold">
                                  {course.grade_point?.toFixed(1) || "0.0"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Rmk</p>
                                <p className="font-semibold text-emerald-600">
                                  {course.semester_remark || "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Semester Summary */}
                  <div className="flex flex-wrap gap-4 text-sm bg-muted/30 rounded-lg p-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">
                        Semester Remark
                      </p>
                      <p className="font-semibold text-emerald-600">
                        {term.remark || "NP"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">
                        GPA
                      </p>
                      <p className="font-bold text-lg text-primary">
                        {term.gpa.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">
                        CGPA
                      </p>
                      <p className="font-bold text-lg text-secondary">
                        {cgpa.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Share Results
                </h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-white rounded-xl p-4 flex items-center justify-center mb-4 border border-border">
                <div ref={qrRef}>
                  <QRCodeSVG
                    value={`https://nexus-university.vercel.app/results?student=${user?.id}`}
                    size={256}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center mb-6">
                Scan this QR code to view academic results for{" "}
                <strong>{profile?.full_name || "this student"}</strong>
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowQRModal(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => {
                    const link = document.createElement("a");
                    const canvas = qrRef.current?.querySelector("canvas");
                    if (canvas) {
                      link.href = canvas.toDataURL("image/png");
                      link.download = `results-qr-${user?.id}.png`;
                      link.click();
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download QR
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StudentBottomNav />
    </div>
  );
}
