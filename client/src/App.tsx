import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { NavHeader } from "@/components/nav-header";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import StudentDashboard from "@/pages/student-dashboard";
import CreateStudyPlan from "@/pages/create-study-plan";
import QuizInterface from "@/pages/quiz-interface";
import QuizResults from "@/pages/quiz-results";
import PerformanceDashboard from "@/pages/performance-dashboard";
import AdminMaterials from "@/pages/admin-materials";
import MaterialsLibrary from "@/pages/materials-library";
import AvailableQuizzes from "@/pages/available-quizzes";
import NotFound from "@/pages/not-found";

// Mock user - will be replaced with real auth
const mockUser = {
  name: "John Doe",
  email: "john@ccit.edu",
  role: "student" as const,
};

function Router() {
  // For now, we'll use mock authentication
  // Will be replaced with real auth from backend
  const isAuthenticated = true;
  const user = isAuthenticated ? mockUser : undefined;

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && <NavHeader user={user} />}
      <main className={isAuthenticated ? "container mx-auto px-4 md:px-6 lg:px-8 py-8" : ""}>
        <Switch>
          {/* Public routes */}
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />

          {/* Student routes */}
          <Route path="/dashboard" component={StudentDashboard} />
          <Route path="/study-plans/new" component={CreateStudyPlan} />
          <Route path="/quizzes" component={AvailableQuizzes} />
          <Route path="/quizzes/available" component={AvailableQuizzes} />
          <Route path="/quiz/:id" component={QuizInterface} />
          <Route path="/quiz/results/:id" component={QuizResults} />
          <Route path="/performance" component={PerformanceDashboard} />
          <Route path="/materials" component={MaterialsLibrary} />

          {/* Admin routes */}
          <Route path="/admin/materials" component={AdminMaterials} />

          {/* 404 */}
          <Route component={NotFound} />
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
