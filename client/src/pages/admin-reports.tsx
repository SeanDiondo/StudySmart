import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileText, Users, Search, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Subject, Quiz, QuizAttempt, Program } from "@shared/schema";

export default function AdminReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("all");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const { isAuthenticated } = useAuth();

  const { data: programs } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
    enabled: isAuthenticated,
  });

  const { data: subjects, isLoading: subjectsLoading, isError: subjectsError } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    enabled: isAuthenticated,
  });

  // Build URL with query params for server-side filtered exams - memoized to prevent refetch loops
  const filteredExamsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedProgram !== 'all') params.append('programId', selectedProgram);
    if (selectedYearLevel !== 'all') params.append('yearLevel', selectedYearLevel);
    if (selectedExamType !== 'all') params.append('examType', selectedExamType);
    if (selectedMaterialType !== 'all') params.append('materialType', selectedMaterialType);
    if (selectedSubject !== 'all') params.append('subjectId', selectedSubject);
    const queryString = params.toString();
    return `/api/admin/exams/filtered${queryString ? `?${queryString}` : ''}`;
  }, [selectedProgram, selectedYearLevel, selectedExamType, selectedMaterialType, selectedSubject]);

  // Use server-side filtered exams endpoint with reactive query params
  const { data: quizzes, isLoading: quizzesLoading } = useQuery<Quiz[]>({
    queryKey: [filteredExamsUrl],
    enabled: isAuthenticated,
  });

  const { data: allAttempts, isLoading: attemptsLoading } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/admin/quiz-attempts"],
    enabled: isAuthenticated,
  });

  const isLoading = subjectsLoading || quizzesLoading || attemptsLoading;

  // Server already filters by program, yearLevel, examType, materialType, and subjectId
  // We only need to apply client-side search filtering
  const exams = quizzes || [];

  const filteredExams = exams.filter(exam => {
    // Search filter (not handled server-side)
    if (searchQuery) {
      const subject = subjects?.find(s => s.id === exam.subjectId);
      const matchesTitle = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = (subject?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      return matchesTitle || matchesSubject;
    }
    return true;
  });

  // Calculate statistics for each exam
  const examStats = filteredExams.map(exam => {
    const attempts = (allAttempts || []).filter(a => a.quizId === exam.id);
    const uniqueStudents = new Set(attempts.map(a => a.userId)).size;
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
      : 0;
    const subject = subjects?.find(s => s.id === exam.subjectId);

    return {
      exam,
      subject,
      totalAttempts: attempts.length,
      uniqueStudents,
      avgScore,
    };
  });

  // Overall statistics
  const totalExams = filteredExams.length;
  const totalAttempts = examStats.reduce((sum, stat) => sum + stat.totalAttempts, 0);
  const totalUniqueStudents = new Set(
    (allAttempts || [])
      .filter(a => filteredExams.some(e => e.id === a.quizId))
      .map(a => a.userId)
  ).size;
  const overallAvgScore = examStats.length > 0
    ? Math.round(examStats.reduce((sum, stat) => sum + stat.avgScore, 0) / examStats.length)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display">Exam Reports</h1>
          <p className="text-muted-foreground mt-1">Loading exam statistics...</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader><div className="h-5 w-24 bg-muted rounded animate-pulse" /></CardHeader>
              <CardContent><div className="h-10 w-16 bg-muted rounded animate-pulse" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (subjectsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display">Exam Reports</h1>
          <p className="text-destructive mt-1">Error loading subject data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-display">Exam Reports</h1>
        <p className="text-muted-foreground mt-1">
          View statistics and analytics for Pre-Tests and Post-Tests
        </p>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="stat-total-exams">
              {totalExams}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <BarChart3 className="h-5 w-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="stat-total-attempts">
              {totalAttempts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Participated</CardTitle>
            <Users className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="stat-unique-students">
              {totalUniqueStudents}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-5 w-5 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display" data-testid="stat-avg-score">
              {overallAvgScore}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter exams by criteria to view specific statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-exams"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger id="program" data-testid="select-program">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {(programs || []).map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-level">Year Level</Label>
              <Select value={selectedYearLevel} onValueChange={setSelectedYearLevel}>
                <SelectTrigger id="year-level" data-testid="select-year-level">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                  <SelectItem value="4">Year 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-type">Exam Type</Label>
              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger id="exam-type" data-testid="select-exam-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pre_test">Pre-Test</SelectItem>
                  <SelectItem value="post_test">Post-Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-type">Term</Label>
              <Select value={selectedMaterialType} onValueChange={setSelectedMaterialType}>
                <SelectTrigger id="material-type" data-testid="select-material-type">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="midterm">Midterm</SelectItem>
                  <SelectItem value="finals">Finals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject" data-testid="select-subject">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects?.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Statistics Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Exam Statistics</CardTitle>
              <CardDescription>
                Showing {examStats.length} exam{examStats.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {examStats.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-center">Attempts</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examStats.map(({ exam, subject, totalAttempts, uniqueStudents, avgScore }) => (
                    <TableRow key={exam.id} data-testid={`row-exam-${exam.id}`}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{subject?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="default" data-testid={`badge-type-${exam.id}`}>
                          {exam.examType === 'pre_test' ? 'Pre-Test' : 'Post-Test'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" data-testid={`badge-term-${exam.id}`}>
                          {exam.materialType === 'midterm' ? 'Midterm' : 'Finals'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center" data-testid={`stat-attempts-${exam.id}`}>
                        {totalAttempts}
                      </TableCell>
                      <TableCell className="text-center" data-testid={`stat-students-${exam.id}`}>
                        {uniqueStudents}
                      </TableCell>
                      <TableCell className="text-center" data-testid={`stat-score-${exam.id}`}>
                        <span className={avgScore >= 70 ? 'text-chart-1 font-medium' : avgScore >= 50 ? 'text-chart-3' : 'text-destructive'}>
                          {avgScore}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No exam statistics found</p>
              <p className="text-sm mt-1">
                {exams.length === 0
                  ? "No Pre-Tests or Post-Tests have been created yet"
                  : "Try adjusting your filters"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
