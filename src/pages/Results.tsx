import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Printer, GraduationCap, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadResults = async () => {
      try {
        setResultsLoading(true);

        const studentId = user.uid;
        console.log("Loading results for student:", studentId);

        let data: any[] = [];

        // Try to fetch from student_grades
        const sgRef = collection(db, "student_grades");
        const qSg = query(
          sgRef,
          where("student_id", "==", studentId),
          orderBy("academic_year", "desc"),
          orderBy("semester", "desc")
        );
        const sgSnap = await getDocs(qSg);

        if (!sgSnap.empty) {
          data = sgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
          // Fallback to exam_results
          const erRef = collection(db, "exam_results");
          const qEr = query(
            erRef,
            where("student_id", "==", studentId),
            orderBy("academic_year", "desc"),
            orderBy("semester", "desc")
          );
          const erSnap = await getDocs(qEr);
          data = erSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        // Fetch course details
        const uniqueCourseIds = Array.from(new Set(data.map(r => r.course_id)));
        const courseMap = new Map();
        for (let i = 0; i < uniqueCourseIds.length; i += 10) {
          const chunk = uniqueCourseIds.slice(i, i + 10);
          const qCourse = query(collection(db, "courses"), where("__name__", "in", chunk));
          const courseSnap = await getDocs(qCourse);
          courseSnap.docs.forEach(d => courseMap.set(d.id, d.data()));
        }

        // Normalize data
        const normalized = data.map((row) => {
          const course = courseMap.get(row.course_id);
          return {
            ...row,
            courseTitle: course?.title || "Course",
            courseCode: course?.code || "",
            credits: course?.credits || 3,
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
          };
        });

        const termMap = new Map<string, TermResult>();
        normalized.forEach((row) => {
          const term = `${row.academic_year} · ${row.semester}`;
          const existing = termMap.get(term) || {
            term,
            gpa: 0,
            cgpa: 0,
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
  }, [user, profile]);

  const getPerformanceLevel = (
    gpa: number
  ): { label: string; color: string; bgColor: string } => {
    if (gpa >= 4.5)
      return { label: "Excellent", color: "text-emerald-700", bgColor: "bg-emerald-50" };
    if (gpa >= 4.0)
      return { label: "Very Good", color: "text-blue-700", bgColor: "bg-blue-50" };
    if (gpa >= 3.5)
      return { label: "Good", color: "text-cyan-700", bgColor: "bg-cyan-50" };
    if (gpa >= 3.0)
      return { label: "Satisfactory", color: "text-amber-700", bgColor: "bg-amber-50" };
    return { label: "Needs Improvement", color: "text-orange-700", bgColor: "bg-orange-50" };
  };

  // ─── PDF Download ────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // ── Header bar ──
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL ACADEMIC TRANSCRIPT", pageWidth / 2, 12, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, pageWidth / 2, 20, { align: "center" });

      yPos = 36;

      // ── Student Info Box ──
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 32, 2, 2, "FD");

      const col1X = margin + 6;
      const col2X = pageWidth / 2 + 6;

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139); // slate-500

      doc.text("FULL NAME", col1X, yPos + 8);
      doc.text("STUDENT NUMBER", col2X, yPos + 8);
      doc.text("PROGRAMME", col1X, yPos + 22);
      doc.text("DEPARTMENT", col2X, yPos + 22);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);

      doc.text(profile?.full_name || "Not Available", col1X, yPos + 15);
      doc.text(profile?.student_number || "Not Available", col2X, yPos + 15);
      doc.text(profile?.programme || "Not Available", col1X, yPos + 29);
      doc.text(profile?.department || "Not Available", col2X, yPos + 29);

      yPos += 40;

      // ── Per-term tables ──
      termResults.forEach((term, termIdx) => {
        // Check if we need a new page
        const estimatedHeight = 14 + term.entries.length * 9 + 20;
        if (yPos + estimatedHeight > pageHeight - 25) {
          doc.addPage();
          yPos = margin;
        }

        // Term heading
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(margin, yPos, pageWidth - margin * 2, 9, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(term.term, margin + 4, yPos + 6.2);
        yPos += 9;

        // Table
        autoTable(doc, {
          startY: yPos,
          margin: { left: margin, right: margin },
          head: [["Code", "Course Title", "Mark", "CUs", "Grade", "GD Pt", "Remark"]],
          body: term.entries.map((c) => [
            c.courseCode || "—",
            c.courseTitle,
            c.marks?.toFixed(1) ?? "0.0",
            String(c.credits),
            c.grade || "—",
            c.grade_point?.toFixed(1) ?? "0.0",
            c.semester_remark || "—",
          ]),
          headStyles: {
            fillColor: [51, 65, 85],   // slate-700
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.5,
            cellPadding: 3,
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
            cellPadding: 3,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { cellWidth: 22, fontStyle: "bold", textColor: [37, 99, 235] },
            1: { cellWidth: "auto" },
            2: { cellWidth: 16, halign: "center" },
            3: { cellWidth: 12, halign: "center" },
            4: { cellWidth: 16, halign: "center", fontStyle: "bold" },
            5: { cellWidth: 16, halign: "center" },
            6: { cellWidth: 24, halign: "center", textColor: [5, 150, 105] },
          },
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.3,
          didDrawPage: () => { /* page break handled by autoTable */ },
        });

        yPos = (doc as any).lastAutoTable.finalY + 3;

        // GPA / CGPA summary strip
        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, yPos, pageWidth - margin * 2, 12, "FD");

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Semester Remark:", margin + 4, yPos + 5);
        doc.text("GPA:", margin + 60, yPos + 5);
        doc.text("CGPA:", margin + 95, yPos + 5);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.text(term.remark || "NP", margin + 36, yPos + 5);

        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(term.gpa.toFixed(2), margin + 73, yPos + 5);

        doc.setTextColor(79, 70, 229); // violet-600
        doc.text(cgpa.toFixed(2), margin + 110, yPos + 5);

        yPos += 18;
      });

      // ── Final CGPA banner ──
      if (yPos + 22 > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFillColor(15, 23, 42);
      doc.rect(margin, yPos, pageWidth - margin * 2, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Cumulative GPA (CGPA): ${cgpa.toFixed(2)}`, pageWidth / 2, yPos + 7, { align: "center" });
      const perf = getPerformanceLevel(cgpa);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(`Overall Performance: ${perf.label}`, pageWidth / 2, yPos + 14, { align: "center" });

      // ── Footer on every page ──
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text("This transcript is computer-generated and is valid without a signature.", margin, pageHeight - 7);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
      }

      doc.save(`academic-transcript-${profile?.student_number || user?.uid || "student"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

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
                onClick={handleDownloadPDF}
                disabled={isDownloading || resultsLoading || termResults.length === 0}
              >
                <Download className={`h-4 w-4 ${isDownloading ? "animate-bounce" : ""}`} />
                <span className="hidden sm:inline">
                  {isDownloading ? "Generating..." : "Download"}
                </span>
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
            <div className="space-y-8" ref={transcriptRef}>
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
                    value={`https://nexus-university.vercel.app/results?student=${user?.uid}`}
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
                    const svgEl = qrRef.current?.querySelector("svg");
                    if (!svgEl) return;
                    const svgData = new XMLSerializer().serializeToString(svgEl);
                    const canvas = document.createElement("canvas");
                    canvas.width = 256;
                    canvas.height = 256;
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      ctx?.drawImage(img, 0, 0);
                      const link = document.createElement("a");
                      link.href = canvas.toDataURL("image/png");
                      link.download = `results-qr-${user?.uid}.png`;
                      link.click();
                    };
                    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
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