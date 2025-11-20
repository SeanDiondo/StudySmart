import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, BookOpen, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/loading-spinner";
import type { User as UserType } from "@shared/schema";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    yearLevel: "1" as "1" | "2" | "3" | "4",
  });

  const { data: userData, isLoading } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName ?? "",
        lastName: userData.lastName ?? "",
        email: userData.email ?? "",
        yearLevel: userData.yearLevel ?? "1",
      });
    }
  }, [userData]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Only send yearLevel for students
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        ...(userData?.role === "student" && { yearLevel: data.yearLevel }),
      };
      const res = await apiRequest("PATCH", "/api/auth/user", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (userData) {
      setFormData({
        firstName: userData.firstName ?? "",
        lastName: userData.lastName ?? "",
        email: userData.email ?? "",
        yearLevel: userData.yearLevel ?? "1",
      });
    }
    setIsEditing(false);
  };

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Unable to load profile information</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joinedDate = new Date(userData.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display">Profile</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Personal Information</CardTitle>
              <CardDescription>Your account details and settings</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name*</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name*</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email*</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-email"
                />
              </div>
              {userData.role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="yearLevel">Year Level*</Label>
                  <Select
                    value={formData.yearLevel}
                    onValueChange={(value: "1" | "2" | "3" | "4") => setFormData({ ...formData, yearLevel: value })}
                  >
                    <SelectTrigger id="yearLevel" data-testid="select-year-level">
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={handleCancel} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Full Name</span>
                  </div>
                  <p className="text-lg font-medium" data-testid="text-full-name">
                    {userData.firstName} {userData.lastName}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <p className="text-lg font-medium" data-testid="text-email">{userData.email}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>Role</span>
                  </div>
                  <Badge variant={userData.role === "admin" ? "default" : "secondary"} className="text-sm">
                    {userData.role === "admin" ? "Administrator" : "Student"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member Since</span>
                  </div>
                  <p className="text-lg font-medium" data-testid="text-joined-date">{joinedDate}</p>
                </div>
              </div>
              {userData.role === "student" && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Year Level</span>
                    </div>
                    <p className="text-lg font-medium" data-testid="text-year-level">
                      {userData.yearLevel ? `Year ${userData.yearLevel}` : "Not set"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Student Status</span>
                    </div>
                    <Badge variant={userData.isRegular ? "default" : "secondary"} className="text-sm">
                      {userData.isRegular ? "Regular Student" : "Irregular Student"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
