import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Pause,
  XCircle,
  Archive,
  GraduationCap,
  Users,
  Layers,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

interface Program {
  id: string;
  code: string;
  title: string;
  department: string | null;
  level: string | null;
  status: "active" | "running" | "paused" | "closed" | "archived";
  description: string | null;
  credits_required: number | null;
  duration_years: number | null;
  created_at: string;
}

const statusOptions: Program["status"][] = [
  "active",
  "running",
  "paused",
  "closed",
  "archived",
];

const statusConfig: Record<
  Program["status"],
  { label: string; color: string; icon: any }
> = {
  active: {
    label: "Active",
    color: "bg-emerald-500/10 text-emerald-700",
    icon: CheckCircle2,
  },
  running: {
    label: "Running",
    color: "bg-primary/10 text-primary",
    icon: CheckCircle2,
  },
  paused: {
    label: "Paused",
    color: "bg-amber-500/10 text-amber-700",
    icon: Pause,
  },
  closed: {
    label: "Closed",
    color: "bg-red-500/10 text-red-600",
    icon: XCircle,
  },
  archived: {
    label: "Archived",
    color: "bg-gray-500/10 text-gray-700",
    icon: Archive,
  },
};

export default function RegistrarPrograms() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    department: "",
    level: "undergraduate",
    credits_required: 120,
    duration_years: 4,
    description: "",
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPrograms((data as Program[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    const values = new Set<string>();
    programs.forEach((p) => p.department && values.add(p.department));
    return Array.from(values);
  }, [programs]);

  const filtered = programs.filter((p) => {
    const query = search.toLowerCase();
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      (p.department || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesDept =
      departmentFilter === "all" || p.department === departmentFilter;
    return matchesQuery && matchesStatus && matchesDept;
  });

  const stats = {
    total: programs.length,
    active: programs.filter(
      (p) => p.status === "active" || p.status === "running"
    ).length,
    paused: programs.filter((p) => p.status === "paused").length,
    archived: programs.filter((p) => p.status === "archived").length,
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.title) {
      toast({
        title: "Validation",
        description: "Code and Title are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from("programs").insert({
        code: formData.code,
        title: formData.title,
        department: formData.department || null,
        level: formData.level,
        credits_required: formData.credits_required,
        duration_years: formData.duration_years,
        description: formData.description || null,
        status: "active",
      });
      if (error) throw error;
      toast({ title: "Created", description: "Program added" });
      setShowAddDialog(false);
      setFormData({
        code: "",
        title: "",
        department: "",
        level: "undergraduate",
        credits_required: 120,
        duration_years: 4,
        description: "",
      });
      fetchPrograms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: Program["status"]) => {
    try {
      const { error } = await (supabase as any)
        .from("programs")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Updated", description: `Status set to ${status}` });
      fetchPrograms();
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
            <span className="text-foreground">Programs</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Degree & Program Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Create, track, and manage academic programs
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Program
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Programs", value: stats.total, icon: Layers },
            {
              label: "Active/Running",
              value: stats.active,
              icon: CheckCircle2,
            },
            { label: "Paused", value: stats.paused, icon: Pause },
            { label: "Archived", value: stats.archived, icon: Archive },
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, title, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((program, idx) => {
            const statusInfo = statusConfig[program.status];
            const StatusIcon = statusInfo.icon;
            return (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="gap-1">
                            <GraduationCap className="h-4 w-4" />
                            {program.code}
                          </Badge>
                          <Badge variant="outline" className={statusInfo.color}>
                            <StatusIcon className="h-4 w-4 mr-1" />{" "}
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mt-2">
                          {program.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {program.department || "General"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {program.description || "No description provided."}
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wide">
                          Credits Required
                        </p>
                        <p className="text-base font-semibold">
                          {program.credits_required || 0} credits
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wide">
                          Duration
                        </p>
                        <p className="text-base font-semibold">
                          {program.duration_years || 0} years
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={program.status}
                        onValueChange={(value: Program["status"]) =>
                          handleStatusChange(program.id, value)
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className="capitalize"
                            >
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-4 w-4" /> Active students
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No programs match your filters.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Program</DialogTitle>
            <DialogDescription>Add a new academic program</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProgram} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., BCSC"
                />
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Bachelor of Science in CS"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credits Required</Label>
                <Input
                  type="number"
                  value={formData.credits_required}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credits_required: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (years)</Label>
                <Input
                  type="number"
                  value={formData.duration_years}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_years: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                placeholder="Overview of the program, objectives, or specializations"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
                  "Create Program"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
