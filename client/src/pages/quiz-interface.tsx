import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SelectQuiz } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function QuizInterface() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/quiz/:id");
  const quizId = params?.id;
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [startTime] = useState(Date.now());
  const timerInitialized = useRef(false);

  const { data: quiz, isLoading } = useQuery<SelectQuiz>({
    queryKey: ["/api/quizzes", quizId],
    enabled: isAuthenticated && !!quizId,
  });

  const questions = quiz?.questions || [];
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Initialize timer when quiz loads
  useEffect(() => {
    if (quiz && questions.length > 0 && !timerInitialized.current) {
      const estimatedMinutes = questions.length * 2;
      setTimeRemaining(estimatedMinutes * 60);
      timerInitialized.current = true;
    }
  }, [quiz, questions.length]);

  // Timer effect - only runs after initialization
  useEffect(() => {
    if (!timerInitialized.current) return; // Don't run until timer is initialized
    
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const timeSpentMinutes = Math.ceil((Date.now() - startTime) / 60000);
      
      const answers = questions.map((question, index) => ({
        questionIndex: index,
        userAnswer: selectedAnswers[index] || "",
        isCorrect: selectedAnswers[index] === question.correctAnswer,
      }));

      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const score = Math.round((correctAnswers / questions.length) * 100);

      const payload = {
        quizId: quiz!.id,
        score,
        totalQuestions: questions.length,
        correctAnswers,
        timeSpentMinutes,
        answers,
      };

      const res = await apiRequest("POST", "/api/quiz-attempts", payload);
      return await res.json();
    },
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      setLocation(`/quiz/results/${attempt.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit quiz. Please try again.",
      });
    },
  });

  const handleSubmit = () => {
    if (!quiz || submitMutation.isPending) return; // Guard against premature submission
    submitMutation.mutate();
  };

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(selectedAnswers).length;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Not Found</CardTitle>
          <CardDescription>The requested quiz could not be found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setLocation("/quizzes")}>Back to Quizzes</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display" data-testid="text-quiz-title">{quiz.title}</h1>
          <Badge variant="secondary" className="mt-1">{quiz.difficulty}</Badge>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-card border rounded-lg">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-lg font-mono font-semibold" data-testid="text-timer">
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-muted-foreground">
            {answeredCount} / {questions.length} answered
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed" data-testid="text-question">
            {questions[currentQuestion].questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={selectedAnswers[currentQuestion] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
            data-testid="radiogroup-answers"
          >
            {questions[currentQuestion].options.map((option, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer hover-elevate ${
                  selectedAnswers[currentQuestion] === option ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleAnswerSelect(option)}
                data-testid={`radio-option-${index}`}
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1 text-base leading-relaxed">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              data-testid="button-previous-question"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  disabled={answeredCount < questions.length}
                  data-testid="button-submit-quiz"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  data-testid="button-next-question"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`h-10 w-10 rounded-lg border font-medium transition-colors hover-elevate ${
                  index === currentQuestion
                    ? "bg-primary text-primary-foreground border-primary"
                    : selectedAnswers[index]
                    ? "bg-chart-2/10 text-chart-2 border-chart-2/30"
                    : "hover:bg-muted"
                }`}
                data-testid={`button-navigate-${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
