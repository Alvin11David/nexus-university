import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  Download,
  Send,
  FileText,
  User,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Shield,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  created_at: string;
  updated_at: string;
}

interface Enrollment {
  id: string;
  course_code: string;
  course_title: string;
  credits: number;
  grade: string | number;
  semester: string;
  academic_year: string;
  enrollment_date: string;
}

const statusConfig = {
  pending: { color: "bg-amber-500/10 text-amber-600", label: "Pending" },
  processing: { color: "bg-blue-500/10 text-blue-600", label: "Processing" },
  issued: { color: "bg-emerald-500/10 text-emerald-600", label: "Issued" },
  rejected: { color: "bg-red-500/10 text-red-600", label: "Rejected" },
  cancelled: { color: "bg-gray-500/10 text-gray-600", label: "Cancelled" },
};

export default function RegistrarTranscriptDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [request, setRequest] = useState<TranscriptRequest | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingNotes, setProcessingNotes] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      fetchRequest();
      fetchEnrollments();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("transcript_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setRequest((data as TranscriptRequest) || null);
      setProcessingNotes((data as any)?.notes || "");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch transcript request",
        variant: "destructive",
      });
      setTimeout(() => navigate("/registrar/transcripts"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data: requestData } = await (supabase as any)
        .from("transcript_requests")
        .select("student_id")
        .eq("id", id)
        .single();

      if (!requestData) return;

      const { data, error } = await (supabase as any)
        .from("enrollments")
        .select(
          "id, grade, enrolled_at, status, course:courses(code, title, credits, semester, academic_year)"
        )
        .eq("student_id", requestData.student_id)
        .eq("status", "completed")
        .order("enrolled_at", { ascending: true });

      if (error) throw error;
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        course_code: row.course?.code || "",
        course_title: row.course?.title || "",
        credits: row.course?.credits || 0,
        grade: row.grade ?? "",
        semester: row.course?.semester || "",
        academic_year: row.course?.academic_year || "",
        enrollment_date: row.enrolled_at || row.enrollment_date || "",
      }));
      setEnrollments(mapped);
    } catch (error: any) {
      console.error("Failed to fetch enrollments:", error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!request) return;

    setIsProcessing(true);
    try {
      const updates: any = {
        status: newStatus,
        notes: processingNotes,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "processing") {
        updates.processed_date = new Date().toISOString();
      } else if (newStatus === "issued") {
        updates.issued_date = new Date().toISOString();
        updates.copies_issued = (request.copies_issued || 0) + 1;
      }

      const { error } = await (supabase as any)
        .from("transcript_requests")
        .update(updates)
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request status updated to ${newStatus}`,
      });

      fetchRequest();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIssueTranscript = async () => {
    if (!request) return;

    setIsProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from("transcript_requests")
        .update({
          status: "issued",
          issued_date: new Date().toISOString(),
          copies_issued: (request.copies_issued || 0) + 1,
          notes: processingNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transcript issued successfully",
      });

      setShowIssueDialog(false);
      fetchRequest();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to issue transcript",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!request || !rejectionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from("transcript_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          notes: processingNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request rejected",
      });

      setShowRejectDialog(false);
      setRejectionReason("");
      fetchRequest();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkFeesPaid = async () => {
    if (!request) return;

    setIsProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from("transcript_requests")
        .update({
          fees_paid: !request.fees_paid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: request.fees_paid ? "Marked as unpaid" : "Marked as paid",
      });

      fetchRequest();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!request) return;

    const transcriptData = {
      student: {
        name: request.student_name,
        number: request.student_number,
        email: request.student_email,
        program: request.program,
      },
      academic: {
        gpa: request.cumulative_gpa?.toFixed(2),
        credits: request.total_credits,
        graduation_date: request.graduation_date,
      },
      courses: enrollments.map((e) => ({
        code: e.course_code,
        title: e.course_title,
        credits: e.credits,
        grade: e.grade,
        semester: e.semester,
        year: e.academic_year,
      })),
      metadata: {
        verification_code: request.verification_code,
        issued_date: new Date().toISOString(),
        request_type: request.request_type,
      },
    };

    const data = JSON.stringify(transcriptData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${request.student_number}-${request.verification_code}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Transcript downloaded",
    });
  };

  const handlePrintTranscript = () => {
    window.print();
    toast({
      title: "Print",
      description: "Print dialog opened",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Request not found
            </p>
            <Button
              onClick={() => navigate("/registrar/transcripts")}
              className="mt-4"
            >
              Back to Transcripts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[request.status];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="px-4 py-4 md:px-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/registrar/transcripts")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transcripts
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {request.student_name}
                </h1>
                <Badge variant="outline" className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Student # {request.student_number} • Verification:{" "}
                <span className="font-mono">{request.verification_code}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {request.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus("processing")}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    <Loader2 className="h-4 w-4" />
                    Start Processing
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              {request.status === "processing" && (
                <Button
                  onClick={() => setShowIssueDialog(true)}
                  disabled={isProcessing || !request.fees_paid}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Issue Transcript
                </Button>
              )}
              {request.status === "issued" && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDownloadTranscript}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintTranscript}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academic">Academic Records</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Student Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{request.student_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Student Number
                    </Label>
                    <p className="font-medium">{request.student_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {request.student_email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Program</Label>
                    <p className="font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {request.program}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Request Type
                    </Label>
                    <p className="font-medium capitalize">
                      {request.request_type.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Delivery Method
                    </Label>
                    <p className="font-medium capitalize flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {request.delivery_method}
                    </p>
                  </div>
                  {request.delivery_address && (
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">
                        Delivery Address
                      </Label>
                      <p className="font-medium flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1" />
                        {request.delivery_address}
                      </p>
                    </div>
                  )}
                  {request.purpose && (
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">Purpose</Label>
                      <p className="font-medium">{request.purpose}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">
                      Requested Date
                    </Label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(request.requested_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Verification Code
                    </Label>
                    <p className="font-mono font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {request.verification_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fee Amount</Label>
                    <p className="font-medium">
                      UGX {request.fee_amount?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Payment Status
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={request.fees_paid ? "default" : "outline"}
                        className={
                          request.fees_paid
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600"
                        }
                      >
                        {request.fees_paid ? "Paid" : "Unpaid"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkFeesPaid}
                        disabled={isProcessing}
                      >
                        {request.fees_paid ? "Mark Unpaid" : "Mark Paid"}
                      </Button>
                    </div>
                  </div>
                  {request.payment_reference && (
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">
                        Payment Reference
                      </Label>
                      <p className="font-mono font-medium">
                        {request.payment_reference}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Records Tab */}
          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Academic Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label className="text-muted-foreground">
                      Cumulative GPA
                    </Label>
                    <p className="text-2xl font-bold">
                      {request.cumulative_gpa?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Total Credits
                    </Label>
                    <p className="text-2xl font-bold">
                      {request.total_credits || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Courses Completed
                    </Label>
                    <p className="text-2xl font-bold">{enrollments.length}</p>
                  </div>
                  {request.graduation_date && (
                    <div>
                      <Label className="text-muted-foreground">
                        Graduation Date
                      </Label>
                      <p className="text-sm font-medium">
                        {new Date(request.graduation_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Course List */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Code</TableHead>
                        <TableHead>Course Title</TableHead>
                        <TableHead className="text-center">Credits</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">
                              No academic records found
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        enrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-mono">
                              {enrollment.course_code}
                            </TableCell>
                            <TableCell>{enrollment.course_title}</TableCell>
                            <TableCell className="text-center">
                              {enrollment.credits}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {enrollment.grade}
                              </Badge>
                            </TableCell>
                            <TableCell>{enrollment.semester}</TableCell>
                            <TableCell>{enrollment.academic_year}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant="outline" className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Copies Issued
                    </Label>
                    <p className="font-medium">{request.copies_issued || 0}</p>
                  </div>
                  {request.processed_date && (
                    <div>
                      <Label className="text-muted-foreground">
                        Processed Date
                      </Label>
                      <p className="font-medium">
                        {new Date(request.processed_date).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {request.issued_date && (
                    <div>
                      <Label className="text-muted-foreground">
                        Issued Date
                      </Label>
                      <p className="font-medium">
                        {new Date(request.issued_date).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Processing Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this request..."
                    value={processingNotes}
                    onChange={(e) => setProcessingNotes(e.target.value)}
                    rows={5}
                  />
                  <Button
                    onClick={() => {
                      const client = supabase as any;
                      return client
                        .from("transcript_requests")
                        .update({ notes: processingNotes })
                        .eq("id", request.id)
                        .then(() =>
                          toast({
                            title: "Success",
                            description: "Notes saved",
                          })
                        );
                    }}
                    size="sm"
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Notes
                  </Button>
                </div>

                {request.rejection_reason && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <Label className="text-destructive">Rejection Reason</Label>
                    <p className="mt-2">{request.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Issue Transcript Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Transcript</DialogTitle>
            <DialogDescription>
              Confirm that you want to issue this transcript. This action will
              mark the request as completed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">{request.student_name}</p>
              <p className="text-sm text-muted-foreground">
                Student # {request.student_number}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.request_type.replace("_", " ").toUpperCase()}
              </p>
            </div>
            {!request.fees_paid && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  ⚠️ Fees have not been marked as paid
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowIssueDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueTranscript}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Issue Transcript
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transcript request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                placeholder="e.g., Incomplete documentation, unpaid fees, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRequest}
              disabled={isProcessing || !rejectionReason.trim()}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Reject Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
