import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, FileQuestion, Plus } from "lucide-react";
import { Link } from "wouter";
import { EmptyState } from "@/components/empty-state";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { SelectQuiz, SelectSubject } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type QuizWithSubject = SelectQuiz & { subject?: Pick<SelectSubject, "name"> };

export default function AvailableQuizzes() {
  const { isAuthenticated } = useAuth();

  const { data: quizzes, isLoading } = useQuery<QuizWithSubject[]>({
    queryKey: ["/api/quizzes"],
    enabled: isAuthenticated,
  });

  const { data: subjects } = useQuery<SelectSubject[]>({
    queryKey: ["/api/subjects"],
    enabled: isAuthenticated,
  });

  const quizzesWithSubjects = quizzes?.map(quiz => {
    const subject = subjects?.find(s => s.id === quiz.subjectId);
    return {
      ...quiz,
      subject: subject ? { name: subject.name } : undefined,
    };
  }) || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "medium":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      case "hard":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display">Available Quizzes</h1>
          <p className="text-muted-foreground mt-1">Test your knowledge with AI-generated quizzes</p>
        </div>
        <Link href="/quiz/generate">
          <Button size="lg" data-testid="button-generate-new-quiz">
            <Plus className="h-5 w-5 mr-2" />
            Generate New Quiz
          </Button>
        </Link>
      </div>

      {/* Quizzes Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : quizzesWithSubjects.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No Quizzes Available"
          description="Generate your first AI-powered quiz to start testing your knowledge"
          actionLabel="Generate Quiz"
          onAction={() => window.location.href = "/quiz/generate"}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzesWithSubjects.map((quiz) => (
            <Card key={quiz.id} className="hover-elevate flex flex-col" data-testid={`card-quiz-${quiz.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <CardTitle className="text-lg leading-tight">{quiz.title}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {quiz.subject && (
                        <Badge variant="secondary" className="text-xs">
                          {quiz.subject.name}
                        </Badge>
                      )}
                      <Badge variant="secondary" className={`text-xs ${getDifficultyColor(quiz.difficulty)}`}>
                        {quiz.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileQuestion className="h-4 w-4" />
                      <span>{quiz.questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{Math.ceil(quiz.questions.length * 2)} min</span>
                    </div>
                  </div>

                  <Link href={`/quiz/${quiz.id}`}>
                    <Button className="w-full" data-testid={`button-start-quiz-${quiz.id}`}>
                      Start Quiz
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
