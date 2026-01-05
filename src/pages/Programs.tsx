import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Users,
  ArrowRight,
  Zap,
  Globe,
  Trophy,
  Sparkles,
  Play,
  Lock,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Program {
  id: string;
  title: string;
  code: string;
  description: string;
  students_count: number;
  status: "active" | "running" | "closed" | "archived";
  color: string;
  icon: React.ReactNode;
  department: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
    },
  },
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "active":
    case "running":
      return {
        label: "Running",
        color: "from-emerald-500 to-teal-500",
        bgColor: "bg-emerald-500/10",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-300/30",
        badge: "bg-emerald-500/20 text-emerald-700",
      };
    case "closed":
      return {
        label: "Closed",
        color: "from-red-500 to-pink-500",
        bgColor: "bg-red-500/10",
        textColor: "text-red-700",
        borderColor: "border-red-300/30",
        badge: "bg-red-500/20 text-red-700",
      };
    case "archived":
      return {
        label: "Archived",
        color: "from-gray-500 to-slate-500",
        bgColor: "bg-gray-500/10",
        textColor: "text-gray-700",
        borderColor: "border-gray-300/30",
        badge: "bg-gray-500/20 text-gray-700",
      };
    default:
      return {
        label: "Pending",
        color: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-700",
        borderColor: "border-amber-300/30",
        badge: "bg-amber-500/20 text-amber-700",
      };
  }
};

const programColors = [
  "from-blue-600 to-cyan-500",
  "from-purple-600 to-pink-500",
  "from-orange-500 to-red-500",
  "from-green-600 to-emerald-500",
  "from-indigo-600 to-blue-500",
  "from-rose-600 to-orange-500",
  "from-violet-600 to-purple-500",
  "from-teal-600 to-cyan-500",
];

export default function Programs() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "running" | "closed">("all");

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const { data: coursesData, error } = await supabase
          .from("courses")
          .select(
            "id, title, code, description, status, department_id, departments(name)"
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        const { data: enrollmentsData } = await supabase
          .from("enrollments")
          .select("course_id");

        const enrollmentCounts =
          enrollmentsData?.reduce(
            (acc: { [key: string]: number }, e: { course_id: string }) => {
              acc[e.course_id] = (acc[e.course_id] || 0) + 1;
              return acc;
            },
            {}
          ) || {};

        const mapped = (coursesData || []).map((course: any, idx: number) => {
          const IconComponent = [
            BookOpen,
            GraduationCap,
            Users,
            Zap,
            Globe,
            Trophy,
            Sparkles,
            TrendingUp,
          ][idx % 8];
          return {
            id: course.id,
            title: course.title,
            code: course.code,
            description: course.description || "No description available",
            students_count: enrollmentCounts[course.id] || 0,
            status:
              course.status === "active" || course.status === "published"
                ? "running"
                : course.status || "closed",
            color: programColors[idx % programColors.length],
            icon: <IconComponent className="h-6 w-6" />,
            department: course.departments?.name || "General",
          };
        });

        setPrograms(mapped);
      } catch (error) {
        console.error("Error fetching programs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchPrograms();
  }, [user]);

  const filteredPrograms = programs.filter(
    (p) => filter === "all" || p.status === filter
  );

  const stats = {
    total: programs.length,
    running: programs.filter((p) => p.status === "running").length,
    closed: programs.filter((p) => p.status === "closed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-24 md:pb-8">
      <Header />

      <main className="container py-8 md:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="text-center space-y-4 mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <GraduationCap className="h-16 w-16 text-primary mx-auto" />
            </motion.div>
            <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              University Programs
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore all available academic programs and their current status
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                label: "Total Programs",
                value: stats.total,
                icon: BookOpen,
                color: "text-blue-500",
              },
              {
                label: "Running",
                value: stats.running,
                icon: Play,
                color: "text-emerald-500",
              },
              {
                label: "Closed",
                value: stats.closed,
                icon: Lock,
                color: "text-red-500",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative bg-card border border-border/60 rounded-xl p-6 backdrop-blur-xl hover:border-primary/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-center mb-8 flex-wrap"
        >
          {[
            { label: "All Programs", value: "all" },
            { label: "Running", value: "running" },
            { label: "Closed", value: "closed" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                filter === tab.value
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/50 scale-105"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Programs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-4 w-full max-w-4xl">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">No Programs Found</h3>
            <p className="text-muted-foreground">
              {filter === "running"
                ? "No running programs at the moment"
                : filter === "closed"
                ? "No closed programs"
                : "No programs available"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
          >
            {filteredPrograms.map((program) => {
              const statusConfig = getStatusConfig(program.status);

              return (
                <motion.div key={program.id} variants={itemVariants}>
                  <div
                    className={`relative group h-full overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-105 cursor-pointer`}
                  >
                    {/* Background Gradient */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />

                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500" />
                      <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-6 h-full flex flex-col justify-between border border-white/10 group-hover:border-white/30 transition-colors duration-300 rounded-2xl backdrop-blur-sm group-hover:backdrop-blur-md bg-card/50 group-hover:bg-card/80">
                      {/* Top Section */}
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${program.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                          >
                            {typeof program.icon === "string" ? (
                              <span className="h-6 w-6 text-white">
                                {program.icon}
                              </span>
                            ) : (
                              <div className="h-6 w-6 text-white">
                                {program.icon}
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white group-hover:bg-clip-text transition-all">
                          {program.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 group-hover:text-muted-foreground/80">
                          {program.description}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <span className="px-2 py-1 rounded-lg bg-muted/50 font-mono">
                            {program.code}
                          </span>
                          <span>{program.department}</span>
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <div className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {program.students_count}
                            </span>
                            <span className="text-muted-foreground">
                              students
                            </span>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                            program.status === "running"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/50"
                              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                          }`}
                          disabled={program.status !== "running"}
                        >
                          {program.status === "running" ? (
                            <>
                              <span>Explore</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <span>Not Available</span>
                              <Lock className="h-4 w-4" />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
