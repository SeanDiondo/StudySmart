import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface SubjectCustomizationDialogProps {
  children: React.ReactNode;
}

export function SubjectCustomizationDialog({ children }: SubjectCustomizationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");

  // Default CCIT subjects
  const defaultSubjects = [
    "Programming Fundamentals",
    "Data Structures and Algorithms",
    "Database Systems",
    "Web Development",
    "Software Engineering",
    "Computer Networks",
    "Operating Systems",
    "Information Security",
    "Mobile Application Development",
    "System Analysis and Design",
  ];

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.trim() && !customSubjects.includes(newSubject.trim())) {
      setCustomSubjects([...customSubjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setCustomSubjects(customSubjects.filter((s) => s !== subject));
  };

  const handleSave = () => {
    // Will be connected to backend
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Subjects</DialogTitle>
          <DialogDescription>
            Add custom subjects for your irregular curriculum
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Default Subjects */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">CCIT Standard Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {defaultSubjects.map((subject) => (
                <Badge key={subject} variant="secondary" className="text-sm py-1.5">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Subjects */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Your Custom Subjects</Label>
            {customSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customSubjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant="default"
                    className="text-sm py-1.5 pr-1"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subject)}
                      className="ml-2 hover:bg-primary-foreground/20 rounded p-0.5"
                      data-testid={`button-remove-${subject.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No custom subjects added yet
              </p>
            )}
          </div>

          {/* Add New Subject Form */}
          <form onSubmit={handleAddSubject} className="space-y-3">
            <Label htmlFor="new-subject">Add New Subject</Label>
            <div className="flex gap-2">
              <Input
                id="new-subject"
                placeholder="e.g., Advanced Mathematics"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                data-testid="input-new-subject"
              />
              <Button
                type="submit"
                disabled={!newSubject.trim()}
                data-testid="button-add-subject"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </form>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel-customize"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-subjects">
              Save Subjects
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
