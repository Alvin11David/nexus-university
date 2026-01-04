import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Plus,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  audience: string;
  views: number;
  likes: number;
  comments: number;
  priority: "high" | "normal" | "low";
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "All Students",
    priority: "normal" as const,
  });

  const mockAnnouncements: Announcement[] = [
    {
      id: "1",
      title: "Midterm Exam Rescheduled",
      content:
        "The midterm exam has been moved from January 15 to January 18. Please update your schedules accordingly.",
      date: "2h ago",
      audience: "All Students",
      views: 157,
      likes: 42,
      comments: 8,
      priority: "high",
    },
    {
      id: "2",
      title: "Guest Lecture Tomorrow",
      content:
        "Dr. Sarah Chen will be giving a guest lecture on Machine Learning applications tomorrow at 2 PM in Room B2-201.",
      date: "4h ago",
      audience: "Advanced Track",
      views: 89,
      likes: 35,
      comments: 12,
      priority: "normal",
    },
    {
      id: "3",
      title: "Assignment 2 Deadline Extended",
      content:
        "Due to the holiday, Assignment 2 deadline has been extended to January 12.",
      date: "1d ago",
      audience: "All Students",
      views: 203,
      likes: 78,
      comments: 15,
      priority: "high",
    },
    {
      id: "4",
      title: "Office Hours This Week",
      content:
        "My office hours remain unchanged: Tuesday 3-5 PM and Thursday 4-6 PM. Zoom link available on course portal.",
      date: "3d ago",
      audience: "All Students",
      views: 312,
      likes: 45,
      comments: 5,
      priority: "normal",
    },
  ];

  useEffect(() => {
    setAnnouncements(mockAnnouncements);
  }, []);

  const stats = {
    totalAnnouncements: announcements.length,
    totalViews: announcements.reduce((acc, a) => acc + a.views, 0),
    totalLikes: announcements.reduce((acc, a) => acc + a.likes, 0),
    totalComments: announcements.reduce((acc, a) => acc + a.comments, 0),
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-700 border-red-300/30";
      case "normal":
        return "bg-blue-500/20 text-blue-700 border-blue-300/30";
      case "low":
        return "bg-gray-500/20 text-gray-700 border-gray-300/30";
      default:
        return "bg-muted/60";
    }
  };

  const handleCreateAnnouncement = () => {
    if (formData.title && formData.content) {
      const newAnnouncement: Announcement = {
        id: (announcements.length + 1).toString(),
        title: formData.title,
        content: formData.content,
        audience: formData.audience,
        priority: formData.priority,
        date: "now",
        views: 0,
        likes: 0,
        comments: 0,
      };
      setAnnouncements([newAnnouncement, ...announcements]);
      setFormData({
        title: "",
        content: "",
        audience: "All Students",
        priority: "normal",
      });
      setShowCreateModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">
      <LecturerHeader />

      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Megaphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Announcements</h1>
                <p className="text-sm text-muted-foreground">
                  Broadcast important messages to your class
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-primary to-secondary gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" /> New Announcement
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Total Announcements
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalAnnouncements}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-emerald-500/10 border-emerald-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {stats.totalViews}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-red-500/10 border-red-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                  <p className="text-2xl font-bold text-red-700">
                    {stats.totalLikes}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-blue-500/10 border-blue-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Total Comments
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.totalComments}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Announcements List */}
        <div className="space-y-3">
          {announcements.map((announcement, i) => (
            <motion.div
              key={announcement.id}
              variants={rise}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <Card className="border-border/60 bg-card/70 backdrop-blur-lg hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={getPriorityColor(announcement.priority)}
                          >
                            {announcement.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {announcement.date}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {announcement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {announcement.content}
                        </p>
                        <Badge variant="outline">{announcement.audience}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex gap-4 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {announcement.views} views
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">
                          {announcement.likes} likes
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">
                          {announcement.comments} comments
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Create Announcement Modal */}
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border/60 rounded-2xl p-6 max-w-md w-full space-y-4"
            >
              <h2 className="text-2xl font-bold">Create Announcement</h2>

              <div>
                <label className="text-sm font-medium block mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Message
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Write your announcement..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Audience
                  </label>
                  <select
                    value={formData.audience}
                    onChange={(e) =>
                      setFormData({ ...formData, audience: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option>All Students</option>
                    <option>Advanced Track</option>
                    <option>Beginner Track</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAnnouncement}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  Publish
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

      <LecturerBottomNav />
    </div>
  );
}
