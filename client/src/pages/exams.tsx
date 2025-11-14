import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { FileText, Calendar, Target, TrendingUp } from "lucide-react";
import type { Quiz, Subject } from "@shared/schema";

export default function Exams() {
  const { user } = useAuth();

  const { data: availableExams, isLoading: examsLoading } = useQuery<Array<Quiz & { attemptCount: number; lastAttemptAt: Date | null; preTestAttempted?: boolean }>>({
    queryKey: ['/api/exams/available'],
    enabled: !!user,
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: !!user,
  });

  if (examsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display">Available Exams</h1>
          <p className="text-muted-foreground mt-2">
            Loading your exams...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Group exams by subject
  const examsBySubject = availableExams?.reduce((acc, exam) => {
    const subject = subjects?.find(s => s.id === exam.subjectId);
    if (!subject) return acc;
    
    const key = subject.id;
    if (!acc[key]) {
      acc[key] = {
        subject,
        exams: [],
      };
    }
    acc[key].exams.push(exam);
    return acc;
  }, {} as Record<string, { subject: Subject; exams: Array<Quiz & { attemptCount: number; lastAttemptAt: Date | null }> }>);

  const sortedSubjects = examsBySubject ? Object.values(examsBySubject).sort((a, b) => 
    a.subject.name.localeCompare(b.subject.name)
  ) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display" data-testid="heading-exams">
          Available Exams
        </h1>
        <p className="text-muted-foreground">
          Take Pre-Tests and Post-Tests to measure your progress
        </p>
      </div>

      {/* Stats Cards */}
      {availableExams && availableExams.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-exams">
                {availableExams.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pre-Tests</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-pre-tests">
                {availableExams.filter(e => e.examType === 'pre_test').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Post-Tests</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-post-tests">
                {availableExams.filter(e => e.examType === 'post_test').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-completed-exams">
                {availableExams.filter(e => e.attemptCount > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exams by Subject */}
      {!availableExams || availableExams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Exams Available</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Pre-Tests and Post-Tests will appear here once your instructors create them based on your study materials.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedSubjects.map(({ subject, exams }) => (
            <div key={subject.id} className="space-y-4">
              {/* Subject Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold font-display">
                    {subject.name}
                  </h2>
                  {subject.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {subject.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">
                  {exams.length} {exams.length === 1 ? 'exam' : 'exams'}
                </Badge>
              </div>

              {/* Exams Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => {
                  const examTypeBadge = exam.examType === 'pre_test' ? 'Pre-Test' : 'Post-Test';
                  const materialTypeBadge = exam.materialType === 'midterm' ? 'Midterm' : 'Finals';
                  const attemptText = exam.attemptCount === 0 
                    ? 'Not Taken' 
                    : `Taken ${exam.attemptCount} ${exam.attemptCount === 1 ? 'time' : 'times'}`;
                  
                  return (
                    <Card key={exam.id} className="hover-elevate" data-testid={`card-exam-${exam.id}`}>
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold break-words">
                              {exam.title}
                            </CardTitle>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Badge 
                              variant={exam.examType === 'pre_test' ? 'default' : 'secondary'}
                              data-testid={`badge-exam-type-${exam.id}`}
                            >
                              {examTypeBadge}
                            </Badge>
                            <Badge variant="outline" data-testid={`badge-material-type-${exam.id}`}>
                              {materialTypeBadge}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Questions:</span>
                            <span className="font-medium">{exam.questions.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="font-medium" data-testid={`text-attempt-status-${exam.id}`}>
                              {attemptText}
                            </span>
                          </div>
                          {exam.lastAttemptAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Last Attempt:</span>
                              <span className="font-medium text-xs">
                                {new Date(exam.lastAttemptAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        {exam.examType === 'post_test' && !exam.preTestAttempted ? (
                          <div className="w-full">
                            <Button 
                              className="w-full"
                              variant="secondary"
                              disabled
                              data-testid={`button-take-exam-${exam.id}`}
                              title="You must take the corresponding Pre-Test before taking this Post-Test"
                            >
                              Take Pre-Test First
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              Complete the Pre-Test to unlock this exam
                            </p>
                          </div>
                        ) : (
                          <Link href={`/quiz/${exam.id}`} className="w-full">
                            <Button 
                              className="w-full"
                              variant={exam.attemptCount === 0 ? "default" : "secondary"}
                              data-testid={`button-take-exam-${exam.id}`}
                            >
                              {exam.attemptCount === 0 ? 'Take Exam' : 'Retake Exam'}
                            </Button>
                          </Link>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
