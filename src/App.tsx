import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Registration from "./pages/Registration";
import Enrollment from "./pages/Enrollment";
import Portal from "./pages/Portal";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Webmail from "./pages/Webmail";
import Results from "./pages/Results";
import Timetable from "./pages/Timetable";
import LecturerDashboard from "./pages/LecturerDashboard";
import LecturerCourseSelection from "./pages/LecturerCourseSelection";
import MarksManagement from "./pages/MarksManagement";
import LecturerAttendance from "./pages/LecturerAttendance";
import LecturerClasses from "./pages/LecturerClasses";
import LecturerMessages from "./pages/LecturerMessages";
import LecturerGradeBook from "./pages/LecturerGradeBook";
import LecturerAssignments from "./pages/LecturerAssignments";
import LecturerAnnouncements from "./pages/LecturerAnnouncements";
import LecturerRoster from "./pages/LecturerRoster";
import LecturerRubrics from "./pages/LecturerRubrics";
import LecturerAnalytics from "./pages/LecturerAnalytics";
import LecturerEnrollments from "./pages/LecturerEnrollments";
import LecturerSettings from "./pages/LecturerSettings";
import LecturerQuiz from "./pages/LecturerQuiz";
import CreateQuiz from "./pages/CreateQuiz";
import StudentAssignments from "./pages/StudentAssignments";
import Announcements from "./pages/Announcements";
import Programs from "./pages/Programs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect lecturers to lecturer dashboard
  if (profile?.role === "lecturer") {
    return <Navigate to="/lecturer" replace />;
  }

  return <>{children}</>;
}

function LecturerRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect students to student dashboard
  if (profile?.role !== "lecturer") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/dashboard"
        element={
          <StudentRoute>
            <Dashboard />
          </StudentRoute>
        }
      />
      <Route
        path="/registration"
        element={
          <StudentRoute>
            <Registration />
          </StudentRoute>
        }
      />
      <Route
        path="/enrollment"
        element={
          <StudentRoute>
            <Enrollment />
          </StudentRoute>
        }
      />
      <Route
        path="/portal"
        element={
          <StudentRoute>
            <Portal />
          </StudentRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <StudentRoute>
            <Dashboard />
          </StudentRoute>
        }
      />
      <Route
        path="/live"
        element={
          <StudentRoute>
            <Dashboard />
          </StudentRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <StudentRoute>
            <Dashboard />
          </StudentRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <StudentRoute>
            <Dashboard />
          </StudentRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/webmail"
        element={
          <StudentRoute>
            <Webmail />
          </StudentRoute>
        }
      />
      <Route
        path="/results"
        element={
          <StudentRoute>
            <Results />
          </StudentRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <StudentRoute>
            <Settings />
          </StudentRoute>
        }
      />
      <Route
        path="/announcements"
        element={
          <StudentRoute>
            <Announcements />
          </StudentRoute>
        }
      />
      <Route
        path="/timetable"
        element={
          <StudentRoute>
            <Timetable />
          </StudentRoute>
        }
      />
      <Route
        path="/assignments"
        element={
          <StudentRoute>
            <StudentAssignments />
          </StudentRoute>
        }
      />
      <Route
        path="/programs"
        element={
          <ProtectedRoute>
            <Programs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer"
        element={
          <LecturerRoute>
            <LecturerDashboard />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/courses"
        element={
          <LecturerRoute>
            <LecturerCourseSelection />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/marks"
        element={
          <LecturerRoute>
            <MarksManagement />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/attendance"
        element={
          <LecturerRoute>
            <LecturerAttendance />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/classes"
        element={
          <LecturerRoute>
            <LecturerClasses />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/messages"
        element={
          <LecturerRoute>
            <LecturerMessages />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/gradebook"
        element={
          <LecturerRoute>
            <LecturerGradeBook />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/assignments"
        element={
          <LecturerRoute>
            <LecturerAssignments />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/enrollments"
        element={
          <LecturerRoute>
            <LecturerEnrollments />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/settings"
        element={
          <LecturerRoute>
            <LecturerSettings />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/announcements"
        element={
          <LecturerRoute>
            <LecturerAnnouncements />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/roster"
        element={
          <LecturerRoute>
            <LecturerRoster />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/rubrics"
        element={
          <LecturerRoute>
            <LecturerRubrics />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/analytics"
        element={
          <LecturerRoute>
            <LecturerAnalytics />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/quiz"
        element={
          <LecturerRoute>
            <LecturerQuiz />
          </LecturerRoute>
        }
      />
      <Route
        path="/lecturer/quiz/create"
        element={
          <LecturerRoute>
            <CreateQuiz />
          </LecturerRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
