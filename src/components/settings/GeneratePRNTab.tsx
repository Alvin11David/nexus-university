import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, Copy, CheckCircle2, RefreshCw, Download, 
  AlertCircle, Clock, Sparkles, CreditCard, Shield,
  QrCode, Share2, Zap, ArrowRight, Layers, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedPRN {
  id?: string;
  code: string;
  amount: number;
  purpose: string;
  generatedAt: Date;
  expiresAt: Date;
  fee_id?: string;
  status?: string;
}

interface Fee {
  id: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  semester: string;
  description: string;
}

export function GeneratePRNTab() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRN, setGeneratedPRN] = useState<GeneratedPRN | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentPRNs, setRecentPRNs] = useState<GeneratedPRN[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [fees, setFees] = useState<Fee[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFees();
    }
  }, [user]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', user?.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setFees(data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const purposes = [
    { value: 'tuition', label: 'Tuition Fees', icon: '🎓', amount: 2500000 },
    { value: 'functional', label: 'Functional Fees', icon: '⚡', amount: 500000 },
    { value: 'retake', label: 'Retake Examination', icon: '📝', amount: 100000 },
    { value: 'supplementary', label: 'Supplementary Exam', icon: '📋', amount: 150000 },
    { value: 'transcript', label: 'Academic Transcript', icon: '📄', amount: 50000 },
    { value: 'certificate', label: 'Certificate Collection', icon: '🏆', amount: 75000 },
    { value: 'id_card', label: 'Student ID Card', icon: '🪪', amount: 25000 },
    { value: 'library', label: 'Library Fine', icon: '📚', amount: 10000 },
    { value: 'accommodation', label: 'Accommodation Fee', icon: '🏠', amount: 1200000 },
  ];

  const handlePurposeChange = (value: string) => {
    setPurpose(value);
    const selectedPurpose = purposes.find(p => p.value === value);
    if (selectedPurpose) {
      setAmount(selectedPurpose.amount.toString());
    }
  };

  const generatePRN = async () => {
    if (!amount || !purpose) {
      toast({
        title: "Missing Information",
        description: "Please enter an amount and select a purpose",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = purpose.substring(0, 3).toUpperCase();
    
    const newPRN: GeneratedPRN = {
      code: `PRN-${prefix}-${timestamp}-${random}`,
      amount: parseFloat(amount),
      purpose: purposes.find(p => p.value === purpose)?.label || purpose,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };
    
    setGeneratedPRN(newPRN);
    setRecentPRNs(prev => [newPRN, ...prev.slice(0, 4)]);
    setIsGenerating(false);
    
    toast({
      title: "PRN Generated Successfully",
      description: "Your payment reference number is ready",
    });
  };

  const copyToClipboard = () => {
    if (generatedPRN) {
      navigator.clipboard.writeText(generatedPRN.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard!" });
    }
  };

  const downloadPRN = () => {
    if (!generatedPRN) return;
    
    const content = `
═══════════════════════════════════════════════════════════════
                    PAYMENT REFERENCE NUMBER (PRN)
═══════════════════════════════════════════════════════════════

    PRN Code:        ${generatedPRN.code}
    Amount:          UGX ${generatedPRN.amount.toLocaleString()}
    Purpose:         ${generatedPRN.purpose}
    
    Generated:       ${generatedPRN.generatedAt.toLocaleString()}
    Expires:         ${generatedPRN.expiresAt.toLocaleString()}
    
    Student:         ${profile?.full_name}
    Student Number:  ${profile?.student_number || 'N/A'}

═══════════════════════════════════════════════════════════════
    
    INSTRUCTIONS:
    • This PRN is valid for 48 hours from generation
    • Present this code at any authorized payment point
    • Keep this receipt for your records
    • Contact support if payment is not reflected in 48 hours

═══════════════════════════════════════════════════════════════
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PRN-${generatedPRN.code}.txt`;
    a.click();
  };

  const formatAmount = (value: string) => {
    const num = parseInt(value.replace(/,/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString();
  };

  return (
    <div className="relative">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative grid lg:grid-cols-3 gap-8">
        {/* Main PRN Generator */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-card via-card to-muted/50">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-secondary/10 via-accent/5 to-transparent" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/10 to-transparent" />
              <div className="absolute top-4 right-4">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                >
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary via-accent to-secondary shadow-lg shadow-secondary/30 flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-secondary-foreground" />
                  </div>
                </motion.div>
              </div>

              <CardHeader className="relative pb-2">
                <div className="space-y-1">
                  <Badge className="w-fit bg-secondary/10 text-secondary border-0 mb-2">
                    <Zap className="h-3 w-3 mr-1" />
                    Instant Generation
                  </Badge>
                  <CardTitle className="text-3xl md:text-4xl font-bold">
                    Generate PRN
                  </CardTitle>
                  <CardDescription className="text-base">
                    Create a payment reference number for university fees and services
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-8 pt-6">
                {/* Purpose Selection - Visual Grid */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Payment Type
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {purposes.map((p, i) => (
                      <motion.button
                        key={p.value}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handlePurposeChange(p.value)}
                        className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${
                          purpose === p.value 
                            ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/20' 
                            : 'border-border hover:border-secondary/50 hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{p.icon}</span>
                        <span className="text-xs font-medium block truncate">{p.label}</span>
                        {purpose === p.value && (
                          <motion.div
                            layoutId="selected"
                            className="absolute top-2 right-2 h-2 w-2 rounded-full bg-secondary"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Amount Input - Premium Style */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Amount
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                      UGX
                    </div>
                    <Input
                      type="text"
                      value={formatAmount(amount)}
                      onChange={(e) => setAmount(e.target.value.replace(/,/g, ''))}
                      className="h-20 pl-20 text-3xl font-bold text-right pr-6 border-2 rounded-2xl focus:border-secondary transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Generate Button - Premium */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={generatePRN}
                    disabled={isGenerating || !amount || !purpose}
                    className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/25 transition-all duration-300 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="h-6 w-6" />
                        </motion.div>
                        <span>Generating PRN...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-6 w-6" />
                        <span>Generate PRN</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Generated PRN Display - Ticket Style */}
          <AnimatePresence>
            {generatedPRN && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="relative">
                  {/* Ticket Shape with Notches */}
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full" />
                  <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background rounded-full" />
                  
                  <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-1 rounded-3xl shadow-2xl shadow-emerald-500/30">
                    <div className="bg-card rounded-[22px] p-8">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0">
                              Payment Reference Generated
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Valid for 48 hours
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button variant="outline" size="icon" onClick={() => setShowQR(!showQR)} className="rounded-xl">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button variant="outline" size="icon" onClick={copyToClipboard} className="rounded-xl">
                              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button variant="outline" size="icon" onClick={downloadPRN} className="rounded-xl">
                              <Download className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>

                      {/* PRN Code - Large Display */}
                      <div className="text-center py-8 px-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 mb-8">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                          Your PRN Code
                        </p>
                        <motion.p 
                          className="font-mono text-2xl md:text-4xl font-black tracking-wider"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            {generatedPRN.code}
                          </span>
                        </motion.p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Amount', value: `UGX ${generatedPRN.amount.toLocaleString()}`, icon: Wallet },
                          { label: 'Purpose', value: generatedPRN.purpose, icon: Layers },
                          { label: 'Generated', value: generatedPRN.generatedAt.toLocaleTimeString(), icon: Clock },
                          { label: 'Expires', value: generatedPRN.expiresAt.toLocaleString(), icon: AlertCircle },
                        ].map((item, i) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            className="p-4 rounded-2xl bg-muted/50 border border-border/50"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <item.icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {item.label}
                              </span>
                            </div>
                            <p className={`font-semibold truncate ${item.label === 'Expires' ? 'text-amber-600' : ''}`}>
                              {item.value}
                            </p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <Button variant="outline" className="h-12 rounded-xl gap-2">
                          <Share2 className="h-4 w-4" />
                          Share PRN
                        </Button>
                        <Button className="h-12 rounded-xl gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                          <Eye className="h-4 w-4" />
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent PRNs - Timeline Style */}
          {recentPRNs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="h-5 w-5 text-secondary" />
                    Recent PRNs
                  </CardTitle>
                  <CardDescription>Your payment reference history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-secondary via-accent to-transparent" />
                    
                    <div className="space-y-4">
                      {recentPRNs.map((prn, i) => (
                        <motion.div
                          key={prn.code}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative flex items-center gap-4 pl-12"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute left-4 h-4 w-4 rounded-full bg-secondary shadow-lg shadow-secondary/50" />
                          
                          <div className="flex-1 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors border border-border/50 group">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-mono font-bold text-sm">{prn.code}</p>
                                <p className="text-xs text-muted-foreground">{prn.purpose}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">UGX {prn.amount.toLocaleString()}</p>
                                <Badge variant={prn.expiresAt > new Date() ? "default" : "secondary"} className="text-xs">
                                  {prn.expiresAt > new Date() ? 'Active' : 'Expired'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Sidebar - Floating Cards */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/30 to-transparent rounded-bl-full" />
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Important</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      PRNs expire after 48 hours. Complete your payment before expiry to avoid regeneration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Mobile Money', desc: 'MTN MoMo, Airtel Money', color: 'from-yellow-500 to-amber-500' },
                  { name: 'Bank Transfer', desc: 'All major banks', color: 'from-blue-500 to-indigo-500' },
                  { name: 'Bank Branch', desc: 'Cash deposit', color: 'from-emerald-500 to-teal-500' },
                  { name: 'Online Portal', desc: 'Visa/Mastercard', color: 'from-purple-500 to-pink-500' },
                ].map((method, i) => (
                  <motion.div
                    key={method.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors group cursor-pointer"
                  >
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center shadow-lg`}>
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Processing Time */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Processing Time</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Payments reflect within 24-48 hours. Contact support if not updated after this period.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Helper component for Wallet icon
const Wallet = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </svg>
);
