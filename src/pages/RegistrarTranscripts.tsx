import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  FileText,
  Download,
  Clock,
  AlertCircle,
  Send,
  Package,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TranscriptRequest {
  id: string;
  student_id: string;
  student_number: string;
  student_name: string;
  student_email: string;
  request_type: "official" | "unofficial" | "certified_copy";
  status: "pending" | "processing" | "issued" | "rejected" | "cancelled";
  purpose: string;
  delivery_method: "pickup" | "email" | "courier" | "postal";
  delivery_address: string;
  program: string;
  graduation_date: string;
  cumulative_gpa: number;
  total_credits: number;
  requested_date: string;
  processed_date: string;
  issued_date: string;
  fees_paid: boolean;
  fee_amount: number;
  payment_reference: string;
  copies_issued: number;
  verification_code: string;
  notes: string;
  rejection_reason: string;
}

interface StudentRecord {
  id: string;
  student_number: string;
  full_name: string;
  email: string;
  enrollment_status: string;
}

const statusConfig = {
  pending: {
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    label: "Pending",
    icon: Clock,
  },
  processing: {
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    label: "Processing",
    icon: Loader2,
  },
  issued: {
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    label: "Issued",
    icon: CheckCircle,
  },
  rejected: {
    color: "bg-red-500/10 text-red-600 border-red-200",
    label: "Rejected",
    icon: XCircle,
  },
  cancelled: {
    color: "bg-gray-500/10 text-gray-600 border-gray-200",
    label: "Cancelled",
    icon: AlertCircle,
  },
};

const requestTypeConfig = {
  official: { label: "Official Transcript", color: "text-blue-600" },
  unofficial: { label: "Unofficial Transcript", color: "text-gray-600" },
  certified_copy: { label: "Certified Copy", color: "text-purple-600" },
};

const deliveryMethodConfig = {
  pickup: { label: "Pickup", icon: Package },
  email: { label: "Email", icon: Send },
  courier: { label: "Courier", icon: Package },
  postal: { label: "Postal", icon: Send },
};

