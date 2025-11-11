import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Target, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Subject } from "@shared/schema";

export default function CreateStudyPlan() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, startTransition] = useTransition();

  // Fetch available subjects from backend
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    enabled: isAuthenticated,
  });

  // Form state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectHours, setSubjectHours] = useState<Record<string, number>>({});
  const [subjectPriorities, setSubjectPriorities] = useState<Record<string, number>>({});
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [learningPace, setLearningPace] = useState("moderate");
  const [learningGoals, setLearningGoals] = useState("");

  // Create study plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/study-plans", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      toast({
        title: "Success!",
        description: "Your study plan has been created",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create study plan",
        variant: "destructive",
      });
    },
  });

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleDayToggle = (day: string) => {
    setAvailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build subjects array with hours and priorities
    const planSubjects = selectedSubjects.map(subjectId => ({
      subjectId,
      hoursAllocated: subjectHours[subjectId] || 3,
      priority: subjectPriorities[subjectId] || 3,
    }));

    const planData = {
      hoursPerWeek: parseInt(hoursPerWeek) || 10,
      learningPace: learningPace as "slow" | "moderate" | "fast",
      learningGoals: learningGoals || undefined,
      subjects: planSubjects,
    };

    createPlanMutation.mutate(planData);
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-display">Create Study Plan</h1>
        <p className="text-muted-foreground">Build your personalized learning schedule</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Step {step} of {totalSteps}</span>
          <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Subject Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <CardTitle className="text-xl">Select Your Subjects</CardTitle>
                  <CardDescription>Choose the subjects you want to study</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {(subjects || []).map((subject) => (
                  <div
                    key={subject.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer hover-elevate ${
                      selectedSubjects.includes(subject.id) ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => handleSubjectToggle(subject.id)}
                    data-testid={`checkbox-subject-${subject.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className={`h-5 w-5 rounded border-2 mt-0.5 flex items-center justify-center ${
                      selectedSubjects.includes(subject.id) 
                        ? "bg-primary border-primary" 
                        : "border-input"
                    }`}>
                      {selectedSubjects.includes(subject.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{subject.name}</div>
                      {subject.description && (
                        <div className="text-sm text-muted-foreground">{subject.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedSubjects.length} {selectedSubjects.length === 1 ? "subject" : "subjects"} selected
                </p>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={selectedSubjects.length === 0}
                  data-testid="button-next-step-1"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Available Time */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <CardTitle className="text-xl">Set Your Schedule</CardTitle>
                  <CardDescription>When are you available to study?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Available Days
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover-elevate ${
                        availableDays.includes(day) ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleDayToggle(day)}
                      data-testid={`checkbox-day-${day.toLowerCase()}`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                        availableDays.includes(day) 
                          ? "bg-primary border-primary" 
                          : "border-input"
                      }`}>
                        {availableDays.includes(day) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <Label className="cursor-pointer font-normal">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="hours" className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Hours Per Week
                </Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  max="40"
                  placeholder="e.g., 15"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  required
                  data-testid="input-hours-per-week"
                />
                <p className="text-sm text-muted-foreground">
                  How many hours can you dedicate to studying each week?
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back-step-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={availableDays.length === 0 || !hoursPerWeek}
                  data-testid="button-next-step-2"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Learning Goals */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <CardTitle className="text-xl">Define Your Goals</CardTitle>
                  <CardDescription>What do you want to achieve?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="goals" className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Learning Goals
                </Label>
                <Textarea
                  id="goals"
                  placeholder="Describe your learning objectives... e.g., Master data structures for technical interviews, Build a full-stack web application, Prepare for final exams"
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  required
                  rows={6}
                  data-testid="textarea-learning-goals"
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about what you want to learn and why. This helps our AI generate better quizzes and recommendations.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Study Plan Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Subjects:</span> {selectedSubjects.length} selected</p>
                  <p><span className="text-muted-foreground">Schedule:</span> {availableDays.length} days per week</p>
                  <p><span className="text-muted-foreground">Time commitment:</span> {hoursPerWeek} hours per week</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back-step-3"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!learningGoals.trim()}
                  data-testid="button-create-plan"
                  size="lg"
                >
                  Create Study Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
