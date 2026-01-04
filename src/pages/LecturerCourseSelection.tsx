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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
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
    []
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

      // Load all available courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, code, title, credits")
        .order("code");

      if (coursesError) {
        console.error("Error loading courses:", coursesError);
        toast({
          title: "Error loading courses",
          description: coursesError.message,
          variant: "destructive",
        });
        throw coursesError;
      }

      console.log("Loaded courses:", coursesData);
      setCourses(coursesData || []);

      // Load lecturer's selected courses for this semester
      if (!user?.id) {
        console.warn("No user ID available");
        return;
      }

      const { data: lecturerCoursesData, error: lecturerCoursesError } =
        await supabase
          .from("lecturer_courses")
          .select(
            `id, course_id, semester, academic_year, courses ( id, code, title, credits )`
          )
          .eq("lecturer_id", user.id)
          .eq("academic_year", currentAcademicYear)
          .eq("semester", currentSemester);

      if (lecturerCoursesError) {
        console.error("Error loading lecturer courses:", lecturerCoursesError);
        // Don't throw - this table might be empty which is OK
      }

      console.log("Loaded lecturer courses:", lecturerCoursesData);

      const mappedCourses: LecturerCourse[] = (lecturerCoursesData || []).map(
        (row) => {
          const fallbackCourse =
            row.courses ||
            coursesData?.find((c) => c.id === row.course_id) ||
            ({
              id: row.course_id,
              code: "Unknown",
              title: "Course",
              credits: 0,
            } as Course);

          return {
            id: row.id,
            course_id: row.course_id,
            course: fallbackCourse,
            semester: row.semester,
            academic_year: row.academic_year,
          };
        }
      );

      setLecturerCourses(mappedCourses);
      setSelectedCourses(mappedCourses.map((lc) => lc.course_id));
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
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterCredits === null || course.credits.toString() === filterCredits;
    return matchesSearch && matchesFilter;
  });

  // Get unique credit values for filter
  const creditOptions = Array.from(new Set(courses.map((c) => c.credits)));

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
        await supabase
          .from("lecturer_courses")
          .delete()
          .eq("lecturer_id", user.id)
          .eq("course_id", courseId)
          .eq("academic_year", currentAcademicYear)
          .eq("semester", currentSemester);

        setSelectedCourses((prev) => prev.filter((id) => id !== courseId));
        setLecturerCourses((prev) =>
          prev.filter((lc) => lc.course_id !== courseId)
        );
        toast({
          title: "Course removed",
          description: "It is no longer in your teaching list.",
        });
      } else {
        if (!course) {
          throw new Error("Course details missing");
        }

        const { data, error } = await supabase
          .from("lecturer_courses")
          .insert({
            lecturer_id: user.id,
            course_id: courseId,
            semester: currentSemester,
            academic_year: currentAcademicYear,
          })
          .select(
            `id, course_id, semester, academic_year, courses ( id, code, title, credits )`
          )
          .single();

        if (error) throw error;

        const newCourse: LecturerCourse = {
          id: data.id,
          course_id: data.course_id,
          course: data.courses || course,
          semester: data.semester,
          academic_year: data.academic_year,
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
                                    : credits.toString()
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
