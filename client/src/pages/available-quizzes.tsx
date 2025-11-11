import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, FileQuestion, Plus } from "lucide-react";
import { Link } from "wouter";
import { EmptyState } from "@/components/empty-state";

export default function AvailableQuizzes() {
  // Mock data
  const availableQuizzes = [
    {
      id: "1",
      title: "Data Structures Fundamentals",
      subject: "Data Structures and Algorithms",
      difficulty: "medium",
      totalQuestions: 10,
      estimatedMinutes: 30,
      description: "Test your understanding of arrays, linked lists, stacks, and queues",
    },
    {
      id: "2",
      title: "React Hooks Deep Dive",
      subject: "Web Development",
      difficulty: "hard",
      totalQuestions: 15,
      estimatedMinutes: 45,
      description: "Advanced concepts in useState, useEffect, and custom hooks",
    },
    {
      id: "3",
      title: "SQL Basics",
      subject: "Database Systems",
      difficulty: "easy",
      totalQuestions: 12,
      estimatedMinutes: 25,
      description: "SELECT queries, WHERE clauses, and basic JOIN operations",
    },
    {
      id: "4",
      title: "Algorithm Complexity",
      subject: "Data Structures and Algorithms",
      difficulty: "medium",
      totalQuestions: 8,
      estimatedMinutes: 20,
      description: "Big O notation, time complexity, and space complexity analysis",
    },
    {
      id: "5",
      title: "Network Fundamentals",
      subject: "Computer Networks",
      difficulty: "easy",
      totalQuestions: 10,
      estimatedMinutes: 20,
      description: "OSI model, TCP/IP, and basic networking concepts",
    },
    {
      id: "6",
      title: "Advanced Database Design",
      subject: "Database Systems",
      difficulty: "hard",
      totalQuestions: 12,
      estimatedMinutes: 40,
      description: "Normalization, indexing strategies, and query optimization",
    },
  ];

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
      {availableQuizzes.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No Quizzes Available"
          description="Generate your first AI-powered quiz to start testing your knowledge"
          actionLabel="Generate Quiz"
          onAction={() => window.location.href = "/quiz/generate"}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableQuizzes.map((quiz) => (
            <Card key={quiz.id} className="hover-elevate flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <CardTitle className="text-lg leading-tight">{quiz.title}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {quiz.subject}
                      </Badge>
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
                <CardDescription className="line-clamp-2 leading-relaxed">
                  {quiz.description}
                </CardDescription>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileQuestion className="h-4 w-4" />
                      <span>{quiz.totalQuestions} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.estimatedMinutes} min</span>
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
