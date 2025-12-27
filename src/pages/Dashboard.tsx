import { motion } from 'framer-motion';
import { BookOpen, Trophy, Clock, TrendingUp, Calendar, Video } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatCard } from '@/components/dashboard/StatCard';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { UpcomingCard } from '@/components/dashboard/UpcomingCard';
import { AnnouncementCard } from '@/components/dashboard/AnnouncementCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

  const mockCourses = [
    { id: '1', title: 'Data Structures and Algorithms', code: 'CS201', instructor: 'Dr. Sarah Chen', progress: 65, completedLessons: 8, totalLessons: 12, students: 156 },
    { id: '2', title: 'Database Management Systems', code: 'CS301', instructor: 'Prof. James Okonkwo', progress: 40, completedLessons: 5, totalLessons: 12, students: 89, isLive: true },
    { id: '3', title: 'Software Engineering', code: 'CS401', instructor: 'Dr. Emily Nakamura', progress: 85, completedLessons: 10, totalLessons: 12, students: 120 },
  ];

  const mockUpcoming = [
    { type: 'class' as const, title: 'Database Systems Lecture', course: 'CS301', time: '10:00 AM', date: 'Today', meetLink: 'https://meet.google.com', isUrgent: true },
    { type: 'assignment' as const, title: 'Binary Tree Implementation', course: 'CS201', time: '11:59 PM', date: 'Tomorrow' },
    { type: 'quiz' as const, title: 'SQL Fundamentals Quiz', course: 'CS301', time: '2:00 PM', date: 'Jan 28' },
  ];

  const mockAnnouncements = [
    { title: 'Mid-Semester Exams Schedule', content: 'The examination schedule has been released. Please check your portal for your specific dates and venues.', author: 'Academic Registrar', date: '2h ago', isGlobal: true, isPinned: true },
    { title: 'Assignment 3 Extended', content: 'Due to technical issues, the deadline has been extended by 2 days.', author: 'Dr. Sarah Chen', date: '5h ago', course: 'CS201' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container py-6 space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Welcome back, <span className="gradient-text">{firstName}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your courses today.</p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing progress={72} size={80} strokeWidth={6}>
              <div className="text-center">
                <span className="text-lg font-bold">72%</span>
                <span className="text-[10px] text-muted-foreground block">Overall</span>
              </div>
            </ProgressRing>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Enrolled Courses" value="6" icon={BookOpen} delay={0.1} />
          <StatCard title="Completed" value="4" subtitle="This semester" icon={Trophy} variant="secondary" delay={0.2} />
          <StatCard title="Study Hours" value="128" subtitle="This month" icon={Clock} delay={0.3} trend={{ value: 12, isPositive: true }} />
          <StatCard title="GPA" value="3.75" subtitle="Current" icon={TrendingUp} delay={0.4} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Courses */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">My Courses</h2>
              <a href="/courses" className="text-sm text-secondary hover:underline">View all</a>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {mockCourses.slice(0, 4).map((course, i) => (
                <CourseCard key={course.id} {...course} delay={i * 0.1} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <h2 className="font-display text-lg font-semibold">Upcoming</h2>
              </div>
              <div className="space-y-3">
                {mockUpcoming.map((event, i) => (
                  <UpcomingCard key={i} {...event} delay={i * 0.1} />
                ))}
              </div>
            </div>

            {/* Announcements */}
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Announcements</h2>
              <div className="space-y-3">
                {mockAnnouncements.map((ann, i) => (
                  <AnnouncementCard key={i} {...ann} delay={i * 0.1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
