import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Brain, Sparkles } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { SelectQuizAttempt } from "@shared/schema";
import { format } from "date-fns";

interface PerformanceStats {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correctAnswers: number;
  attempts: number;
  averageScore: number;
}

interface AIInsights {
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
}

export default function PerformanceDashboard() {
  const { isAuthenticated } = useAuth();

  // Fetch performance stats
  const { data: performanceStats = [], isLoading: isLoadingStats } = useQuery<PerformanceStats[]>({
    queryKey: ["/api/analytics/performance"],
    enabled: isAuthenticated,
  });

  // Fetch quiz attempts for history
  const { data: attempts = [], isLoading: isLoadingAttempts } = useQuery<SelectQuizAttempt[]>({
    queryKey: ["/api/quiz-attempts"],
    enabled: isAuthenticated,
  });

  // Mutation to generate AI insights
  const insightsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest<AIInsights>("/api/analytics/insights", {
        method: "POST",
      });
    },
  });

  const isLoading = isLoadingStats || isLoadingAttempts;

  // Calculate overall stats
  const totalQuizzes = attempts.length;
  const overallScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;
  const totalQuestions = performanceStats.reduce((sum, s) => sum + s.totalQuestions, 0);
  const correctAnswers = performanceStats.reduce((sum, s) => sum + s.correctAnswers, 0);
  
  // Calculate score history (last 5 attempts)
  const scoreHistory = attempts
    .slice(-5)
    .map((attempt, index) => ({
      attempt: `Quiz ${index + 1}`,
      score: attempt.score,
      date: format(new Date(attempt.completedAt), "MMM d"),
    }));

  // Transform subject performance for chart
  const subjectPerformance = performanceStats.map(stat => ({
    subject: stat.subjectName,
    score: stat.averageScore,
    quizzes: stat.attempts,
  }));

  // AI insights data
  const insights = insightsMutation.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display">Performance Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your progress and identify areas for improvement</p>
        </div>
        {performanceStats.length > 0 && (
          <Button
            onClick={() => insightsMutation.mutate()}
            disabled={insightsMutation.isPending}
            data-testid="button-generate-insights"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {insightsMutation.isPending ? "Generating..." : "Get AI Insights"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : performanceStats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Performance Data Yet</h3>
            <p className="text-muted-foreground text-sm text-center mb-4">
              Take some quizzes to start tracking your performance
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card data-testid="card-average-score">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display" data-testid="text-average-score">{overallScore}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all quizzes
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-quizzes">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                <Brain className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display" data-testid="text-total-quizzes">{totalQuizzes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalQuestions} questions answered
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-accuracy">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <TrendingUp className="h-5 w-5 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display" data-testid="text-accuracy">
                  {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {correctAnswers} of {totalQuestions} correct
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Charts */}
      {!isLoading && performanceStats.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Score Trend */}
          {scoreHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
                <CardDescription>Your last {scoreHistory.length} quiz scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Average scores by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="subject" type="category" width={100} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Insights - Strengths and Weaknesses */}
      {insights && (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card data-testid="card-strengths">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-chart-2" />
                  <CardTitle>Your Strengths</CardTitle>
                </div>
                <CardDescription>AI-identified topics where you excel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insights.strengths.map((strength, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-sm py-1.5"
                      data-testid={`badge-strength-${index}`}
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-weaknesses">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-chart-4" />
                  <CardTitle>Areas to Improve</CardTitle>
                </div>
                <CardDescription>Focus on these topics for better results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insights.weaknesses.map((weakness, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-chart-4/10 text-chart-4 border-chart-4/20 text-sm py-1.5"
                      data-testid={`badge-weakness-${index}`}
                    >
                      {weakness}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card data-testid="card-recommendations">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Recommendations</CardTitle>
              </div>
              <CardDescription>Personalized study advice based on your performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed" data-testid="text-recommendations">
                {insights.recommendations}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
