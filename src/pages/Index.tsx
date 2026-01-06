import { Link, Navigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Users,
  Video,
  Award,
  ArrowRight,
  Sparkles,
  Play,
  Calendar,
  CreditCard,
  ChartBar,
  Globe,
  Shield,
  Zap,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useRef } from "react";

export default function Index() {
  const { user, profile, loading } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);

  // Only use scroll effects if we're actually going to render the landing page
  const shouldRender = !loading && !(user && profile);

  const { scrollYProgress } = useScroll({
    target: shouldRender ? heroRef : null,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Redirect authenticated users to their dashboard
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && profile) {
    // Ensure we have the role before redirecting
    const destination =
      profile.role === "lecturer" ? "/lecturer" : "/dashboard";
    console.log("Redirecting to:", destination, "Role:", profile.role);
    return <Navigate to={destination} replace />;
  }

  const stats = [
    { value: "50K+", label: "Active Students" },
    { value: "2,500+", label: "Courses" },
    { value: "500+", label: "Expert Instructors" },
    { value: "98%", label: "Success Rate" },
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Smart Learning",
      desc: "AI-powered course recommendations and adaptive learning paths tailored to your goals",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Video,
      title: "Live Classes",
      desc: "Seamless Google Meet integration for real-time lectures and interactive sessions",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      desc: "Automated timetables, reminders, and deadline tracking across all your courses",
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      icon: CreditCard,
      title: "Easy Payments",
      desc: "Generate PRN, track tuition fees, and manage payments all in one place",
      color: "bg-coral/10 text-coral",
    },
    {
      icon: ChartBar,
      title: "Analytics Dashboard",
      desc: "Visualize your academic progress with beautiful charts and insights",
      color: "bg-lavender/10 text-lavender",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      desc: "Enterprise-grade security protecting your academic records and personal data",
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* Hero Section - Immersive Full Screen */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--secondary)/0.3)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--accent)/0.2)_0%,_transparent_50%)]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-[20%] w-96 h-96 rounded-full bg-secondary/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 left-[10%] w-80 h-80 rounded-full bg-accent/20 blur-3xl"
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container relative z-10 pt-20"
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card text-white/90 text-sm font-medium mb-8"
              >
                <Sparkles className="h-4 w-4 text-secondary" />
                <span>The Future of University Learning</span>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </motion.div>

              {/* Main Heading */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.1] mb-8">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="block"
                >
                  Transform Your
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="block bg-gradient-to-r from-secondary via-amber-light to-secondary bg-clip-text text-transparent"
                >
                  Academic Journey
                </motion.span>
              </h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl lg:text-2xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed"
              >
                Access courses, track grades, join live sessions, manage
                finances — all in one beautifully designed platform built for
                modern learners.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                {user ? (
                  <Button
                    size="lg"
                    asChild
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-10 h-16 rounded-2xl shadow-glow group"
                  >
                    <Link to="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      asChild
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-10 h-16 rounded-2xl shadow-glow group"
                    >
                      <Link to="/auth?mode=signup">
                        Start Learning Free
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      asChild
                      className="text-white/90 hover:text-white hover:bg-white/10 text-lg px-8 h-16 rounded-2xl group"
                    >
                      <Link to="/auth" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <Play className="h-4 w-4 ml-0.5" />
                        </div>
                        Watch Demo
                      </Link>
                    </Button>
                  </>
                )}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm md:text-base text-white/60">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 rounded-full bg-white/50" />
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-32 left-[5%] hidden xl:block"
        >
          <div className="h-20 w-20 rounded-3xl glass-card flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-white/80" />
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-48 right-[8%] hidden xl:block"
        >
          <div className="h-24 w-24 rounded-3xl bg-secondary/30 backdrop-blur-sm flex items-center justify-center">
            <Award className="h-12 w-12 text-secondary" />
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-40 left-[15%] hidden xl:block"
        >
          <div className="h-16 w-16 rounded-2xl bg-accent/30 backdrop-blur-sm flex items-center justify-center">
            <Globe className="h-8 w-8 text-accent" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 bg-muted/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--secondary)/0.05)_0%,_transparent_70%)]" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-secondary font-semibold text-sm tracking-wider uppercase mb-4">
              Why Choose UniPortal
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Everything You Need to
              <span className="block gradient-text">Excel Academically</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete learning management system with student portal
              features, designed for the modern university experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-card border border-border hover:border-secondary/30 hover-lift relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-secondary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <div
                  className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Portal Highlight */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-secondary font-semibold text-sm tracking-wider uppercase mb-4">
                Student Portal
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                Your Complete
                <span className="block text-primary">Academic Hub</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Access everything you need in one place — from viewing grades
                and timetables to managing tuition payments with generated PRNs.
              </p>

              <div className="space-y-4">
                {[
                  "View exam results and academic transcripts",
                  "Check class timetables and schedules",
                  "Generate PRN for tuition payments",
                  "Track fees and payment history",
                  "Course registration and enrollment",
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                asChild
                className="mt-10 bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-xl"
              >
                <Link to={user ? "/portal" : "/auth?mode=signup"}>
                  Access Student Portal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-accent p-1">
                <div className="w-full h-full rounded-[calc(1.5rem-4px)] bg-card p-8 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        2024/2025
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Current GPA
                      </p>
                      <p className="text-4xl font-display font-bold text-foreground">
                        4.52
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">
                        Enrolled Courses
                      </p>
                      <p className="text-2xl font-bold">6</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/10">
                      <p className="text-xs text-muted-foreground mb-1">
                        Fee Status
                      </p>
                      <p className="text-lg font-semibold text-emerald-600">
                        Cleared
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 p-4 rounded-2xl bg-card shadow-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Achievement</p>
                    <p className="font-semibold">Dean's List 2024</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--secondary)/0.2)_0%,_transparent_50%)]" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Transform Your
              <span className="block text-secondary">Learning Experience?</span>
            </h2>
            <p className="text-white/70 text-lg mb-10">
              Join thousands of students already using UniPortal to excel in
              their academic journey.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-10 h-16 rounded-2xl shadow-glow"
              >
                <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
                  {user ? "Go to Dashboard" : "Get Started Free"}
                  <Zap className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">UniPortal</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link
                to="/about"
                className="hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                to="/features"
                className="hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                to="/support"
                className="hover:text-foreground transition-colors"
              >
                Support
              </Link>
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 UniPortal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
