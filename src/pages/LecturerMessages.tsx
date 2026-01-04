import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Trash2, Archive, Pin, Search, Filter } from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
  category: "students" | "staff" | "admin" | "system";
  pinned: boolean;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "students" | "staff" | "admin" | "system"
  >("all");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  // Mock data
  const mockMessages: Message[] = [
    {
      id: "1",
      from: "John Doe",
      subject: "Question about Assignment 3",
      preview:
        "Hi Prof, I'm stuck on part B of the assignment. Could you help me understand the concept?",
      timestamp: "5m ago",
      read: false,
      category: "students",
      pinned: false,
    },
    {
      id: "2",
      from: "Department Admin",
      subject: "Room change approved for Thursday",
      preview:
        "Your request to change the classroom for Thursday lecture has been approved.",
      timestamp: "1h ago",
      read: false,
      category: "admin",
      pinned: true,
    },
    {
      id: "3",
      from: "TA Sarah",
      subject: "Grading complete for Midterm",
      preview:
        "I've completed grading the midterm exams. The results are ready for review.",
      timestamp: "2h ago",
      read: true,
      category: "staff",
      pinned: false,
    },
    {
      id: "4",
      from: "Student Council",
      subject: "Can we extend Q&A by 10 mins?",
      preview:
        "Many students are interested in staying longer for the Q&A session this week.",
      timestamp: "3h ago",
      read: true,
      category: "students",
      pinned: false,
    },
    {
      id: "5",
      from: "System",
      subject: "New assignment submission received",
      preview: "Emma Davis submitted Assignment 2 at 3:45 PM",
      timestamp: "4h ago",
      read: true,
      category: "system",
      pinned: false,
    },
    {
      id: "6",
      from: "Dr. Johnson",
      subject: "Collaboration on Research Project",
      preview:
        "I'd like to discuss the possibility of collaborating on the ML research project.",
      timestamp: "Yesterday",
      read: true,
      category: "staff",
      pinned: false,
    },
    {
      id: "7",
      from: "Mike Brown",
      subject: "Grade Appeal",
      preview:
        "I believe my exam should be reviewed. I think I answered question 5 correctly.",
      timestamp: "Yesterday",
      read: true,
      category: "students",
      pinned: false,
    },
  ];

  useEffect(() => {
    setMessages(mockMessages);
  }, []);

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || msg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const unreadCount = messages.filter((m) => !m.read).length;
  const pinnedCount = messages.filter((m) => m.pinned).length;

  const categoryColors = {
    students: "bg-blue-500/20 text-blue-700 border-blue-300/30",
    staff: "bg-purple-500/20 text-purple-700 border-purple-300/30",
    admin: "bg-red-500/20 text-red-700 border-red-300/30",
    system: "bg-amber-500/20 text-amber-700 border-amber-300/30",
  };

  const togglePin = (id: string) => {
    setMessages(
      messages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    );
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">
      <LecturerHeader />

      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Messages</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your inbox and communications
                </p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-primary to-secondary gap-2">
              <Send className="h-4 w-4" /> New Message
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <Badge variant="outline" className="px-3 py-1.5">
              <Mail className="h-3 w-3 mr-1" />
              {messages.length} Messages
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5">
              {unreadCount} Unread
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5">
              <Pin className="h-3 w-3 mr-1" />
              {pinnedCount} Pinned
            </Badge>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-64">
              <label className="text-sm font-medium block mb-2">
                Search Messages
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by sender, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "students", "staff", "admin", "system"] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              )
            )}
          </div>
        </motion.div>

        {/* Messages List */}
        <div className="space-y-2">
          {filteredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No messages found</p>
            </motion.div>
          ) : (
            filteredMessages.map((message, i) => (
              <motion.div
                key={message.id}
                variants={rise}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <Card
                  className={`border-border/60 cursor-pointer transition-all hover:shadow-md ${
                    !message.read
                      ? "bg-primary/5 border-primary/30"
                      : "bg-card/70 backdrop-blur-lg"
                  } ${
                    selectedMessage === message.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedMessage(message.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium border ${
                              categoryColors[message.category]
                            }`}
                          >
                            {message.category}
                          </div>
                          {message.pinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                          {!message.read && (
                            <div className="h-2 w-2 rounded-full bg-primary ml-auto" />
                          )}
                        </div>
                        <p
                          className={`font-semibold truncate ${
                            !message.read
                              ? "font-bold text-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {message.from}
                        </p>
                        <p className="text-sm text-foreground font-medium truncate">
                          {message.subject}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {message.preview}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {message.timestamp}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(message.id);
                          }}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                          title={message.pinned ? "Unpin" : "Pin"}
                        >
                          <Pin
                            className={`h-4 w-4 ${
                              message.pinned
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(message.id);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
