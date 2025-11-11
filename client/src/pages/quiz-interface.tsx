import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useLocation } from "wouter";

export default function QuizInterface() {
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes in seconds

  // Mock quiz data
  const quiz = {
    id: "1",
    title: "Data Structures Fundamentals",
    subject: "Data Structures and Algorithms",
    difficulty: "medium",
    totalQuestions: 10,
    estimatedMinutes: 30,
  };

  const questions = [
    {
      id: "q1",
      text: "What is the time complexity of inserting an element at the beginning of an array?",
      type: "multiple_choice",
      options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
      correctAnswer: "O(n)",
    },
    {
      id: "q2",
      text: "Which data structure follows the LIFO (Last In First Out) principle?",
      type: "multiple_choice",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correctAnswer: "Stack",
    },
    // More questions would be here
  ];

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else {
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

  const handleSubmit = () => {
    // Calculate score and submit
    setLocation("/quiz/results/1");
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">{quiz.title}</h1>
          <p className="text-muted-foreground">{quiz.subject}</p>
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
          <CardTitle className="text-xl leading-relaxed">
            {questions[currentQuestion].text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={selectedAnswers[currentQuestion] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
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
