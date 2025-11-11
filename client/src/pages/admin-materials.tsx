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
import { Upload, FileText, Trash2, Pencil, Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function AdminMaterials() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Mock data
  const materials = [
    {
      id: "1",
      title: "Introduction to Data Structures",
      subject: "Data Structures and Algorithms",
      fileName: "data-structures-intro.pdf",
      fileSize: 2.4,
      uploadedAt: "2024-01-15",
    },
    {
      id: "2",
      title: "React Fundamentals Guide",
      subject: "Web Development",
      fileName: "react-fundamentals.pdf",
      fileSize: 3.1,
      uploadedAt: "2024-01-14",
    },
    {
      id: "3",
      title: "SQL Query Optimization",
      subject: "Database Systems",
      fileName: "sql-optimization.pdf",
      fileSize: 1.8,
      uploadedAt: "2024-01-13",
    },
  ];

  const subjects = [
    "Programming Fundamentals",
    "Data Structures and Algorithms",
    "Database Systems",
    "Web Development",
    "Software Engineering",
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    // Will be connected to backend
    setIsUploadDialogOpen(false);
    setSelectedFile(null);
  };

  const filteredMaterials = materials.filter(
    (material) =>
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchQuery.toLowerCase())
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
                Add a new PDF resource for students to access
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Material Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Algorithms"
                  required
                  data-testid="input-material-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select required>
                  <SelectTrigger id="subject" data-testid="select-material-subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
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
                  data-testid="textarea-material-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">PDF File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate">
                  <input
                    type="file"
                    id="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    required
                    data-testid="input-file-upload"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-primary mx-auto" />
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <Button type="button" variant="outline" size="sm">
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div className="font-medium">Click to upload PDF</div>
                        <div className="text-sm text-muted-foreground">
                          Max file size: 10MB
                        </div>
                      </div>
                    )}
                  </label>
                </div>
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
                  Upload Material
                </Button>
              </div>
            </form>
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
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{material.subject}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {material.fileName}
                    </TableCell>
                    <TableCell>{material.fileSize} MB</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-edit-${material.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
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
