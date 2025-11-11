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
import type { StudyMaterial, Subject } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

export default function AdminMaterials() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<"file" | "url">("file");
  const [uploadForm, setUploadForm] = useState<{
    title: string;
    description: string;
    subjectId: string;
    url: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }>({
    title: "",
    description: "",
    subjectId: "",
    url: "",
  });
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
      setUploadForm({ title: "", description: "", subjectId: "", url: "" });
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

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.subjectId || (!uploadForm.url && uploadTab === "url")) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
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
      if (!uploadForm.title || !uploadForm.subjectId) {
        toast({
          title: "Missing Information",
          description: "Please fill in the title and select a subject before uploading",
          variant: "destructive",
        });
        return;
      }
      
      const normalizedUrl = fileUrl.split("?")[0];
      
      uploadMutation.mutate({
        ...uploadForm,
        fileUrl: normalizedUrl,
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
    </div>
  );
}
