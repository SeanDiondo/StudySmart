import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, TrendingDown, BookOpen, Brain, Plus } from "lucide-react";
import { Link } from "wouter";
import { LoadingSkeleton } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { StudyPlan, QuizAttempt, PerformanceData } from "@shared/schema";

export default function StudentDashboard() {
  const { isAuthenticated } = useAuth();

  const { data: studyPlan, isLoading: planLoading } = useQuery<StudyPlan>({
    queryKey: ["/api/study-plans"],
    enabled: isAuthenticated,
  });

  const { data: quizAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
    enabled: isAuthenticated,
  });

  const { data: performance } = useQuery<PerformanceData[]>({
    queryKey: ["/api/performance"],
    enabled: isAuthenticated,
  });

  const { data: studyPlanSubjects } = useQuery<any[]>({
    queryKey: ["/api/study-plans", studyPlan?.id, "subjects"],
    enabled: isAuthenticated && !!studyPlan?.id,
  });

  const isLoading = planLoading;
  const hasStudyPlan = !!studyPlan;

  // Calculate stats from real data
  const quizzesCompleted = quizAttempts?.length || 0;
  const averageScore = quizAttempts?.length 
    ? Math.round(quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length)
    : 0;

  const stats = [
    { label: "Study Plan Status", value: hasStudyPlan ? "Active" : "None", icon: BookOpen, color: "text-primary" },
    { label: "Quizzes Completed", value: String(quizzesCompleted), icon: Brain, color: "text-chart-2" },
    { label: "Average Score", value: `${averageScore}%`, icon: TrendingUp, color: "text-chart-1" },
  ];

  // Get recent quiz attempts (last 5)
  const recentQuizzes = (quizAttempts || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get performance insights from performance data
  const performanceInsights = {
    strengths: (performance || [])
      .filter(p => p.category === 'strength')
      .map(p => p.area)
      .slice(0, 5),
    weaknesses: (performance || [])
      .filter(p => p.category === 'weakness')
      .map(p => p.area)
      .slice(0, 5),
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

  if (!hasStudyPlan && !isLoading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={BookOpen}
          title="No Study Plan Yet"
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

      {/* Your Study Plan */}
      {studyPlan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold font-display">Your Study Plan</h2>
            <Link href="/study-plans/new">
              <Button variant="ghost" data-testid="link-edit-plan">
                Edit Plan
              </Button>
            </Link>
          </div>
          <Card className="hover-elevate">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Weekly Study Schedule</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {studyPlan.hoursPerWeek} hours per week
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {studyPlan.learningPace} pace
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {studyPlanSubjects && studyPlanSubjects.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {studyPlanSubjects.map((subject: any) => (
                      <Badge key={subject.id} variant="outline" className="text-xs">
                        {subject.subjectName || subject.subjectId}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {studyPlan.learningGoals && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Learning Goals</h4>
                  <p className="text-sm">{studyPlan.learningGoals}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

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
            {recentQuizzes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No quizzes completed yet</p>
                <p className="text-sm mt-1">Start learning by taking your first quiz</p>
              </div>
            ) : (
              recentQuizzes.map((attempt) => {
                const score = attempt.score || 0;
                const dateStr = attempt.submittedAt 
                  ? new Date(attempt.submittedAt).toLocaleDateString()
                  : new Date(attempt.startedAt).toLocaleDateString();
                
                return (
                  <div key={attempt.id} className="flex items-center justify-between p-4 rounded-lg border hover-elevate">
                    <div className="space-y-1">
                      <div className="font-medium">Quiz {attempt.quizId.substring(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">{dateStr}</div>
                    </div>
                    <div className={`text-2xl font-bold ${score >= 80 ? "text-chart-2" : score >= 60 ? "text-chart-4" : "text-destructive"}`}>
                      {Math.round(score)}%
                    </div>
                  </div>
                );
              })
            )}
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
