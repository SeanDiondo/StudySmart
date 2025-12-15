import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BookOpen, Users, ClipboardList, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SubjectEnrollment {
  id: string;
  name: string;
  yearLevel: string | null;
  subjectType: string | null;
  programIds: string[];
  enrolledCount: number;
  studyPlanCount: number;
}

interface ProgramStat {
  programId: string;
  programCode: string;
  programName: string;
  subjectCount: number;
  totalEnrolled: number;
}

interface YearLevelStat {
  yearLevel: number;
  subjectCount: number;
  totalEnrolled: number;
  studentCount: number;
}

interface AnalyticsData {
  subjects: SubjectEnrollment[];
  programStats: ProgramStat[];
  yearLevelStats: YearLevelStat[];
  typeStats: {
    major: { count: number; totalEnrolled: number };
    minor: { count: number; totalEnrolled: number };
  };
  overview: {
    totalSubjects: number;
    totalStudents: number;
    totalStudyPlans: number;
    activeStudyPlans: number;
  };
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AdminAnalytics() {
  const { isAuthenticated } = useAuth();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics/subjects"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Subject enrollment statistics</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const topSubjects = [...analytics.subjects]
    .sort((a, b) => b.enrolledCount - a.enrolledCount)
    .slice(0, 10);

  const yearLevelChartData = analytics.yearLevelStats.map(stat => ({
    name: `Year ${stat.yearLevel}`,
    subjects: stat.subjectCount,
    students: stat.studentCount,
    enrolled: stat.totalEnrolled,
  }));

  const programChartData = analytics.programStats.map(stat => ({
    name: stat.programCode,
    subjects: stat.subjectCount,
    enrolled: stat.totalEnrolled,
  }));

  const typeChartData = [
    { name: "Major", value: analytics.typeStats.major.count, enrolled: analytics.typeStats.major.totalEnrolled },
    { name: "Minor", value: analytics.typeStats.minor.count, enrolled: analytics.typeStats.minor.totalEnrolled },
  ];

  const studyPlanChartData = [
    { name: "Active", value: analytics.overview.activeStudyPlans },
    { name: "Inactive", value: analytics.overview.totalStudyPlans - analytics.overview.activeStudyPlans },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-display" data-testid="text-analytics-title">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Subject enrollment and student statistics</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="stat-total-subjects">
              {analytics.overview.totalSubjects}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-5 w-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="stat-total-students">
              {analytics.overview.totalStudents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Plans</CardTitle>
            <ClipboardList className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="stat-study-plans">
              {analytics.overview.totalStudyPlans}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.activeStudyPlans} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Major Subjects</CardTitle>
            <BookOpen className="h-5 w-5 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="stat-major-subjects">
              {analytics.typeStats.major.count}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.typeStats.minor.count} minor subjects
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment by Year Level</CardTitle>
            <CardDescription>Student distribution across year levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearLevelChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="students" name="Students" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="subjects" name="Subjects" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment by Program</CardTitle>
            <CardDescription>Subject and enrollment distribution per program</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={programChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="subjects" name="Subjects" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="enrolled" name="Eligible Students" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subject Types</CardTitle>
            <CardDescription>Distribution of major vs minor subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Plan Status</CardTitle>
            <CardDescription>Active vs inactive study plans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={studyPlanChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {studyPlanChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index + 2]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Subjects by Enrollment</CardTitle>
          <CardDescription>Subjects with the most eligible students</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topSubjects} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={150} 
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "enrolledCount" ? "Eligible Students" : "In Study Plans"
                ]}
              />
              <Legend />
              <Bar 
                dataKey="enrolledCount" 
                name="Eligible Students" 
                fill={CHART_COLORS[0]} 
                radius={[0, 4, 4, 0]} 
              />
              <Bar 
                dataKey="studyPlanCount" 
                name="In Study Plans" 
                fill={CHART_COLORS[4]} 
                radius={[0, 4, 4, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
