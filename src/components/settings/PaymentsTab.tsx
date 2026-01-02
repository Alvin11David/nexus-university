import { useState, useEffect } from "react";
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
  Smartphone,
  Globe,
  Search,
  X,
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

export function PaymentsTab() {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
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
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalFees = fees.reduce((acc, f) => acc + f.amount, 0);
  const totalPaid = fees.reduce((acc, f) => acc + (f.paid_amount || 0), 0);
  const outstanding = totalFees - totalPaid;
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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Fee Structure Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Fee Structure</CardTitle>
                      <CardDescription>Breakdown of your fees</CardDescription>
                    </div>
                  </div>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-36 rounded-xl">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                      <SelectItem value="2023/2024">2023/2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                      <p className="text-muted-foreground">
                        Loading fee data...
                      </p>
                    </div>
                  ) : fees.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="font-semibold text-lg mb-2">
                        No fees found
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Check back later for your fee structure
                      </p>
                    </div>
                  ) : (
                    fees.map((fee, i) => {
                      const isPaid = fee.paid_amount >= fee.amount;
                      const isPartial =
                        fee.paid_amount > 0 && fee.paid_amount < fee.amount;
                      const progress = (fee.paid_amount / fee.amount) * 100;

                      return (
                        <motion.div
                          key={fee.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{
                            scale: 1.01,
                            transition: { duration: 0.2 },
                          }}
                          className="relative p-5 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all border border-border/50 group"
                        >
                          {/* Progress Background */}
                          <div
                            className={`absolute inset-0 rounded-2xl opacity-20 ${
                              isPaid
                                ? "bg-gradient-to-r from-emerald-500/30 to-transparent"
                                : isPartial
                                ? "bg-gradient-to-r from-amber-500/30 to-transparent"
                                : "bg-gradient-to-r from-destructive/30 to-transparent"
                            }`}
                            style={{ width: `${progress}%` }}
                          />

                          <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-bold text-lg">
                                  {fee.description}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {fee.semester} • {fee.academic_year}
                                </p>
                              </div>
                              <Badge
                                className={`${
                                  isPaid
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    : isPartial
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                    : "bg-destructive/10 text-destructive border-destructive/30"
                                }`}
                              >
                                {isPaid
                                  ? "✓ Paid"
                                  : isPartial
                                  ? "Partial"
                                  : "Unpaid"}
                              </Badge>
                            </div>

                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Due:{" "}
                                  {new Date(fee.due_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                                {isPartial && (
                                  <p className="text-sm">
                                    <span className="text-emerald-600 font-semibold">
                                      UGX {fee.paid_amount.toLocaleString()}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {" "}
                                      / {fee.amount.toLocaleString()}
                                    </span>
                                  </p>
                                )}
                              </div>
                              <p className="text-2xl font-black">
                                UGX {fee.amount.toLocaleString()}
                              </p>
                            </div>

                            {/* Progress Bar for Partial */}
                            {isPartial && (
                              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
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
                  {payments.map((payment, i) => {
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
                  })}
                </div>

                {/* View All Button */}
                <Button
                  variant="outline"
                  className="w-full mt-6 h-12 rounded-xl gap-2 border-dashed"
                >
                  <FileText className="h-4 w-4" />
                  View All Transactions
                </Button>
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
