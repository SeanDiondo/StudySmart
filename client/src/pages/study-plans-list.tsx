import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, BookOpen, Brain, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { LoadingSkeleton } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { StudyPlan, Subject } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function StudyPlansList() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: studyPlans, isLoading } = useQuery<StudyPlan[]>({
    queryKey: ["/api/study-plans"],
    enabled: isAuthenticated,
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch(`/api/study-plans/${planId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete study plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      toast({
        title: "Success!",
        description: "Study plan deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete study plan",
        variant: "destructive",
      });
    },
  });

  const activePlansCount = studyPlans?.filter(plan => plan.isActive).length || 0;
  const totalPlansCount = studyPlans?.length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-32" />
        <LoadingSkeleton className="h-48" />
        <LoadingSkeleton className="h-48" />
      </div>
    );
  }

  if (!studyPlans || studyPlans.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={BookOpen}
          title="No Study Plans Yet"
          description="Create your first personalized study plan to start your learning journey"
          actionLabel="Create Study Plan"
          onAction={() => window.location.href = "/study-plans/new"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display">My Study Plans</h1>
          <p className="text-muted-foreground mt-1">
            {activePlansCount} active {activePlansCount === 1 ? 'plan' : 'plans'} out of {totalPlansCount} total
          </p>
        </div>
        <Link href="/study-plans/new">
          <Button size="lg" data-testid="button-create-study-plan">
            <Plus className="h-5 w-5 mr-2" />
            Create New Plan
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{totalPlansCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Calendar className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{activePlansCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Plans</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{totalPlansCount - activePlansCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Study Plans List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-display">All Study Plans</h2>
        {studyPlans.map((plan, index) => (
          <StudyPlanCard
            key={plan.id}
            plan={plan}
            subjects={subjects}
            planNumber={index + 1}
            onDelete={() => deleteMutation.mutate(plan.id)}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function StudyPlanCard({
  plan,
  subjects,
  planNumber,
  onDelete,
  isDeleting,
}: {
  plan: StudyPlan;
  subjects?: Subject[];
  planNumber: number;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { data: planSubjects } = useQuery<any[]>({
    queryKey: ["/api/study-plans", plan.id, "subjects"],
    enabled: !!plan.id,
  });

  const getSubjectName = (subjectId: string) => {
    const subject = subjects?.find(s => s.id === subjectId);
    return subject?.name || subjectId;
  };

  const createdDate = new Date(plan.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Card className="hover-elevate" data-testid={`study-plan-card-${plan.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                Plan #{planNumber}
              </Badge>
              <span className="text-xs text-muted-foreground">{createdDate}</span>
            </div>
            <CardTitle className="text-lg">
              {plan.learningGoals || "Study Plan"}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              {plan.hoursPerWeek} hours per week
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs">
              {plan.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {planSubjects && planSubjects.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Subjects</h4>
            <div className="flex flex-wrap gap-2">
              {planSubjects.map((planSubject: any) => (
                <Badge key={planSubject.id} variant="outline" className="text-xs">
                  {getSubjectName(planSubject.subjectId)}
                  {planSubject.priority && ` (Priority: ${planSubject.priority})`}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {plan.availableDays && plan.availableDays.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Available Days</h4>
            <div className="flex flex-wrap gap-2">
              {plan.availableDays.map((day: string) => (
                <Badge key={day} variant="secondary" className="text-xs capitalize">
                  {day}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Link href={`/quizzes/available`}>
            <Button size="sm" data-testid={`button-quiz-${plan.id}`}>
              <Brain className="h-4 w-4 mr-1" />
              Take Quiz
            </Button>
          </Link>
          <Link href={`/materials`}>
            <Button variant="outline" size="sm" data-testid={`button-materials-${plan.id}`}>
              <BookOpen className="h-4 w-4 mr-1" />
              View Materials
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            data-testid={`button-delete-${plan.id}`}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
