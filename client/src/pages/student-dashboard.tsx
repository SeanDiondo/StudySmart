import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, TrendingDown, BookOpen, Brain, Plus } from "lucide-react";
import { Link } from "wouter";
import { LoadingSkeleton } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";

export default function StudentDashboard() {
  // Mock data - will be replaced with real data
  const hasStudyPlans = true;
  const isLoading = false;

  const stats = [
    { label: "Active Study Plans", value: "3", icon: BookOpen, color: "text-primary" },
    { label: "Quizzes Completed", value: "12", icon: Brain, color: "text-chart-2" },
    { label: "Average Score", value: "85%", icon: TrendingUp, color: "text-chart-1" },
  ];

  const studyPlans = [
    {
      id: "1",
      subject: "Data Structures and Algorithms",
      progress: 65,
      nextSession: "Today, 2:00 PM",
      hoursThisWeek: 8,
      totalHours: 12,
    },
    {
      id: "2",
      subject: "Web Development",
      progress: 45,
      nextSession: "Tomorrow, 10:00 AM",
      hoursThisWeek: 5,
      totalHours: 10,
    },
    {
      id: "3",
      subject: "Database Systems",
      progress: 80,
      nextSession: "Wednesday, 3:00 PM",
      hoursThisWeek: 10,
      totalHours: 12,
    },
  ];

  const recentQuizzes = [
    { id: "1", subject: "Data Structures", score: 90, date: "2 days ago", difficulty: "medium" },
    { id: "2", subject: "Web Development", score: 75, date: "5 days ago", difficulty: "easy" },
    { id: "3", subject: "Database Systems", score: 95, date: "1 week ago", difficulty: "hard" },
  ];

  const performanceInsights = {
    strengths: ["Problem Solving", "Algorithm Design", "SQL Queries"],
    weaknesses: ["Time Complexity", "CSS Styling", "React Hooks"],
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid md:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!hasStudyPlans && !isLoading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={BookOpen}
          title="No Study Plans Yet"
          description="Create your first personalized study plan to start your learning journey"
          actionLabel="Create Study Plan"
          onAction={() => window.location.href = "/study-plans/new"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your progress and continue learning</p>
        </div>
        <Link href="/study-plans/new">
          <Button size="lg" data-testid="button-create-study-plan">
            <Plus className="h-5 w-5 mr-2" />
            Create Study Plan
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Study Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-display">Active Study Plans</h2>
          <Link href="/study-plans">
            <Button variant="ghost" data-testid="link-view-all-plans">
              View All
            </Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studyPlans.map((plan) => (
            <Card key={plan.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{plan.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {plan.hoursThisWeek}/{plan.totalHours} hours this week
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {plan.progress}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{plan.progress}%</span>
                  </div>
                  <Progress value={plan.progress} className="h-2" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Next: {plan.nextSession}
                </div>
                <Link href={`/study-plans/${plan.id}`}>
                  <Button variant="outline" className="w-full" data-testid={`button-view-plan-${plan.id}`}>
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Quizzes and Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Recent Quizzes</CardTitle>
              <Link href="/quizzes">
                <Button variant="ghost" size="sm" data-testid="link-view-all-quizzes">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-4 rounded-lg border hover-elevate">
                <div className="space-y-1">
                  <div className="font-medium">{quiz.subject}</div>
                  <div className="text-sm text-muted-foreground">{quiz.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={quiz.difficulty === "hard" ? "default" : quiz.difficulty === "medium" ? "secondary" : "outline"}>
                    {quiz.difficulty}
                  </Badge>
                  <div className={`text-2xl font-bold ${quiz.score >= 80 ? "text-chart-2" : quiz.score >= 60 ? "text-chart-4" : "text-destructive"}`}>
                    {quiz.score}%
                  </div>
                </div>
              </div>
            ))}
            <Link href="/quizzes/available">
              <Button className="w-full" data-testid="button-take-new-quiz">
                <Brain className="h-4 w-4 mr-2" />
                Take New Quiz
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Performance Insights</CardTitle>
            <CardDescription>AI-powered analysis of your learning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-chart-2" />
                <span className="font-medium">Strengths</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {performanceInsights.strengths.map((strength, index) => (
                  <Badge key={index} variant="secondary" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                    {strength}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-chart-4" />
                <span className="font-medium">Areas to Improve</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {performanceInsights.weaknesses.map((weakness, index) => (
                  <Badge key={index} variant="secondary" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                    {weakness}
                  </Badge>
                ))}
              </div>
            </div>
            <Link href="/performance">
              <Button variant="outline" className="w-full" data-testid="button-view-full-analytics">
                View Full Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
