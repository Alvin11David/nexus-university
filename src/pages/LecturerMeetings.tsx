import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Plus,
  Link as LinkIcon,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Loader2,
  BookOpen,
} from "lucide-react";

import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/integrations/firebase/client";
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
} from "firebase/firestore";

interface OnlineMeeting {
  id: string;
  course_id: string;
  course_title: string;
  course_code: string;
  meeting_type: "googlemeet" | "zoom" | "other";
  meeting_link: string;
  description: string;
  created_at?: any;
}

interface CourseOption {
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

const getMeetingTypeIcon = (type: string) => {
  if (type === "googlemeet") return "🔵";
  if (type === "zoom") return "🔷";
  return "🔗";
};

const getMeetingTypeLabel = (type: string) => {
  if (type === "googlemeet") return "Google Meet";
  if (type === "zoom") return "Zoom";
  return "Other";
};

export default function LecturerMeetings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [meetings, setMeetings] = useState<OnlineMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [meetingType, setMeetingType] = useState<"googlemeet" | "zoom">(
    "googlemeet",
  );
  const [meetingLink, setMeetingLink] = useState("");
  const [description, setDescription] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      void loadCourses();
      void loadMeetings();
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
              code: courseData.code || courseData.course_unit_code || "Unknown",
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
        description: "Unable to fetch your assigned courses.",
        variant: "destructive",
      });
    }
  };

  const loadMeetings = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const meetingsQuery = query(
        collection(db, "lecturer_meetings"),
        where("lecturer_id", "==", user.uid),
      );
      const snapshot = await getDocs(meetingsQuery);
      const loadedMeetings = snapshot.docs.map((meetingDoc) => ({
        id: meetingDoc.id,
        ...(meetingDoc.data() as Omit<OnlineMeeting, "id">),
      }));
      setMeetings(loadedMeetings);
    } catch (error) {
      console.error("Error loading meetings:", error);
      toast({
        title: "Could not load meetings",
        description: "Unable to fetch your meeting links.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeeting = async () => {
    if (!user?.uid) return;

    if (!selectedCourse) {
      toast({
        title: "Select a course",
        description: "Choose a course for this meeting link.",
        variant: "destructive",
      });
      return;
    }

    if (!meetingLink.trim()) {
      toast({
        title: "Add a meeting link",
        description: "Paste the Google Meet or Zoom link.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const course = courses.find((item) => item.id === selectedCourse);

      await addDoc(collection(db, "lecturer_meetings"), {
        lecturer_id: user.uid,
        course_id: selectedCourse,
        course_title: course?.title || "Unknown Course",
        course_code: course?.code || "Unknown",
        meeting_type: meetingType,
        meeting_link: meetingLink.trim(),
        description: description.trim(),
        created_at: serverTimestamp(),
      });

      toast({
        title: "Meeting link added",
        description: "Your meeting link has been saved successfully.",
      });

      setMeetingLink("");
      setDescription("");
      setMeetingType("googlemeet");
      await loadMeetings();
    } catch (error) {
      console.error("Error adding meeting:", error);
      toast({
        title: "Failed to save",
        description: "Unable to save the meeting link.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async (meeting: OnlineMeeting) => {
    try {
      const confirmed = window.confirm(
        `Delete meeting link for ${meeting.course_code}?`,
      );
      if (!confirmed) return;

      await deleteDoc(doc(db, "lecturer_meetings", meeting.id));
      setMeetings((prev) => prev.filter((item) => item.id !== meeting.id));
      toast({
        title: "Meeting link deleted",
        description: "The meeting link has been removed.",
      });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast({
        title: "Delete failed",
        description: "Unable to remove the meeting link.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = (link: string, meetingId: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Link copied",
      description: "The meeting link has been copied to your clipboard.",
    });
  };

  const filteredMeetings = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return meetings;

    return meetings.filter((meeting) => {
      return (
        meeting.course_title?.toLowerCase().includes(search) ||
        meeting.course_code?.toLowerCase().includes(search) ||
        meeting.description?.toLowerCase().includes(search) ||
        getMeetingTypeLabel(meeting.meeting_type).toLowerCase().includes(search)
      );
    });
  }, [meetings, searchQuery]);

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
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Online Meetings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your Google Meet and Zoom links for each course.
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
                  <Plus className="h-5 w-5 text-primary" />
                  Add Meeting Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="course" className="text-sm font-medium">
                    Course
                  </label>
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
                  <label htmlFor="meetingType" className="text-sm font-medium">
                    Meeting Type
                  </label>
                  <select
                    id="meetingType"
                    value={meetingType}
                    onChange={(event) =>
                      setMeetingType(
                        event.target.value as "googlemeet" | "zoom",
                      )
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="googlemeet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="link" className="text-sm font-medium">
                    Meeting Link
                  </label>
                  <Input
                    id="link"
                    value={meetingLink}
                    onChange={(event) => setMeetingLink(event.target.value)}
                    placeholder="Paste your Google Meet or Zoom link"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure the link is publicly accessible or shareable.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add notes like meeting time, topic, etc."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleAddMeeting}
                  disabled={saving || courses.length === 0}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Meeting Link
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
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-muted-foreground">Total Links</p>
                  <p className="text-2xl font-bold">{meetings.length}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-muted-foreground">Assigned Courses</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 backdrop-blur-lg shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by course or type"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Card className="border-border/60 bg-card/80 backdrop-blur-lg shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Your Meeting Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading meetings...
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-10 text-center text-muted-foreground">
                <p className="font-medium">No meeting links yet</p>
                <p className="text-sm mt-1">
                  Add meeting links to make it easy for students to join your
                  classes.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredMeetings.map((meeting, index) => (
                  <motion.div
                    key={meeting.id}
                    variants={rise}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                  >
                    <Card className="border-border/60 bg-background/80 h-full">
                      <CardContent className="p-5 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {getMeetingTypeIcon(meeting.meeting_type)}
                                </span>
                                <h3 className="font-semibold">
                                  {meeting.course_code}
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {meeting.course_title}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {getMeetingTypeLabel(meeting.meeting_type)}
                            </Badge>
                          </div>
                        </div>

                        {meeting.description && (
                          <p className="text-sm text-muted-foreground">
                            {meeting.description}
                          </p>
                        )}

                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                          <p className="text-xs text-muted-foreground mb-2">
                            Meeting Link:
                          </p>
                          <div className="flex items-start gap-2 break-all text-xs font-mono">
                            <a
                              href={meeting.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex-1"
                            >
                              {meeting.meeting_link.substring(0, 50)}
                              {meeting.meeting_link.length > 50 ? "..." : ""}
                            </a>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() =>
                              handleCopyLink(meeting.meeting_link, meeting.id)
                            }
                          >
                            <Copy className="h-4 w-4" />
                            {copiedId === meeting.id ? "Copied!" : "Copy"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() =>
                              window.open(meeting.meeting_link, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMeeting(meeting)}
                          >
                            <Trash2 className="h-4 w-4" />
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
