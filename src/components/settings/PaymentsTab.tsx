import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Receipt, CheckCircle2, Clock, AlertTriangle,
  Download, Eye, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  Calendar, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
}

export function PaymentsTab() {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('all');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [feesRes, paymentsRes] = await Promise.all([
        supabase
          .from('fees')
          .select('*')
          .eq('student_id', user?.id)
          .order('due_date', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('student_id', user?.id)
          .order('paid_at', { ascending: false })
      ]);

      if (feesRes.data) setFees(feesRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching payment data:', error);
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
      case 'completed': return 'bg-emerald-500/10 text-emerald-600';
      case 'pending': return 'bg-amber-500/10 text-amber-600';
      case 'failed': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Fees', 
            value: `UGX ${totalFees.toLocaleString()}`, 
            icon: Wallet, 
            color: 'text-primary',
            bg: 'bg-primary/10',
            trend: null
          },
          { 
            label: 'Amount Paid', 
            value: `UGX ${totalPaid.toLocaleString()}`, 
            icon: CheckCircle2, 
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            trend: { value: '+15%', up: true }
          },
          { 
            label: 'Outstanding', 
            value: `UGX ${outstanding.toLocaleString()}`, 
            icon: outstanding > 0 ? AlertTriangle : CheckCircle2, 
            color: outstanding > 0 ? 'text-amber-500' : 'text-emerald-500',
            bg: outstanding > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
            trend: null
          },
          { 
            label: 'Transactions', 
            value: payments.length.toString(), 
            icon: Receipt, 
            color: 'text-secondary',
            bg: 'bg-secondary/10',
            trend: null
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  {stat.trend && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      {stat.trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {stat.trend.value}
                    </Badge>
                  )}
                </div>
                <p className="text-xl font-bold truncate">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Progress */}
      <Card className="bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Payment Progress</CardTitle>
              <CardDescription>Your fee payment completion status</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg font-bold">
              {paymentProgress.toFixed(0)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={paymentProgress} className="h-4 mb-4" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Paid: <span className="font-semibold text-emerald-600">UGX {totalPaid.toLocaleString()}</span>
            </span>
            <span className="text-muted-foreground">
              Remaining: <span className="font-semibold text-amber-600">UGX {outstanding.toLocaleString()}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fee Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Fee Structure</CardTitle>
                <CardDescription>Breakdown of your fees</CardDescription>
              </div>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {fees.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No fees recorded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fees.map((fee, i) => {
                  const isPaid = fee.paid_amount >= fee.amount;
                  const isPartial = fee.paid_amount > 0 && fee.paid_amount < fee.amount;
                  
                  return (
                    <motion.div
                      key={fee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{fee.description || 'Tuition Fee'}</p>
                          <p className="text-xs text-muted-foreground">
                            {fee.semester} {fee.academic_year}
                          </p>
                        </div>
                        <Badge className={`${
                          isPaid ? 'bg-emerald-500/10 text-emerald-600' :
                          isPartial ? 'bg-amber-500/10 text-amber-600' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Due: {new Date(fee.due_date).toLocaleDateString()}
                        </span>
                        <span className="font-bold">UGX {fee.amount.toLocaleString()}</span>
                      </div>
                      {isPartial && (
                        <div className="mt-2">
                          <Progress value={(fee.paid_amount / fee.amount) * 100} className="h-1" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Paid: UGX {fee.paid_amount.toLocaleString()} / {fee.amount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Payment History</CardTitle>
                <CardDescription>Your recent transactions</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No payments made yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment, i) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">UGX {payment.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.payment_method || 'Bank Transfer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.paid_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
