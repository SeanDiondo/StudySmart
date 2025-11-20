import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Download, FileText, Calendar, BookOpen, Info } from "lucide-react";
import { LoadingSkeleton } from "@/components/loading-spinner";
import type { StudyMaterial, Subject } from "@shared/schema";

export default function MaterialViewer() {
  const [, params] = useRoute("/materials/:id");
  const materialId = params?.id;

  const { data: material, isLoading: materialLoading } = useQuery<StudyMaterial>({
    queryKey: ["/api/study-materials", materialId],
    enabled: !!materialId,
  });

  const { data: subject } = useQuery<Subject | null>({
    queryKey: ["/api/subjects", material?.subjectId ?? ""],
    enabled: !!material && !!material.subjectId,
    retry: false,
    queryFn: async () => {
      if (!material?.subjectId) return null;
      try {
        const res = await fetch(`/api/subjects/${material.subjectId}`, {
          credentials: "include",
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching subject:", error);
        return null;
      }
    },
  });

  if (materialLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <LoadingSkeleton className="h-screen" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Material not found</p>
            <Button asChild className="mt-4" data-testid="button-back-to-materials">
              <Link href="/materials">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Materials
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const uploadedDate = material.uploadedAt 
    ? new Date(material.uploadedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  const materialTypeLabel = material.materialType 
    ? material.materialType.charAt(0).toUpperCase() + material.materialType.slice(1)
    : 'General';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild data-testid="button-back">
          <Link href="/materials">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-display" data-testid="text-material-title">{material.title}</h1>
          {subject ? (
            <p className="text-muted-foreground mt-1">{subject.name}</p>
          ) : material.subjectId ? (
            <Badge variant="secondary" className="mt-2">Subject unavailable</Badge>
          ) : null}
        </div>
        <Button asChild data-testid="button-download-material">
          <a href={`/api/study-materials/${material.id}/download`} download={material.fileName}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </Button>
      </div>

      {/* Material Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Material Information
              </CardTitle>
              <CardDescription>{material.description || "No description available"}</CardDescription>
            </div>
            <Badge variant="secondary">{materialTypeLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Subject</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-medium" data-testid="text-subject-name">
                  {subject ? subject.name : material.subjectId ? (
                    <span className="text-muted-foreground italic">Subject unavailable</span>
                  ) : (
                    <span className="text-muted-foreground italic">Not assigned</span>
                  )}
                </p>
                {!subject && material.subjectId && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">This material's subject information could not be found. It may have been removed or is temporarily unavailable.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Uploaded On</span>
              </div>
              <p className="text-lg font-medium" data-testid="text-upload-date">{uploadedDate}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>File Name</span>
              </div>
              <p className="text-lg font-medium truncate" data-testid="text-file-name">{material.fileName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Viewer */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
          <CardDescription>
            View the material below or download it for offline access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-muted/30">
            <iframe
              src={`/api/study-materials/${material.id}/download`}
              className="w-full h-[70vh] border-0"
              title={material.title}
              data-testid="iframe-material-viewer"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
