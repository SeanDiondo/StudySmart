import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Target, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Subject } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateStudyPlan() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, startTransition] = useTransition();

  // Fetch available subjects from backend
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects/for-student"],
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
  
  // Weekly calendar state: { "monday-09:00": true, "tuesday-14:00": true, ... }
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Record<string, boolean>>({});
  
  // Google Meet-style builder state
  const [builderDays, setBuilderDays] = useState<string[]>([]);
  const [builderStartTime, setBuilderStartTime] = useState("");
  const [builderEndTime, setBuilderEndTime] = useState("");
  const [addedRanges, setAddedRanges] = useState<Array<{ id: string; days: string[]; startTime: string; endTime: string }>>([]);

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

  // Time slots for calendar (30-minute intervals from 6 AM to 11:30 PM)
  const timeSlots = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
  ];

  const formatTimeDisplay = (time: string) => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr);
    const minute = minuteStr;
    const isPM = hour >= 12;
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    const period = isPM ? "PM" : "AM";
    return minute === "00" ? `${displayHour} ${period}` : `${displayHour}:${minute} ${period}`;
  };

  const handleTimeSlotToggle = (day: string, time: string) => {
    const key = `${day.toLowerCase()}-${time}`;
    setSelectedTimeSlots(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleBuilderDayToggle = (day: string) => {
    setBuilderDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddTimeRange = () => {
    // Validation
    if (builderDays.length === 0) {
      toast({
        title: "Select days",
        description: "Please select at least one day of the week",
        variant: "destructive",
      });
      return;
    }

    if (!builderStartTime || !builderEndTime) {
      toast({
        title: "Select times",
        description: "Please select both start and end times",
        variant: "destructive",
      });
      return;
    }

    const timeToMinutes = (time: string): number => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    };

    if (timeToMinutes(builderStartTime) >= timeToMinutes(builderEndTime)) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    // Create time slots for each selected day
    const newSlots: Record<string, boolean> = { ...selectedTimeSlots };
    const startMinutes = timeToMinutes(builderStartTime);
    const endMinutes = timeToMinutes(builderEndTime);

    builderDays.forEach(day => {
      // Generate 30-minute intervals from start to end
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const key = `${day.toLowerCase()}-${timeStr}`;
        newSlots[key] = true;
      }
    });

    setSelectedTimeSlots(newSlots);

    // Add to ranges list
    const rangeId = `${Date.now()}-${Math.random()}`;
    setAddedRanges(prev => [...prev, {
      id: rangeId,
      days: [...builderDays],
      startTime: builderStartTime,
      endTime: builderEndTime,
    }]);

    // Reset builder form
    setBuilderDays([]);
    setBuilderStartTime("");
    setBuilderEndTime("");

    toast({
      title: "Time range added",
      description: `Added ${builderDays.join(', ')} from ${formatTimeDisplay(builderStartTime)} to ${formatTimeDisplay(builderEndTime)}`,
    });
  };

  const handleRemoveTimeRange = (rangeId: string) => {
    const range = addedRanges.find(r => r.id === rangeId);
    if (!range) return;

    // Remove time slots from the calendar
    const newSlots: Record<string, boolean> = { ...selectedTimeSlots };
    const timeToMinutes = (time: string): number => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    };

    const startMinutes = timeToMinutes(range.startTime);
    const endMinutes = timeToMinutes(range.endTime);

    range.days.forEach(day => {
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const key = `${day.toLowerCase()}-${timeStr}`;
        delete newSlots[key];
      }
    });

    setSelectedTimeSlots(newSlots);
    setAddedRanges(prev => prev.filter(r => r.id !== rangeId));
  };

  const calculateTotalHours = () => {
    // Each selected slot is 30 minutes = 0.5 hours
    return Object.values(selectedTimeSlots).filter(Boolean).length * 0.5;
  };

  const getSelectedDaysCount = () => {
    const days = new Set<string>();
    Object.keys(selectedTimeSlots).forEach(key => {
      if (selectedTimeSlots[key]) {
        const [day] = key.split("-");
        days.add(day);
      }
    });
    return days.size;
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

    // Build time slots from selected calendar blocks - preserve non-contiguous blocks
    const timeSlotsByDay: Record<string, string[]> = {};
    const dayCapitalization: Record<string, string> = {}; // Keep original capitalization
    
    Object.keys(selectedTimeSlots).forEach(key => {
      if (selectedTimeSlots[key]) {
        const [dayLower, time] = key.split("-");
        // Find the original capitalized day name
        const dayCapitalized = daysOfWeek.find(d => d.toLowerCase() === dayLower) || dayLower;
        
        if (!timeSlotsByDay[dayLower]) {
          timeSlotsByDay[dayLower] = [];
          dayCapitalization[dayLower] = dayCapitalized;
        }
        timeSlotsByDay[dayLower].push(time);
      }
    });

    // Group contiguous time blocks per day (don't collapse gaps) - 30-minute intervals
    const availableTimeSlots: Array<{ day: string; startTime: string; endTime: string }> = [];
    
    const timeToMinutes = (time: string): number => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute;
    };
    
    const minutesToTime = (minutes: number): string => {
      const hour = Math.floor(minutes / 60) % 24;
      const minute = minutes % 60;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };
    
    const add30Minutes = (time: string): string => {
      return minutesToTime(timeToMinutes(time) + 30);
    };
    
    Object.keys(timeSlotsByDay).forEach(day => {
      const times = timeSlotsByDay[day].sort();
      
      // Group into contiguous blocks (30-minute increments)
      let currentBlockStart = times[0];
      let previousTime = times[0];
      
      for (let i = 1; i <= times.length; i++) {
        const currentTime = times[i];
        // Check if current time is exactly 30 minutes after previous time
        const isContiguous = i < times.length && 
          timeToMinutes(currentTime) === timeToMinutes(previousTime) + 30;
        
        if (!isContiguous) {
          // End current block - endTime is 30 minutes after the last selected block
          availableTimeSlots.push({
            day: day.toLowerCase(),
            startTime: currentBlockStart,
            endTime: add30Minutes(previousTime)
          });
          
          if (i < times.length) {
            currentBlockStart = currentTime;
          }
        }
        
        previousTime = currentTime;
      }
    });

    // Get unique days with proper capitalization
    const uniqueDays = Object.keys(timeSlotsByDay).map(dayLower => dayCapitalization[dayLower]);
    const totalHours = calculateTotalHours();

    const planData = {
      hoursPerWeek: Math.round(totalHours),
      learningGoals: learningGoals || "Personal development and skill improvement",
      availableDays: uniqueDays,
      availableTimeSlots: availableTimeSlots,
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

        {/* Step 2: Weekly Calendar Schedule */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <CardTitle className="text-xl">Set Your Schedule</CardTitle>
                  <CardDescription>Add time slots when you're available to study</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Meet-Style Time Range Builder */}
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Study Time
                </h4>

                {/* Day Checkboxes */}
                <div>
                  <Label className="text-sm mb-2 block">Select Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={builderDays.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleBuilderDayToggle(day)}
                        className="min-w-[70px]"
                        data-testid={`button-day-${day.toLowerCase()}`}
                      >
                        {builderDays.includes(day) && <Check className="h-3 w-3 mr-1" />}
                        {day.substring(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Range Selectors */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                    <Select value={builderStartTime} onValueChange={setBuilderStartTime}>
                      <SelectTrigger id="start-time" data-testid="select-start-time">
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="text-sm">End Time</Label>
                    <Select value={builderEndTime} onValueChange={setBuilderEndTime}>
                      <SelectTrigger id="end-time" data-testid="select-end-time">
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatTimeDisplay(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Add Button */}
                <Button
                  type="button"
                  onClick={handleAddTimeRange}
                  className="w-full"
                  variant="secondary"
                  data-testid="button-add-time-range"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Range
                </Button>
              </div>

              {/* Added Ranges List */}
              {addedRanges.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Added Time Slots</Label>
                  <div className="space-y-2">
                    {addedRanges.map((range) => (
                      <div
                        key={range.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-background"
                      >
                        <div className="text-sm">
                          <div className="font-medium">{range.days.join(', ')}</div>
                          <div className="text-muted-foreground">
                            {formatTimeDisplay(range.startTime)} - {formatTimeDisplay(range.endTime)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTimeRange(range.id)}
                          data-testid={`button-remove-range-${range.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{calculateTotalHours()} hours selected</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTimeSlots({});
                    setAddedRanges([]);
                  }}
                  data-testid="button-clear-schedule"
                >
                  Clear All
                </Button>
              </div>

              {/* Weekly Calendar Grid */}
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="grid grid-cols-[100px_repeat(7,1fr)] border border-border rounded-lg overflow-hidden">
                    {/* Header Row - Days of Week */}
                    <div className="bg-muted p-3 border-r border-b border-border"></div>
                    {daysOfWeek.map((day, index) => (
                      <div
                        key={day}
                        className={`bg-muted p-3 text-center font-semibold text-sm border-b border-border ${
                          index < daysOfWeek.length - 1 ? 'border-r' : ''
                        }`}
                        data-testid={`header-${day.toLowerCase()}`}
                      >
                        <div className="hidden md:block">{day}</div>
                        <div className="md:hidden">{day.substring(0, 3)}</div>
                      </div>
                    ))}

                    {/* Time Slot Rows */}
                    {timeSlots.map((time, rowIndex) => (
                      <div key={`row-${time}`} className="contents">
                        {/* Time Label */}
                        <div className={`bg-muted p-2 flex items-center justify-end text-xs text-muted-foreground font-medium border-r border-border ${
                          rowIndex < timeSlots.length - 1 ? 'border-b' : ''
                        }`}>
                          {formatTimeDisplay(time)}
                        </div>
                        
                        {/* Time Blocks for Each Day */}
                        {daysOfWeek.map((day, colIndex) => {
                          const key = `${day.toLowerCase()}-${time}`;
                          const isSelected = selectedTimeSlots[key];
                          
                          return (
                            <div
                              key={key}
                              onClick={() => handleTimeSlotToggle(day, time)}
                              className={`
                                p-2 cursor-pointer hover-elevate active-elevate-2
                                min-h-[36px] flex items-center justify-center
                                ${rowIndex < timeSlots.length - 1 ? 'border-b border-border' : ''}
                                ${colIndex < daysOfWeek.length - 1 ? 'border-r border-border' : ''}
                                ${isSelected ? "bg-primary text-primary-foreground" : "bg-background"}
                              `}
                              data-testid={`timeslot-${day.toLowerCase()}-${time}`}
                            >
                              {isSelected && (
                                <Check className="h-4 w-4" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-sm">How to use:</h4>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                  <li>• Use the form above to quickly add time ranges for multiple days</li>
                  <li>• Or click individual time blocks in the calendar below</li>
                  <li>• Each block represents 30 minutes of study time</li>
                  <li>• The calendar shows all your selected time slots</li>
                </ul>
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
                  disabled={calculateTotalHours() === 0}
                  data-testid="button-next-step-2"
                >
                  Next Step ({calculateTotalHours()}h selected)
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
                  <p><span className="text-muted-foreground">Schedule:</span> {getSelectedDaysCount()} days per week</p>
                  <p><span className="text-muted-foreground">Time commitment:</span> {calculateTotalHours()} hours per week</p>
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
