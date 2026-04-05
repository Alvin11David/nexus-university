import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
  BookOpen,
  Plus,
  FileUp,
} from "lucide-react";

import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { db, storage } from "@/integrations/firebase/client";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

interface CourseOption {
  id: string;
  title: string;
  code: string;
}

interface LecturerNote {
  id: string;
  course_id: string;
  course_title: string;
  course_code: string;
  topic: string;
  description: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  created_at?: any;
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

export default function LecturerNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [notes, setNotes] = useState<LecturerNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [noteFile, setNoteFile] = useState<File | null>(null);

  const selectedCourseInfo = useMemo(
    () => courses.find((course) => course.id === selectedCourse),
    [courses, selectedCourse],
  );

  useEffect(() => {
    if (user) {
      void loadCourses();
      void loadNotes();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user?.uid) return;

    try {
      const profileDoc = await getDoc(doc(db, "profiles", user.uid));
      if (!profileDoc.exists()) {
        setCourses([]);
        return;
      }

      const profileData = profileDoc.data();
      const assignedCourseUnits = profileData.assigned_course_units || [];
      const loadedCourses: CourseOption[] = [];

      if (assignedCourseUnits.length > 0) {
        for (let i = 0; i < assignedCourseUnits.length; i += 30) {
          const chunk = assignedCourseUnits.slice(i, i + 30);
          const courseUnitsQuery = query(
            collection(db, "course_units"),
            where("__name__", "in", chunk),
          );
          const courseUnitsSnapshot = await getDocs(courseUnitsQuery);
          courseUnitsSnapshot.docs.forEach((courseDoc) => {
            const courseData = courseDoc.data();
            loadedCourses.push({
              id: courseDoc.id,
              title:
                courseData.name ||
                courseData.course_unit_name ||
                "Unknown Course",
              code:
                courseData.code || courseData.course_unit_code || "Unknown",
            });
          });
        }
      }

      setCourses(loadedCourses);
      setSelectedCourse((current) => current || loadedCourses[0]?.id || "");
    } catch (error) {
      console.error("Error loading lecturer courses:", error);
      toast({
        title: "Could not load courses",
        description: "Unable to fetch the courses assigned to this lecturer.",
        variant: "destructive",
      });
    }
  };

  const loadNotes = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const notesQuery = query(
        collection(db, "lecture_notes"),
        where("lecturer_id", "==", user.uid),
        orderBy("created_at", "desc"),
      );
      const snapshot = await getDocs(notesQuery);
      const loadedNotes = snapshot.docs.map((noteDoc) => ({
        id: noteDoc.id,
        ...(noteDoc.data() as Omit<LecturerNote, "id">),
      }));
      setNotes(loadedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast({
        title: "Could not load notes",
        description: "Unable to fetch uploaded lecture notes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!user?.uid) return;

    if (!selectedCourse) {
      toast({
        title: "Select a course",
        description: "Choose the course this note belongs to.",
        variant: "destructive",
      });
      return;
    }

    if (!topic.trim()) {
      toast({
        title: "Add a topic",
        description: "Enter the topic for these notes.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Add a description",
        description: "Describe the notes before uploading.",
        variant: "destructive",
      });
      return;
    }

    if (!noteFile) {
      toast({
        title: "Choose a file",
        description: "Upload the note file first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const course = courses.find((item) => item.id === selectedCourse);
      const safeFileName = noteFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const storagePath = `lecture-notes/${user.uid}/${selectedCourse}/${Date.now()}-${safeFileName}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, noteFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "lecture_notes"), {
        lecturer_id: user.uid,
        course_id: selectedCourse,
        course_title: course?.title || "Unknown Course",
        course_code: course?.code || "Unknown",
        topic: topic.trim(),
        description: description.trim(),
        file_name: noteFile.name,
        file_url: downloadUrl,
        file_size: noteFile.size,
        file_type: noteFile.type || "application/octet-stream",
        storage_path: storagePath,
        created_at: serverTimestamp(),
      });

      toast({
        title: "Notes uploaded",
        description: "The lecture notes have been saved successfully.",
      });

      setTopic("");
      setDescription("");
      setNoteFile(null);
      await loadNotes();
    } catch (error) {
      console.error("Error uploading notes:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading the notes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note: LecturerNote) => {
    try {
      const confirmed = window.confirm(
        `Delete notes for ${note.topic}? This will remove the file and its record.`,
      );
      if (!confirmed) return;

      if (note.storage_path) {
        await deleteObject(ref(storage, note.storage_path));
      }

      await deleteDoc(doc(db, "lecture_notes", note.id));
      setNotes((prev) => prev.filter((item) => item.id !== note.id));
      toast({
        title: "Notes deleted",
        description: "The note file and record were removed.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Delete failed",
        description: "Unable to remove the note.",
        variant: "destructive",
      });
    }
  };

  const filteredNotes = notes.filter((note) => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return true;

    return (
      note.topic.toLowerCase().includes(search) ||
      note.description.toLowerCase().includes(search) ||
      note.course_title.toLowerCase().includes(search) ||
      note.course_code.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5 pb-28">
      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FileUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Lecture Notes</h1>
              <p className="text-sm text-muted-foreground">
                Upload notes and descriptions for each topic you teach.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border/60 bg-card/80 backdrop-blur-lg shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload New Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <select
                    id="course"
                    value={selectedCourse}
                    onChange={(event) => setSelectedCourse(event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {courses.length === 0 ? (
                      <option value="">No assigned courses found</option>
                    ) : (
                      courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. Introduction to Databases"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add a brief description of the notes, key points, or learning outcomes."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Notes File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                    onChange={(event) => setNoteFile(event.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Accepted files: PDF, Word, PowerPoint, TXT, or ZIP. Max 25MB.
                  </p>
                </div>

                {noteFile && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{noteFile.name}</p>
                        <p className="text-muted-foreground">
                          {formatFileSize(noteFile.size)}
                        </p>
                      </div>
                      <Badge variant="secondary">Ready to upload</Badge>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={saving || courses.length === 0}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Save Notes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-border/60 bg-card/80 backdrop-blur-lg shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Notes Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-muted-foreground">Total Notes</p>
                  <p className="text-2xl font-bold">{notes.length}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-muted-foreground">Assigned Courses</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3 col-span-2">
                  <p className="text-muted-foreground">Current Course</p>
                  <p className="font-semibold">
                    {selectedCourseInfo
                      ? `${selectedCourseInfo.code} - ${selectedCourseInfo.title}`
                      : "No course selected"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 backdrop-blur-lg shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Search Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by topic, course, or description"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Card className="border-border/60 bg-card/80 backdrop-blur-lg shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Uploaded Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                <p className="font-medium">No notes uploaded yet</p>
                <p className="text-sm mt-1">
                  Upload notes for each topic to keep everything organized.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    variants={rise}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                  >
                    <Card className="h-full border-border/60 bg-background/80">
                      <CardContent className="space-y-4 p-5">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {note.course_code}
                              </Badge>
                              <h3 className="text-lg font-semibold leading-tight">
                                {note.topic}
                              </h3>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(note)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {note.course_title}
                          </p>
                        </div>

                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {note.description}
                        </p>

                        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm space-y-1">
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">File</span>
                            <span className="font-medium text-right break-all">
                              {note.file_name}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Size</span>
                            <span>{formatFileSize(note.file_size)}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Type</span>
                            <span>{note.file_type || "Unknown"}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" className="gap-2 flex-1">
                            <a href={note.file_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </a>
                          </Button>
                          <Button asChild size="sm" variant="outline" className="gap-2 flex-1">
                            <a href={note.file_url} download={note.file_name}>
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
