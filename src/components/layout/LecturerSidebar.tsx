import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  BarChart3,
  FileText,
  HelpCircle,
  Users,
  MessageCircle,
  Target,
  User,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LecturerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const lecturerNavItems = [
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

export function LecturerSidebar({ isOpen, onClose }: LecturerSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  // Close sidebar when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed left-0 top-0 z-50 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-700"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {lecturerNavItems.map((item, index) => {
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
                          onClick={onClose}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            isActive
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                              : "text-gray-700 dark:text-gray-300"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
