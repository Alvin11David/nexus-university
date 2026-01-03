import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  BookOpen,
  Award,
  Users,
  Sparkles,
  CheckCircle2,
  IdCard,
  Hash,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type AuthStep =
  | "signin"
  | "signup-details"
  | "lecturer-personal-details"
  | "signup-otp"
  | "signup-password";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup";
  const [step, setStep] = useState<AuthStep>(
    initialMode ? "signup-details" : "signin"
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [studentRecord, setStudentRecord] = useState<any>(null);
  const [isLecturerSignup, setIsLecturerSignup] = useState(false); // Auto-detect based on email
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState({
    identifier: "", // student number or registration number for sign in
    email: "",
    password: "",
    registrationNumber: "",
    studentNumber: "",
    firstName: "",
    lastName: "",
    department: "",
  });

  const {
    signIn,
    signUp,
    signInWithStudentId,
    validateStudent,
    generateOTP,
    verifyOTP,
  } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isSignUp = step !== "signin";

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleLecturerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate OTP for lecturer
      const { otp, error: otpError } = await generateOTP(formData.email, null);
      if (otpError) throw otpError;

      setGeneratedOtp(otp);
      setStudentRecord({
        id: null,
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        department: formData.department,
      });

      toast({
        title: "OTP Sent (Demo Mode)",
        description: `Your verification code is: ${otp}`,
        duration: 10000,
      });

      setStep("signup-otp");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signInWithStudentId(
        formData.identifier,
        formData.password
      );
      if (error) throw error;
      toast({ title: "Welcome back!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Auto-detect if email is lecturer format
      const emailPattern = /^[a-z]+\.[a-z]+@lecturer\.com$/i;
      const isLecturer = emailPattern.test(formData.email);

      if (isLecturer) {
        // Validate email format: surname.othernames@lecturer.com
        if (!emailPattern.test(formData.email)) {
          throw new Error(
            "Email must be in format: surname.othernames@lecturer.com"
          );
        }

        // Set lecturer flag and move to personal details step
        setIsLecturerSignup(true);
        setStep("lecturer-personal-details");
        setLoading(false);
        return;
      }

      // For students: validate against student records
      const { data, error } = await validateStudent(
        formData.registrationNumber,
        formData.studentNumber,
        formData.email
      );
      if (error) throw error;

      setStudentRecord(data);

      // Generate OTP (mock - shown in toast for testing)
      const { otp, error: otpError } = await generateOTP(
        formData.email,
        data!.id
      );
      if (otpError) throw otpError;

      setGeneratedOtp(otp);

      // Show OTP in toast for testing
      toast({
        title: "OTP Sent (Demo Mode)",
        description: `Your verification code is: ${otp}`,
        duration: 10000,
      });

      setStep("signup-otp");
    } catch (error: any) {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const enteredOtp = otpValues.join("");

    try {
      const { valid, error } = await verifyOTP(formData.email, enteredOtp);
      if (error) throw error;

      if (valid) {
        toast({
          title: "Email Verified!",
          description: "Please set your password.",
        });
        setStep("signup-password");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        studentRecord?.full_name || (isLecturerSignup ? "Lecturer" : "Student"),
        isLecturerSignup ? undefined : formData.registrationNumber,
        isLecturerSignup ? undefined : formData.studentNumber,
        isLecturerSignup ? "lecturer" : "student"
      );
      if (error) {
        // If user already exists, provide helpful guidance
        if (
          error.message.includes("already exists") ||
          error.message.includes("already registered")
        ) {
          toast({
            title: "Account Already Exists",
            description:
              error.message ||
              "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
            duration: 6000,
          });
          // Optionally redirect to sign in after a delay
          setTimeout(() => {
            setStep("signin");
            setFormData((prev) => ({
              ...prev,
              identifier: formData.email,
              password: "",
            }));
          }, 2000);
          return;
        }
        throw error;
      }

      toast({
        title: "Account Created!",
        description: "Welcome to UniPortal.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToSignIn = () => {
    setStep("signin");
    setOtpValues(["", "", "", ""]);
    setGeneratedOtp("");
    setStudentRecord(null);
    setFormData({
      identifier: "",
      email: "",
      password: "",
      registrationNumber: "",
      studentNumber: "",
      firstName: "",
      lastName: "",
      department: "",
    });
  };

  const resetToSignUp = () => {
    setStep("signup-details");
    setOtpValues(["", "", "", ""]);
    setGeneratedOtp("");
    setStudentRecord(null);
    setFormData({
      identifier: "",
      email: "",
      password: "",
      registrationNumber: "",
      studentNumber: "",
      firstName: "",
      lastName: "",
      department: "",
    });
  };

  const benefits = [
    { icon: BookOpen, text: "Access 2,500+ courses" },
    { icon: Award, text: "Track grades & achievements" },
    { icon: Users, text: "Join live sessions" },
  ];

  const renderStepIndicator = () => {
    if (step === "signin") return null;

    const steps = isLecturerSignup
      ? [
          { key: "signup-details", label: "Email" },
          { key: "lecturer-personal-details", label: "Details" },
          { key: "signup-otp", label: "Verify" },
          { key: "signup-password", label: "Password" },
        ]
      : [
          { key: "signup-details", label: "Details" },
          { key: "signup-otp", label: "Verify" },
          { key: "signup-password", label: "Password" },
        ];

    const currentIndex = steps.findIndex((s) => s.key === step);

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                i <= currentIndex
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  i < currentIndex ? "bg-secondary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderForm = () => {
    switch (step) {
      case "signin":
        return (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium">
                Student / Registration Number or Email
              </Label>
              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="identifier"
                  placeholder="21/U/12345/PS, 2100712345 or email"
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  className="h-14 pl-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-secondary hover:text-secondary/80 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-14 pl-12 pr-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl shadow-glow group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        );

      case "signup-details":
        return (
          <form onSubmit={handleValidateStudent} className="space-y-5">
            {!formData.email.endsWith("@lecturer.com") && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="registrationNumber"
                    className="text-sm font-medium"
                  >
                    Registration Number
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="registrationNumber"
                      placeholder="21/U/12345/PS"
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationNumber: e.target.value,
                        })
                      }
                      className="h-14 pl-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="studentNumber"
                    className="text-sm font-medium"
                  >
                    Student Number
                  </Label>
                  <div className="relative">
                    <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="studentNumber"
                      placeholder="2100712345"
                      value={formData.studentNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          studentNumber: e.target.value,
                        })
                      }
                      className="h-14 pl-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-14 pl-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                />
              </div>
              {formData.email.endsWith("@lecturer.com") && (
                <p className="text-xs text-muted-foreground mt-1 ml-1">
                  Lecturer email detected - you'll be asked for personal details
                  next
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80">
                {formData.email.endsWith("@lecturer.com")
                  ? "Lecturer registration: Enter email in format surname.othernames@lecturer.com"
                  : "We'll verify you're a registered student by checking your registration and student numbers against our records."}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl shadow-glow group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        );

      case "lecturer-personal-details":
        return (
          <form onSubmit={handleLecturerDetails} className="space-y-5">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Personal Details</h3>
              <p className="text-muted-foreground text-sm">
                Please provide your information
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="h-14 pl-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="h-14 pl-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium">
                Department
              </Label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="department"
                  placeholder="Computer Science"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="h-14 pl-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span>{" "}
                {formData.email}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl shadow-glow group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue to Verification
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        );

      case "signup-otp":
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Enter Verification Code
              </h3>
              <p className="text-muted-foreground text-sm">
                We've sent a 4-digit code to{" "}
                <span className="font-medium text-foreground">
                  {formData.email}
                </span>
              </p>
            </div>

            <div className="flex justify-center gap-3">
              {otpValues.map((value, index) => (
                <Input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="h-16 w-16 text-center text-2xl font-bold rounded-xl bg-muted/50 border-border focus:bg-background focus:border-secondary transition-all"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl shadow-glow group"
              disabled={loading || otpValues.some((v) => !v)}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify Code
                  <CheckCircle2 className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={() => {
                  toast({
                    title: "OTP Resent (Demo Mode)",
                    description: `Your verification code is: ${generatedOtp}`,
                    duration: 10000,
                  });
                }}
                className="text-secondary font-medium hover:text-secondary/80"
              >
                Resend
              </button>
            </p>
          </form>
        );

      case "signup-password":
        return (
          <form onSubmit={handleCreateAccount} className="space-y-5">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Verified!</h3>
              <p className="text-muted-foreground text-sm">
                Welcome,{" "}
                <span className="font-medium text-foreground">
                  {studentRecord?.full_name}
                </span>
                . Set your password to complete registration.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Create Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-14 pl-12 pr-12 text-base rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80">
                By creating an account, you agree to our Terms of Service and
                Privacy Policy
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl shadow-glow group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Decorative */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden"
      >
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--secondary)/0.3)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)/0.2)_0%,_transparent_50%)]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-[20%] w-72 h-72 rounded-full bg-secondary/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 left-[10%] w-60 h-60 rounded-full bg-accent/20 blur-3xl"
        />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-20 w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-white">
              UniPortal
            </span>
          </Link>

          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-8">
                <Sparkles className="h-4 w-4 text-secondary" />
                <span>Join 50,000+ students</span>
              </div>

              <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                Your Gateway to
                <span className="block text-secondary">
                  Academic Excellence
                </span>
              </h1>

              <p className="text-lg text-white/70 mb-10">
                Access courses, manage your schedule, track grades, and connect
                with classmates — all in one powerful platform.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 text-secondary" />
                    </div>
                    <span className="text-white/90">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-primary bg-gradient-to-br from-secondary to-accent"
                  style={{ zIndex: 5 - i }}
                />
              ))}
            </div>
            <div className="text-white/70 text-sm">
              <span className="text-white font-semibold">4.9★</span> from
              10,000+ reviews
            </div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-32 right-16 hidden xl:block"
        >
          <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-white/80" />
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-40 right-24 hidden xl:block"
        >
          <div className="h-20 w-20 rounded-2xl bg-secondary/30 backdrop-blur-sm flex items-center justify-center">
            <Award className="h-10 w-10 text-secondary" />
          </div>
        </motion.div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">UniPortal</span>
          </Link>

          {/* Back button for multi-step */}
          {step !== "signin" && step !== "signup-details" && (
            <button
              onClick={() =>
                setStep(step === "signup-otp" ? "signup-details" : "signup-otp")
              }
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              {step === "signin"
                ? "Welcome back"
                : step === "signup-details"
                ? "Create an account"
                : step === "signup-otp"
                ? "Verify your email"
                : "Set your password"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {step === "signin"
                ? "Sign in with your student credentials"
                : step === "signup-details"
                ? "Verify your student identity to get started"
                : step === "signup-otp"
                ? "Enter the code sent to your email"
                : "Almost there! Create a secure password"}
            </p>
          </div>

          {/* Render Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderForm()}
            </motion.div>
          </AnimatePresence>

          {/* Toggle */}
          <p className="text-center text-muted-foreground mt-8">
            {step === "signin"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              onClick={() =>
                step === "signin" ? resetToSignUp() : resetToSignIn()
              }
              className="text-secondary font-semibold hover:text-secondary/80 transition-colors"
            >
              {step === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
