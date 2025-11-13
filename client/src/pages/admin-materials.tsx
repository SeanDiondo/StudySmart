import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Trash2, Pencil, Plus, Search, Link as LinkIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { StudyMaterial, Subject, MaterialSet } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

export default function AdminMaterials() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<"file" | "url">("file");
  const [uploadForm, setUploadForm] = useState<{
    title: string;
    description: string;
    subjectId: string;
    materialType: "midterm" | "finals" | "";
    url: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }>({
    title: "",
    description: "",
    subjectId: "",
    materialType: "",
    url: "",
  });
  const [pendingSubjectSelections, setPendingSubjectSelections] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Fetch materials from backend
  const { data: materials } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/study-materials"],
    enabled: isAuthenticated,
  });

  // Fetch subjects for dropdown
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    enabled: isAuthenticated,
  });

  // Fetch pending materials for validation
  const { data: pendingMaterials } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/materials/pending"],
    enabled: isAuthenticated,
  });

  // Fetch material set status for all subject+materialType combinations
  const materialSetPairs = (materials || []).reduce((acc, material) => {
    const key = `${material.subjectId}::${material.materialType}`;
    if (!acc.find(p => p.key === key)) {
      acc.push({
        key,
        subjectId: material.subjectId,
        materialType: material.materialType as "midterm" | "finals"
      });
    }
    return acc;
  }, [] as Array<{ key: string; subjectId: string; materialType: "midterm" | "finals" }>);

  // Fetch all material set statuses in parallel using the default fetcher
  const materialSetQueries = useQuery<Record<string, MaterialSet | null>>({
    queryKey: ["/api/material-sets/status", ...materialSetPairs.map(p => p.key).sort()],
    queryFn: async () => {
      const results: Record<string, MaterialSet | null> = {};
      await Promise.all(
        materialSetPairs.map(async (pair) => {
          try {
            const response = await fetch(`/api/material-sets/status?subjectId=${pair.subjectId}&materialType=${pair.materialType}`, {
              credentials: 'include'
            });
            if (response.ok) {
              results[pair.key] = await response.json();
            } else {
              results[pair.key] = null;
            }
          } catch (error) {
            console.error(`Error fetching material set status for ${pair.key}:`, error);
            results[pair.key] = null;
          }
        })
      );
      return results;
    },
    enabled: isAuthenticated && materialSetPairs.length > 0,
  });

  // Upload material mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadForm) => {
      const res = await apiRequest("POST", "/api/study-materials", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-materials"] });
      toast({
        title: "Success!",
        description: "Material uploaded successfully",
      });
      setIsUploadDialogOpen(false);
      setUploadForm({ title: "", description: "", subjectId: "", materialType: "", url: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload material",
        variant: "destructive",
      });
    },
  });

  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/study-materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-materials"] });
      toast({
        title: "Success!",
        description: "Material deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete material",
        variant: "destructive",
      });
    },
  });

  // Mark material set complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async ({ subjectId, materialType }: { subjectId: string; materialType: "midterm" | "finals" }) => {
      const res = await apiRequest("POST", "/api/material-sets/mark-complete", { subjectId, materialType });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-sets/status"], exact: false });
      toast({
        title: "Success!",
        description: "Material set marked as completed. AI exam generation will begin shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark material set as complete",
        variant: "destructive",
      });
    },
  });

  // Resolve pending material mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ materialId, subjectId }: { materialId: string; subjectId: string }) => {
      const res = await apiRequest("POST", `/api/materials/${materialId}/resolve`, { subjectId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-materials"] });
      toast({
        title: "Success!",
        description: "Material resolved and mapped to subject successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve material",
        variant: "destructive",
      });
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.subjectId || !uploadForm.materialType || (!uploadForm.url && uploadTab === "url")) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (title, subject, material type)",
        variant: "destructive",
      });
      return;
    }
    
    // For URL tab, convert url field to fileUrl with placeholder file info
    const dataToSubmit = uploadTab === "url" ? {
      ...uploadForm,
      fileUrl: uploadForm.url,
      fileName: "external-link",
      fileSize: 0,
    } : uploadForm;
    
    uploadMutation.mutate(dataToSubmit);
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleFileUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileUrl = uploadedFile.uploadURL;
      
      if (!fileUrl) {
        toast({
          title: "Error",
          description: "File upload failed - no URL returned",
          variant: "destructive",
        });
        return;
      }
      
      // Validate required fields before submitting
      if (!uploadForm.title?.trim() || !uploadForm.subjectId?.trim() || !uploadForm.materialType) {
        const missingFields = [];
        if (!uploadForm.title?.trim()) missingFields.push("title");
        if (!uploadForm.subjectId?.trim()) missingFields.push("subject");
        if (!uploadForm.materialType) missingFields.push("material type");
        
        toast({
          title: "Missing Information",
          description: `Please fill in the ${missingFields.join(", ")} before uploading`,
          variant: "destructive",
        });
        return;
      }
      
      // Extract the object path from the signed URL
      // The URL format is: https://storage.googleapis.com/bucket/path/to/object?X-Goog-...
      // We need to store just the path part (without query params) for generating fresh signed URLs later
      let normalizedPath = fileUrl;
      try {
        const url = new URL(fileUrl);
        // Extract pathname and strip query string
        normalizedPath = url.pathname.split('?')[0];
        // Ensure leading slash
        if (!normalizedPath.startsWith('/')) {
          normalizedPath = `/${normalizedPath}`;
        }
      } catch (e) {
        console.warn("Could not parse upload URL, storing as-is:", e);
      }
      
      uploadMutation.mutate({
        ...uploadForm,
        fileUrl: normalizedPath,
        fileName: uploadedFile.name || "unknown",
        fileSize: uploadedFile.size || 0,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredMaterials = (materials || []).filter(
    (material) =>
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group materials by subject and material type
  const materialsBySubject = (materials || []).reduce((acc, material) => {
    const key = `${material.subjectId}::${material.materialType}`;
    if (!acc[key]) {
      acc[key] = {
        subjectId: material.subjectId,
        materialType: material.materialType,
        materials: [],
      };
    }
    acc[key].materials.push(material);
    return acc;
  }, {} as Record<string, { subjectId: string; materialType: string; materials: StudyMaterial[] }>);

  const handleMarkComplete = (subjectId: string, materialType: "midterm" | "finals") => {
    markCompleteMutation.mutate({ subjectId, materialType });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display">Study Materials</h1>
          <p className="text-muted-foreground mt-1">Manage educational resources for students</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="button-upload-material">
              <Plus className="h-5 w-5 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Study Material</DialogTitle>
              <DialogDescription>
                Upload a file or add a link to a study resource for students
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={uploadTab} onValueChange={(value) => setUploadTab(value as "file" | "url")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" data-testid="tab-upload-file">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="url" data-testid="tab-upload-url">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Add URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Material Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Algorithms"
                    required
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    data-testid="input-material-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select required value={uploadForm.subjectId} onValueChange={(value) => setUploadForm({ ...uploadForm, subjectId: value })}>
                    <SelectTrigger id="subject" data-testid="select-material-subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {(subjects || []).map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materialType">Material Type</Label>
                  <Select required value={uploadForm.materialType} onValueChange={(value) => setUploadForm({ ...uploadForm, materialType: value as "midterm" | "finals" })}>
                    <SelectTrigger id="materialType" data-testid="select-material-type">
                      <SelectValue placeholder="Select material type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midterm">Midterm</SelectItem>
                      <SelectItem value="finals">Finals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the material contents..."
                    rows={3}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    data-testid="textarea-material-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>File Upload</Label>
                  {uploadForm.title?.trim() && uploadForm.subjectId?.trim() && uploadForm.materialType ? (
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={52428800}
                      allowedFileTypes={['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt']}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleFileUploadComplete}
                      buttonVariant="outline"
                      buttonClassName="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File (PDF, DOC, PPT)
                    </ObjectUploader>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const missingFields = [];
                        if (!uploadForm.title?.trim()) missingFields.push("title");
                        if (!uploadForm.subjectId?.trim()) missingFields.push("subject");
                        if (!uploadForm.materialType) missingFields.push("material type");
                        toast({
                          title: "Missing Information",
                          description: `Please fill in the ${missingFields.join(", ")} before uploading a file`,
                          variant: "destructive",
                        });
                      }}
                      data-testid="button-upload-disabled"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File (PDF, DOC, PPT)
                    </Button>
                  )}
                  <p className="text-sm text-muted-foreground">Maximum file size: 50MB</p>
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4 mt-4">
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title-url">Material Title</Label>
                    <Input
                      id="title-url"
                      placeholder="e.g., Introduction to Algorithms"
                      required
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      data-testid="input-material-title-url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject-url">Subject</Label>
                    <Select required value={uploadForm.subjectId} onValueChange={(value) => setUploadForm({ ...uploadForm, subjectId: value })}>
                      <SelectTrigger id="subject-url" data-testid="select-material-subject-url">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {(subjects || []).map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="materialType-url">Material Type</Label>
                    <Select required value={uploadForm.materialType} onValueChange={(value) => setUploadForm({ ...uploadForm, materialType: value as "midterm" | "finals" })}>
                      <SelectTrigger id="materialType-url" data-testid="select-material-type-url">
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="finals">Finals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description-url">Description (Optional)</Label>
                    <Textarea
                      id="description-url"
                      placeholder="Brief description of the material contents..."
                      rows={3}
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      data-testid="textarea-material-description-url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">Material URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/document.pdf"
                      required
                      value={uploadForm.url}
                      onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                      data-testid="input-material-url"
                    />
                    <p className="text-sm text-muted-foreground">Enter the URL of the study material</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUploadDialogOpen(false)}
                      data-testid="button-cancel-upload"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-submit-upload">
                      Add Material
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Material Sets Completion Status */}
      {Object.keys(materialsBySubject).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Material Set Status</CardTitle>
            <CardDescription>
              Mark material sets as complete to trigger AI-generated Pre-Tests and Post-Tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.values(materialsBySubject).map((group) => {
              const subject = (subjects || []).find(s => s.id === group.subjectId);
              const materialCount = group.materials.length;
              const key = `${group.subjectId}::${group.materialType}`;
              const materialSet = materialSetQueries.data?.[key];
              const isCompleted = materialSet?.isCompleted || false;
              
              return (
                <div key={key} className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-md">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{subject?.name || "Unknown Subject"}</p>
                        {isCompleted && (
                          <Badge variant="default" className="bg-green-600">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={group.materialType === "midterm" ? "default" : "outline"}>
                          {group.materialType === "midterm" ? "Midterm" : "Finals"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {materialCount} material{materialCount !== 1 ? 's' : ''}
                        </span>
                        {isCompleted && materialSet?.completedAt && (
                          <span className="text-sm text-muted-foreground">
                            • Marked {new Date(materialSet.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleMarkComplete(group.subjectId, group.materialType as "midterm" | "finals")}
                    disabled={markCompleteMutation.isPending || isCompleted}
                    data-testid={`button-mark-complete-${group.subjectId}-${group.materialType}`}
                  >
                    {markCompleteMutation.isPending ? "Processing..." : isCompleted ? "Already Completed" : "Mark as Completed"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Materials Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-materials">
            All Materials
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-validation">
            Pending Validation
            {pendingMaterials && pendingMaterials.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingMaterials.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Materials Tab */}
        <TabsContent value="all" className="space-y-6">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-materials"
              />
            </div>
          </div>

          {/* Materials Table */}
          {filteredMaterials.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Materials Found"
              description="Upload your first study material to get started"
              actionLabel="Upload Material"
              onAction={() => setIsUploadDialogOpen(true)}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {(subjects || []).find(s => s.id === material.subjectId)?.name || material.subjectId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={material.materialType === "midterm" ? "default" : "outline"}>
                            {material.materialType === "midterm" ? "Midterm" : "Finals"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {material.fileUrl}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {material.description || 'No description'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(material.id)}
                              data-testid={`button-delete-${material.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pending Validation Tab */}
        <TabsContent value="pending" className="space-y-6">
          {!pendingMaterials || pendingMaterials.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Pending Materials"
              description="All materials have been validated and mapped to subjects"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pending Subject Validation</CardTitle>
                <CardDescription>
                  These materials have unrecognized subject names. Map them to existing subjects to resolve.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Unrecognized Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Map to Subject</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.title}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {material.rawSubjectName || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={material.materialType === "midterm" ? "default" : "outline"}>
                            {material.materialType === "midterm" ? "Midterm" : "Finals"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={pendingSubjectSelections[material.id] || ""}
                            onValueChange={(value) => setPendingSubjectSelections({ ...pendingSubjectSelections, [material.id]: value })}
                          >
                            <SelectTrigger data-testid={`select-subject-${material.id}`}>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {(subjects || []).map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => {
                              const subjectId = pendingSubjectSelections[material.id];
                              if (!subjectId) {
                                toast({
                                  title: "No Subject Selected",
                                  description: "Please select a subject first",
                                  variant: "destructive",
                                });
                                return;
                              }
                              resolveMutation.mutate({ materialId: material.id, subjectId });
                            }}
                            disabled={resolveMutation.isPending}
                            data-testid={`button-resolve-${material.id}`}
                          >
                            {resolveMutation.isPending ? "Resolving..." : "Resolve"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
