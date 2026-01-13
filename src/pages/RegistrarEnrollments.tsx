import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  GraduationCap,
  BookOpen,
  ChevronRight,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

interface EnrollmentRow {
  id: string;
  status: "pending" | "approved" | "rejected" | "completed";
  grade: number | null;
  enrolled_at: string;
  student: {
    full_name: string;
    student_number: string;
    email: string;
  } | null;
  course: {
    id: string;
    code: string;
    title: string;
    credits: number;
    semester: string;
    capacity?: number | null;
  } | null;
}

const statusConfig: Record<
  EnrollmentRow["status"],
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-700",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-600",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-blue-500/10 text-blue-700",
    icon: CheckCircle2,
  },
};

export default function RegistrarEnrollments() {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("enrollments")
        .select(
          `id, status, grade, enrolled_at,
           student:student_records(full_name, student_number, email),
           course:courses(id, code, title, credits, semester, capacity)`
        )
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      setEnrollments((data as EnrollmentRow[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load enrollments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const semesters = useMemo(() => {
    const values = new Set<string>();
    enrollments.forEach(
      (e) => e.course?.semester && values.add(e.course.semester)
    );
    return Array.from(values);
  }, [enrollments]);

  const filtered = enrollments.filter((row) => {
    const query = search.toLowerCase();
    const matchesQuery =
      !query ||
      row.student?.full_name.toLowerCase().includes(query) ||
      row.student?.student_number.toLowerCase().includes(query) ||
      row.course?.code.toLowerCase().includes(query) ||
      row.course?.title.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    const matchesSemester =
      semesterFilter === "all" || row.course?.semester === semesterFilter;

    return matchesQuery && matchesStatus && matchesSemester;
  });

  const stats = {
    total: enrollments.length,
    pending: enrollments.filter((e) => e.status === "pending").length,
    approved: enrollments.filter((e) => e.status === "approved").length,
    completed: enrollments.filter((e) => e.status === "completed").length,
  };

  const updateStatus = async (id: string, status: EnrollmentRow["status"]) => {
    setUpdatingId(id);
    try {
      const { error } = await (supabase as any)
        .from("enrollments")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Updated", description: `Enrollment marked ${status}.` });
      fetchEnrollments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
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
            <span className="text-foreground">Course Enrollments</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Course Registration & Enrollment
              </h1>
              <p className="text-muted-foreground mt-1">
                Approve, track, and manage student course enrollments
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: BookOpen },
            { label: "Pending", value: stats.pending, icon: Clock },
            { label: "Approved", value: stats.approved, icon: CheckCircle2 },
            { label: "Completed", value: stats.completed, icon: GraduationCap },
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
                placeholder="Search by student, number, or course code..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center space-y-2">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-lg font-semibold">No enrollments found</p>
                <p className="text-muted-foreground text-sm">
                  Adjust filters or try a different search.
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((row, idx) => {
              const statusInfo = statusConfig[row.status];
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardContent className="p-4 md:p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-foreground">
                              {row.student?.full_name || "Unknown Student"}
                            </h3>
                            <Badge
                              variant="outline"
                              className={statusInfo.color}
                            >
                              <StatusIcon className="h-4 w-4 mr-1" />{" "}
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                            <span className="font-medium">
                              {row.student?.student_number}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" /> {row.student?.email}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <Badge variant="secondary" className="gap-1">
                              <BookOpen className="h-4 w-4" />{" "}
                              {row.course?.code}
                            </Badge>
                            <span className="text-foreground font-medium">
                              {row.course?.title}
                            </span>
                            <Badge variant="outline" className="gap-1">
                              <GraduationCap className="h-4 w-4" />{" "}
                              {row.course?.credits} credits
                            </Badge>
                            {row.course?.semester && (
                              <Badge variant="outline">
                                {row.course.semester}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Enrolled{" "}
                            {new Date(row.enrolled_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === row.id}
                            onClick={() => updateStatus(row.id, "approved")}
                            className="gap-2"
                          >
                            {updatingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === row.id}
                            onClick={() => updateStatus(row.id, "completed")}
                            className="gap-2"
                          >
                            {updatingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <GraduationCap className="h-4 w-4" />
                            )}
                            Mark Completed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive gap-2"
                            disabled={updatingId === row.id}
                            onClick={() => updateStatus(row.id, "rejected")}
                          >
                            {updatingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
