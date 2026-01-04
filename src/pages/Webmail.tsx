import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Star,
  Archive,
  Trash2,
  Search,
  Plus,
  X,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Reply,
  ReplyAll,
  Forward,
  ChevronLeft,
  Filter,
  Loader2,
  User,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface Draft {
  id: string;
  to_user_id: string | null;
  subject: string | null;
  body: string | null;
  created_at: string;
  to_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
}

type ViewType = "inbox" | "sent" | "drafts" | "starred" | "archived";

export default function Webmail() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedView, setSelectedView] = useState<ViewType>("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeToId, setComposeToId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sending, setSending] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchDrafts();
      fetchUsers();
    }
  }, [user, selectedView]);

  useEffect(() => {
    // GSAP Title Animation
    if (titleRef.current) {
      const chars = titleRef.current.textContent?.split("") || [];
      titleRef.current.innerHTML = chars
        .map((char) =>
          char === " " ? " " : `<span class="inline-block">${char}</span>`
        )
        .join("");

      gsap.fromTo(
        titleRef.current.querySelectorAll("span"),
        {
          opacity: 0,
          y: 30,
          rotationX: -90,
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.6,
          stagger: 0.02,
          ease: "back.out(1.7)",
        }
      );
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .neq("id", user?.id)
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
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
      } else if (selectedView === "archived") {
        query = query
          .eq("is_archived", true)
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

  const fetchDrafts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("message_drafts")
        .select(
          `
          *,
          to_profile:profiles!to_user_id(id, full_name, email)
        `
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      alert("You must be logged in to send messages.");
      return;
    }

    if (!composeToId) {
      alert("Please select a recipient from the list.");
      return;
    }

    if (!composeSubject.trim()) {
      alert("Please enter a subject.");
      return;
    }

    if (!composeBody.trim()) {
      alert("Please enter a message.");
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
      });

      if (error) throw error;

      // Reset compose form
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeToId(null);
      setIsComposeOpen(false);

      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        "Failed to send message. Please try again. Error: " +
          (error as any).message
      );
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;

    try {
      setSavingDraft(true);
      const { error } = await supabase.from("message_drafts").insert({
        user_id: user.id,
        to_user_id: composeToId,
        subject: composeSubject,
        body: composeBody,
      });

      if (error) throw error;

      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeToId(null);
      setIsComposeOpen(false);
      fetchDrafts();
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleToggleStar = async (messageId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_starred: !currentValue })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, is_starred: !currentValue });
      }
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, is_read: true });
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!user) return;

    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const isSent = message.from_user_id === user.id;
      const updateField = isSent
        ? "is_deleted_by_sender"
        : "is_deleted_by_recipient";

      const { error } = await supabase
        .from("messages")
        .update({ [updateField]: true })
        .eq("id", messageId);

      if (error) throw error;

      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleArchive = async (messageId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_archived: !currentValue })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, is_archived: !currentValue });
      }
    } catch (error) {
      console.error("Error archiving message:", error);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
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
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent py-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--secondary)/0.2)_0%,_transparent_50%)]" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl"
          >
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-3">
              <Mail className="h-4 w-4" />
              <span>Communication</span>
            </div>

            <h1
              ref={titleRef}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4"
            >
              Webmail
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl">
              Connect with lecturers and students across the university
            </p>
          </motion.div>
        </div>
      </section>

      <main className="container py-8">
        <div className="max-w-7xl mx-auto">
          {/* Compose Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button
              onClick={() => setIsComposeOpen(true)}
              className="gap-2 h-12 px-6 bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Compose
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 space-y-1">
                  <button
                    onClick={() => setSelectedView("inbox")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      selectedView === "inbox"
                        ? "bg-secondary text-secondary-foreground shadow-md"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Inbox className="h-5 w-5" />
                    <span className="font-medium">Inbox</span>
                    {unreadCount > 0 && (
                      <Badge className="ml-auto bg-amber-500">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedView("sent")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      selectedView === "sent"
                        ? "bg-secondary text-secondary-foreground shadow-md"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Send className="h-5 w-5" />
                    <span className="font-medium">Sent</span>
                  </button>

                  <button
                    onClick={() => setSelectedView("drafts")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      selectedView === "drafts"
                        ? "bg-secondary text-secondary-foreground shadow-md"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Drafts</span>
                    {drafts.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {drafts.length}
                      </Badge>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedView("starred")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      selectedView === "starred"
                        ? "bg-secondary text-secondary-foreground shadow-md"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className="h-5 w-5" />
                    <span className="font-medium">Starred</span>
                  </button>

                  <button
                    onClick={() => setSelectedView("archived")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      selectedView === "archived"
                        ? "bg-secondary text-secondary-foreground shadow-md"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Archive className="h-5 w-5" />
                    <span className="font-medium">Archived</span>
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedView === "drafts" ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Drafts</h2>
                    </div>
                    {drafts.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">No drafts yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {drafts.map((draft) => (
                          <Card
                            key={draft.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setComposeTo(draft.to_profile?.email || "");
                              setComposeToId(draft.to_user_id || null);
                              setComposeSubject(draft.subject || "");
                              setComposeBody(draft.body || "");
                              setIsComposeOpen(true);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">
                                      {draft.to_profile?.full_name ||
                                        "No recipient"}
                                    </span>
                                    {draft.subject && (
                                      <>
                                        <span className="text-muted-foreground">
                                          •
                                        </span>
                                        <span className="font-semibold">
                                          {draft.subject}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {draft.body && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {draft.body}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {format(
                                      new Date(draft.created_at),
                                      "MMM d, yyyy h:mm a"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Search Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 bg-muted/50 border-0 rounded-xl"
                      />
                    </div>
                  </motion.div>

                  {loading ? (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-12 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-secondary mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Loading messages...
                        </p>
                      </CardContent>
                    </Card>
                  ) : selectedMessage ? (
                    /* Message Detail View */
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMessage(null)}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <div className="flex-1" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleStar(
                                    selectedMessage.id,
                                    selectedMessage.is_starred
                                  )
                                }
                              >
                                <Star
                                  className={`h-4 w-4 mr-2 ${
                                    selectedMessage.is_starred
                                      ? "fill-amber-500 text-amber-500"
                                      : ""
                                  }`}
                                />
                                {selectedMessage.is_starred ? "Unstar" : "Star"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleArchive(
                                    selectedMessage.id,
                                    selectedMessage.is_archived
                                  )
                                }
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                {selectedMessage.is_archived
                                  ? "Unarchive"
                                  : "Archive"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(selectedMessage.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h2 className="text-2xl font-bold mb-4">
                              {selectedMessage.subject}
                            </h2>
                            <div className="flex items-start gap-4 pb-4 border-b">
                              <Avatar className="h-12 w-12">
                                <AvatarImage
                                  src={
                                    selectedMessage.from_profile?.avatar_url ||
                                    undefined
                                  }
                                />
                                <AvatarFallback>
                                  {getInitials(
                                    selectedMessage.from_profile?.full_name ||
                                      "U"
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">
                                    {selectedMessage.from_profile?.full_name ||
                                      "Unknown"}
                                  </span>
                                  <span className="text-muted-foreground">
                                    &lt;{selectedMessage.from_profile?.email}
                                    &gt;
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(selectedMessage.created_at),
                                    "PPpp"
                                  )}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleToggleStar(
                                    selectedMessage.id,
                                    selectedMessage.is_starred
                                  )
                                }
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    selectedMessage.is_starred
                                      ? "fill-amber-500 text-amber-500"
                                      : ""
                                  }`}
                                />
                              </Button>
                            </div>
                          </div>

                          <div className="prose max-w-none">
                            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                              {selectedMessage.body}
                            </p>
                          </div>

                          <div className="flex gap-2 pt-4 border-t">
                            <Button variant="outline" className="gap-2">
                              <Reply className="h-4 w-4" />
                              Reply
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <Forward className="h-4 w-4" />
                              Forward
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    /* Message List */
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-0">
                        {filteredMessages.length === 0 ? (
                          <div className="text-center py-12">
                            <Mail className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              {searchQuery
                                ? "No messages found"
                                : "No messages yet"}
                            </p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[600px]">
                            <div className="divide-y">
                              <AnimatePresence>
                                {filteredMessages.map((message, index) => {
                                  const isSent =
                                    message.from_user_id === user?.id;
                                  const otherProfile = isSent
                                    ? message.to_profile
                                    : message.from_profile;

                                  return (
                                    <motion.div
                                      key={message.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 20 }}
                                      transition={{ delay: index * 0.03 }}
                                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                                        !message.is_read && !isSent
                                          ? "bg-primary/5"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        setSelectedMessage(message);
                                        if (!message.is_read && !isSent) {
                                          handleMarkAsRead(message.id);
                                        }
                                      }}
                                    >
                                      <div className="flex items-start gap-4">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                          <AvatarImage
                                            src={
                                              otherProfile?.avatar_url ||
                                              undefined
                                            }
                                          />
                                          <AvatarFallback className="text-xs">
                                            {getInitials(
                                              otherProfile?.full_name || "U"
                                            )}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold truncate">
                                              {otherProfile?.full_name ||
                                                "Unknown"}
                                            </span>
                                            {!message.is_read && !isSent && (
                                              <Circle className="h-2 w-2 fill-secondary text-secondary flex-shrink-0" />
                                            )}
                                          </div>
                                          <p className="font-medium truncate mb-1">
                                            {message.subject || "(No subject)"}
                                          </p>
                                          <p className="text-sm text-muted-foreground line-clamp-2">
                                            {message.body}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-2">
                                            {formatDistanceToNow(
                                              new Date(message.created_at),
                                              { addSuffix: true }
                                            )}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleStar(
                                                message.id,
                                                message.is_starred
                                              );
                                            }}
                                          >
                                            <Star
                                              className={`h-4 w-4 ${
                                                message.is_starred
                                                  ? "fill-amber-500 text-amber-500"
                                                  : ""
                                              }`}
                                            />
                                          </Button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">To</label>
              <div className="space-y-2">
                <Input
                  placeholder="Type name or email to search..."
                  value={composeTo}
                  onChange={(e) => {
                    setComposeTo(e.target.value);
                    const foundUser = users.find(
                      (u) =>
                        u.email.toLowerCase() ===
                          e.target.value.toLowerCase() ||
                        u.full_name
                          .toLowerCase()
                          .includes(e.target.value.toLowerCase())
                    );
                    setComposeToId(foundUser?.id || null);
                  }}
                  className={composeToId ? "border-green-500" : ""}
                />
                {composeTo && !composeToId && (
                  <p className="text-xs text-amber-600">
                    No user found. Please select from the list below.
                  </p>
                )}
                {composeToId && (
                  <p className="text-xs text-green-600">✓ Recipient selected</p>
                )}
                {composeTo && (
                  <ScrollArea className="max-h-32 rounded-md border">
                    <div className="p-2 space-y-1">
                      {users
                        .filter(
                          (u) =>
                            u.email
                              .toLowerCase()
                              .includes(composeTo.toLowerCase()) ||
                            u.full_name
                              .toLowerCase()
                              .includes(composeTo.toLowerCase())
                        )
                        .slice(0, 10)
                        .map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setComposeTo(user.email);
                              setComposeToId(user.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                          >
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </button>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[300px] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={savingDraft}
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Draft"
                )}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={
                  !composeToId ||
                  !composeSubject ||
                  !composeBody.trim() ||
                  sending
                }
                className="bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
