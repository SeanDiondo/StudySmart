import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Sparkles, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subject, StudyMaterial } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

const quizGenerationSchema = z.object({
  subjectId: z.string().min(1, "Please select a subject"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.coerce.number().min(5, "Minimum 5 questions").max(20, "Maximum 20 questions"),
  materialIds: z.array(z.string()).optional(),
});

type QuizGenerationForm = z.infer<typeof quizGenerationSchema>;

export default function GenerateQuiz() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects/for-student"],
    enabled: isAuthenticated,
  });

  const form = useForm<QuizGenerationForm>({
    resolver: zodResolver(quizGenerationSchema),
    defaultValues: {
      subjectId: "",
      difficulty: "medium",
      questionCount: 10,
      materialIds: [],
    },
  });

  const selectedSubjectId = form.watch("subjectId");

  const { data: materials, isLoading: materialsLoading } = useQuery<StudyMaterial[]>({
    queryKey: selectedSubjectId 
      ? [`/api/study-materials?subjectId=${selectedSubjectId}`] 
      : ["/api/study-materials"],
    enabled: !!selectedSubjectId && isAuthenticated,
  });

  useEffect(() => {
    setSelectedMaterials([]);
    form.setValue("materialIds", []);
  }, [selectedSubjectId, form]);

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) => {
      const newSelection = prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId];
      form.setValue("materialIds", newSelection);
      return newSelection;
    });
  };

  const toggleAllMaterials = () => {
    if (materials) {
      const allIds = materials.map((m) => m.id);
      const newSelection = selectedMaterials.length === materials.length ? [] : allIds;
      setSelectedMaterials(newSelection);
      form.setValue("materialIds", newSelection);
    }
  };

  const generateMutation = useMutation({
    mutationFn: async (data: QuizGenerationForm) => {
      const payload = {
        ...data,
        materialIds: selectedMaterials.length > 0 ? selectedMaterials : undefined,
      };
      const res = await apiRequest("POST", "/api/quizzes/generate", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz Generated!",
        description: "Your AI-powered quiz has been created successfully.",
      });
      setLocation("/quizzes");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate quiz. Please try again.",
      });
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-display">Generate AI Quiz</h1>
        <p className="text-muted-foreground text-lg">
          Create a personalized quiz powered by AI based on your study materials
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Quiz Configuration
          </CardTitle>
          <CardDescription>
            Select a subject and customize your quiz parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => generateMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Quiz questions will be generated from this subject's study materials
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedSubjectId && (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Study Materials (Optional)
                  </FormLabel>
                  <FormDescription className="mb-3">
                    Select specific materials to base quiz questions on, or leave empty to use all available materials
                  </FormDescription>
                  {materialsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading materials...</div>
                  ) : materials && materials.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Checkbox
                          id="select-all"
                          checked={selectedMaterials.length === materials.length && materials.length > 0}
                          onCheckedChange={toggleAllMaterials}
                          data-testid="checkbox-select-all-materials"
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Select All ({materials.length} materials)
                        </label>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {materials.map((material) => (
                          <div key={material.id} className="flex items-start gap-2 p-2 rounded-md hover-elevate">
                            <Checkbox
                              id={material.id}
                              checked={selectedMaterials.includes(material.id)}
                              onCheckedChange={() => toggleMaterial(material.id)}
                              data-testid={`checkbox-material-${material.id}`}
                            />
                            <label
                              htmlFor={material.id}
                              className="text-sm cursor-pointer flex-1"
                            >
                              <div className="font-medium">{material.title}</div>
                              {material.description && (
                                <div className="text-muted-foreground text-xs mt-0.5">
                                  {material.description}
                                </div>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground pt-2">
                        {selectedMaterials.length > 0
                          ? `${selectedMaterials.length} material${selectedMaterials.length !== 1 ? 's' : ''} selected`
                          : "No materials selected - will use all available materials"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No materials available for this subject
                    </div>
                  )}
                </FormItem>
              )}

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger data-testid="select-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Adjust the complexity of generated questions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions (5-20)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={20}
                        placeholder="10"
                        data-testid="input-question-count"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose how many questions to include in your quiz
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/quizzes")}
                  disabled={generateMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-quiz"
                >
                  {generateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Quiz
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
