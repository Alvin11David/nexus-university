import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Download,
  Upload,
  Filter,
  Search,
  TrendingUp,
  Award,
  AlertCircle,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

interface StudentGrade {
  id: string;
  student_id: string;
  name: string;
  email: string;
  componentScores: Record<string, number>;
  total: number;
  grade: string;
  gp: number;
  status: "excellent" | "good" | "average" | "warning" | "failing";
  grade_id?: string;
}

interface GradingCriterion {
  id: string;
  name: string;
  weight: number;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

const calculateGrade = (total: number) => {
  if (total >= 90) return { grade: "A", gp: 4.0 };
  if (total >= 80) return { grade: "B+", gp: 3.3 };
  if (total >= 70) return { grade: "B", gp: 3.0 };
  if (total >= 60) return { grade: "C", gp: 2.0 };
  if (total >= 50) return { grade: "D", gp: 1.0 };
  return { grade: "F", gp: 0 };
};

const calculateSemesterRemark = (gp: number, grade: string): string => {
  if (gp >= 3.5) return "Excellent";
  if (gp >= 3.0) return "Very Good";
  if (gp >= 2.5) return "Good";
  if (gp >= 2.0) return "Satisfactory";
  if (gp >= 1.0) return "Pass";
  return "Fail";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "excellent":
      return "bg-emerald-500/20 text-emerald-700 border-emerald-300/30";
    case "good":
      return "bg-blue-500/20 text-blue-700 border-blue-300/30";
    case "average":
      return "bg-amber-500/20 text-amber-700 border-amber-300/30";
    case "warning":
      return "bg-orange-500/20 text-orange-700 border-orange-300/30";
    case "failing":
      return "bg-red-500/20 text-red-700 border-red-300/30";
    default:
      return "bg-muted/60";
  }
};

const defaultCriteria: GradingCriterion[] = [
  { id: "assignment1", name: "Assignment 1", weight: 15 },
  { id: "assignment2", name: "Assignment 2", weight: 15 },
  { id: "midterm", name: "Midterm", weight: 25 },
  { id: "participation", name: "Participation", weight: 10 },
  { id: "finalExam", name: "Final Exam", weight: 35 },
];

const normalizeCriterionId = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || `criterion_${Date.now()}`;

const getStatusFromTotal = (total: number): StudentGrade["status"] => {
  if (total >= 90) return "excellent";
  if (total >= 80) return "good";
  if (total >= 60) return "average";
  if (total >= 50) return "warning";
  return "failing";
};

const calculateTotalFromCriteria = (
  scores: Record<string, number>,
  criteria: GradingCriterion[],
) =>
  criteria.reduce((sum, criterion) => {
    const score = Number(scores[criterion.id] ?? 0);
    return sum + score * (Number(criterion.weight || 0) / 100);
  }, 0);

