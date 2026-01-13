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
import { supabase } from "@/integrations/supabase/client";

export function StudentHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, profile, signOut } = useAuth();
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

    const handlePing = () => fetchUnreadCount();
    window.addEventListener("notifications-updated", handlePing);

    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        fetchUnreadCount
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("notifications-updated", handlePing);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setUnreadCount(count || 0);
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
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <GraduationCap />
            </div>
            <span className="hidden sm:block font-bold text-lg">
              Uni<span className="text-orange-600">Portal</span>
            </span>
          </Link>

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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t"
          >
            <nav className="p-4 space-y-2">
              {studentNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