export default function RegistrarTranscripts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TranscriptRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TranscriptRequest[]>(
    []
  );
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    request_type: "official" as "official" | "unofficial" | "certified_copy",
    purpose: "",
    delivery_method: "email" as "pickup" | "email" | "courier" | "postal",
    delivery_address: "",
    fee_amount: 50.0,
  });

  useEffect(() => {
    fetchRequests();
    fetchStudents();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery, statusFilter, typeFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("transcript_requests")
        .select("*")
        .order("requested_date", { ascending: false });

      if (error) throw error;
      setRequests((data as TranscriptRequest[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch transcript requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("student_records")
        .select("id, student_number, full_name, email, enrollment_status")
        .eq("enrollment_status", "active")
        .order("full_name");

      if (error) throw error;
      setStudents((data as StudentRecord[]) || []);
    } catch (error: any) {
      console.error("Failed to fetch students:", error);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.student_name.toLowerCase().includes(query) ||
          r.student_number.toLowerCase().includes(query) ||
          r.verification_code?.toLowerCase().includes(query) ||
          r.student_email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.request_type === typeFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || !formData.request_type) {
      toast({
        title: "Validation Error",
        description: "Please select a student and request type",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get student details
      const student = students.find((s) => s.id === formData.student_id);
      if (!student) throw new Error("Student not found");

      // Get student academic info
      const { data: enrollments, error: enrollError } = await (supabase as any)
        .from("enrollments")
        .select("grade, course:courses(credits)")
        .eq("student_id", formData.student_id)
        .eq("status", "completed");

      let totalCredits = 0;
      let totalGradePoints = 0;
      let cumulativeGpa = 0;

      if (!enrollError && enrollments) {
        enrollments.forEach((e: any) => {
          const credits = e.course?.credits || 0;
          if (credits) totalCredits += credits;
          const grade = e.grade;
          if (grade !== null && grade !== undefined && credits) {
            const gradePoints = getGradePoints(grade);
            totalGradePoints += gradePoints * credits;
          }
        });
        if (totalCredits > 0) {
          cumulativeGpa = totalGradePoints / totalCredits;
        }
      }

      const { error } = await (supabase as any)
        .from("transcript_requests")
        .insert({
          student_id: formData.student_id,
          student_number: student.student_number,
          student_name: student.full_name,
          student_email: student.email,
          request_type: formData.request_type,
          purpose: formData.purpose,
          delivery_method: formData.delivery_method,
          delivery_address: formData.delivery_address,
          program: (student as any).program || "",
          cumulative_gpa: cumulativeGpa,
          total_credits: totalCredits,
          fee_amount: formData.fee_amount,
          fees_paid: false,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transcript request created successfully",
      });

      setShowAddDialog(false);
      setFormData({
        student_id: "",
        request_type: "official",
        purpose: "",
        delivery_method: "email",
        delivery_address: "",
        fee_amount: 50.0,
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create transcript request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGradePoints = (grade: string | number): number => {
    if (typeof grade === "number") {
      // simple numeric to GPA mapping fallback
      if (grade >= 80) return 4;
      if (grade >= 75) return 3.7;
      if (grade >= 70) return 3.3;
      if (grade >= 65) return 3.0;
      if (grade >= 60) return 2.7;
      if (grade >= 55) return 2.3;
      if (grade >= 50) return 2.0;
      if (grade >= 45) return 1.7;
      if (grade >= 40) return 1.3;
      if (grade >= 35) return 1.0;
      return 0;
    }
    const gradeMap: { [key: string]: number } = {
      A: 4.0,
      "A-": 3.7,
      "B+": 3.3,
      B: 3.0,
      "B-": 2.7,
      "C+": 2.3,
      C: 2.0,
      "C-": 1.7,
      "D+": 1.3,
      D: 1.0,
      F: 0.0,
    };
    return gradeMap[grade] || 0;
  };

  const handleViewRequest = (id: string) => {
    navigate(`/registrar/transcripts/${id}`);
  };

  const handleDownloadRequest = (request: TranscriptRequest) => {
    const data = JSON.stringify(request, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-request-${request.student_number}-${request.verification_code}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      label: "Total Requests",
      value: requests.length,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      label: "Pending",
      value: requests.filter((r) => r.status === "pending").length,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Processing",
      value: requests.filter((r) => r.status === "processing").length,
      icon: Loader2,
      color: "text-blue-600",
    },
    {
      label: "Issued",
      value: requests.filter((r) => r.status === "issued").length,
      icon: CheckCircle,
      color: "text-emerald-600",
    },
  ];

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
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span
              className="hover:text-foreground cursor-pointer"
              onClick={() => navigate("/registrar")}
            >
              Registrar
            </span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Transcripts</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Academic Transcripts
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage transcript requests and issuance
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, number, or verification code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="official">Official</SelectItem>
                  <SelectItem value="unofficial">Unofficial</SelectItem>
                  <SelectItem value="certified_copy">Certified Copy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRequests.length} of {requests.length} requests
          </p>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  No transcript requests found
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first transcript request"}
                </p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request, index) => {
              const statusInfo = statusConfig[request.status];
              const typeInfo = requestTypeConfig[request.request_type];
              const deliveryInfo =
                deliveryMethodConfig[request.delivery_method];
              const DeliveryIcon = deliveryInfo.icon;

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleViewRequest(request.id)}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-foreground truncate">
                                  {request.student_name}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={statusInfo.color}
                                >
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="font-medium">
                                    Student #:
                                  </span>
                                  <span>{request.student_number}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="font-medium">
                                    Verification:
                                  </span>
                                  <span className="font-mono">
                                    {request.verification_code}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-medium ${typeInfo.color}`}
                                  >
                                    {typeInfo.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <DeliveryIcon className="h-4 w-4" />
                                  <span>{deliveryInfo.label}</span>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                Requested:{" "}
                                {new Date(
                                  request.requested_date
                                ).toLocaleDateString()}
                              </div>
                              {request.purpose && (
                                <div className="mt-1 text-sm text-muted-foreground">
                                  Purpose: {request.purpose}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRequest(request.id);
                            }}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadRequest(request);
                            }}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
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

      {/* Add Request Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Transcript Request</DialogTitle>
            <DialogDescription>
              Create a new transcript request for a student
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRequest}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, student_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.student_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request_type">Request Type *</Label>
                <Select
                  value={formData.request_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, request_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="official">
                      Official Transcript
                    </SelectItem>
                    <SelectItem value="unofficial">
                      Unofficial Transcript
                    </SelectItem>
                    <SelectItem value="certified_copy">
                      Certified Copy
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Graduate school application, employment verification..."
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_method">Delivery Method *</Label>
                <Select
                  value={formData.delivery_method}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, delivery_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="courier">Courier</SelectItem>
                    <SelectItem value="postal">Postal Mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.delivery_method === "courier" ||
                formData.delivery_method === "postal") && (
                <div className="space-y-2">
                  <Label htmlFor="delivery_address">Delivery Address</Label>
                  <Textarea
                    id="delivery_address"
                    placeholder="Enter full delivery address..."
                    value={formData.delivery_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delivery_address: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fee_amount">Fee Amount (UGX)</Label>
                <Input
                  id="fee_amount"
                  type="number"
                  step="0.01"
                  value={formData.fee_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fee_amount: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
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
                    Creating...
                  </>
                ) : (
                  "Create Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
