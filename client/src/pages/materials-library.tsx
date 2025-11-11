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

export default function MaterialsLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Mock data
  const materials = [
    {
      id: "1",
      title: "Introduction to Data Structures",
      description: "Comprehensive guide covering arrays, linked lists, stacks, and queues",
      subject: "Data Structures and Algorithms",
      fileName: "data-structures-intro.pdf",
      fileSize: 2.4,
      uploadedAt: "2024-01-15",
    },
    {
      id: "2",
      title: "React Fundamentals Guide",
      description: "Complete guide to React components, hooks, and state management",
      subject: "Web Development",
      fileName: "react-fundamentals.pdf",
      fileSize: 3.1,
      uploadedAt: "2024-01-14",
    },
    {
      id: "3",
      title: "SQL Query Optimization",
      description: "Techniques for writing efficient database queries and indexes",
      subject: "Database Systems",
      fileName: "sql-optimization.pdf",
      fileSize: 1.8,
      uploadedAt: "2024-01-13",
    },
    {
      id: "4",
      title: "Algorithm Design Patterns",
      description: "Common algorithmic patterns and problem-solving strategies",
      subject: "Data Structures and Algorithms",
      fileName: "algorithm-patterns.pdf",
      fileSize: 2.9,
      uploadedAt: "2024-01-12",
    },
    {
      id: "5",
      title: "Network Protocols Overview",
      description: "Deep dive into TCP/IP, HTTP, and other essential protocols",
      subject: "Computer Networks",
      fileName: "network-protocols.pdf",
      fileSize: 2.2,
      uploadedAt: "2024-01-11",
    },
    {
      id: "6",
      title: "Operating Systems Concepts",
      description: "Process management, memory allocation, and file systems",
      subject: "Operating Systems",
      fileName: "os-concepts.pdf",
      fileSize: 3.5,
      uploadedAt: "2024-01-10",
    },
  ];

  const subjects = Array.from(new Set(materials.map((m) => m.subject))).sort();

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "all" || material.subject === selectedSubject;
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
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
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
                      {material.subject}
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
                  <span>{material.fileSize} MB</span>
                  <span>{new Date(material.uploadedAt).toLocaleDateString()}</span>
                </div>

                <Button className="w-full" data-testid={`button-download-${material.id}`}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
