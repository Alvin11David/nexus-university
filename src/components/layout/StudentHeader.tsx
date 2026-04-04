import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  BookOpen,
  Settings,
  Mail,
  Calendar,
  Zap,
  Clipboard,
  Megaphone,
  Award,
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
import { StudentSidebar } from "./StudentSidebar";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  limit,
  orderBy,
  onSnapshot,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export function StudentHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, signOut } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", user.uid),
      where("is_read", "==", false),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    const handlePing = () => fetchUnreadCount();
    window.addEventListener("notifications-updated", handlePing);

    return () => {
      unsubscribe();
      window.removeEventListener("notifications-updated", handlePing);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", user.uid),
      where("is_read", "==", false),
    );
    const snapshot = await getCountFromServer(q);
    setUnreadCount(snapshot.data().count);
  };

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

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-lg"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Menu Toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-10 w-10"
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={`${settings.siteName} logo`}
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <GraduationCap />
                )}
              </div>
              <span className="hidden sm:block font-bold text-lg">
                {settings.shortName}
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-2">
            {user &&
              studentNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-orange-600"
                >
                  <item.icon className="inline h-4 w-4 mr-1" />
                  {item.label}
                </Link>
              ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/notifications" className="relative">
                    <Bell />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Avatar>
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile?.full_name
                            ? getInitials(profile.full_name)
                            : user?.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await signOut();
                        navigate("/auth");
                      }}
                      className="text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">Sign in</Link>
            )}

            {/* Mobile Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </motion.header>
  );
}
