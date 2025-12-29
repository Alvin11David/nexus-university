import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, Copy, CheckCircle2, RefreshCw, Download, 
  AlertCircle, Clock, Sparkles, CreditCard, Shield 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface GeneratedPRN {
  code: string;
  amount: number;
  purpose: string;
  generatedAt: Date;
  expiresAt: Date;
}

export function GeneratePRNTab() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRN, setGeneratedPRN] = useState<GeneratedPRN | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentPRNs, setRecentPRNs] = useState<GeneratedPRN[]>([]);

  const purposes = [
    { value: 'tuition', label: 'Tuition Fees' },
    { value: 'functional', label: 'Functional Fees' },
    { value: 'retake', label: 'Retake Examination' },
    { value: 'supplementary', label: 'Supplementary Examination' },
    { value: 'transcript', label: 'Academic Transcript' },
    { value: 'certificate', label: 'Certificate Collection' },
    { value: 'id_card', label: 'Student ID Card' },
    { value: 'library', label: 'Library Fine' },
    { value: 'accommodation', label: 'Accommodation Fee' },
    { value: 'other', label: 'Other Services' },
  ];

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
    
    // Simulate PRN generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = purpose.substring(0, 3).toUpperCase();
    
    const newPRN: GeneratedPRN = {
      code: `PRN-${prefix}-${timestamp}-${random}`,
      amount: parseFloat(amount),
      purpose: purposes.find(p => p.value === purpose)?.label || purpose,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
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
PAYMENT REFERENCE NUMBER (PRN)
================================
PRN: ${generatedPRN.code}
Amount: UGX ${generatedPRN.amount.toLocaleString()}
Purpose: ${generatedPRN.purpose}
Generated: ${generatedPRN.generatedAt.toLocaleString()}
Expires: ${generatedPRN.expiresAt.toLocaleString()}

Student: ${profile?.full_name}
Student Number: ${profile?.student_number || 'N/A'}

This PRN is valid for 48 hours from generation.
Present this code at any payment point.
================================
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PRN-${generatedPRN.code}.txt`;
    a.click();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* PRN Generation Form */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Generate Payment Reference Number</CardTitle>
                <CardDescription>Create a PRN for any university payment</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Amount (UGX)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 text-lg font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-sm font-medium">Payment Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposes.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generatePRN}
              disabled={isGenerating}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Generating PRN...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate PRN
                </>
              )}
            </Button>

            {/* Generated PRN Display */}
            <AnimatePresence>
              {generatedPRN && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[2px]"
                >
                  <div className="relative rounded-2xl bg-background p-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Generated Successfully
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                          {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={downloadPRN}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your PRN Code</p>
                      <p className="font-mono text-2xl md:text-3xl font-bold tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {generatedPRN.code}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">Amount</p>
                        <p className="font-bold">UGX {generatedPRN.amount.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">Purpose</p>
                        <p className="font-medium">{generatedPRN.purpose}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">Generated</p>
                        <p className="font-medium">{generatedPRN.generatedAt.toLocaleTimeString()}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-muted-foreground text-xs mb-1">Expires</p>
                        <p className="font-medium text-amber-600">{generatedPRN.expiresAt.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Recent PRNs */}
        {recentPRNs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent PRNs</CardTitle>
              <CardDescription>Previously generated payment references</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPRNs.map((prn, i) => (
                  <motion.div
                    key={prn.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono font-medium text-sm">{prn.code}</p>
                        <p className="text-xs text-muted-foreground">{prn.purpose}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">UGX {prn.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {prn.expiresAt > new Date() ? 'Active' : 'Expired'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Important Note</h4>
                <p className="text-xs text-muted-foreground">
                  PRNs are valid for 48 hours. Ensure you complete payment within this period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Mobile Money', desc: 'MTN, Airtel' },
              { name: 'Bank Transfer', desc: 'All major banks' },
              { name: 'Bank Branch', desc: 'Cash deposit' },
              { name: 'Online Portal', desc: 'Card payment' },
            ].map((method) => (
              <div key={method.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{method.name}</p>
                  <p className="text-xs text-muted-foreground">{method.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Processing Time</h4>
                <p className="text-xs text-muted-foreground">
                  Payments are typically reflected within 24-48 hours after completion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
