import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Brain, TrendingUp, TrendingDown, RotateCcw, Home } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { SelectQuiz, SelectQuizAttempt } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuizResults() {
  const [, params] = useRoute("/quiz/results/:id");
  const attemptId = params?.id;
  const { isAuthenticated } = useAuth();

  const { data: attempt, isLoading: attemptLoading } = useQuery<SelectQuizAttempt>({
    queryKey: ["/api/quiz-attempts", attemptId],
    enabled: isAuthenticated && !!attemptId,
  });

  const { data: quiz, isLoading: quizLoading } = useQuery<SelectQuiz>({
    queryKey: ["/api/quizzes", attempt?.quizId],
    enabled: isAuthenticated && !!attempt?.quizId,
  });

  const isLoading = attemptLoading || quizLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attempt || !quiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results Not Found</CardTitle>
          <CardDescription>The quiz results could not be found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const incorrectAnswers = attempt.totalQuestions - attempt.correctAnswers;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-chart-2";
    if (score >= 60) return "text-chart-4";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const };
    if (score >= 80) return { label: "Great", variant: "secondary" as const };
    if (score >= 70) return { label: "Good", variant: "secondary" as const };
    if (score >= 60) return { label: "Fair", variant: "outline" as const };
    return { label: "Needs Improvement", variant: "destructive" as const };
  };

  const scoreBadge = getScoreBadge(attempt.score);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-display">Quiz Complete!</h1>
        <p className="text-muted-foreground" data-testid="text-quiz-title">{quiz.title}</p>
      </div>

      {/* Score Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className={`text-6xl md:text-7xl font-bold font-display ${getScoreColor(attempt.score)}`} data-testid="text-score">
                {attempt.score}%
              </div>
              <Badge variant={scoreBadge.variant} className="text-base px-4 py-1">
                {scoreBadge.label}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-chart-2" data-testid="text-correct-answers">{attempt.correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-destructive" data-testid="text-incorrect-answers">{incorrectAnswers}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold" data-testid="text-time-spent">{attempt.timeSpentMinutes}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link href="/quizzes/available">
                <Button size="lg" data-testid="button-take-another">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Take Another Quiz
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" data-testid="button-back-dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>Review your answers and learn from mistakes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {attempt.answers.map((answer) => {
            const question = quiz.questions[answer.questionIndex];
            return (
              <div
                key={answer.questionIndex}
                className={`p-4 rounded-lg border ${
                  answer.isCorrect ? "bg-chart-2/5 border-chart-2/20" : "bg-destructive/5 border-destructive/20"
                }`}
                data-testid={`review-question-${answer.questionIndex}`}
              >
                <div className="flex items-start gap-3">
                  {answer.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="font-medium">
                      Question {answer.questionIndex + 1}: {question.questionText}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Your answer:</span>
                        <span className={answer.isCorrect ? "text-chart-2 font-medium" : "text-destructive font-medium"}>
                          {answer.userAnswer || "(No answer)"}
                        </span>
                      </div>
                      {!answer.isCorrect && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Correct answer:</span>
                          <span className="text-chart-2 font-medium">{question.correctAnswer}</span>
                        </div>
                      )}
                      {question.explanation && (
                        <div className="mt-2 p-3 bg-muted/50 rounded text-sm leading-relaxed">
                          <span className="font-semibold">Explanation: </span>
                          {question.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
