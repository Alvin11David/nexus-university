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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration"
        element={
          <ProtectedRoute>
            <Registration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enrollment"
        element={
          <ProtectedRoute>
            <Enrollment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <Portal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
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
          <ProtectedRoute>
            <Webmail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timetable"
        element={
          <ProtectedRoute>
            <Timetable />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute>
            <LecturerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/courses"
        element={
          <ProtectedRoute>
            <LecturerCourseSelection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/marks"
        element={
          <ProtectedRoute>
            <MarksManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/attendance"
        element={
          <ProtectedRoute>
            <LecturerAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/classes"
        element={
          <ProtectedRoute>
            <LecturerClasses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/messages"
        element={
          <ProtectedRoute>
            <LecturerMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/gradebook"
        element={
          <ProtectedRoute>
            <LecturerGradeBook />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/assignments"
        element={
          <ProtectedRoute>
            <LecturerAssignments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/enrollments"
        element={
          <ProtectedRoute>
            <LecturerEnrollments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/announcements"
        element={
          <ProtectedRoute>
            <LecturerAnnouncements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/roster"
        element={
          <ProtectedRoute>
            <LecturerRoster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/rubrics"
        element={
          <ProtectedRoute>
            <LecturerRubrics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lecturer/analytics"
        element={
          <ProtectedRoute>
            <LecturerAnalytics />
          </ProtectedRoute>
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