export default function LecturerGradeBook() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [gradingCriteria, setGradingCriteria] =
    useState<GradingCriterion[]>(defaultCriteria);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "total" | "grade">("name");
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [changedGrades, setChangedGrades] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      console.log("Fetching courses for user:", user.uid);
      fetchLecturerCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudentsAndGrades();
    }
  }, [selectedCourse]);

  useEffect(() => {
    setStudents((prev) =>
      prev.map((student) => {
        const total = calculateTotalFromCriteria(
          student.componentScores,
          gradingCriteria,
        );
        const { grade, gp } = calculateGrade(total);
        return {
          ...student,
          total,
          grade,
          gp,
          status: getStatusFromTotal(total),
        };
      }),
    );
  }, [gradingCriteria]);

  const fetchCourseCriteria = async (courseId: string) => {
    const docRef = doc(db, "course_grading_criteria", courseId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      setGradingCriteria(defaultCriteria);
      return defaultCriteria;
    }

    const rawCriteria = (snap.data().criteria || []) as Array<
      Partial<GradingCriterion>
    >;
    const normalized = rawCriteria
      .map((criterion, idx) => ({
        id:
          (criterion.id && normalizeCriterionId(criterion.id)) ||
          `criterion_${idx + 1}`,
        name: (criterion.name || `Criterion ${idx + 1}`).toString(),
        weight: Number(criterion.weight || 0),
      }))
      .filter((criterion) => criterion.name.trim().length > 0);

    const resolved = normalized.length > 0 ? normalized : defaultCriteria;
    setGradingCriteria(resolved);
    return resolved;
  };

  const saveCourseCriteria = async () => {
    if (!selectedCourse) return;

    const trimmed = gradingCriteria
      .map((criterion) => ({
        id: normalizeCriterionId(criterion.id),
        name: criterion.name.trim(),
        weight: Number(criterion.weight || 0),
      }))
      .filter((criterion) => criterion.name.length > 0);

    if (trimmed.length === 0) {
      alert("Add at least one grading criterion.");
      return;
    }

    const totalWeight = trimmed.reduce((sum, item) => sum + item.weight, 0);
    if (Math.round(totalWeight * 100) / 100 !== 100) {
      alert("Criteria weights must add up to exactly 100%.");
      return;
    }

    try {
      setSavingCriteria(true);
      await setDoc(
        doc(db, "course_grading_criteria", selectedCourse),
        {
          course_id: selectedCourse,
          criteria: trimmed,
          updated_at: serverTimestamp(),
          updated_by: user?.uid || null,
        },
        { merge: true },
      );

      setGradingCriteria(trimmed);
      setStudents((prev) => {
        const next = prev.map((student) => {
          const nextScores: Record<string, number> = {};
          trimmed.forEach((criterion) => {
            nextScores[criterion.id] = Number(
              student.componentScores[criterion.id] ?? 0,
            );
          });

          const total = calculateTotalFromCriteria(nextScores, trimmed);
          const { grade, gp } = calculateGrade(total);
          return {
            ...student,
            componentScores: nextScores,
            total,
            grade,
            gp,
            status: getStatusFromTotal(total),
          };
        });

        setChangedGrades(new Set(next.map((student) => student.id)));
        return next;
      });

      alert(
        "Grading criteria saved. Remember to Save All grades to persist recalculated totals.",
      );
    } catch (error) {
      console.error("Error saving grading criteria:", error);
      alert("Failed to save grading criteria.");
    } finally {
      setSavingCriteria(false);
    }
  };

  const fetchLecturerCourses = async () => {
    try {
      if (!user?.uid) return;

      // Fetch lecturer's profile to get assigned_course_units
      const assignedRawCourses: any[] = [];
      try {
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          const assignedCourseUnits = profileData.assigned_course_units || [];

          if (assignedCourseUnits.length > 0) {
            // Query course_units collection where doc.id is in assignedCourseUnits
            // Firestore 'in' supports up to 30 values
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
                assignedRawCourses.push({
                  id: doc.id,
                  code:
                    courseData.code || courseData.course_unit_code || "Unknown",
                  title:
                    courseData.name ||
                    courseData.course_unit_name ||
                    "Unknown Course",
                  credits: courseData.credits || 3,
                  semester:
                    courseData.semester ||
                    courseData.term ||
                    courseData.semester_name ||
                    null,
                  academic_year: courseData.academic_year || null,
                });
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch lecturer profile or course units:", err);
      }

      // Set available courses to the assigned course units
      const coursesData: any[] = assignedRawCourses.map((raw) => ({
        id: raw.id || `temp-${Date.now()}`,
        code: raw.code || "Unknown",
        title: raw.title || "Unknown Course",
        credits: raw.credits || 3,
        semester: raw.semester || null,
        academic_year: raw.academic_year || null,
      }));
      setCourses(coursesData);

      // Check if a course is specified in URL parameters
      const courseParam = searchParams.get("course");
      if (
        courseParam &&
        coursesData.some((course) => course.id === courseParam)
      ) {
        setSelectedCourse(courseParam);
      } else if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0].id);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchStudentsAndGrades = async () => {
    if (!selectedCourse || !user) return;

    try {
      setLoading(true);
      const criteria = await fetchCourseCriteria(selectedCourse);

      // Fetch enrolled students
      const enrollQuery = query(
        collection(db, "enrollments"),
        where("course_id", "==", selectedCourse),
        where("status", "==", "approved"),
      );
      const enrollSnap = await getDocs(enrollQuery);

      if (enrollSnap.empty) {
        setStudents([]);
        return;
      }

      const studentIds = enrollSnap.docs.map((doc) => doc.data().student_id);

      // Fetch student profiles chunked
      const profilesMap: Record<string, any> = {};
      for (let i = 0; i < studentIds.length; i += 30) {
        const chunk = studentIds.slice(i, i + 30);
        const profilesQuery = query(
          collection(db, "profiles"),
          where("__name__", "in", chunk),
        );
        const profilesSnap = await getDocs(profilesQuery);
        profilesSnap.forEach((doc) => {
          profilesMap[doc.id] = doc.data();
        });
      }

      // Fetch existing grades for this course
      const gradesQuery = query(
        collection(db, "student_grades"),
        where("course_id", "==", selectedCourse),
      );
      const gradesSnap = await getDocs(gradesQuery);
      const gradesMap: Record<string, any> = {};
      gradesSnap.forEach((doc) => {
        gradesMap[doc.data().student_id] = { ...doc.data(), id: doc.id };
      });

      // Merge data
      const studentsWithGrades: StudentGrade[] = studentIds.map((sid) => {
        const profile = profilesMap[sid];
        const existingGrade = gradesMap[sid];

        const legacyScores: Record<string, number> = {
          assignment1: Number(existingGrade?.assignment1 || 0),
          assignment2: Number(existingGrade?.assignment2 || 0),
          midterm: Number(existingGrade?.midterm || 0),
          participation: Number(existingGrade?.participation || 0),
          finalExam: Number(existingGrade?.final_exam || 0),
        };

        const existingScores =
          (existingGrade?.component_scores as Record<string, number>) || {};
        const componentScores: Record<string, number> = {};
        criteria.forEach((criterion) => {
          componentScores[criterion.id] = Number(
            existingScores[criterion.id] ?? legacyScores[criterion.id] ?? 0,
          );
        });

        const total = calculateTotalFromCriteria(componentScores, criteria);

        const { grade, gp } = calculateGrade(total);

        return {
          id: sid,
          student_id: sid,
          name: profile?.full_name || "Unknown",
          email: profile?.email || "",
          componentScores,
          total,
          grade: existingGrade?.grade || grade,
          gp: existingGrade?.gp || gp,
          status: getStatusFromTotal(total),
          grade_id: existingGrade?.id,
        };
      });

      setStudents(studentsWithGrades);
    } catch (error) {
      console.error("Error fetching students and grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStudentGrade = (
    studentId: string,
    criterionId: string,
    value: number,
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updatedScores = {
          ...student.componentScores,
          [criterionId]: value,
        };

        const total = calculateTotalFromCriteria(
          updatedScores,
          gradingCriteria,
        );

        const { grade, gp } = calculateGrade(total);

        return {
          ...student,
          componentScores: updatedScores,
          total,
          grade,
          gp,
          status: getStatusFromTotal(total),
        };
      }),
    );

    // Mark this student's grade as changed
    setChangedGrades((prev) => new Set([...prev, studentId]));

    // Auto-save after 2 seconds of no changes
    setTimeout(() => {
      saveSingleStudentGrade(studentId);
    }, 2000);
  };

  const saveSingleStudentGrade = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || !selectedCourse || !user) return;

    try {
      // Prefer semester metadata from the selected course unit
      const courseData = courses.find((course) => course.id === selectedCourse);

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
      const currentYear = now.getFullYear();

      const semester =
        (courseData?.semester && String(courseData.semester)) || "Semester";
      const academicYear =
        (courseData?.academic_year && String(courseData.academic_year)) ||
        (currentMonth >= 9
          ? `${currentYear}-${currentYear + 1}`
          : `${currentYear - 1}-${currentYear}`);

      const gradeData = {
        student_id: student.student_id,
        course_id: selectedCourse,
        lecturer_id: user.uid,
        assignment1: student.componentScores.assignment1 ?? 0,
        assignment2: student.componentScores.assignment2 ?? 0,
        midterm: student.componentScores.midterm ?? 0,
        participation: student.componentScores.participation ?? 0,
        final_exam: student.componentScores.finalExam ?? 0,
        component_scores: student.componentScores,
        criteria_snapshot: gradingCriteria,
        total: student.total,
        grade: student.grade,
        gp: student.gp,
        semester,
        academic_year: academicYear,
        saved_at: new Date().toISOString(),
        updated_at: serverTimestamp(),
      };

      // Use sid_cid as the doc ID for upsert behavior
      const gradeRef = doc(
        db,
        "student_grades",
        `${student.student_id}_${selectedCourse}`,
      );
      await setDoc(gradeRef, gradeData, { merge: true });

      await sendGradeUpdateNotification(student);

      setChangedGrades((prev) => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });

      console.log(`Grade saved for student ${student.name}`);
    } catch (error) {
      console.error("Error saving grade:", error);
    }
  };

  const sendGradeUpdateNotification = async (student: StudentGrade) => {
    if (!selectedCourse || !user) return;

    try {
      const courseData = courses.find((c) => c.id === selectedCourse);
      const courseName = courseData?.title || courseData?.code || "Course";

      await addDoc(collection(db, "notifications"), {
        user_id: student.student_id,
        type: "grade_update",
        title: "Grade Updated",
        message: `Your grades for ${courseName} have been updated. Total: ${student.total.toFixed(
          1,
        )}%, Grade: ${student.grade}`,
        related_id: selectedCourse,
        is_read: false,
        created_at: serverTimestamp(),
      });
      console.log(`Notification sent to ${student.name}`);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const saveAllGrades = async () => {
    if (!selectedCourse || !user) return;

    try {
      setSaving(true);

      for (const studentId of Array.from(changedGrades)) {
        await saveSingleStudentGrade(studentId);
      }

      setChangedGrades(new Set());
      alert("Grades saved successfully!");
      fetchStudentsAndGrades();
    } catch (error) {
      console.error("Error saving grades:", error);
      alert("Failed to save some grades. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportGrades = () => {
    if (students.length === 0) {
      alert("No data to export");
      return;
    }

    // Create CSV content
    const headers = [
      "Name",
      "Email",
      ...gradingCriteria.map(
        (criterion) => `${criterion.name} (${criterion.weight}%)`,
      ),
      "Total",
      "Grade",
      "GP",
    ];

    const rows = students.map((student) => [
      student.name,
      student.email,
      ...gradingCriteria.map((criterion) =>
        Number(student.componentScores[criterion.id] ?? 0).toFixed(2),
      ),
      student.total.toFixed(2),
      student.grade,
      student.gp.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grades_${selectedCourse}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImportGrades = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          alert("CSV file is empty or invalid");
          setImporting(false);
          return;
        }

        // Skip header line
        const dataLines = lines.slice(1);
        const importedStudents: StudentGrade[] = [];

        dataLines.forEach((line, index) => {
          // Handle quoted values
          const values = line
            .match(/"[^"]*"|[^,]+/g)
            ?.map((v) => v.replace(/^"|"$/g, ""));

          const minColumns = gradingCriteria.length + 5;
          if (!values || values.length < minColumns) {
            console.warn(`Skipping invalid line ${index + 2}`);
            return;
          }

          const name = values[0];
          const email = values[1];
          const scoreValues = values.slice(2, 2 + gradingCriteria.length);
          const totalRaw = values[2 + gradingCriteria.length];
          const gradeRaw = values[3 + gradingCriteria.length];
          const gpRaw = values[4 + gradingCriteria.length];

          const componentScores: Record<string, number> = {};
          let invalidScore = false;
          gradingCriteria.forEach((criterion, criterionIdx) => {
            const parsed = parseFloat(scoreValues[criterionIdx]);
            if (Number.isNaN(parsed)) {
              invalidScore = true;
            }
            componentScores[criterion.id] = Number.isNaN(parsed) ? 0 : parsed;
          });

          const totalScore = parseFloat(totalRaw);
          const gradePoint = parseFloat(gpRaw);

          if (invalidScore || isNaN(totalScore) || isNaN(gradePoint)) {
            console.warn(`Skipping line ${index + 2} due to invalid numbers`);
            return;
          }

          const recomputedTotal = calculateTotalFromCriteria(
            componentScores,
            gradingCriteria,
          );
          const { grade, gp } = calculateGrade(recomputedTotal);

          importedStudents.push({
            id: `imported-${Date.now()}-${index}`,
            student_id: `imported-${Date.now()}-${index}`,
            name: name.trim(),
            email: email.trim(),
            componentScores,
            total: recomputedTotal,
            grade: gradeRaw?.trim() || grade,
            gp: Number.isNaN(gradePoint) ? gp : gradePoint,
            status: getStatusFromTotal(recomputedTotal),
          });
        });

        if (importedStudents.length === 0) {
          alert("No valid student records found in CSV file");
          setImporting(false);
          return;
        }

        // Match imported students with existing enrolled students by email
        const matchedStudents = importedStudents
          .map((imported) => {
            const existing = students.find(
              (s) => s.email.toLowerCase() === imported.email.toLowerCase(),
            );
            if (existing) {
              return {
                ...existing,
                componentScores: imported.componentScores,
                total: imported.total,
                grade: imported.grade,
                gp: imported.gp,
                status: imported.status,
              };
            }
            return null;
          })
          .filter(Boolean) as StudentGrade[];

        if (matchedStudents.length === 0) {
          alert(
            "No matching students found. Make sure the email addresses in CSV match enrolled students.",
          );
          setImporting(false);
          return;
        }

        // Update the students state with the imported data
        setStudents((prev) =>
          prev.map((student) => {
            const imported = matchedStudents.find((m) => m.id === student.id);
            return imported || student;
          }),
        );

        alert(
          `Successfully imported grades for ${matchedStudents.length} student(s). Click "Save All" to save to database.`,
        );
      } catch (error) {
        console.error("Error importing CSV:", error);
        alert("Failed to import CSV file. Please check the file format.");
      } finally {
        setImporting(false);
        // Reset file input
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      alert("Failed to read file");
      setImporting(false);
    };

    reader.readAsText(file);
  };

  const filteredStudents = students
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "total") return b.total - a.total;
      return b.gp - a.gp;
    });

  const stats = {
    classAverage:
      students.length > 0
        ? (
            students.reduce((acc, s) => acc + s.total, 0) / students.length
          ).toFixed(1)
        : "0.0",
    highestScore:
      students.length > 0 ? Math.max(...students.map((s) => s.total)) : 0,
    lowestScore:
      students.length > 0 ? Math.min(...students.map((s) => s.total)) : 0,
    excellentCount: students.filter((s) => s.status === "excellent").length,
    failingCount: students.filter((s) => s.status === "failing").length,
  };

  const criteriaWeightTotal = gradingCriteria.reduce(
    (sum, criterion) => sum + Number(criterion.weight || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">
      <main className="px-3 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 sm:space-y-4"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold truncate">
                  Grade Book
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  Track and manage all student grades
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 sm:px-4 py-2 rounded-lg border border-border/60 bg-muted/50 text-foreground focus:outline-none text-xs sm:text-sm flex-1 sm:flex-none min-w-0"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>

              <div className="flex gap-1 sm:gap-2 flex-wrap">
                <Button
                  onClick={saveAllGrades}
                  disabled={saving || students.length === 0}
                  className="bg-gradient-to-r from-orange-600 to-amber-500 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 flex-1 sm:flex-none"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {saving ? "Saving..." : "Save All"}
                  </span>
                  <span className="sm:hidden">{saving ? "..." : "Save"}</span>
                </Button>

                <Button
                  variant="outline"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 flex-1 sm:flex-none"
                  onClick={handleExportGrades}
                  disabled={students.length === 0}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>

                <Button
                  className="bg-gradient-to-r from-primary to-secondary gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 flex-1 sm:flex-none"
                  onClick={() =>
                    document.getElementById("grade-import")?.click()
                  }
                  disabled={importing}
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {importing ? "Importing..." : "Import"}
                  </span>
                </Button>

                <input
                  id="grade-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportGrades}
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-3 sm:pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Class Average
                    </p>
                    <p className="text-lg sm:text-2xl font-bold">
                      {stats.classAverage}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-emerald-500/10 border-emerald-300/30">
                <CardContent className="pt-3 sm:pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Highest</p>
                    <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                      {stats.highestScore}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-red-500/10 border-red-300/30">
                <CardContent className="pt-3 sm:pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Lowest</p>
                    <p className="text-lg sm:text-2xl font-bold text-red-600">
                      {stats.lowestScore}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden sm:block"
            >
              <Card className="bg-blue-500/10 border-blue-300/30">
                <CardContent className="pt-3 sm:pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Excellent</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">
                      {stats.excellentCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="hidden sm:block"
            >
              <Card className="bg-orange-500/10 border-orange-300/30">
                <CardContent className="pt-3 sm:pt-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Failing</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">
                      {stats.failingCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs sm:text-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 sm:px-4 py-2 rounded-lg border border-border/60 bg-muted/50 text-foreground focus:outline-none text-xs sm:text-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="total">Sort by Score</option>
              <option value="grade">Sort by Grade</option>
            </select>
          </div>

          {/* Grading Criteria */}
          <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">
                  Grading Criteria for This Course
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      Math.round(criteriaWeightTotal * 100) / 100 === 100
                        ? "bg-emerald-500/20 text-emerald-700"
                        : "bg-amber-500/20 text-amber-700"
                    }
                  >
                    Total Weight: {criteriaWeightTotal.toFixed(1)}%
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setGradingCriteria((prev) => [
                        ...prev,
                        {
                          id: `criterion_${Date.now()}`,
                          name: `Criterion ${prev.length + 1}`,
                          weight: 0,
                        },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveCourseCriteria}
                    disabled={savingCriteria || !selectedCourse}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {savingCriteria ? "Saving..." : "Save Criteria"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {gradingCriteria.map((criterion, idx) => (
                <div
                  key={criterion.id}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-7 sm:col-span-8">
                    <Input
                      value={criterion.name}
                      onChange={(e) =>
                        setGradingCriteria((prev) =>
                          prev.map((item, itemIdx) =>
                            itemIdx === idx
                              ? {
                                  ...item,
                                  name: e.target.value,
                                  id:
                                    item.id.startsWith("criterion_") &&
                                    e.target.value.trim().length > 0
                                      ? normalizeCriterionId(e.target.value)
                                      : item.id,
                                }
                              : item,
                          ),
                        )
                      }
                      placeholder="Criterion name (e.g. Test 1)"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={criterion.weight}
                      onChange={(e) =>
                        setGradingCriteria((prev) =>
                          prev.map((item, itemIdx) =>
                            itemIdx === idx
                              ? {
                                  ...item,
                                  weight: Math.max(
                                    0,
                                    Math.min(100, Number(e.target.value || 0)),
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setGradingCriteria((prev) =>
                          prev.filter((_, itemIdx) => itemIdx !== idx),
                        )
                      }
                      disabled={gradingCriteria.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Define how each component contributes to the final 100%.
                Example: Test 1 = 20%, Midterm = 30%, Final = 50%.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grade Table */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">
              {filteredStudents.length} Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-max">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">
                      Student
                    </th>
                    {gradingCriteria.map((criterion) => (
                      <th
                        key={criterion.id}
                        className="px-1 sm:px-3 py-2 sm:py-3 text-center font-semibold whitespace-nowrap"
                      >
                        {criterion.name} ({criterion.weight}%)
                      </th>
                    ))}
                    <th className="px-1 sm:px-3 py-2 sm:py-3 text-center font-semibold whitespace-nowrap">
                      Total
                    </th>
                    <th className="px-1 sm:px-3 py-2 sm:py-3 text-center font-semibold whitespace-nowrap">
                      Grade
                    </th>
                    <th className="px-1 sm:px-3 py-2 sm:py-3 text-center font-semibold whitespace-nowrap">
                      GP
                    </th>
                    <th className="hidden sm:table-cell px-3 py-3 text-center font-semibold whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={gradingCriteria.length + 5}
                        className="px-4 py-6 sm:py-8 text-center text-muted-foreground"
                      >
                        Loading students and grades...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={gradingCriteria.length + 5}
                        className="px-4 py-6 sm:py-8 text-center text-muted-foreground"
                      >
                        {selectedCourse
                          ? "No enrolled students found"
                          : "Please select a course"}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, i) => (
                      <motion.tr
                        key={student.id}
                        variants={rise}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-foreground text-xs sm:text-sm">
                          <div className="flex flex-col">
                            <span className="truncate">{student.name}</span>
                            <span className="text-xs text-muted-foreground hidden sm:inline truncate">
                              {student.email}
                            </span>
                          </div>
                        </td>
                        {gradingCriteria.map((criterion) => (
                          <td
                            key={`${student.id}-${criterion.id}`}
                            className="px-1 sm:px-3 py-2 sm:py-3 text-center"
                          >
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={student.componentScores[criterion.id] ?? 0}
                              onChange={(e) =>
                                updateStudentGrade(
                                  student.id,
                                  criterion.id,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-16 sm:w-20 px-1 sm:px-2 py-1 text-center text-xs sm:text-sm bg-background border border-border/60 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </td>
                        ))}
                        <td className="px-1 sm:px-3 py-2 sm:py-3 text-center font-bold text-primary text-xs sm:text-sm">
                          {student.total.toFixed(1)}
                        </td>
                        <td className="px-1 sm:px-3 py-2 sm:py-3 text-center">
                          <Badge className="bg-primary/20 text-primary text-xs">
                            {student.grade}
                          </Badge>
                        </td>
                        <td className="px-1 sm:px-3 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm">
                          {student.gp.toFixed(2)}
                        </td>
                        <td className="hidden sm:table-cell px-3 py-3 text-center">
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
