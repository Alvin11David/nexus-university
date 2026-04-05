import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Megaphone,
  Eye,
  Heart,
  MessageCircle,
  ThumbsUp,
  Send,
  Loader2,
} from "lucide-react";

import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  views: number;
  likes: number;
  comments: number;
  hasLiked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  date: string;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function Announcements() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  useEffect(() => {
    // Check if there's an announcement ID in the query params to expand
    const announcementId = searchParams.get("id");
    if (announcementId) {
      setExpandedId(announcementId);
      // Scroll to the announcement after a short delay to ensure it's rendered
      setTimeout(() => {
        const element = document.getElementById(
          `announcement-${announcementId}`,
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }, [searchParams]);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);

      const studentId = user?.uid;
      if (!studentId) return;

      // Get student's enrolled courses
      const enrollRef = collection(db, "enrollments");
      const qEnroll = query(enrollRef, where("student_id", "==", studentId));
      const enrollSnap = await getDocs(qEnroll);

      if (enrollSnap.empty) {
        setAnnouncements([]);
        return;
      }

      const courseIds = enrollSnap.docs
        .map((d) => d.data().course_id)
        .filter(Boolean);

      // Fetch announcements
      const announcementsRef = collection(db, "announcements");
      const annData: any[] = [];
      for (let i = 0; i < courseIds.length; i += 10) {
        const chunk = courseIds.slice(i, i + 10);
        const qAnn = query(
          announcementsRef,
          where("course_id", "in", chunk),
          orderBy("created_at", "desc"),
        );
        const annSnap = await getDocs(qAnn);
        annSnap.docs.forEach((d) => annData.push({ id: d.id, ...d.data() }));
      }

      // Fetch author profiles
      const authorIds = Array.from(new Set(annData.map((a) => a.author_id)));
      const profileMap = new Map();
      for (let i = 0; i < authorIds.length; i += 10) {
        const chunk = authorIds.slice(i, i + 10);
        const qProfile = query(
          collection(db, "profiles"),
          where("__name__", "in", chunk),
        );
        const profileSnap = await getDocs(qProfile);
        profileSnap.docs.forEach((d) =>
          profileMap.set(d.id, d.data().full_name),
        );
      }

      // Fetch interactions
      const announcementsWithInteractions = await Promise.all(
        annData.map(async (ann) => {
          // View count
          const viewsRef = collection(db, "announcement_views");
          const viewSnap = await getCountFromServer(
            query(viewsRef, where("announcement_id", "==", ann.id)),
          );

          // Like count
          const likesRef = collection(db, "announcement_likes");
          const likeSnap = await getCountFromServer(
            query(likesRef, where("announcement_id", "==", ann.id)),
          );

          // Comment count
          const commentsRef = collection(db, "announcement_comments");
          const commentSnap = await getCountFromServer(
            query(commentsRef, where("announcement_id", "==", ann.id)),
          );

          // User liked?
          const qUserLike = query(
            likesRef,
            where("announcement_id", "==", ann.id),
            where("student_id", "==", studentId),
          );
          const userLikeSnap = await getDocs(qUserLike);

          // Record view
          const qUserView = query(
            viewsRef,
            where("announcement_id", "==", ann.id),
            where("student_id", "==", studentId),
          );
          const userViewSnap = await getDocs(qUserView);

          if (userViewSnap.empty) {
            await addDoc(viewsRef, {
              announcement_id: ann.id,
              student_id: studentId,
              created_at: serverTimestamp(),
            });
          }

          return {
            id: ann.id,
            title: ann.title,
            content: ann.content,
            date: ann.created_at?.toDate
              ? ann.created_at.toDate().toLocaleDateString()
              : new Date(ann.created_at).toLocaleDateString(),
            author: profileMap.get(ann.author_id) || "Unknown",
            views: viewSnap.data().count,
            likes: likeSnap.data().count,
            comments: commentSnap.data().count,
            hasLiked: !userLikeSnap.empty,
          };
        }),
      );

      setAnnouncements(announcementsWithInteractions);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (announcementId: string) => {
    try {
      const q = query(
        collection(db, "announcement_comments"),
        where("announcement_id", "==", announcementId),
        orderBy("created_at", "asc"),
      );
      const snap = await getDocs(q);

      const studentIds = Array.from(
        new Set(snap.docs.map((d) => d.data().student_id)),
      );
      const profileMap = new Map();
      if (studentIds.length > 0) {
        for (let i = 0; i < studentIds.length; i += 10) {
          const chunk = studentIds.slice(i, i + 10);
          const qp = query(
            collection(db, "profiles"),
            where("__name__", "in", chunk),
          );
          const pSnap = await getDocs(qp);
          pSnap.docs.forEach((d) => profileMap.set(d.id, d.data().full_name));
        }
      }

      const transformedComments = snap.docs.map((d) => ({
        id: d.id,
        content: d.data().content,
        author: profileMap.get(d.data().student_id) || "Unknown",
        date: d.data().created_at?.toDate
          ? d.data().created_at.toDate().toLocaleDateString()
          : new Date(d.data().created_at).toLocaleDateString(),
      }));

      setComments({ ...comments, [announcementId]: transformedComments });
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleLike = async (announcementId: string) => {
    if (!user) return;

    try {
      const announcement = announcements.find((a) => a.id === announcementId);
      if (!announcement) return;

      const likesRef = collection(db, "announcement_likes");

      if (announcement.hasLiked) {
        // Unlike
        const q = query(
          likesRef,
          where("announcement_id", "==", announcementId),
          where("student_id", "==", user.uid),
        );
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        setAnnouncements(
          announcements.map((a) =>
            a.id === announcementId
              ? { ...a, likes: a.likes - 1, hasLiked: false }
              : a,
          ),
        );
      } else {
        // Like
        await addDoc(likesRef, {
          announcement_id: announcementId,
          student_id: user.uid,
          created_at: serverTimestamp(),
        });

        setAnnouncements(
          announcements.map((a) =>
            a.id === announcementId
              ? { ...a, likes: a.likes + 1, hasLiked: true }
              : a,
          ),
        );
      }
    } catch (error) {
      console.error("Error liking announcement:", error);
    }
  };

  const handleComment = async (announcementId: string) => {
    if (!user || !commentInput[announcementId]?.trim()) return;

    try {
      setSendingComment({ ...sendingComment, [announcementId]: true });

      const commentsRef = collection(db, "announcement_comments");
      await addDoc(commentsRef, {
        announcement_id: announcementId,
        student_id: user.uid,
        content: commentInput[announcementId],
        created_at: serverTimestamp(),
      });

      // Update local comments
      await fetchComments(announcementId);

      // Update comment count
      setAnnouncements(
        announcements.map((a) =>
          a.id === announcementId ? { ...a, comments: a.comments + 1 } : a,
        ),
      );

      setCommentInput({ ...commentInput, [announcementId]: "" });
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSendingComment({ ...sendingComment, [announcementId]: false });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-secondary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5 pb-28">
      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Announcements</h1>
              <p className="text-sm text-muted-foreground">
                Stay updated with course announcements
              </p>
            </div>
          </div>
        </motion.div>

        {announcements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No announcements yet</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement, i) => (
              <motion.div
                id={`announcement-${announcement.id}`}
                key={announcement.id}
                variants={rise}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <Card className="border-border/60 bg-card/70 backdrop-blur-lg hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {announcement.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              By {announcement.author} • {announcement.date}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {announcement.content}
                        </p>
                      </div>

                      {/* Engagement Stats */}
                      <div className="flex gap-4 pt-3 border-t border-border/60 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {announcement.views} views
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart
                            className={`h-4 w-4 ${
                              announcement.hasLiked
                                ? "text-red-500 fill-red-500"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="text-sm text-muted-foreground">
                            {announcement.likes} likes
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {announcement.comments} comments
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-border/60">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLike(announcement.id)}
                          className={`flex-1 gap-2 ${
                            announcement.hasLiked
                              ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                              : ""
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {announcement.hasLiked ? "Liked" : "Like"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (expandedId === announcement.id) {
                              setExpandedId(null);
                            } else {
                              setExpandedId(announcement.id);
                              if (!comments[announcement.id]) {
                                fetchComments(announcement.id);
                              }
                            }
                          }}
                          className="flex-1 gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Comment
                        </Button>
                      </div>

                      {/* Comments Section */}
                      {expandedId === announcement.id && (
                        <div className="space-y-3 pt-4 border-t border-border/60">
                          {/* Comments List */}
                          {comments[announcement.id] &&
                            comments[announcement.id].length > 0 && (
                              <div className="space-y-2">
                                {comments[announcement.id].map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="p-3 rounded-lg bg-muted/50 border border-border/30"
                                  >
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {comment.author} • {comment.date}
                                    </p>
                                    <p className="text-sm text-foreground mt-1">
                                      {comment.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                          {/* Comment Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentInput[announcement.id] || ""}
                              onChange={(e) =>
                                setCommentInput({
                                  ...commentInput,
                                  [announcement.id]: e.target.value,
                                })
                              }
                              placeholder="Write a comment..."
                              className="flex-1 px-3 py-2 rounded-lg border border-border/60 bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleComment(announcement.id)}
                              disabled={
                                sendingComment[announcement.id] ||
                                !commentInput[announcement.id]?.trim()
                              }
                              className="bg-gradient-to-r from-primary to-secondary"
                            >
                              {sendingComment[announcement.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
}
