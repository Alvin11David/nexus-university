import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Flame,
  GraduationCap,
  Layers,
  Mail,
  MessageCircle,
  PlayCircle,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const rise = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerDashboard() {
  const { profile, user } = useAuth();
  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || "Lecturer";
  const firstName = displayName.split(" ")[0];

  const quickStats = useMemo(
    () => [
      { label: "Courses", value: 6, hint: "+1 awaiting publish", icon: Layers },
      {
        label: "Sessions today",
        value: 3,
        hint: "2 on-site, 1 live",
        icon: CalendarClock,
      },
      { label: "Grading queue", value: 42, hint: "8 due today", icon: Target },
      { label: "Feedback", value: 18, hint: "4 unread", icon: MessageCircle },
    ],
    []
  );

  const schedule = useMemo(
    () => [
      {
        time: "08:30",
        title: "Advanced Algorithms",
        type: "Lecture",
        room: "B2-201",
        mode: "On Campus",
      },
      {
        time: "11:00",
        title: "Systems Design",
        type: "Seminar",
        room: "Online",
        mode: "Live",
      },
      {
        time: "14:00",
        title: "Research Lab",
        type: "Lab",
        room: "Innovation Hub",
        mode: "On Campus",
      },
    ],
    []
  );

  const gradingQueue = useMemo(
    () => [
      { course: "Algorithms", items: 24, due: "Today", progress: 62 },
      { course: "Systems Design", items: 10, due: "Tomorrow", progress: 40 },
      { course: "Data Mining", items: 8, due: "In 2 days", progress: 80 },
    ],
    []
  );

  const announcements = useMemo(
    () => [
      { title: "Capstone checkpoints", audience: "Year 4", when: "In 30m" },
      {
        title: "Midterm rubrics posted",
        audience: "All cohorts",
        when: "2h ago",
      },
      {
        title: "Guest lecture confirmed",
        audience: "Year 3",
        when: "Yesterday",
      },
    ],
    []
  );

  const engagement = useMemo(
    () => [
      { label: "Attendance", value: 92 },
      { label: "Assignments", value: 78 },
      { label: "Live participation", value: 64 },
      { label: "Feedback", value: 86 },
    ],
    []
  );

  const messages = useMemo(
    () => [
      {
        from: "Dept. Admin",
        text: "Room change approved for Thursday.",
        time: "08:15",
      },
      { from: "TA Sarah", text: "Graded 12 more submissions.", time: "07:50" },
      {
        from: "Student Council",
        text: "Can we extend Q&A by 10 mins?",
        time: "Yesterday",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 text-foreground">
      <Header />

      <main className="px-4 pb-28 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto pt-6 lg:pt-10">
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 backdrop-blur-lg p-6 sm:p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.3em] text-primary/80">
                  Lecturer workspace
                </p>
                <h1 className="text-3xl font-bold sm:text-4xl flex items-center gap-2 text-foreground">
                  Welcome back, {firstName}
                  <Sparkles className="h-6 w-6 text-primary" />
                </h1>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  Run your day with focus: live sessions, grading,
                  announcements, and class insights in one clean view.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" className="border-border/60">
                  <Mail className="mr-2 h-4 w-4" /> Message cohorts
                </Button>
                <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 shadow-lg shadow-primary/30">
                  <PlayCircle className="mr-2 h-4 w-4" /> Start live session
                </Button>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                variants={rise}
                initial="hidden"
                animate="visible"
                custom={idx}
              >
                <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold text-foreground">
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.hint}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </section>

          <section className="mt-8 grid gap-4 xl:grid-cols-3">
            <motion.div
              variants={rise}
              initial="hidden"
              animate="visible"
              custom={1}
              className="space-y-4 xl:col-span-2"
            >
              <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      Today's schedule
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Live sessions, labs, and seminars
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/30"
                  >
                    Focus mode
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {schedule.map((item) => (
                    <div
                      key={item.time}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
                          {item.time}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.type} • {item.room}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-primary/40 text-primary"
                      >
                        {item.mode}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      Grading queue
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      What needs your attention now
                    </p>
                  </div>
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200/60">
                    Auto-save on
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gradingQueue.map((item) => (
                    <div
                      key={item.course}
                      className="rounded-2xl border border-border/60 bg-muted/30 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {item.course}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.items} submissions • Due {item.due}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/30"
                        >
                          {item.progress}% reviewed
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-muted/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={rise}
              initial="hidden"
              animate="visible"
              custom={2}
              className="space-y-4"
            >
              <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      Announcements
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Push to cohorts instantly
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-muted/60 text-foreground border-border/60"
                  >
                    <Mail className="mr-2 h-4 w-4" /> New
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {announcements.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-3"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.audience}
                        </p>
                      </div>
                      <span className="text-xs text-primary">{item.when}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">
                    Engagement pulse
                  </CardTitle>
                  <Flame className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {engagement.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{item.label}</span>
                        <span className="font-semibold text-foreground">
                          {item.value}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            <motion.div
              variants={rise}
              initial="hidden"
              animate="visible"
              custom={3}
              className="space-y-4 lg:col-span-2"
            >
              <Card className="border-white/10 bg-white/5">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">
                      Cohort insights
                    </CardTitle>
                    <p className="text-sm text-slate-300/70">
                      Health of your classes at a glance
                    </p>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-100 border-purple-300/30">
                    Updated 5m ago
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      title: "Attendance stability",
                      value: "92%",
                      trend: "+3% week",
                      icon: Users,
                    },
                    {
                      title: "Assignment on-time",
                      value: "78%",
                      trend: "-2% week",
                      icon: CheckCircle2,
                    },
                    {
                      title: "Live join rate",
                      value: "64%",
                      trend: "+5% week",
                      icon: PlayCircle,
                    },
                    {
                      title: "Feedback response",
                      value: "86%",
                      trend: "+1% week",
                      icon: MessageCircle,
                    },
                  ].map((item, idx) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/5 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-slate-200/80">
                            {item.title}
                          </p>
                          <p className="text-2xl font-semibold text-white">
                            {item.value}
                          </p>
                          <p className="text-xs text-emerald-200">
                            {item.trend}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white/10 text-emerald-100 flex items-center justify-center">
                          <item.icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                          style={{ width: `${80 + idx * 5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">Inbox</CardTitle>
                    <p className="text-sm text-slate-300/70">
                      Latest pings across courses
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20"
                  >
                    Realtime
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {messages.map((item) => (
                    <div
                      key={item.text}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-3 py-3"
                    >
                      <div>
                        <p className="font-semibold text-white">{item.from}</p>
                        <p className="text-xs text-slate-300/70">{item.text}</p>
                      </div>
                      <span className="text-xs text-emerald-100">
                        {item.time}
                      </span>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    className="w-full bg-white/10 text-white border-white/20"
                  >
                    View all messages
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={rise}
              initial="hidden"
              animate="visible"
              custom={4}
              className="space-y-4"
            >
              <Card className="border-white/10 bg-white/5">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">
                      Quick actions
                    </CardTitle>
                    <p className="text-sm text-slate-300/70">
                      Launch the things you do most
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-emerald-200" />
                </CardHeader>
                <CardContent className="grid gap-3">
                  {[
                    { label: "Create announcement", icon: Mail },
                    { label: "Open grading", icon: CheckCircle2 },
                    { label: "Start live class", icon: PlayCircle },
                    { label: "Schedule office hours", icon: CalendarClock },
                  ].map((action) => (
                    <Button
                      key={action.label}
                      variant="secondary"
                      className="justify-start bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      <action.icon className="mr-3 h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">
                      Course signals
                    </CardTitle>
                    <p className="text-sm text-slate-300/70">
                      Where to lean in this week
                    </p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-emerald-200" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "Algorithms", status: "Stable", tag: "Green" },
                    {
                      title: "Systems Design",
                      status: "Needs support",
                      tag: "Amber",
                    },
                    { title: "Data Mining", status: "At risk", tag: "Red" },
                  ].map((course) => (
                    <div
                      key={course.title}
                      className="rounded-xl border border-white/5 bg-white/[0.04] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">
                          {course.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            course.tag === "Green"
                              ? "border-emerald-300/40 text-emerald-50"
                              : course.tag === "Amber"
                              ? "border-amber-300/40 text-amber-50"
                              : "border-rose-300/40 text-rose-50"
                          }
                        >
                          {course.status}
                        </Badge>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${
                            course.tag === "Green"
                              ? "bg-emerald-500"
                              : course.tag === "Amber"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{
                            width:
                              course.tag === "Green"
                                ? "82%"
                                : course.tag === "Amber"
                                ? "64%"
                                : "42%",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/5">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">
                      Energy meter
                    </CardTitle>
                    <p className="text-sm text-slate-300/70">
                      Workload vs momentum
                    </p>
                  </div>
                  <Target className="h-4 w-4 text-emerald-200" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Teaching load", value: "73%" },
                    { label: "Research", value: "46%" },
                    { label: "Admin", value: "32%" },
                    { label: "Student support", value: "58%" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/5 bg-white/[0.04] p-3"
                    >
                      <p className="text-xs text-slate-300/70">{item.label}</p>
                      <p className="text-xl font-semibold text-white">
                        {item.value}
                      </p>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                          style={{ width: item.value }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
