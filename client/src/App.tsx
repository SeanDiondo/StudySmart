import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { NavHeader } from "@/components/nav-header";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { ProtectedRoute } from "@/components/protected-route";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import StudentDashboard from "@/pages/student-dashboard";
import CreateStudyPlan from "@/pages/create-study-plan";
import StudyPlansList from "@/pages/study-plans-list";
import QuizInterface from "@/pages/quiz-interface";
import QuizResults from "@/pages/quiz-results";
import PerformanceDashboard from "@/pages/performance-dashboard";
import AdminMaterials from "@/pages/admin-materials";
import AdminSubjects from "@/pages/admin-subjects";
import AdminUsers from "@/pages/admin-users";
import AdminReports from "@/pages/admin-reports";
import MaterialsLibrary from "@/pages/materials-library";
import AvailableQuizzes from "@/pages/available-quizzes";
import GenerateQuiz from "@/pages/generate-quiz";
import Exams from "@/pages/exams";
import ForgotPassword from "@/pages/forgot-password";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && user && <NavHeader user={user} />}
      <main className={isAuthenticated ? "container mx-auto px-4 md:px-6 lg:px-8 py-8" : ""}>
        <Switch>
          {/* Public routes */}
          <Route path="/" component={isAuthenticated ? () => <ProtectedRoute><StudentDashboard /></ProtectedRoute> : Landing} />
          <Route path="/login" component={isAuthenticated ? () => <Redirect to="/dashboard" /> : Login} />
          <Route path="/signup" component={isAuthenticated ? () => <Redirect to="/dashboard" /> : Signup} />
          <Route path="/forgot-password" component={isAuthenticated ? () => <Redirect to="/dashboard" /> : ForgotPassword} />
          
          {/* Protected routes - always present, ProtectedRoute handles redirect */}
          <Route path="/dashboard">{() => <ProtectedRoute><StudentDashboard /></ProtectedRoute>}</Route>
          <Route path="/study-plans">{() => <ProtectedRoute><StudyPlansList /></ProtectedRoute>}</Route>
          <Route path="/study-plans/new">{() => <ProtectedRoute><CreateStudyPlan /></ProtectedRoute>}</Route>
          <Route path="/quizzes">{() => <ProtectedRoute><AvailableQuizzes /></ProtectedRoute>}</Route>
          <Route path="/quizzes/available">{() => <ProtectedRoute><AvailableQuizzes /></ProtectedRoute>}</Route>
          <Route path="/quiz/generate">{() => <ProtectedRoute><GenerateQuiz /></ProtectedRoute>}</Route>
          <Route path="/quiz/:id">{() => <ProtectedRoute><QuizInterface /></ProtectedRoute>}</Route>
          <Route path="/quiz/results/:id">{() => <ProtectedRoute><QuizResults /></ProtectedRoute>}</Route>
          <Route path="/performance">{() => <ProtectedRoute><PerformanceDashboard /></ProtectedRoute>}</Route>
          <Route path="/materials">{() => <ProtectedRoute><MaterialsLibrary /></ProtectedRoute>}</Route>
          <Route path="/exams">{() => <ProtectedRoute><Exams /></ProtectedRoute>}</Route>
          <Route path="/profile">{() => <ProtectedRoute><Profile /></ProtectedRoute>}</Route>
          <Route path="/admin/materials">{() => <ProtectedRoute><AdminMaterials /></ProtectedRoute>}</Route>
          <Route path="/admin/subjects">{() => <ProtectedRoute><AdminSubjects /></ProtectedRoute>}</Route>
          <Route path="/admin/users">{() => <ProtectedRoute><AdminUsers /></ProtectedRoute>}</Route>
          <Route path="/admin/reports">{() => <ProtectedRoute><AdminReports /></ProtectedRoute>}</Route>
          
          {/* Catch-all */}
          <Route path="/:rest*" component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
