import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Brain, TrendingUp, TrendingDown, RotateCcw, Home } from "lucide-react";
import { Link } from "wouter";

export default function QuizResults() {
  // Mock results data
  const results = {
    quizId: "1",
    quizTitle: "Data Structures Fundamentals",
    subject: "Data Structures and Algorithms",
    score: 85,
    totalQuestions: 10,
    correctAnswers: 8,
    incorrectAnswers: 2,
    timeSpent: 24, // minutes
    completedAt: new Date(),
  };

  const aiInsights = {
    strengths: ["Array manipulation", "Stack operations", "Basic complexity analysis"],
    weaknesses: ["Tree traversal", "Hash table implementation"],
    recommendations: "Focus on practicing tree-based problems. Review hash table collision resolution techniques. Consider reviewing Big O notation for common operations.",
  };

  const questionResults = [
    { id: "q1", text: "What is the time complexity of inserting an element...", userAnswer: "O(n)", correctAnswer: "O(n)", isCorrect: true },
    { id: "q2", text: "Which data structure follows the LIFO principle?", userAnswer: "Stack", correctAnswer: "Stack", isCorrect: true },
    { id: "q3", text: "What is the worst-case time complexity of QuickSort?", userAnswer: "O(n log n)", correctAnswer: "O(n²)", isCorrect: false },
    // More results...
  ];

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

  const scoreBadge = getScoreBadge(results.score);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-display">Quiz Complete!</h1>
        <p className="text-muted-foreground">{results.quizTitle}</p>
      </div>

      {/* Score Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className={`text-6xl md:text-7xl font-bold font-display ${getScoreColor(results.score)}`}>
                {results.score}%
              </div>
              <Badge variant={scoreBadge.variant} className="text-base px-4 py-1">
                {scoreBadge.label}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-chart-2">{results.correctAnswers}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-destructive">{results.incorrectAnswers}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{results.timeSpent}</div>
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

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Performance Analysis</CardTitle>
          </div>
          <CardDescription>Personalized insights based on your performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-2" />
              <span className="font-semibold">Strengths</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiInsights.strengths.map((strength, index) => (
                <Badge key={index} variant="secondary" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {strength}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-chart-4" />
              <span className="font-semibold">Areas to Improve</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiInsights.weaknesses.map((weakness, index) => (
                <Badge key={index} variant="secondary" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiInsights.recommendations}
            </p>
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
          {questionResults.map((question, index) => (
            <div
              key={question.id}
              className={`p-4 rounded-lg border ${
                question.isCorrect ? "border-chart-2/30 bg-chart-2/5" : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="flex items-start gap-3">
                {question.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-chart-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="font-medium">
                    {index + 1}. {question.text}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className={question.isCorrect ? "text-chart-2 font-medium" : "text-destructive font-medium"}>
                        {question.userAnswer}
                      </span>
                    </div>
                    {!question.isCorrect && (
                      <div>
                        <span className="text-muted-foreground">Correct answer: </span>
                        <span className="text-chart-2 font-medium">{question.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
