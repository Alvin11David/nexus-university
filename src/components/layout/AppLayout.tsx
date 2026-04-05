import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Zap,
  BookOpen,
  Calendar,
  Megaphone,
  Clipboard,
  Award,
  Mail,
  Settings,
  BarChart3,
  FileText,
  HelpCircle,
  Users,
  MessageCircle,
  Target,
  CheckCircle,
  Calculator,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { db } from "@/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface AppLayoutProps {
  children: React.ReactNode;
}

const studentNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: Zap },
  { label: "Programs", href: "/programs", icon: BookOpen },
  { label: "Calendar", href: "/academic-calendar", icon: Calendar },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Assignments", href: "/assignments", icon: Clipboard },
  { label: "Quiz", href: "/quiz", icon: BookOpen },
  { label: "Results", href: "/results", icon: Award },
  { label: "Webmail", href: "/webmail", icon: Mail },
  { label: "ID Card", href: "/id-card", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

const lecturerNavItems = [
  { label: "Dashboard", href: "/lecturer", icon: BookOpen },
  { label: "My Courses", href: "/lecturer/courses", icon: BookOpen },
  { label: "Grades", href: "/lecturer/gradebook", icon: BarChart3 },
  { label: "Assignments", href: "/lecturer/assignments", icon: FileText },
  { label: "Quizzes", href: "/lecturer/quiz", icon: HelpCircle },
  { label: "Enrollments", href: "/lecturer/enrollments", icon: Users },
  {
    label: "Announcements",
    href: "/lecturer/announcements",
    icon: MessageCircle,
  },
  { label: "Roster", href: "/lecturer/roster", icon: Users },
  { label: "Analytics", href: "/lecturer/analytics", icon: Target },
  { label: "ID Card", href: "/lecturer/id-card", icon: User },
  { label: "Settings", href: "/lecturer/settings", icon: Settings },
];

const registrarNavItems = [
  { label: "Dashboard", href: "/registrar", icon: Calculator },
  { label: "Students", href: "/registrar/students", icon: Users },
  { label: "Programs", href: "/registrar/programs", icon: BookOpen },
  { label: "Enrollments", href: "/registrar/enrollments", icon: CheckCircle },
  { label: "Transcripts", href: "/registrar/transcripts", icon: FileText },
  { label: "Reports", href: "/registrar/reports", icon: BarChart3 },
  { label: "Calendar", href: "/registrar/calendar", icon: Calendar },
  { label: "Settings", href: "/registrar/settings", icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getNavItems = () => {
    switch (profile?.role) {
      case "lecturer":
        return lecturerNavItems;
      case "registrar":
        return registrarNavItems;
      default:
        return studentNavItems;
    }
  };

  const getRoleLabel = () => {
    switch (profile?.role) {
      case "lecturer":
        return "Lecturer";
      case "registrar":
        return "Registrar";
      default:
        return "Student";
    }
  };

  useEffect(() => {
    if (user?.uid) {
      // Set up real-time listener for notifications
      const q = query(
        collection(db, "notifications"),
        where("user_id", "==", user.uid),
        where("is_read", "==", false),
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setUnreadCount(snapshot.size);
        },
        (error) => {
          console.error("Error with notifications snapshot:", error);
        },
      );

      return () => unsubscribe();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block">
        <div className="fixed left-0 top-0 z-40 h-full w-64 bg-card border-r border-border shadow-lg">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-center border-b border-border px-4">
              <Link
                to={
                  profile?.role === "lecturer"
                    ? "/lecturer"
                    : profile?.role === "registrar"
                      ? "/registrar"
                      : "/dashboard"
                }
                className="flex items-center gap-2 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground transition-transform group-hover:scale-105 shadow-lg">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={`${settings.siteName} logo`}
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    <GraduationCap className="h-6 w-6" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-lg font-bold text-foreground">
                    {settings.shortName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleLabel()}
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {navItems.map((item, index) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10 ${
                          isActive
                            ? "bg-primary/15 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed left-0 top-0 z-40 h-full w-64 bg-card border-r border-border shadow-lg">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center justify-center border-b border-border px-4">
                <Link
                  to={
                    profile?.role === "lecturer"
                      ? "/lecturer"
                      : profile?.role === "registrar"
                        ? "/registrar"
                        : "/dashboard"
                  }
                  className="flex items-center gap-2 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground transition-transform group-hover:scale-105 shadow-lg">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt={`${settings.siteName} logo`}
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <GraduationCap className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-lg font-bold text-foreground">
                      {settings.shortName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getRoleLabel()}
                    </span>
                  </div>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {navItems.map((item, index) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10 ${
                            isActive
                              ? "bg-primary/15 text-primary border-l-2 border-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header - Minimal on desktop, full on mobile */}
        <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>

            {/* Spacer for mobile */}
            <div className="lg:hidden" />

            {/* Right side - User menu and notifications */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Notifications */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    asChild
                  >
                    <Link to="/notifications">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </Button>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-10 w-10 rounded-full"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={profile?.avatar_url || ""}
                            alt={profile?.full_name || user.email || ""}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {profile?.full_name
                              ? getInitials(profile.full_name)
                              : user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <div className="flex items-center gap-2 p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {profile?.full_name
                              ? getInitials(profile.full_name)
                              : user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-sm font-medium">
                            {profile?.full_name || getRoleLabel()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          to={
                            profile?.role === "lecturer"
                              ? "/lecturer/settings"
                              : profile?.role === "registrar"
                                ? "/registrar/settings"
                                : "/settings"
                          }
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <User className="h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
