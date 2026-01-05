import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Send,
  Trash2,
  Archive,
  Pin,
  Search,
  Filter,
  Plus,
  X,
  User,
  Inbox,
  Star,
  Clock,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  is_deleted_by_sender: boolean;
  is_deleted_by_recipient: boolean;
  created_at: string;
  from_profile?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  to_profile?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

type ViewType = "inbox" | "sent" | "starred";

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerMessages() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState<ViewType>("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeToId, setComposeToId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchStudents();
    }
  }, [user, selectedView]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .neq("id", user?.id)
        .eq("role", "student")
        .order("full_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("messages")
        .select(
          `
          *,
          from_profile:profiles!from_user_id(id, full_name, email, avatar_url),
          to_profile:profiles!to_user_id(id, full_name, email, avatar_url)
        `
        )
        .order("created_at", { ascending: false });

      if (selectedView === "inbox") {
        query = query
          .eq("to_user_id", user.id)
          .eq("is_deleted_by_recipient", false);
      } else if (selectedView === "sent") {
        query = query
          .eq("from_user_id", user.id)
          .eq("is_deleted_by_sender", false);
      } else if (selectedView === "starred") {
        query = query
          .eq("is_starred", true)
          .or(`to_user_id.eq.${user.id},from_user_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (
      !user ||
      !composeToId ||
      !composeSubject.trim() ||
      !composeBody.trim()
    ) {
      alert("Please fill in all fields and select a recipient.");
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase.from("messages").insert({
        from_user_id: user.id,
        to_user_id: composeToId,
        subject: composeSubject,
        body: composeBody,
        thread_id: crypto.randomUUID(),
        is_read: false,
        is_starred: false,
        is_archived: false,
        is_deleted_by_sender: false,
        is_deleted_by_recipient: false,
      });

      if (error) throw error;

      // Notify the student recipient
      const senderName = profile?.full_name || "Lecturer";
      await supabase.from("notifications").insert({
        user_id: composeToId,
        title: `New message from ${senderName}`,
        message: composeSubject || "You have a new message",
        type: "info",
        link: "/webmail",
      });

      // Reset compose form
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeToId(null);
      setIsComposeOpen(false);

      // Refresh messages
      fetchMessages();

      alert("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Error: " + (error as any).message);
    } finally {
      setSending(false);
    }
  };

  const handleReply = (message: Message) => {
    setComposeToId(message.from_user_id);
    setComposeTo(message.from_profile?.email || "");
    setComposeSubject(`Re: ${message.subject}`);
    setComposeBody("");
    setIsComposeOpen(true);
  };

  const handleToggleStar = async (messageId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_starred: !currentValue })
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_starred: !currentValue } : m
        )
      );
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_read: true } : m))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read && message.to_user_id === user?.id) {
      markAsRead(message.id);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const query = searchQuery.toLowerCase();
    return (
      msg.subject.toLowerCase().includes(query) ||
      msg.body.toLowerCase().includes(query) ||
      msg.from_profile?.full_name.toLowerCase().includes(query) ||
      msg.from_profile?.email.toLowerCase().includes(query) ||
      msg.to_profile?.full_name.toLowerCase().includes(query) ||
      msg.to_profile?.email.toLowerCase().includes(query)
    );
  });

  const unreadCount = messages.filter(
    (m) => !m.is_read && m.to_user_id === user?.id
  ).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
            <Button
              onClick={() => setIsComposeOpen(true)}
              className="bg-gradient-to-r from-primary to-secondary gap-2"
            >
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
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["inbox", "sent", "starred"] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedView === view
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground hover:bg-muted"
                }`}
              >
                {view === "inbox" && <Inbox className="inline h-4 w-4 mr-1" />}
                {view === "sent" && <Send className="inline h-4 w-4 mr-1" />}
                {view === "starred" && <Star className="inline h-4 w-4 mr-1" />}
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Messages List */}
        <div className="space-y-2">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground">Loading messages...</p>
            </motion.div>
          ) : filteredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No messages found</p>
            </motion.div>
          ) : (
            filteredMessages.map((message, i) => {
              const displayProfile =
                selectedView === "sent"
                  ? message.to_profile
                  : message.from_profile;
              return (
                <motion.div
                  key={message.id}
                  variants={rise}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  <Card
                    className={`border-border/60 cursor-pointer transition-all hover:shadow-md ${
                      !message.is_read && message.to_user_id === user?.id
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card/70 backdrop-blur-lg"
                    } ${
                      selectedMessage?.id === message.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={displayProfile?.avatar_url} />
                            <AvatarFallback>
                              {displayProfile?.full_name
                                ? getInitials(displayProfile.full_name)
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p
                                className={`font-semibold truncate ${
                                  !message.is_read &&
                                  message.to_user_id === user?.id
                                    ? "font-bold text-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {displayProfile?.full_name || "Unknown User"}
                              </p>
                              {!message.is_read &&
                                message.to_user_id === user?.id && (
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                            </div>
                            <p className="text-sm text-foreground font-medium truncate">
                              {message.subject}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {message.body}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(
                                new Date(message.created_at),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(message.id, message.is_starred);
                            }}
                            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                            title={message.is_starred ? "Unstar" : "Star"}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                message.is_starred
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Message to Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">To:</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <select
                  value={composeToId || ""}
                  onChange={(e) => {
                    const selectedStudent = students.find(
                      (s) => s.id === e.target.value
                    );
                    setComposeToId(e.target.value);
                    setComposeTo(selectedStudent?.email || "");
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject:</label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Enter subject..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message:</label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Type your message here..."
                rows={8}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsComposeOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={sending}>
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Detail Dialog */}
      <AnimatePresence>
        {selectedMessage && (
          <Dialog
            open={!!selectedMessage}
            onOpenChange={(open) => {
              if (!open) setSelectedMessage(null);
            }}
          >
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={
                          selectedView === "sent"
                            ? selectedMessage.to_profile?.avatar_url
                            : selectedMessage.from_profile?.avatar_url
                        }
                      />
                      <AvatarFallback>
                        {selectedView === "sent"
                          ? selectedMessage.to_profile?.full_name
                            ? getInitials(selectedMessage.to_profile.full_name)
                            : "?"
                          : selectedMessage.from_profile?.full_name
                          ? getInitials(selectedMessage.from_profile.full_name)
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {selectedView === "sent"
                          ? selectedMessage.to_profile?.full_name
                          : selectedMessage.from_profile?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedView === "sent"
                          ? selectedMessage.to_profile?.email
                          : selectedMessage.from_profile?.email}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(selectedMessage.created_at),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>
                  <div className="prose max-w-none whitespace-pre-wrap">
                    {selectedMessage.body}
                  </div>
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-4">
                {selectedView === "inbox" && (
                  <Button
                    onClick={() => {
                      handleReply(selectedMessage);
                      setSelectedMessage(null);
                    }}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" /> Reply
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <LecturerBottomNav />
    </div>
  );
}
