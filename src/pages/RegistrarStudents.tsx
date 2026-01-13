import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  GraduationCap,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentRecord {
  id: string;
  student_number: string;
  registration_number: string;
  full_name: string;
  email: string;
  enrollment_status: "active" | "inactive" | "graduated" | "suspended";
  department: string;
  program: string;
  year_of_study: number;
  date_of_admission: string;
  created_at: string;
  avatar_url?: string | null;
}

const enrollmentStatusConfig = {
  active: {
    color: "bg-emerald-500/10 text-emerald-600",
    label: "Active",
    icon: CheckCircle2,
  },
  inactive: {
    color: "bg-gray-500/10 text-gray-600",
    label: "Inactive",
    icon: AlertCircle,
  },
  graduated: {
    color: "bg-blue-500/10 text-blue-600",
    label: "Graduated",
    icon: CheckCircle2,
  },
  suspended: {
    color: "bg-red-500/10 text-red-600",
    label: "Suspended",
    icon: AlertCircle,
  },
};

export default function RegistrarStudents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    student_number: "",
    registration_number: "",
    full_name: "",
    email: "",
    department: "",
    program: "",
    year_of_study: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, statusFilter, departmentFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data: studentData, error: studentError } = await supabase
        .from("student_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (studentError) throw studentError;

      // Fetch profiles for avatar URLs
      const studentIds = studentData?.map((s) => s.id) || [];
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("student_record_id, avatar_url")
        .in("student_record_id", studentIds);

      if (profileError) {
        console.warn("Could not fetch profiles:", profileError);
      }

      // Merge avatar URLs into student data
      const studentsWithAvatars =
        studentData?.map((student) => ({
          ...student,
          avatar_url: profileData?.find(
            (p) => p.student_record_id === student.id
          )?.avatar_url,
        })) || [];

      setStudents(studentsWithAvatars);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch student records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name.toLowerCase().includes(query) ||
          s.student_number.toLowerCase().includes(query) ||
          s.registration_number.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.enrollment_status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((s) => s.department === departmentFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.student_number ||
      !formData.full_name ||
      !formData.email ||
      !formData.department
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("student_records").insert([
        {
          ...formData,
          enrollment_status: "active",
          year_of_study: parseInt(formData.year_of_study.toString()),
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student record added successfully",
      });

      setFormData({
        student_number: "",
        registration_number: "",
        full_name: "",
        email: "",
        department: "",
        program: "",
        year_of_study: 1,
      });
      setShowAddDialog(false);
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add student record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("student_records")
        .delete()
        .eq("id", studentToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student record deleted successfully",
      });

      setShowDeleteDialog(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student record",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const departments = [
    ...new Set(students.map((s) => s.department).filter(Boolean)),
  ];

  const stats = {
    total: students.length,
    active: students.filter((s) => s.enrollment_status === "active").length,
    graduated: students.filter((s) => s.enrollment_status === "graduated")
      .length,
    suspended: students.filter((s) => s.enrollment_status === "suspended")
      .length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <h1 className="text-xl md:text-2xl font-bold">Student Records</h1>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gap-2 bg-secondary hover:bg-secondary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Student</span>
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <GraduationCap className="h-4 w-4" />
            <span>Administration</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Student Records</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Students
                  </p>
                  <p className="text-2xl md:text-3xl font-bold">
                    {stats.total}
                  </p>
                </div>
                <Users className="h-8 w-8 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Active Students
                  </p>
                  <p className="text-2xl md:text-3xl font-bold">
                    {stats.active}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Graduated
                  </p>
                  <p className="text-2xl md:text-3xl font-bold">
                    {stats.graduated}
                  </p>
                </div>
                <FileText className="h-8 w-8 opacity-50" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Suspended
                  </p>
                  <p className="text-2xl md:text-3xl font-bold">
                    {stats.suspended}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 opacity-50" />
              </div>
            </motion.div>
          </div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 space-y-4"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, student number, registration number, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-11 rounded-xl bg-muted/50"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px] h-11 rounded-xl bg-muted/50">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                {departments.length > 0 && (
                  <Select
                    value={departmentFilter}
                    onValueChange={setDepartmentFilter}
                  >
                    <SelectTrigger className="w-full md:w-[200px] h-11 rounded-xl bg-muted/50">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by dept" />
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
                )}
              </div>
            </div>

            {(searchQuery ||
              statusFilter !== "all" ||
              departmentFilter !== "all") && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredStudents.length} of {students.length} students
              </div>
            )}
          </motion.div>

          {/* Students Table/Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {filteredStudents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    No students found
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    departmentFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Add a student to get started"}
                  </p>
                  {!searchQuery &&
                    statusFilter === "all" &&
                    departmentFilter === "all" && (
                      <Button
                        onClick={() => setShowAddDialog(true)}
                        className="gap-2 bg-secondary"
                      >
                        <Plus className="h-4 w-4" />
                        Add First Student
                      </Button>
                    )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student, index) => {
                  const statusConfig =
                    enrollmentStatusConfig[
                      student.enrollment_status as keyof typeof enrollmentStatusConfig
                    ];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-border rounded-xl p-4 md:p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={student.avatar_url || undefined}
                                alt={student.full_name}
                              />
                              <AvatarFallback>
                                {getInitials(student.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">
                                {student.full_name}
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Student Number
                                  </p>
                                  <p className="font-medium">
                                    {student.student_number}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Reg. Number
                                  </p>
                                  <p className="font-medium">
                                    {student.registration_number || "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Department
                                  </p>
                                  <p className="font-medium">
                                    {student.department}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Year</p>
                                  <p className="font-medium">
                                    Year {student.year_of_study}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2 md:flex-col">
                          <Button
                            onClick={() =>
                              navigate(`/registrar/students/${student.id}`)
                            }
                            variant="outline"
                            size="sm"
                            className="gap-2 flex-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            onClick={() =>
                              navigate(`/registrar/students/${student.id}/edit`)
                            }
                            variant="outline"
                            size="sm"
                            className="gap-2 flex-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            onClick={() => {
                              setStudentToDelete(student);
                              setShowDeleteDialog(true);
                            }}
                            variant="destructive"
                            size="sm"
                            className="gap-2 flex-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student Record</DialogTitle>
            <DialogDescription>
              Create a new student record in the system
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student_number" className="text-sm font-medium">
                Student Number *
              </Label>
              <Input
                id="student_number"
                placeholder="e.g., 2100712345"
                value={formData.student_number}
                onChange={(e) =>
                  setFormData({ ...formData, student_number: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="registration_number"
                className="text-sm font-medium"
              >
                Registration Number
              </Label>
              <Input
                id="registration_number"
                placeholder="e.g., 21/U/12345/PS"
                value={formData.registration_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_number: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">
                Full Name *
              </Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@university.edu"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium">
                Department *
              </Label>
              <Input
                id="department"
                placeholder="e.g., Computer Science"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program" className="text-sm font-medium">
                Program / Degree
              </Label>
              <Input
                id="program"
                placeholder="e.g., Bachelor of Science"
                value={formData.program}
                onChange={(e) =>
                  setFormData({ ...formData, program: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year_of_study" className="text-sm font-medium">
                Year of Study
              </Label>
              <Select
                value={formData.year_of_study.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, year_of_study: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                  <SelectItem value="4">Year 4</SelectItem>
                  <SelectItem value="5">Year 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-secondary"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add Student
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Student Record?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the record for{" "}
              <span className="font-semibold">
                {studentToDelete?.full_name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
