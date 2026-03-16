import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Trash2,
  GraduationCap,
  Search,
  Filter,
  X,
  AlertCircle,
} from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { useToast } from "@/components/ui/use-toast";

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
}

interface LecturerCourse {
  id: string;
  course_id: string;
  course: Course;
  semester: string;
  academic_year: string;
}

export default function LecturerCourseSelection() {
  const { user } = useAuth(); // Firebase user
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturerCourses, setLecturerCourses] = useState<LecturerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCredits, setFilterCredits] = useState<string | null>(null);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);

  const currentAcademicYear = useMemo(
    () => new Date().getFullYear().toString(),
    [],
  );
  const currentSemester = useMemo(() => "1", []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setCourses([]);
      setLecturerCourses([]);
      setSelectedCourses([]);
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!user?.uid) {
        console.warn("No user ID available");
        return;
      }

      // Fetch lecturer's profile to get assigned_course_units
      const assignedRawCourses: Partial<Course>[] = [];
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
                });
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch lecturer profile or course units:", err);
      }

      // Set available courses to the assigned course units
      const coursesData: Course[] = assignedRawCourses.map((raw) => ({
        id: raw.id || `temp-${Date.now()}`,
        code: raw.code || "Unknown",
        title: raw.title || "Unknown Course",
        credits: raw.credits || 3,
      })) as Course[];
      setCourses(coursesData);

      // Auto-assign courses based on assigned course units
      const autoAssignedCourses: Course[] = assignedRawCourses.map((raw) => ({
        id: raw.id || `temp-${Date.now()}`,
        code: raw.code || "Unknown",
        title: raw.title || "Unknown Course",
        credits: raw.credits || 3,
      })) as Course[];

      // Load lecturer's CURRENT selected courses for this semester from lecturer_courses
      const lecturerCoursesQuery = query(
        collection(db, "lecturer_courses"),
        where("lecturer_id", "==", user.uid),
        where("academic_year", "==", currentAcademicYear),
        where("semester", "==", currentSemester),
      );
      const lecturerCoursesSnapshot = await getDocs(lecturerCoursesQuery);

      const existingCourseIds = new Set<string>();

      const lecturerCoursesData: LecturerCourse[] =
        lecturerCoursesSnapshot.docs.map((doc) => {
          const data = doc.data();
          existingCourseIds.add(data.course_id);

          let course = coursesData.find((c) => c.id === data.course_id);
          if (!course) {
            // Check if it's one of our auto-assigned fallbacks
            course = autoAssignedCourses.find((c) => c.id === data.course_id);
          }

          if (!course) {
            course = {
              id: data.course_id,
              code: "Unknown",
              title: "Course",
              credits: 0,
            };
          }

          return {
            id: doc.id,
            course_id: data.course_id,
            course,
            semester: data.semester,
            academic_year: data.academic_year,
          };
        });

      // Save any newly assigned courses from the registrar that aren't yet in lecturer_courses
      const coursesToAdd = autoAssignedCourses.filter(
        (c) => !existingCourseIds.has(c.id),
      );

      for (const course of coursesToAdd) {
        try {
          const docRef = await addDoc(collection(db, "lecturer_courses"), {
            lecturer_id: user.uid,
            course_id: course.id,
            semester: currentSemester,
            academic_year: currentAcademicYear,
          });

          lecturerCoursesData.unshift({
            id: docRef.id,
            course_id: course.id,
            course,
            semester: currentSemester,
            academic_year: currentAcademicYear,
          });
        } catch (addErr) {
          console.error(
            "Failed to auto-assign course to lecturer_courses",
            addErr,
          );
        }
      }

      setLecturerCourses(lecturerCoursesData);
      setSelectedCourses(lecturerCoursesData.map((lc) => lc.course_id));
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Could not load courses",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search and credits
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      (course.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterCredits === null || course.credits?.toString() === filterCredits;
    return matchesSearch && matchesFilter;
  });

  // Get unique credit values for filter
  const creditOptions = Array.from(
    new Set(courses.map((c) => c.credits)),
  ).filter((c): c is number => c !== undefined && c !== null);

  const rise = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05 },
    }),
  };

  const handleToggleCourse = async (courseId: string) => {
    if (!user || savingCourseId) return;
    setSavingCourseId(courseId);
    const course = courses.find((c) => c.id === courseId);
    const exists = selectedCourses.includes(courseId);
    try {
      if (exists) {
        // Find the lecturer_course document to delete
        const lecturerCourse = lecturerCourses.find(
          (lc) =>
            lc.course_id === courseId &&
            lc.academic_year === currentAcademicYear &&
            lc.semester === currentSemester,
        );
        if (lecturerCourse) {
          await deleteDoc(doc(db, "lecturer_courses", lecturerCourse.id));
        }
        setSelectedCourses((prev) => prev.filter((id) => id !== courseId));
        setLecturerCourses((prev) =>
          prev.filter((lc) => lc.course_id !== courseId),
        );
        toast({
          title: "Course removed",
          description: "It is no longer in your teaching list.",
        });
      } else {
        if (!course) {
          throw new Error("Course details missing");
        }
        const docRef = await addDoc(collection(db, "lecturer_courses"), {
          lecturer_id: user.uid,
          course_id: courseId,
          semester: currentSemester,
          academic_year: currentAcademicYear,
        });
        const newCourse: LecturerCourse = {
          id: docRef.id,
          course_id: courseId,
          course,
          semester: currentSemester,
          academic_year: currentAcademicYear,
        };
        setSelectedCourses((prev) => [...prev, courseId]);
        setLecturerCourses((prev) => [newCourse, ...prev]);
        toast({
          title: "Course added",
          description: "You can now create assignments for it.",
        });
      }
    } catch (error) {
      console.error("Error updating lecturer courses:", error);
      toast({
        title: exists ? "Remove failed" : "Add failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingCourseId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">
      <LecturerHeader />

      <main className="px-4 pb-20 sm:px-6 lg:px-8 pt-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    My Courses
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your teaching assignments
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {selectedCourses.length}
                </p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Selected Courses Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-4"
            >
              <Card className="border-border/60 bg-gradient-to-br from-card/70 to-card/50 backdrop-blur-lg sticky top-24 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Assigned Courses
                  </CardTitle>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge className="bg-primary/20 text-primary border-0">
                      {selectedCourses.length} courses
                    </Badge>
                    <Badge variant="outline">This semester</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  {loading ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      Loading your courses...
                    </div>
                  ) : selectedCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Select courses to get started
                      </p>
                    </div>
                  ) : (
                    lecturerCourses.map((lc, i) => (
                      <motion.div
                        key={lc.id}
                        variants={rise}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        className="group p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/0 border border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {lc.course.code}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {lc.course.title}
                            </p>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {lc.course.credits} units
                            </Badge>
                          </div>
                          <button
                            onClick={() => handleToggleCourse(lc.course.id)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
                            title="Remove course"
                            disabled={savingCourseId === lc.course.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Available Courses Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card className="border-border/60 bg-card/70 backdrop-blur-lg shadow-lg">
                <CardHeader className="border-b border-border/60">
                  <div className="space-y-4">
                    <div>
                      <CardTitle className="text-lg">
                        Available Courses
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {filteredCourses.length} of {courses.length} courses
                      </p>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="space-y-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by code or title..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-muted/50 border-border/60 focus:bg-muted"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>

                      {/* Filter by Credits */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <button
                          onClick={() => setFilterCredits(null)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            filterCredits === null
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/60 text-foreground hover:bg-muted"
                          }`}
                        >
                          All Units
                        </button>
                        {creditOptions
                          .sort((a, b) => a - b)
                          .map((credits) => (
                            <button
                              key={credits}
                              onClick={() =>
                                setFilterCredits(
                                  filterCredits === credits.toString()
                                    ? null
                                    : credits.toString(),
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                filterCredits === credits.toString()
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/60 text-foreground hover:bg-muted"
                              }`}
                            >
                              {credits}u
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Fetching available courses...
                      </div>
                    ) : filteredCourses.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          No courses found
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setFilterCredits(null);
                          }}
                          className="text-xs text-primary hover:underline mt-2"
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      <motion.div layout className="space-y-2">
                        {filteredCourses.map((course, i) => (
                          <motion.button
                            key={course.id}
                            variants={rise}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            whileHover={{ scale: 1.01, y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleToggleCourse(course.id)}
                            disabled={!!savingCourseId}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
                              selectedCourses.includes(course.id)
                                ? "border-primary bg-gradient-to-r from-primary/15 to-primary/5 shadow-md"
                                : "border-border/60 bg-gradient-to-r from-muted/40 to-muted/20 hover:border-primary/50 hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40"
                            } ${
                              savingCourseId === course.id ? "opacity-70" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                  <p className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                                    {course.code}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {course.credits} units
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {course.title}
                                </p>
                              </div>
                              <Badge
                                className={
                                  selectedCourses.includes(course.id)
                                    ? "bg-primary text-primary-foreground whitespace-nowrap"
                                    : "bg-muted text-foreground whitespace-nowrap border-border/60"
                                }
                              >
                                {selectedCourses.includes(course.id)
                                  ? savingCourseId === course.id
                                    ? "Saving..."
                                    : "✓ Added"
                                  : savingCourseId === course.id
                                    ? "Saving..."
                                    : "+ Add"}
                              </Badge>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
