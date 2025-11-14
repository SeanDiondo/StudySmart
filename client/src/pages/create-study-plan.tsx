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
  
  // Event-based schedule state (Google Calendar style)
  const [scheduleEvents, setScheduleEvents] = useState<Array<{
    id: string;
    day: string; // "Monday", "Tuesday", etc.
    startMinutes: number; // minutes from midnight (e.g., 540 = 9:00 AM)
    endMinutes: number;
    label: string; // e.g., "9:00 AM - 11:00 AM"
  }>>([]);
  
  // Google Meet-style builder state
  const [builderDays, setBuilderDays] = useState<string[]>([]);
  const [builderStartTime, setBuilderStartTime] = useState("");
  const [builderEndTime, setBuilderEndTime] = useState("");

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

  // Generate time slots with 15-minute intervals from midnight to 11:45 PM
  const generateTimeSlots = (startHour: number = 0, endHour: number = 24, intervalMinutes: number = 15): string[] => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const hourStr = String(hour).padStart(2, '0');
        const minuteStr = String(minute).padStart(2, '0');
        slots.push(`${hourStr}:${minuteStr}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots(0, 24, 15);

  // Helper functions
  const timeToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };

  const minutesToTime = (minutes: number): string => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const formatTimeDisplay = (time: string) => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr);
    const minute = minuteStr;
    const isPM = hour >= 12;
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    const period = isPM ? "PM" : "AM";
    return minute === "00" ? `${displayHour} ${period}` : `${displayHour}:${minute} ${period}`;
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

    const startMinutes = timeToMinutes(builderStartTime);
    const endMinutes = timeToMinutes(builderEndTime);

    if (startMinutes >= endMinutes) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    // Create events for each selected day
    const newEvents = builderDays.map(day => ({
      id: `${Date.now()}-${Math.random()}-${day}`,
      day,
      startMinutes,
      endMinutes,
      label: `${formatTimeDisplay(builderStartTime)} - ${formatTimeDisplay(builderEndTime)}`,
    }));

    setScheduleEvents(prev => [...prev, ...newEvents]);

    // Reset builder form
    setBuilderDays([]);
    setBuilderStartTime("");
    setBuilderEndTime("");

    toast({
      title: "Time range added",
      description: `Added ${builderDays.join(', ')} from ${formatTimeDisplay(builderStartTime)} to ${formatTimeDisplay(builderEndTime)}`,
    });
  };

  const handleRemoveEvent = (eventId: string) => {
    setScheduleEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const calculateTotalHours = () => {
    // Sum up all event durations (in minutes) and convert to hours
    const totalMinutes = scheduleEvents.reduce((sum, event) => {
      return sum + (event.endMinutes - event.startMinutes);
    }, 0);
    return totalMinutes / 60;
  };

  const getSelectedDaysCount = () => {
    const days = new Set<string>();
    scheduleEvents.forEach(event => {
      days.add(event.day);
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

    // Convert schedule events to time slots format expected by API
    const availableTimeSlots: Array<{ day: string; startTime: string; endTime: string }> = scheduleEvents.map(event => ({
      day: event.day,
      startTime: minutesToTime(event.startMinutes),
      endTime: minutesToTime(event.endMinutes),
    }));

    // Get unique days from events
    const uniqueDays = Array.from(new Set(scheduleEvents.map(e => e.day)));
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

              {/* Schedule Events List */}
              {scheduleEvents.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Added Time Slots</Label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {scheduleEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg bg-background"
                      >
                        <div className="text-sm">
                          <div className="font-medium">{event.day}</div>
                          <div className="text-muted-foreground">{event.label}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEvent(event.id)}
                          data-testid={`button-remove-event-${event.id}`}
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
                  <span className="font-semibold">{calculateTotalHours().toFixed(1)} hours selected</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleEvents([])}
                  data-testid="button-clear-schedule"
                >
                  Clear All
                </Button>
              </div>

              {/* Google Calendar-Style Timeline */}
              <div className="border border-border rounded-lg bg-background overflow-hidden">
                <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border">
                  {/* Empty corner */}
                  <div className="bg-muted"></div>
                  {/* Day headers */}
                  {daysOfWeek.map((day, index) => (
                    <div
                      key={day}
                      className={`bg-muted p-3 text-center font-semibold text-sm ${
                        index < daysOfWeek.length - 1 ? 'border-r border-border' : ''
                      }`}
                      data-testid={`header-${day.toLowerCase()}`}
                    >
                      <div className="hidden md:block">{day}</div>
                      <div className="md:hidden">{day.substring(0, 3)}</div>
                    </div>
                  ))}
                </div>

                {/* Timeline view */}
                <div className="overflow-y-auto max-h-[600px]">
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] relative">
                    {(() => {
                      const displayHours = Array.from({ length: 24 }, (_, i) => i);
                      const slotHeight = 60; // Height in pixels for each hour
                      const totalHeight = 24 * slotHeight; // Total height for 24 hours
                      
                      // Helper to detect overlapping events
                      type ScheduleEvent = { id: string; day: string; startMinutes: number; endMinutes: number; label: string };
                      const getEventColumns = (dayEvents: ScheduleEvent[]) => {
                        // Sort events by start time
                        const sorted = [...dayEvents].sort((a, b) => a.startMinutes - b.startMinutes);
                        const columns: ScheduleEvent[][] = [];
                        
                        sorted.forEach(event => {
                          // Find a column where this event doesn't overlap
                          let placed = false;
                          for (const column of columns) {
                            const overlaps = column.some(e => 
                              event.startMinutes < e.endMinutes && event.endMinutes > e.startMinutes
                            );
                            if (!overlaps) {
                              column.push(event);
                              placed = true;
                              break;
                            }
                          }
                          if (!placed) {
                            columns.push([event]);
                          }
                        });
                        
                        return columns;
                      };
                      
                      return (
                        <>
                          {/* Time labels column */}
                          <div className="sticky left-0 z-10">
                            {displayHours.map((hour) => (
                              <div
                                key={hour}
                                className="bg-muted p-2 flex items-start justify-end text-xs text-muted-foreground font-medium border-r border-b border-border h-[60px]"
                              >
                                {formatTimeDisplay(`${String(hour).padStart(2, '0')}:00`)}
                              </div>
                            ))}
                          </div>
                          
                          {/* Day columns with events */}
                          {daysOfWeek.map((day, colIndex) => {
                            const dayEvents = scheduleEvents.filter(e => e.day === day);
                            const eventColumns = getEventColumns(dayEvents);
                            const numColumns = eventColumns.length;
                            
                            return (
                              <div
                                key={day}
                                className={`relative ${
                                  colIndex < daysOfWeek.length - 1 ? 'border-r border-border' : ''
                                }`}
                                style={{ height: `${totalHeight}px` }}
                              >
                                {/* Hour grid lines */}
                                {displayHours.map((hour) => (
                                  <div
                                    key={hour}
                                    className="absolute inset-x-0 border-b border-border"
                                    style={{
                                      top: `${hour * slotHeight}px`,
                                      height: `${slotHeight}px`,
                                    }}
                                    data-testid={`timecell-${day.toLowerCase()}-${hour}`}
                                  />
                                ))}
                                
                                {/* Event bars */}
                                {eventColumns.map((column, columnIndex) => 
                                  column.map(event => {
                                    const top = (event.startMinutes / 60) * slotHeight;
                                    const height = ((event.endMinutes - event.startMinutes) / 60) * slotHeight;
                                    const leftPercent = (columnIndex / numColumns) * 100;
                                    const widthPercent = 100 / numColumns;
                                    
                                    return (
                                      <div
                                        key={event.id}
                                        className="absolute bg-primary text-primary-foreground rounded-md p-2 text-xs overflow-hidden shadow-sm"
                                        style={{
                                          top: `${top}px`,
                                          height: `${height}px`,
                                          left: `${leftPercent}%`,
                                          width: `calc(${widthPercent}% - 4px)`,
                                        }}
                                        data-testid={`event-bar-${event.id}`}
                                      >
                                        <div className="font-semibold truncate">{event.label}</div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
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
                  <li>• Use the form above to add time ranges for multiple days</li>
                  <li>• The timeline below shows your schedule as horizontal bars (like Google Calendar)</li>
                  <li>• Each time range appears as a colored bar on the selected days</li>
                  <li>• Remove time slots using the X button in the "Added Time Slots" list</li>
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
