import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  Layers,
  List,
  ChevronRight,
  Loader2,
  MapPin,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  semester: string | null;
  academic_year: string | null;
  status: "open" | "close" | "current" | "completed";
  visibility: "public" | "internal";
  start_date: string;
  end_date: string;
  location: string | null;
  created_at: string;
}

const statusConfig: Record<
  CalendarEvent["status"],
  { label: string; color: string }
> = {
  open: { label: "Open", color: "bg-emerald-500/10 text-emerald-700" },
  close: { label: "Closed", color: "bg-amber-500/10 text-amber-700" },
  current: {
    label: "Current",
    color: "bg-secondary/20 text-secondary-foreground",
  },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground" },
};

const categories = [
  "academic",
  "registration",
  "enrollment",
  "exams",
  "graduation",
  "holiday",
  "deadline",
  "other",
];

export default function RegistrarCalendar() {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "academic",
    semester: "",
    academic_year: "2025/2026",
    status: "open" as CalendarEvent["status"],
    visibility: "public" as CalendarEvent["visibility"],
    start_date: "",
    end_date: "",
    location: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("academic_calendar_events")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      setEvents((data as CalendarEvent[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load calendar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter((event) => {
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || event.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const stats = {
    total: events.length,
    current: events.filter((e) => e.status === "current").length,
    open: events.filter((e) => e.status === "open").length,
    completed: events.filter((e) => e.status === "completed").length,
  };

  const timelineEvents = useMemo(() => {
    return [...filtered].sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  }, [filtered]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_date || !formData.end_date) {
      toast({
        title: "Validation",
        description: "Title and dates are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("academic_calendar_events")
        .insert({
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        semester: formData.semester || null,
        academic_year: formData.academic_year || null,
        status: formData.status,
        visibility: formData.visibility,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location || null,
      });
      if (error) throw error;
      toast({ title: "Created", description: "Event added to calendar" });
      setShowAddDialog(false);
      setFormData({
        title: "",
        description: "",
        category: "academic",
        semester: "",
        academic_year: "2025/2026",
        status: "open",
        visibility: "public",
        start_date: "",
        end_date: "",
        location: "",
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: CalendarEvent["status"]) => {
    try {
      const { error } = await (supabase as any)
        .from("academic_calendar_events")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Updated", description: `Marked ${status}` });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="hover:text-foreground cursor-pointer">
              Registrar
            </span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Academic Calendar</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Academic Calendar & Scheduling
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage key academic dates, deadlines, and events
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "secondary" : "outline"}
                onClick={() => setViewMode("grid")}
              >
                <Layers className="h-4 w-4 mr-2" /> Cards
              </Button>
              <Button
                variant={viewMode === "timeline" ? "secondary" : "outline"}
                onClick={() => setViewMode("timeline")}
              >
                <List className="h-4 w-4 mr-2" /> Timeline
              </Button>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: CalendarDays },
            { label: "Open", value: stats.open, icon: Clock },
            { label: "Current", value: stats.current, icon: Shield },
            { label: "Completed", value: stats.completed, icon: CheckCircle2 },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-secondary" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="close">Closed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((event, idx) => {
              const statusInfo = statusConfig[event.status];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">
                            {event.title}
                          </CardTitle>
                          <CardDescription className="mt-1 capitalize">
                            {event.category}
                          </CardDescription>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={statusInfo.color}
                            >
                              {statusInfo.label}
                            </Badge>
                            <Badge
                              variant={
                                event.visibility === "public"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {event.visibility === "public"
                                ? "Public"
                                : "Internal"}
                            </Badge>
                            {event.semester && (
                              <Badge variant="outline">{event.semester}</Badge>
                            )}
                            {event.academic_year && (
                              <Badge variant="outline">
                                {event.academic_year}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {event.description || "No description provided."}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(
                            event.start_date
                          ).toLocaleDateString()} -{" "}
                          {new Date(event.end_date).toLocaleDateString()}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(event.id, "current")}
                        >
                          Mark Current
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(event.id, "completed")}
                        >
                          Mark Completed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(event.id, "close")}
                        >
                          Close
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/70 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Timeline view</CardTitle>
              <CardDescription>
                Chronological list across semesters
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6">
              <div className="relative pl-6 space-y-6">
                <div
                  className="absolute left-2 top-0 bottom-0 w-px bg-border"
                  aria-hidden
                />
                {timelineEvents.map((event) => {
                  const statusInfo = statusConfig[event.status];
                  return (
                    <div key={event.id} className="relative pl-4">
                      <div className="absolute left-[-10px] top-1.5 h-2 w-2 rounded-full bg-secondary" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">
                          {event.title}
                        </p>
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        <Badge
                          variant={
                            event.visibility === "public"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {event.visibility === "public"
                            ? "Public"
                            : "Internal"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.category} • {event.semester || ""}{" "}
                        {event.academic_year || ""}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(event.start_date).toLocaleDateString()} -{" "}
                        {new Date(event.end_date).toLocaleDateString()}
                      </p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-4 w-4" /> {event.location}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
            <DialogDescription>
              Create a new academic calendar entry
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Registration Opens"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: CalendarEvent["status"]) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="close">Closed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Input
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({ ...formData, semester: e.target.value })
                  }
                  placeholder="Semester I"
                />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input
                  value={formData.academic_year || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, academic_year: e.target.value })
                  }
                  placeholder="2025/2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: CalendarEvent["visibility"]) =>
                    setFormData({ ...formData, visibility: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Online / Hall A"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Key details, prerequisites, or notes"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
