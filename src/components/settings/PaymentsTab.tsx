import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  PieChart,
  BarChart3,
  Sparkles,
  ChevronRight,
  FileText,
  Building2,
  Banknote,
  Smartphone,
  Globe,
  Search,
  X,
  BookOpen,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Fee {
  id: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  semester: string;
  academic_year: string;
  description: string;
}

interface Payment {
  id: string;
  amount: number;
  paid_at: string;
  payment_method: string;
  status: string;
  transaction_ref: string;
  fee_id: string;
}

interface Course {
  id: string;
  title: string;
  code: string;
  credits: number;
  semester: string;
  year: number;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  course?: Course;
}

interface CourseFeesBreakdown {
  course: Course;
  enrollment: Enrollment;
  semesterFees: Fee[];
  totalCost: number;
  totalPaid: number;
}

export function PaymentsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courseFeesBreakdown, setCourseFeesBreakdown] = useState<
    CourseFeesBreakdown[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch fees data
      const { data: feesData, error: feesError } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", user?.id)
        .order("due_date", { ascending: false });

      // Fetch payments data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", user?.id)
        .order("paid_at", { ascending: false });

      // Fetch enrollments with course data
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          course_id,
          status,
          enrolled_at,
          courses (
            id,
            title,
            code,
            credits,
            semester,
            year
          )
        `
        )
        .eq("student_id", user?.id)
        .order("enrolled_at", { ascending: false });

      if (feesError) {
        console.error("Error fetching fees:", feesError);
      } else if (feesData) {
        setFees(feesData);
      }

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      } else if (paymentsData) {
        setPayments(paymentsData);
      }

      if (enrollmentsError) {
        console.error("Error fetching enrollments:", enrollmentsError);
      } else if (enrollmentsData) {
        const transformedEnrollments = enrollmentsData.map((e: any) => ({
          id: e.id,
          course_id: e.course_id,
          status: e.status,
          enrolled_at: e.enrolled_at,
          course: e.courses,
        }));
        setEnrollments(transformedEnrollments);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const paymentTotalsByFee = useMemo(() => {
    const map = new Map<string, number>();
    payments
      .filter((p) => p.status === "completed")
      .forEach((p) => {
        map.set(p.fee_id, (map.get(p.fee_id) || 0) + Number(p.amount));
      });
    return map;
  }, [payments]);

  const totalFees = fees.reduce((acc, f) => acc + Number(f.amount || 0), 0);
  const totalPaid = Array.from(paymentTotalsByFee.values()).reduce(
    (acc, v) => acc + v,
    0
  );
  const outstanding = Math.max(totalFees - totalPaid, 0);
  const paymentProgress = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getMethodIcon = (method: string) => {
    if (method?.toLowerCase().includes("mobile")) return Smartphone;
    if (method?.toLowerCase().includes("bank")) return Building2;
    return Globe;
  };

  const paymentMethods = [
    {
      key: "mobile-money",
      title: "Mobile Money",
      subtitle: "MTN MoMo, Airtel Money",
      timing: "Instant",
      icon: Smartphone,
      bg: "from-emerald-500 to-teal-500",
      instant: true,
    },
    {
      key: "bank-transfer",
      title: "Bank Transfer",
      subtitle: "All major banks",
      timing: "Same-day",
      icon: Banknote,
      bg: "from-primary to-primary/70",
      instant: false,
    },
    {
      key: "bank-branch",
      title: "Bank Branch",
      subtitle: "Cash deposit",
      timing: "Same-day",
      icon: Building2,
      bg: "from-amber-500 to-orange-500",
      instant: false,
    },
    {
      key: "online-portal",
      title: "Online Portal",
      subtitle: "Visa/Mastercard",
      timing: "Instant",
      icon: Globe,
      bg: "from-secondary to-secondary/70",
      instant: true,
    },
  ];

  const paymentTotalsForFee = (feeId: string) =>
    paymentTotalsByFee.get(feeId) || 0;

  const findNextOutstandingFee = () =>
    fees.find(
      (f) => Math.max(Number(f.amount || 0) - paymentTotalsForFee(f.id), 0) > 0
    );

  const handlePay = async (methodKey: string) => {
    if (!user) return;
    const method = paymentMethods.find((m) => m.key === methodKey);
    if (!method) return;

    const targetFee = findNextOutstandingFee();
    if (!targetFee) {
      toast({
        title: "No outstanding fees",
        description: "You have no unpaid balance to pay right now.",
      });
      return;
    }

    const alreadyPaid = paymentTotalsForFee(targetFee.id);
    const amount = Math.max(Number(targetFee.amount || 0) - alreadyPaid, 0);

    if (amount <= 0) {
      toast({
        title: "Nothing to pay",
        description: "Your selected fee is already fully paid.",
      });
      return;
    }

    const transactionRef = `PAY-${method.key}-${Math.floor(
      Date.now() / 1000
    )}-${Math.floor(100 + Math.random() * 900)}`;
    const status = method.instant ? "completed" : "pending";

    try {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          fee_id: targetFee.id,
          student_id: user.id,
          amount,
          payment_method: method.title,
          transaction_ref: transactionRef,
          status,
          paid_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) throw error;

      setPayments((prev) => [data as Payment, ...prev]);
      toast({
        title: method.instant ? "Payment recorded" : "Payment submitted",
        description: method.instant
          ? "Your payment has been marked completed."
          : "We received your payment request. It will be confirmed soon.",
      });
    } catch (error: any) {
      console.error("Payment error", error);
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Recompute course fee breakdown whenever fees/enrollments/payments change
  useEffect(() => {
    const paymentTotals = paymentTotalsByFee;
    const breakdown = enrollments.map((enrollment) => {
      const semesterFees = fees.filter(
        (fee) => fee.semester === enrollment.course?.semester
      );
      const totalCost = semesterFees.reduce(
        (sum, fee) => sum + Number(fee.amount || 0),
        0
      );
      const totalPaidForSemester = semesterFees.reduce(
        (sum, fee) => sum + (paymentTotals.get(fee.id) || 0),
        0
      );

      return {
        course: enrollment.course,
        enrollment,
        semesterFees,
        totalCost,
        totalPaid: totalPaidForSemester,
      };
    });
    setCourseFeesBreakdown(breakdown);
  }, [fees, enrollments, paymentTotalsByFee]);

  return (
    <div className="relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="relative space-y-8">
        {/* Stats Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Total Fees",
              value: totalFees,
              icon: Wallet,
              gradient: "from-primary to-primary/70",
              trend: null,
              prefix: "UGX ",
            },
            {
              label: "Amount Paid",
              value: totalPaid,
              icon: CheckCircle2,
              gradient: "from-emerald-500 to-teal-500",
              trend: { value: "+15%", up: true },
              prefix: "UGX ",
            },
            {
              label: "Outstanding",
              value: outstanding,
              icon: outstanding > 0 ? AlertTriangle : CheckCircle2,
              gradient:
                outstanding > 0
                  ? "from-amber-500 to-orange-500"
                  : "from-emerald-500 to-teal-500",
              trend: null,
              prefix: "UGX ",
            },
            {
              label: "Transactions",
              value: payments.length,
              icon: Receipt,
              gradient: "from-secondary to-secondary/70",
              trend: null,
              prefix: "",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="relative overflow-hidden border-0 shadow-xl bg-card/80 backdrop-blur-sm h-full">
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`}
                />
                <div
                  className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${stat.gradient} opacity-10 rounded-bl-full`}
                />

                <CardContent className="pt-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    {stat.trend && (
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-emerald-500/10 text-emerald-600 border-0"
                      >
                        {stat.trend.up ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {stat.trend.value}
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold truncate">
                    {stat.prefix}
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Payment Progress - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-r from-card via-card to-muted/30">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />

            <CardHeader className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                    <PieChart className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Payment Progress</CardTitle>
                    <CardDescription className="text-base">
                      Your fee payment completion status
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <motion.div
                    className="text-center px-6 py-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <p className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {paymentProgress.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      COMPLETED
                    </p>
                  </motion.div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative pt-2">
              {/* Custom Progress Bar */}
              <div className="relative h-6 rounded-full bg-muted/50 overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${paymentProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full"
                />
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Amount Paid
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    UGX {totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Remaining
                  </p>
                  <p className="text-xl font-bold text-amber-600">
                    UGX {outstanding.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Total Fees
                  </p>
                  <p className="text-xl font-bold text-primary">
                    UGX {totalFees.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Payment Methods</CardTitle>
                    <CardDescription>
                      Choose how you want to pay
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.title}
                    className="p-4 rounded-2xl border border-border/50 bg-muted/20 hover:border-primary/30 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`h-10 w-10 rounded-xl bg-gradient-to-br ${method.bg} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {method.timing}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{method.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {method.subtitle}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="mt-auto"
                      onClick={() => handlePay(method.key)}
                      disabled={outstanding <= 0}
                    >
                      Pay Now
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Fee Structure by Course Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Course Fee Breakdown
                      </CardTitle>
                      <CardDescription>
                        Fees for each course by semester
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">
                      Loading course data...
                    </p>
                  </div>
                ) : courseFeesBreakdown.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold text-lg mb-2">
                      No courses found
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Your enrolled courses will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {courseFeesBreakdown.map((breakdown, courseIdx) => {
                      const coursePaid = breakdown.totalPaid;
                      const courseRemaining = breakdown.totalCost - coursePaid;
                      const courseProgress =
                        breakdown.totalCost > 0
                          ? (coursePaid / breakdown.totalCost) * 100
                          : 0;

                      return (
                        <motion.div
                          key={breakdown.course?.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: courseIdx * 0.1 }}
                          className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-6 group hover:border-primary/20 transition-all"
                        >
                          {/* Decorative Background */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="relative">
                            {/* Course Header */}
                            <div className="flex items-start justify-between mb-5">
                              <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                  <Award className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">
                                      {breakdown.course?.title}
                                    </h3>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {breakdown.course?.code}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-muted-foreground">
                                      {breakdown.course?.semester}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      •
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {breakdown.course?.credits} Credits
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge
                                className={`${
                                  courseRemaining <= 0
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    : courseRemaining <
                                      breakdown.totalCost * 0.25
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                    : "bg-destructive/10 text-destructive border-destructive/30"
                                }`}
                              >
                                {courseRemaining <= 0 ? "✓ Paid" : "Pending"}
                              </Badge>
                            </div>

                            {/* Semester Fees */}
                            {breakdown.semesterFees.length > 0 ? (
                              <>
                                <div className="space-y-3 mb-5">
                                  {breakdown.semesterFees.map((fee, feeIdx) => {
                                    const paid = paymentTotalsForFee(fee.id);
                                    const isPaid = paid >= fee.amount;
                                    const isPartial =
                                      paid > 0 && paid < fee.amount;
                                    const progress =
                                      fee.amount > 0
                                        ? Math.min(
                                            (paid / fee.amount) * 100,
                                            100
                                          )
                                        : 0;

                                    return (
                                      <motion.div
                                        key={fee.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: feeIdx * 0.05 }}
                                        className="p-4 rounded-xl bg-background/50 border border-border/50"
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div>
                                            <p className="font-semibold text-sm">
                                              {fee.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Due:{" "}
                                              {new Date(
                                                fee.due_date
                                              ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-bold text-sm">
                                              UGX {fee.amount.toLocaleString()}
                                            </p>
                                            {isPartial && (
                                              <p className="text-xs text-emerald-600">
                                                Paid: UGX{" "}
                                                {paid.toLocaleString()}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        {/* Mini Progress Bar */}
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8 }}
                                            className={`h-full ${
                                              isPaid
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                : isPartial
                                                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                                : "bg-gradient-to-r from-primary to-secondary"
                                            }`}
                                          />
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>

                                {/* Course Total */}
                                <div className="pt-4 border-t border-border/50">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">
                                        Total Course Cost
                                      </p>
                                      <p className="font-bold text-lg">
                                        UGX{" "}
                                        {breakdown.totalCost.toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-emerald-600 font-semibold">
                                        Paid: UGX{" "}
                                        {breakdown.totalPaid.toLocaleString()}
                                      </p>
                                      {courseRemaining > 0 && (
                                        <p className="text-sm text-destructive font-semibold">
                                          Remaining: UGX{" "}
                                          {courseRemaining.toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Course Progress Bar */}
                                  <div className="mt-3 h-3 rounded-full bg-muted/50 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${courseProgress}%` }}
                                      transition={{ duration: 1 }}
                                      className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
                                    />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-muted-foreground text-sm">
                                  No fees associated with this course
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment History Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Payment History</CardTitle>
                      <CardDescription>
                        Your recent transactions
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-40 rounded-xl"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mb-4"></div>
                      <p className="text-muted-foreground">
                        Loading payment history...
                      </p>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="font-semibold text-lg mb-2">
                        No payments yet
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Your payment history will appear here
                      </p>
                    </div>
                  ) : (
                    payments.map((payment, i) => {
                      const MethodIcon = getMethodIcon(payment.payment_method);

                      return (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => setSelectedPayment(payment)}
                          className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-border/50 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <MethodIcon className="h-7 w-7 text-white" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-card">
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-lg">
                                UGX {payment.amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {payment.payment_method}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {payment.transaction_ref}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={getPaymentStatusColor(payment.status)}
                            >
                              {payment.status}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">
                              {new Date(payment.paid_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                            <ChevronRight className="h-5 w-5 text-muted-foreground mt-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* View All Button */}
                {payments.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-6 h-12 rounded-xl gap-2 border-dashed"
                  >
                    <FileText className="h-4 w-4" />
                    View All Transactions
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Payment Detail Modal */}
        <AnimatePresence>
          {selectedPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedPayment(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <Card className="border-0 shadow-2xl overflow-hidden">
                  {/* Receipt Header */}
                  <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-white/20 text-white border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Payment Successful
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPayment(null)}
                        className="text-white hover:bg-white/20"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-4xl font-black">
                      UGX {selectedPayment.amount.toLocaleString()}
                    </p>
                    <p className="text-white/80 text-sm mt-1">Payment Amount</p>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    {[
                      {
                        label: "Transaction Ref",
                        value: selectedPayment.transaction_ref,
                      },
                      {
                        label: "Payment Method",
                        value: selectedPayment.payment_method,
                      },
                      { label: "Status", value: selectedPayment.status },
                      {
                        label: "Date",
                        value: new Date(
                          selectedPayment.paid_at
                        ).toLocaleString(),
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button className="h-12 rounded-xl gap-2 bg-gradient-to-r from-emerald-600 to-teal-600">
                        <FileText className="h-4 w-4" />
                        View Receipt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            {
              title: "Generate PRN",
              desc: "Create payment reference",
              icon: Sparkles,
              gradient: "from-primary to-primary/70",
            },
            {
              title: "Payment Statement",
              desc: "Download full history",
              icon: FileText,
              gradient: "from-secondary to-secondary/70",
            },
            {
              title: "Contact Finance",
              desc: "Get support",
              icon: Building2,
              gradient: "from-accent to-accent/70",
            },
          ].map((action, i) => (
            <motion.div
              key={action.title}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="border-0 shadow-lg cursor-pointer overflow-hidden group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{action.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {action.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
