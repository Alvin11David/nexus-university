import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Mail,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  updated_at: string;
  avatar_url?: string | null;
}

const enrollmentStatusConfig = {
  active: {
    color: "bg-emerald-500/10 text-emerald-600",
    label: "Active",
  },
  inactive: {
    color: "bg-gray-500/10 text-gray-600",
    label: "Inactive",
  },
  graduated: {
    color: "bg-blue-500/10 text-blue-600",
    label: "Graduated",
  },
  suspended: {
    color: "bg-red-500/10 text-red-600",
    label: "Suspended",
  },
};

export default function RegistrarStudentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StudentRecord | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const { data: studentData, error: studentError } = await supabase
        .from("student_records")
        .select("*")
        .eq("id", id)
        .single();

      if (studentError) throw studentError;

      // Fetch profile for avatar URL
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("student_record_id", id)
        .single();

      if (profileError) {
        console.warn("Could not fetch profile:", profileError);
      }

      const studentWithAvatar = {
        ...studentData,
        avatar_url: profileData?.avatar_url,
      };

      setStudent(studentWithAvatar);
      setFormData(studentWithAvatar);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch student record",
        variant: "destructive",
      });
      setTimeout(() => navigate("/registrar/students"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("student_records")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", formData.id);

      if (error) throw error;

      setStudent(formData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Student record updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update student record",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(student);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!student || !formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Student not found
            </p>
            <Button
              onClick={() => navigate("/registrar/students")}
              className="mt-4"
            >
              Back to Students
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = enrollmentStatusConfig[student.enrollment_status];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/registrar/students")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={student.avatar_url || undefined}
                    alt={student.full_name}
                  />
                  <AvatarFallback>
                    {getInitials(student.full_name)}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-xl md:text-2xl font-bold">
                  {student.full_name}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {student.student_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-secondary gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="basic" className="gap-2">
                <User className="h-4 w-4 hidden sm:inline" />
                <span>Basic Info</span>
              </TabsTrigger>
              <TabsTrigger value="enrollment" className="gap-2">
                <GraduationCap className="h-4 w-4 hidden sm:inline" />
                <span>Enrollment</span>
              </TabsTrigger>
              <TabsTrigger value="academic" className="gap-2">
                <BookOpen className="h-4 w-4 hidden sm:inline" />
                <span>Academic</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Calendar className="h-4 w-4 hidden sm:inline" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Student's basic personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Full Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{student.full_name}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Email Address
                      </Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email: e.target.value,
                            })
                          }
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium break-all">
                            {student.email}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Student Number
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.student_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              student_number: e.target.value,
                            })
                          }
                          className="rounded-lg"
                        />
                      ) : (
                        <p className="font-medium bg-muted/50 rounded-lg px-3 py-2">
                          {student.student_number}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Registration Number
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.registration_number || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              registration_number: e.target.value,
                            })
                          }
                          className="rounded-lg"
                          placeholder="e.g., 21/U/12345/PS"
                        />
                      ) : (
                        <p className="font-medium bg-muted/50 rounded-lg px-3 py-2">
                          {student.registration_number || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enrollment Tab */}
            <TabsContent value="enrollment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Information</CardTitle>
                  <CardDescription>
                    Manage student enrollment status and details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Enrollment Status
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.enrollment_status}
                          onValueChange={(value: any) =>
                            setFormData({
                              ...formData,
                              enrollment_status: value,
                            })
                          }
                        >
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="graduated">Graduated</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Date of Admission
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={
                            formData.date_of_admission?.split("T")[0] || ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              date_of_admission: e.target.value,
                            })
                          }
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {new Date(
                              student.date_of_admission
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Department</Label>
                      {isEditing ? (
                        <Input
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              department: e.target.value,
                            })
                          }
                          className="rounded-lg"
                          placeholder="e.g., Computer Science"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{student.department}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Year of Study
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.year_of_study.toString()}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              year_of_study: parseInt(value),
                            })
                          }
                        >
                          <SelectTrigger className="rounded-lg">
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
                      ) : (
                        <p className="font-medium bg-muted/50 rounded-lg px-3 py-2">
                          Year {student.year_of_study}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic Tab */}
            <TabsContent value="academic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                  <CardDescription>
                    Degree program and academic details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Program / Degree
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.program}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            program: e.target.value,
                          })
                        }
                        className="rounded-lg"
                        placeholder="e.g., Bachelor of Science"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {student.program || "Not specified"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Additional academic information can be managed through the
                      grades, transcripts, and course management modules.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Record History</CardTitle>
                  <CardDescription>
                    Important dates and record information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        Record Created
                      </p>
                      <p className="font-medium">
                        {new Date(student.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        Last Updated
                      </p>
                      <p className="font-medium">
                        {new Date(student.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-emerald-900">
                          Record Active
                        </p>
                        <p className="text-sm text-emerald-800">
                          This student record is currently active in the system.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
