import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy, Target, Brain, Calendar } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function PerformanceDashboard() {
  // Mock performance data
  const overallStats = {
    averageScore: 83,
    totalQuizzes: 25,
    studyHours: 48,
    subjectsStudied: 5,
    improvement: "+12%",
  };

  const scoreHistory = [
    { week: "Week 1", score: 65 },
    { week: "Week 2", score: 72 },
    { week: "Week 3", score: 78 },
    { week: "Week 4", score: 83 },
    { week: "Week 5", score: 85 },
  ];

  const subjectPerformance = [
    { subject: "Data Structures", score: 90, quizzes: 8 },
    { subject: "Web Dev", score: 85, quizzes: 6 },
    { subject: "Databases", score: 80, quizzes: 5 },
    { subject: "Algorithms", score: 75, quizzes: 4 },
    { subject: "Networks", score: 70, quizzes: 2 },
  ];

  const strengths = [
    "Problem Solving",
    "SQL Queries",
    "Algorithm Design",
    "Data Modeling",
    "Code Optimization",
  ];

  const weaknesses = [
    "Time Complexity Analysis",
    "CSS Styling",
    "React Hooks",
    "Network Protocols",
    "Graph Algorithms",
  ];

  const recentAchievements = [
    { title: "Quiz Master", description: "Complete 25 quizzes", icon: Trophy, date: "2 days ago" },
    { title: "High Scorer", description: "Score 90% or above", icon: Target, date: "5 days ago" },
    { title: "Consistent Learner", description: "Study 5 days in a row", icon: Calendar, date: "1 week ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-display">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your progress and identify areas for improvement</p>
      </div>

      {/* Overall Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{overallStats.averageScore}%</div>
            <p className="text-xs text-chart-2 mt-1">
              {overallStats.improvement} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <Brain className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{overallStats.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {overallStats.subjectsStudied} subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
            <Calendar className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{overallStats.studyHours}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-5 w-5 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{recentAchievements.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unlocked recently
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Your quiz performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
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

      {/* Strengths and Weaknesses */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-2" />
              <CardTitle>Your Strengths</CardTitle>
            </div>
            <CardDescription>Topics where you excel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strengths.map((strength, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-sm py-1.5"
                >
                  {strength}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-chart-4" />
              <CardTitle>Areas to Improve</CardTitle>
            </div>
            <CardDescription>Focus on these topics for better results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weaknesses.map((weakness, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-chart-4/10 text-chart-4 border-chart-4/20 text-sm py-1.5"
                >
                  {weakness}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-chart-5" />
            <CardTitle>Recent Achievements</CardTitle>
          </div>
          <CardDescription>Milestones you've unlocked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentAchievements.map((achievement, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-lg border hover-elevate">
              <div className="h-12 w-12 rounded-full bg-chart-5/10 flex items-center justify-center flex-shrink-0">
                <achievement.icon className="h-6 w-6 text-chart-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-semibold">{achievement.title}</div>
                <div className="text-sm text-muted-foreground">{achievement.description}</div>
              </div>
              <div className="text-sm text-muted-foreground">{achievement.date}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
