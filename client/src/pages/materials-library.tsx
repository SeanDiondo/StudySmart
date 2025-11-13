import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { StudyMaterial, Subject } from "@shared/schema";

export default function MaterialsLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const { isAuthenticated } = useAuth();

  // Fetch materials from backend
  const { data: materials } = useQuery<StudyMaterial[]>({
    queryKey: ["/api/study-materials"],
    enabled: isAuthenticated,
  });

  // Fetch subjects for filtering
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects/for-student"],
    enabled: isAuthenticated,
  });

  const materialsData = materials || [];
  const subjectsData = subjects || [];

  const filteredMaterials = materialsData.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject =
      selectedSubject === "all" || material.subjectId === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-display">Study Materials</h1>
        <p className="text-muted-foreground mt-1">Download resources to support your learning</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-materials"
          />
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full md:w-64" data-testid="select-filter-subject">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjectsData.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredMaterials.length} {filteredMaterials.length === 1 ? "material" : "materials"} found
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Materials Found"
          description="Try adjusting your search criteria or filters"
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg leading-tight">{material.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {subjectsData.find(s => s.id === material.subjectId)?.name || material.subjectId}
                    </Badge>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-2 leading-relaxed">
                  {material.description}
                </CardDescription>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : 'N/A'}</span>
                </div>

                <Button 
                  className="w-full" 
                  asChild
                  data-testid={`button-download-${material.id}`}
                >
                  <a href={`/api/study-materials/${material.id}/download`} download={material.fileName}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
