import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Search,
} from "lucide-react";

import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";

interface StudentNote {
  id: string;
  lecturer_id: string;
  lecturer_name: string;
  course_id: string;
  course_title: string;
  course_code: string;
  topic: string;
  description: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at?: any;
}

interface EnrolledCourse {
  id: string;
  title: string;
  code: string;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

const formatDate = (value: any): string => {
  if (!value) return "Unknown date";
  if (value?.toDate) return value.toDate().toLocaleDateString();
  return new Date(value).toLocaleDateString();
};

export default function StudentNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const loadNotes = async () => {
      try {
        setLoading(true);

        const enrollmentsQuery = query(
          collection(db, "enrollments"),
          where("student_id", "==", user.uid),
          where("status", "in", ["approved", "pending"]),
        );
        const enrollmentsSnap = await getDocs(enrollmentsQuery);

        const courseIds = Array.from(
          new Set(
            enrollmentsSnap.docs
              .map((enrollmentDoc) => enrollmentDoc.data().course_id)
              .filter(Boolean),
          ),
        );

        if (courseIds.length === 0) {
          setEnrolledCourses([]);
          setNotes([]);
          return;
        }

        const courseMap = new Map<string, EnrolledCourse>();
        for (let i = 0; i < courseIds.length; i += 10) {
          const chunk = courseIds.slice(i, i + 10);
          const courseUnitsQuery = query(
            collection(db, "course_units"),
            where("__name__", "in", chunk),
          );
          const courseUnitsSnap = await getDocs(courseUnitsQuery);
          courseUnitsSnap.docs.forEach((courseDoc) => {
            const courseData = courseDoc.data();
            courseMap.set(courseDoc.id, {
              id: courseDoc.id,
              title:
                courseData.name ||
                courseData.course_unit_name ||
                "Unknown Course",
              code: courseData.code || courseData.course_unit_code || "Unknown",
            });
          });
        }

        const courses = Array.from(courseMap.values()).sort((a, b) =>
          `${a.code} ${a.title}`.localeCompare(`${b.code} ${b.title}`),
        );
        setEnrolledCourses(courses);

        const rawNotes: Array<Omit<StudentNote, "lecturer_name">> = [];
        for (let i = 0; i < courseIds.length; i += 10) {
          const chunk = courseIds.slice(i, i + 10);
          const notesQuery = query(
            collection(db, "lecture_notes"),
            where("course_id", "in", chunk),
          );
          const notesSnap = await getDocs(notesQuery);
          notesSnap.docs.forEach((noteDoc) => {
            rawNotes.push({
              id: noteDoc.id,
              ...(noteDoc.data() as Omit<StudentNote, "id" | "lecturer_name">),
            });
          });
        }

        const lecturerIds = Array.from(
          new Set(rawNotes.map((note) => note.lecturer_id).filter(Boolean)),
        );
        const lecturerMap = new Map<string, string>();

        for (let i = 0; i < lecturerIds.length; i += 10) {
          const chunk = lecturerIds.slice(i, i + 10);
          const lecturersQuery = query(
            collection(db, "profiles"),
            where("__name__", "in", chunk),
          );
          const lecturersSnap = await getDocs(lecturersQuery);
          lecturersSnap.forEach((lecturerDoc) => {
            lecturerMap.set(
              lecturerDoc.id,
              lecturerDoc.data().full_name || "Lecturer",
            );
          });
        }

        const mappedNotes: StudentNote[] = rawNotes
          .map((note) => ({
            ...note,
            lecturer_name: lecturerMap.get(note.lecturer_id) || "Lecturer",
          }))
          .sort((a, b) => {
            const aTime = a.created_at?.toDate
              ? a.created_at.toDate().getTime()
              : new Date(a.created_at || 0).getTime();
            const bTime = b.created_at?.toDate
              ? b.created_at.toDate().getTime()
              : new Date(b.created_at || 0).getTime();
            return bTime - aTime;
          });

        setNotes(mappedNotes);
      } catch (error) {
        console.error("Error loading lecture notes:", error);
        toast({
          title: "Could not load notes",
          description: "There was a problem fetching lecture notes.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadNotes();
  }, [user, toast]);

  useEffect(() => {
    if (selectedCourseId === "all") return;
    const exists = enrolledCourses.some(
      (course) => course.id === selectedCourseId,
    );
    if (!exists) {
      setSelectedCourseId("all");
    }
  }, [enrolledCourses, selectedCourseId]);

  const filteredNotes = useMemo(() => {
    const byCourse =
      selectedCourseId === "all"
        ? notes
        : notes.filter((note) => note.course_id === selectedCourseId);

    const value = search.trim().toLowerCase();
    if (!value) return byCourse;

    return byCourse.filter((note) => {
      return (
        note.topic?.toLowerCase().includes(value) ||
        note.description?.toLowerCase().includes(value) ||
        note.course_title?.toLowerCase().includes(value) ||
        note.course_code?.toLowerCase().includes(value) ||
        note.file_name?.toLowerCase().includes(value) ||
        note.lecturer_name?.toLowerCase().includes(value)
      );
    });
  }, [notes, search, selectedCourseId]);

  const notesCourseCount = useMemo(
    () => new Set(notes.map((note) => note.course_id)).size,
    [notes],
  );

  const handleDownload = async (note: StudentNote) => {
    try {
      setDownloadingId(note.id);
      const response = await fetch(note.file_url);
      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = note.file_name || "lecture-note";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading note:", error);
      toast({
        title: "Download failed",
        description: "Unable to download this file right now.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">
      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Lecture Notes</h1>
              <p className="text-sm text-muted-foreground">
                Browse notes uploaded by your lecturers for each course topic.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Notes</p>
              <p className="text-2xl font-bold mt-1">{notes.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Courses With Notes
              </p>
              <p className="text-2xl font-bold mt-1">{notesCourseCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Course</p>
              <div className="mt-2">
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All enrolled courses</option>
                  {enrolledCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/80">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Search</p>
              <div className="relative mt-2">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Topic, course, lecturer"
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Available Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                <p className="font-medium">No lecture notes found</p>
                <p className="text-sm mt-1">
                  Notes will appear here when your lecturer uploads them.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredNotes.map((note, index) => {
                  const isImage = note.file_type?.startsWith("image/");
                  const uploadedAt = formatDate(note.created_at);

                  return (
                    <motion.div
                      key={note.id}
                      variants={rise}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                    >
                      <Card className="h-full border-border/60 bg-background/80">
                        <CardContent className="p-5 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-semibold leading-tight">
                                {note.topic || "Untitled topic"}
                              </h3>
                              <Badge variant="outline">
                                {note.course_code}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {note.course_title}
                            </p>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {note.description || "No description provided."}
                          </p>

                          {isImage ? (
                            <div className="rounded-lg border border-border/60 overflow-hidden bg-muted/20">
                              <img
                                src={note.file_url}
                                alt={note.file_name || note.topic}
                                className="w-full h-40 object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="rounded-lg border border-border/60 p-3 bg-muted/20 flex items-center gap-2 text-sm text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                              <span>Document preview not available</span>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>
                              <span className="font-medium text-foreground">
                                Lecturer:
                              </span>{" "}
                              {note.lecturer_name}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                Uploaded:
                              </span>{" "}
                              {uploadedAt}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                File:
                              </span>{" "}
                              {note.file_name || "lecture-note"} (
                              {formatFileSize(note.file_size)})
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={() =>
                                window.open(note.file_url, "_blank")
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={() => handleDownload(note)}
                              disabled={downloadingId === note.id}
                            >
                              {downloadingId === note.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <StudentBottomNav />
    </div>
  );
}
