import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  FileText,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export default function RegistrarDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({
    students: "...",
    programs: "...",
    transcripts: "...",
    pending: "...",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCounts();
  }, [user, navigate]);

  const fetchCounts = async () => {
    try {
      const studentsQuery = query(collection(db, "student_records"));
      const programsQuery = query(collection(db, "programs"));
      const transcriptsQuery = query(
        collection(db, "transcript_requests"),
        where("status", "==", "issued")
      );
      const pendingQuery = query(
        collection(db, "enrollments"),
        where("status", "==", "pending")
      );

      const [studentsSnap, programsSnap, transcriptsSnap, pendingSnap] =
        await Promise.all([
          getCountFromServer(studentsQuery),
          getCountFromServer(programsQuery),
          getCountFromServer(transcriptsQuery),
          getCountFromServer(pendingQuery),
        ]);

      setCounts({
        students: studentsSnap.data().count.toLocaleString(),
        programs: programsSnap.data().count.toLocaleString(),
        transcripts: transcriptsSnap.data().count.toLocaleString(),
        pending: pendingSnap.data().count.toLocaleString(),
      });
    } catch (error) {
      console.error("Error fetching dashboard counts:", error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const navigationItems = [
    { icon: Home, label: "Dashboard", href: "/registrar" },
    { icon: Users, label: "Students", href: "/registrar/students" },
    { icon: BookOpen, label: "Enrollments", href: "/registrar/enrollments" },
    { icon: GraduationCap, label: "Programs", href: "/registrar/programs" },
    { icon: Calendar, label: "Calendar", href: "/registrar/calendar" },
    { icon: FileText, label: "Transcripts", href: "/registrar/transcripts" },
    { icon: BarChart3, label: "Reports", href: "/registrar/reports" },
    { icon: Settings, label: "Settings", href: "/registrar/settings" },
  ];

  const stats = [
    {
      label: "Total Students",
      value: counts.students,
      icon: Users,
      color: "bg-blue-500/10",
    },
    {
      label: "Programs",
      value: counts.programs,
      icon: GraduationCap,
      color: "bg-purple-500/10",
    },
    {
      label: "Transcripts Issued",
      value: counts.transcripts,
      icon: FileText,
      color: "bg-green-500/10",
    },
    {
      label: "Pending Approvals",
      value: counts.pending,
      icon: CheckCircle2,
      color: "bg-orange-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <h1 className="text-xl md:text-2xl font-bold">Registrar Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || user?.email}
            </span>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -250 }}
          animate={{ x: sidebarOpen ? 0 : -250 }}
          transition={{ duration: 0.3 }}
          className="fixed md:static w-64 h-[calc(100vh-64px)] bg-muted/50 border-r border-border p-4 md:translate-x-0 z-30 overflow-y-auto"
        >
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
              <p className="text-muted-foreground">
                Here's what's happening with your institution today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${stat.color} border border-border rounded-xl p-6 backdrop-blur`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl md:text-3xl font-bold">
                        {stat.value}
                      </p>
                    </div>
                    <stat.icon className="h-8 w-8 opacity-50" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-border rounded-xl p-6 bg-muted/20 backdrop-blur"
            >
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigate("/registrar/students")}
                  variant="outline"
                  className="justify-start h-auto py-3"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="font-medium">Manage Students</p>
                    <p className="text-xs text-muted-foreground">
                      View and update student records
                    </p>
                  </div>
                </Button>
                <Button
                  onClick={() => navigate("/registrar/transcripts")}
                  variant="outline"
                  className="justify-start h-auto py-3"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="font-medium">Transcripts</p>
                    <p className="text-xs text-muted-foreground">
                      Issue and manage transcripts
                    </p>
                  </div>
                </Button>
                <Button
                  onClick={() => navigate("/registrar/reports")}
                  variant="outline"
                  className="justify-start h-auto py-3"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="font-medium">Reports</p>
                    <p className="text-xs text-muted-foreground">
                      View analytics and reports
                    </p>
                  </div>
                </Button>
              </div>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 border border-secondary/20 rounded-xl p-6 bg-secondary/5 backdrop-blur"
            >
              <div className="flex gap-4">
                <BookOpen className="h-5 w-5 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Module Coming Soon</h4>
                  <p className="text-sm text-muted-foreground">
                    Additional registrar features and management tools are being
                    developed. Check back soon for updates!
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
