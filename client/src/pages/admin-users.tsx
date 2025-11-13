import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Users as UsersIcon, Shield, User as UserIcon, Pencil, Trash2, BookOpen, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { User, Subject } from "@shared/schema";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [managingSubjectsUserId, setManagingSubjectsUserId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
  });

  const { data: allSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    enabled: isAuthenticated,
  });

  const { data: studentAssignments, refetch: refetchAssignments } = useQuery<{ subject: Subject }[]>({
    queryKey: ["/api/admin/students", managingSubjectsUserId, "assignments"],
    enabled: isAuthenticated && !!managingSubjectsUserId,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "student" | "admin" }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success!",
        description: "User role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success!",
        description: "User updated successfully",
      });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const updateStudentStatusMutation = useMutation({
    mutationFn: async ({ userId, yearLevel, isRegular }: { userId: string; yearLevel: string; isRegular: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/student-status`, { yearLevel, isRegular });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success!",
        description: "Student status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student status",
        variant: "destructive",
      });
    },
  });

  const assignSubjectMutation = useMutation({
    mutationFn: async ({ studentId, subjectId }: { studentId: string; subjectId: string }) => {
      const res = await apiRequest("POST", `/api/admin/students/${studentId}/subjects`, { subjectId });
      return await res.json();
    },
    onSuccess: () => {
      refetchAssignments();
      queryClient.invalidateQueries({ queryKey: ["/api/subjects/for-student"] });
      setSelectedSubjectId("");
      toast({
        title: "Success!",
        description: "Subject assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign subject",
        variant: "destructive",
      });
    },
  });

  const removeSubjectMutation = useMutation({
    mutationFn: async ({ studentId, subjectId }: { studentId: string; subjectId: string }) => {
      const res = await apiRequest("DELETE", `/api/admin/students/${studentId}/subjects/${subjectId}`);
      return await res.json();
    },
    onSuccess: () => {
      refetchAssignments();
      queryClient.invalidateQueries({ queryKey: ["/api/subjects/for-student"] });
      toast({
        title: "Success!",
        description: "Subject removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove subject",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success!",
        description: "User deleted successfully",
      });
      setDeletingUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: "student" | "admin") => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleYearLevelChange = (userId: string, newYearLevel: string, currentIsRegular: boolean) => {
    updateStudentStatusMutation.mutate({ userId, yearLevel: newYearLevel, isRegular: currentIsRegular });
  };

  const handleStudentStatusChange = (userId: string, newIsRegular: boolean, currentYearLevel: string) => {
    updateStudentStatusMutation.mutate({ userId, yearLevel: currentYearLevel, isRegular: newIsRegular });
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });
  };

  const handleEditSubmit = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      userId: editingUser.id,
      data: editFormData,
    });
  };

  const handleDeleteClick = (userId: string) => {
    setDeletingUserId(userId);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUserId) return;
    deleteUserMutation.mutate(deletingUserId);
  };

  const handleManageSubjectsClick = (userId: string) => {
    setManagingSubjectsUserId(userId);
  };

  const handleAssignSubject = () => {
    if (!managingSubjectsUserId || !selectedSubjectId) return;
    assignSubjectMutation.mutate({ studentId: managingSubjectsUserId, subjectId: selectedSubjectId });
  };

  const handleRemoveSubject = (subjectId: string) => {
    if (!managingSubjectsUserId) return;
    removeSubjectMutation.mutate({ studentId: managingSubjectsUserId, subjectId });
  };

  const managingUser = users?.find(u => u.id === managingSubjectsUserId);
  const assignedSubjectIds = new Set(studentAssignments?.map(a => a.subject.id) || []);
  const availableSubjects = allSubjects?.filter(s => !assignedSubjectIds.has(s.id)) || [];

  const filteredUsers = (users || []).filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-primary" />
            Manage Users
          </h1>
          <p className="text-muted-foreground mt-1">
            View all users and manage their roles
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>All registered users in the system</CardDescription>
          <div className="flex items-center gap-2 mt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-users"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "No users match your search" : "No users found"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Name</TableHead>
                    <TableHead className="w-[220px]">Email</TableHead>
                    <TableHead className="w-[100px]">Role</TableHead>
                    <TableHead className="w-[120px]">Year Level</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[110px]">Joined</TableHead>
                    <TableHead className="w-[120px]">Change Role</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email?.split("@")[0] || "Unknown"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.role === "admin" ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {user.role === "admin" ? "Admin" : "Student"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role === "student" ? (
                          <Select
                            value={user.yearLevel || "1"}
                            onValueChange={(value) => handleYearLevelChange(user.id, value, user.isRegular ?? true)}
                            disabled={updateStudentStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-[100px]" data-testid={`select-year-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Year 1</SelectItem>
                              <SelectItem value="2">Year 2</SelectItem>
                              <SelectItem value="3">Year 3</SelectItem>
                              <SelectItem value="4">Year 4</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === "student" ? (
                          <Select
                            value={user.isRegular ? "regular" : "irregular"}
                            onValueChange={(value) => handleStudentStatusChange(user.id, value === "regular", user.yearLevel || "1")}
                            disabled={updateStudentStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-[120px]" data-testid={`select-status-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="irregular">Irregular</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as "student" | "admin")}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[110px]" data-testid={`select-role-${user.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.role === "student" && !user.isRegular && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleManageSubjectsClick(user.id)}
                              data-testid={`button-manage-subjects-${user.id}`}
                              title="Manage Subjects"
                            >
                              <BookOpen className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(user.id)}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent data-testid="dialog-edit-user">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                data-testid="input-edit-firstname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                data-testid="input-edit-lastname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                data-testid="input-edit-email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateUserMutation.isPending} data-testid="button-save-edit">
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent data-testid="dialog-delete-user">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Subjects Dialog */}
      <Dialog open={!!managingSubjectsUserId} onOpenChange={(open) => !open && setManagingSubjectsUserId(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-manage-subjects">
          <DialogHeader>
            <DialogTitle>Manage Subjects</DialogTitle>
            <DialogDescription>
              Assign subjects to {managingUser?.firstName || managingUser?.email?.split("@")[0] || "student"} (Irregular Student)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Assigned Subjects</Label>
              {studentAssignments && studentAssignments.length > 0 ? (
                <div className="space-y-2">
                  {studentAssignments.map((assignment) => (
                    <div
                      key={assignment.subject.id}
                      className="flex items-center justify-between p-3 rounded-md border"
                      data-testid={`assigned-subject-${assignment.subject.id}`}
                    >
                      <div>
                        <p className="font-medium">{assignment.subject.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.subject.description || `Year ${assignment.subject.yearLevel}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubject(assignment.subject.id)}
                        disabled={removeSubjectMutation.isPending}
                        data-testid={`button-remove-subject-${assignment.subject.id}`}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No subjects assigned yet
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Label>Assign New Subject</Label>
              <div className="flex gap-2">
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="flex-1" data-testid="select-assign-subject">
                    <SelectValue placeholder="Select a subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.length > 0 ? (
                      availableSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.description || subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No subjects available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignSubject}
                  disabled={!selectedSubjectId || assignSubjectMutation.isPending}
                  data-testid="button-assign-subject"
                >
                  {assignSubjectMutation.isPending ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingSubjectsUserId(null)} data-testid="button-close-manage-subjects">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
