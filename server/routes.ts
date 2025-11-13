// Reference: blueprint:javascript_log_in_with_replit
// Reference: blueprint:javascript_object_storage
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateQuiz, analyzePerformance, generateExamFromMaterials } from "./openai";
import {
  insertSubjectSchema,
  insertStudyPlanSchema,
  insertStudyPlanSubjectSchema,
  insertStudyMaterialSchema,
  insertQuizSchema,
  insertQuizAttemptSchema,
  type StudyPlan,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Password login endpoint for testing
  const passwordLoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post("/api/auth/password-login", async (req: any, res) => {
    try {
      const { email, password } = passwordLoginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session manually (same format as Replit Auth)
      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      req.login(sessionUser, (err: any) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("Password login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin-only endpoint to get all users
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only admins can view all users
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can view all users" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin-only endpoint to update any user's role
  app.patch("/api/admin/users/:userId/role", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only admins can change user roles
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update user roles" });
      }

      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !["student", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(userId, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Admin-only endpoint to update user details
  app.patch("/api/admin/users/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only admins can edit users
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can edit users" });
      }

      const { userId } = req.params;
      const { firstName, lastName, email } = req.body;

      // Validate input
      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      if (firstName !== undefined && (!firstName || firstName.trim().length === 0)) {
        return res.status(400).json({ message: "First name cannot be empty" });
      }
      
      if (lastName !== undefined && (!lastName || lastName.trim().length === 0)) {
        return res.status(400).json({ message: "Last name cannot be empty" });
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin-only endpoint to delete a user
  app.delete("/api/admin/users/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only admins can delete users
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete users" });
      }

      const { userId } = req.params;

      // Prevent deleting yourself
      if (userId === currentUser.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin-only endpoint to update student status (year level and regular/irregular)
  app.patch("/api/admin/users/:userId/student-status", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only admins can update student status
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update student status" });
      }

      const { userId } = req.params;
      const { yearLevel, isRegular } = req.body;
      
      // Verify user exists
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!yearLevel || !["1", "2", "3", "4"].includes(yearLevel)) {
        return res.status(400).json({ message: "Invalid year level. Must be 1, 2, 3, or 4" });
      }

      if (typeof isRegular !== "boolean") {
        return res.status(400).json({ message: "isRegular must be a boolean" });
      }

      const user = await storage.updateUserStudentStatus(userId, yearLevel, isRegular);
      res.json(user);
    } catch (error) {
      console.error("Error updating student status:", error);
      res.status(500).json({ message: "Failed to update student status" });
    }
  });

  // Admin-only endpoint to get student's assigned subjects
  app.get("/api/admin/students/:studentId/assignments", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only admins can view assignments
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can view student assignments" });
      }

      const { studentId } = req.params;
      const assignments = await storage.getStudentAssignments(studentId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      res.status(500).json({ message: "Failed to fetch student assignments" });
    }
  });

  // Admin-only endpoint to assign a subject to a student
  app.post("/api/admin/students/:studentId/subjects", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only admins can assign subjects
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can assign subjects" });
      }

      const { studentId } = req.params;
      const { subjectId } = req.body;

      if (!subjectId) {
        return res.status(400).json({ message: "Subject ID is required" });
      }

      // Verify student exists
      const student = await storage.getUser(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Verify subject exists
      const subject = await storage.getSubject(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      const assignment = await storage.assignSubjectToStudent({
        studentId,
        subjectId,
        assignedBy: currentUser.id,
      });
      
      res.json(assignment);
    } catch (error: any) {
      console.error("Error assigning subject:", error);
      // Check for unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({ message: "This subject is already assigned to the student" });
      }
      res.status(500).json({ message: "Failed to assign subject" });
    }
  });

  // Admin-only endpoint to remove a subject from a student
  app.delete("/api/admin/students/:studentId/subjects/:subjectId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      
      // Only admins can remove assignments
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can remove subject assignments" });
      }

      const { studentId, subjectId } = req.params;
      await storage.removeSubjectFromStudent(studentId, subjectId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing subject assignment:", error);
      res.status(500).json({ message: "Failed to remove subject assignment" });
    }
  });

  // Object Storage routes for materials uploads
  app.post("/api/objects/upload", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can upload files" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Subject routes
  app.get("/api/subjects", isAuthenticated, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Get subject-program mappings for filtering
  app.get("/api/subject-programs", isAuthenticated, async (req, res) => {
    try {
      const mappings = await storage.getSubjectProgramMappings();
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching subject-program mappings:", error);
      res.status(500).json({ message: "Failed to fetch subject-program mappings" });
    }
  });

  // Get filtered subjects for the current student (year-level or assigned)
  app.get("/api/subjects/for-student", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subjects = await storage.getSubjectsForStudent(userId);
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects for student:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", isAuthenticated, async (req, res) => {
    try {
      const subject = await storage.getSubject(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  app.post("/api/subjects", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create subjects" });
      }

      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      res.json(subject);
    } catch (error: any) {
      console.error("Error creating subject:", error);
      res.status(400).json({ message: error.message || "Failed to create subject" });
    }
  });

  app.patch("/api/subjects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update subjects" });
      }

      const subject = await storage.updateSubject(req.params.id, req.body);
      res.json(subject);
    } catch (error) {
      console.error("Error updating subject:", error);
      res.status(500).json({ message: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete subjects" });
      }

      await storage.deleteSubject(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  // Study Plan routes
  app.get("/api/study-plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plans = await storage.getAllStudyPlans(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching study plans:", error);
      res.status(500).json({ message: "Failed to fetch study plans" });
    }
  });

  app.get("/api/study-plans/my-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plan = await storage.getStudyPlan(userId);
      res.json(plan || null);
    } catch (error) {
      console.error("Error fetching study plan:", error);
      res.status(500).json({ message: "Failed to fetch study plan" });
    }
  });

  app.post("/api/study-plans", isAuthenticated, async (req: any, res) => {
    let newPlan: StudyPlan | null = null;

    try {
      const userId = req.user.claims.sub;
      
      // Extract subjects array from request body
      const { subjects, ...planData } = req.body;
      
      // Round hoursPerWeek to integer if it's a decimal
      if (planData.hoursPerWeek !== undefined) {
        planData.hoursPerWeek = Math.round(planData.hoursPerWeek);
      }
      
      // CRITICAL: Validate ALL input upfront before ANY database operations
      // This ensures we never touch the database if validation fails
      const validatedPlanData = insertStudyPlanSchema.parse({ ...planData, userId });
      
      // Pre-validate all subjects to ensure no mid-creation failures
      const subjectsToCreate = [];
      if (subjects && Array.isArray(subjects)) {
        for (const subjectData of subjects) {
          // Validate structure (studyPlanId will be set after plan creation)
          const { studyPlanId: _, ...subjectFields } = subjectData;
          const validated = insertStudyPlanSubjectSchema.omit({ studyPlanId: true }).parse(subjectFields);
          subjectsToCreate.push(validated);
        }
      }

      // All validation passed - now we can safely modify the database
      
      // Create new plan (keep all existing plans - don't delete them)
      newPlan = await storage.createStudyPlan(validatedPlanData);

      // Create all validated subjects
      for (const subjectFields of subjectsToCreate) {
        await storage.createStudyPlanSubject({
          ...subjectFields,
          studyPlanId: newPlan.id,
        });
      }

      res.json(newPlan);
    } catch (error: any) {
      console.error("Error creating study plan:", error);
      
      // Cleanup: If we created a new plan, delete it (CASCADE will handle subjects)
      if (newPlan) {
        try {
          await storage.deleteStudyPlan(newPlan.id);
        } catch (cleanupError) {
          console.error("Error cleaning up partial plan:", cleanupError);
        }
      }
      
      res.status(400).json({ message: error.message || "Failed to create study plan" });
    }
  });

  app.get("/api/study-plans/:id/subjects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verify ownership: get the study plan and check if it belongs to the current user
      const planSubjects = await storage.getStudyPlanSubjects(req.params.id);
      if (planSubjects.length > 0) {
        const plan = await storage.getStudyPlanById(req.params.id);
        if (!plan || plan.userId !== userId) {
          return res.status(403).json({ message: "Not authorized to access this study plan" });
        }
      }
      
      res.json(planSubjects);
    } catch (error) {
      console.error("Error fetching study plan subjects:", error);
      res.status(500).json({ message: "Failed to fetch study plan subjects" });
    }
  });

  app.patch("/api/study-plans/:id/subjects/:subjectId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const plan = await storage.getStudyPlanById(req.params.id);
      if (!plan || plan.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this study plan" });
      }

      // Validate with Zod schema
      const validatedData = insertStudyPlanSubjectSchema.partial().parse(req.body);
      const planSubject = await storage.updateStudyPlanSubject(req.params.subjectId, validatedData);
      res.json(planSubject);
    } catch (error: any) {
      console.error("Error updating study plan subject:", error);
      res.status(400).json({ message: error.message || "Failed to update study plan subject" });
    }
  });

  app.delete("/api/study-plans/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const plan = await storage.getStudyPlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Study plan not found" });
      }
      if (plan.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this study plan" });
      }

      // Delete study plan subjects first
      await storage.deleteStudyPlanSubjectsByPlanId(req.params.id);
      
      // Then delete the study plan
      await storage.deleteStudyPlan(req.params.id);
      
      res.json({ message: "Study plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting study plan:", error);
      res.status(500).json({ message: "Failed to delete study plan" });
    }
  });

  // Study Materials routes
  app.get("/api/materials", isAuthenticated, async (req, res) => {
    try {
      const { subjectId } = req.query;
      const materials = await storage.getStudyMaterials(subjectId as string);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching study materials:", error);
      res.status(500).json({ message: "Failed to fetch study materials" });
    }
  });

  // Alias for study materials (used by frontend)
  app.get("/api/study-materials", isAuthenticated, async (req, res) => {
    try {
      const { subjectId, materialType } = req.query;
      const materials = await storage.getStudyMaterials(
        subjectId as string, 
        materialType as "midterm" | "finals" | undefined
      );
      res.json(materials);
    } catch (error) {
      console.error("Error fetching study materials:", error);
      res.status(500).json({ message: "Failed to fetch study materials" });
    }
  });

  app.get("/api/materials/:id", isAuthenticated, async (req, res) => {
    try {
      const material = await storage.getStudyMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  app.post("/api/materials", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can upload materials" });
      }

      const { subjectName, programId, yearLevel, ...materialData } = req.body;

      // Validate subject if subjectName is provided
      let subjectId = materialData.subjectId;
      let subjectValidationStatus: "valid" | "pending" = "valid";
      let rawSubjectName: string | undefined;

      if (subjectName) {
        const validation = await storage.validateSubjectByName({
          subjectName,
          programId,
          yearLevel,
        });
        
        subjectId = validation.subjectId;
        subjectValidationStatus = validation.status;
        
        if (validation.status === "pending") {
          rawSubjectName = subjectName;
        }
      }

      // Prepare material data
      const dataWithUser = {
        ...materialData,
        subjectId,
        subjectValidationStatus,
        rawSubjectName,
        programId,
        uploadedBy: user.id,
      };

      // Validate and sanitize input
      const validatedData = insertStudyMaterialSchema.parse(dataWithUser);
      
      // URL validation: Accept full URLs (http/https) or normalized paths (starting with /)
      if (validatedData.fileUrl && !validatedData.fileUrl.match(/^(https?:\/\/|\/)/)) {
        return res.status(400).json({ message: "Invalid file URL format" });
      }

      const material = await storage.createStudyMaterial(validatedData);
      res.json(material);
    } catch (error: any) {
      console.error("Error creating material:", error);
      res.status(400).json({ message: error.message || "Failed to create material" });
    }
  });

  // Alias for study materials post (used by frontend)
  app.post("/api/study-materials", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can upload materials" });
      }

      const { subjectName, programId, yearLevel, ...materialData } = req.body;

      // Validate subject if subjectName is provided
      let subjectId = materialData.subjectId;
      let subjectValidationStatus: "valid" | "pending" = "valid";
      let rawSubjectName: string | undefined;

      if (subjectName) {
        const validation = await storage.validateSubjectByName({
          subjectName,
          programId,
          yearLevel,
        });
        
        subjectId = validation.subjectId;
        subjectValidationStatus = validation.status;
        
        if (validation.status === "pending") {
          rawSubjectName = subjectName;
        }
      }

      // Prepare material data
      const dataWithUser = {
        ...materialData,
        subjectId,
        subjectValidationStatus,
        rawSubjectName,
        programId,
        uploadedBy: user.id,
      };

      // Validate and sanitize input
      const validatedData = insertStudyMaterialSchema.parse(dataWithUser);
      
      // URL validation: Accept full URLs (http/https) or normalized paths (starting with /)
      if (validatedData.fileUrl && !validatedData.fileUrl.match(/^(https?:\/\/|\/)/)) {
        return res.status(400).json({ message: "Invalid file URL format" });
      }

      const material = await storage.createStudyMaterial(validatedData);
      res.json(material);
    } catch (error: any) {
      console.error("Error creating material:", error);
      res.status(400).json({ message: error.message || "Failed to create material" });
    }
  });

  app.patch("/api/materials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update materials" });
      }

      // Validate and sanitize input
      const validatedData = insertStudyMaterialSchema.partial().parse(req.body);
      
      // URL validation: Accept full URLs (http/https) or normalized paths (starting with /)
      if (validatedData.fileUrl && !validatedData.fileUrl.match(/^(https?:\/\/|\/)/)) {
        return res.status(400).json({ message: "Invalid file URL format" });
      }

      const material = await storage.updateStudyMaterial(req.params.id, validatedData);
      res.json(material);
    } catch (error: any) {
      console.error("Error updating material:", error);
      res.status(400).json({ message: error.message || "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete materials" });
      }

      await storage.deleteStudyMaterial(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // Alias for delete study materials (used by frontend)
  app.delete("/api/study-materials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete materials" });
      }

      await storage.deleteStudyMaterial(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // Get pending materials for subject validation
  app.get("/api/materials/pending", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can view pending materials" });
      }

      const pendingMaterials = await storage.getPendingMaterials();
      res.json(pendingMaterials);
    } catch (error) {
      console.error("Error fetching pending materials:", error);
      res.status(500).json({ message: "Failed to fetch pending materials" });
    }
  });

  // Resolve a pending material by mapping to a subject
  const resolveMaterialSchema = z.object({
    subjectId: z.string().min(1, "Subject ID is required"),
  });

  app.post("/api/materials/:id/resolve", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can resolve materials" });
      }

      const { subjectId } = resolveMaterialSchema.parse(req.body);

      const material = await storage.resolvePendingMaterial({
        materialId: req.params.id,
        subjectId,
        validatedBy: user.id,
      });

      res.json(material);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      
      // Handle specific error messages from storage layer
      const errorMessage = error.message || "Failed to resolve material";
      const statusCode = errorMessage.includes("not found") ? 404 : 400;
      
      console.error("Error resolving material:", error);
      res.status(statusCode).json({ message: errorMessage });
    }
  });

  // Download study material
  app.get("/api/study-materials/:id/download", isAuthenticated, async (req, res) => {
    try {
      const material = await storage.getStudyMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      const objectStorageService = new ObjectStorageService();
      const fileUrl = material.fileUrl;
      
      // Classify the URL type and handle accordingly
      // 1. Try to canonicalize (returns null for external URLs)
      const canonicalPath = objectStorageService.canonicalizeObjectPath(fileUrl);
      
      if (canonicalPath === null) {
        // External URL (non-GCS or external GCS) - redirect directly
        return res.redirect(fileUrl);
      }
      
      // 2. Check if it's a legacy /objects/... path
      if (canonicalPath.startsWith('/objects/')) {
        // Legacy format - use streaming method
        try {
          const objectFile = await objectStorageService.getObjectEntityFile(canonicalPath);
          res.setHeader('Content-Disposition', `attachment; filename="${material.fileName || 'download'}"`);
          return await objectStorageService.downloadObject(objectFile, res);
        } catch (error) {
          console.error("Error streaming legacy object:", error);
          if (error instanceof ObjectNotFoundError) {
            return res.status(404).json({ message: "File not found" });
          }
          throw error;
        }
      }
      
      // 3. It's a normalized path - parse and generate fresh signed URL
      try {
        // Expected format: /bucket-name/path/to/object
        const pathParts = canonicalPath.slice(1).split('/'); // Remove leading slash
        
        if (pathParts.length < 2) {
          throw new Error("Invalid object path format - need bucket and object name");
        }
        
        // Don't decode here - the path from canonicalization is already decoded
        // Decoding individual segments would break object names with escaped characters like %2F
        const bucketName = pathParts[0];
        const objectName = pathParts.slice(1).join('/');
        
        // Generate a fresh signed URL for download (valid for 1 hour)
        const signedUrl = await objectStorageService.getDownloadUrl(bucketName, objectName);
        
        // Redirect to the fresh signed URL
        return res.redirect(signedUrl);
      } catch (parseError) {
        console.error("Error parsing object path for signing:", parseError, "Path:", canonicalPath);
        return res.status(500).json({ message: "Failed to generate download URL" });
      }
    } catch (error) {
      console.error("Error downloading material:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "File not found" });
      }
      res.status(500).json({ message: "Failed to download material" });
    }
  });

  // Material Set routes (Phase 1: Admin completion workflow)
  app.get("/api/material-sets/status", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can access material set status" });
      }

      const { subjectId, materialType } = req.query;
      if (!subjectId || !materialType) {
        return res.status(400).json({ message: "subjectId and materialType are required" });
      }

      const materialSet = await storage.getMaterialSet(
        subjectId as string,
        materialType as "midterm" | "finals"
      );
      
      res.json(materialSet || { 
        subjectId, 
        materialType, 
        isCompleted: false,
        preTestQuizId: null,
        postTestQuizId: null 
      });
    } catch (error) {
      console.error("Error fetching material set status:", error);
      res.status(500).json({ message: "Failed to fetch material set status" });
    }
  });

  app.post("/api/material-sets/mark-complete", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can mark material sets as complete" });
      }

      const { subjectId, materialType } = req.body;
      if (!subjectId || !materialType) {
        return res.status(400).json({ message: "subjectId and materialType are required" });
      }

      // Validate that materials exist for this subject+materialType
      const materials = await storage.getStudyMaterials(subjectId, materialType);
      if (materials.length === 0) {
        return res.status(400).json({ 
          message: `No materials uploaded for ${materialType}. Please upload materials first.` 
        });
      }

      // Get subject details
      const subject = await storage.getSubject(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      // Get system user for AI-generated quizzes
      const systemUser = await storage.getUserByEmail("system@ccitstudy.local");
      if (!systemUser) {
        return res.status(500).json({ message: "System user not found. Please restart the application." });
      }

      // Prepare materials context for AI
      const materialsForAI = materials.map(m => ({
        title: m.title,
        description: m.description || undefined
      }));

      // Generate Pre-Test and Post-Test IN PARALLEL (cuts time in half!)
      console.log(`⏳ Generating Pre-Test and Post-Test for ${subject.name} (${materialType}) in parallel...`);
      const [preTestResult, postTestResult] = await Promise.allSettled([
        generateExamFromMaterials(
          subject.name,
          materialType as "midterm" | "finals",
          "pre_test",
          materialsForAI
        ),
        generateExamFromMaterials(
          subject.name,
          materialType as "midterm" | "finals",
          "post_test",
          materialsForAI
        )
      ]);

      // Check if Pre-Test generation succeeded
      if (preTestResult.status === "rejected") {
        console.error(`❌ Pre-Test generation failed:`, preTestResult.reason);
        throw new Error(`Failed to generate Pre-Test: ${preTestResult.reason.message || preTestResult.reason}`);
      }
      const preTestData = preTestResult.value;
      console.log(`✓ Pre-Test generated: ${preTestData.title} (${preTestData.questions.length} questions)`);

      // Check if Post-Test generation succeeded
      if (postTestResult.status === "rejected") {
        console.error(`❌ Post-Test generation failed:`, postTestResult.reason);
        throw new Error(`Failed to generate Post-Test: ${postTestResult.reason.message || postTestResult.reason}`);
      }
      const postTestData = postTestResult.value;
      console.log(`✓ Post-Test generated: ${postTestData.title} (${postTestData.questions.length} questions)`);

      // Create Pre-Test quiz in database
      console.log(`💾 Creating Pre-Test quiz in database...`);
      const preTestQuiz = await storage.createQuiz({
        userId: systemUser.id,
        subjectId,
        title: preTestData.title,
        difficulty: "medium",
        examType: "pre_test",
        materialType: materialType as "midterm" | "finals",
        questions: preTestData.questions,
      });
      console.log(`✓ Pre-Test quiz created with ID: ${preTestQuiz.id}`);

      // Create Post-Test quiz in database
      console.log(`💾 Creating Post-Test quiz in database...`);
      const postTestQuiz = await storage.createQuiz({
        userId: systemUser.id,
        subjectId,
        title: postTestData.title,
        difficulty: "medium",
        examType: "post_test",
        materialType: materialType as "midterm" | "finals",
        questions: postTestData.questions,
      });
      console.log(`✓ Post-Test quiz created with ID: ${postTestQuiz.id}`);

      // Mark the material set as completed with quiz IDs
      console.log(`💾 Marking material set as completed...`);
      const materialSet = await storage.markMaterialSetCompleted({
        subjectId,
        materialType: materialType as "midterm" | "finals",
        completedBy: user.id,
        preTestQuizId: preTestQuiz.id,
        postTestQuizId: postTestQuiz.id,
      });

      console.log(`✓ Generated Pre-Test and Post-Test for ${subject.name} (${materialType})`);
      
      // Send email notifications to eligible students (async, non-blocking)
      // This runs in the background and doesn't block the response
      (async () => {
        try {
          // Guard: Ensure storage methods are available
          if (!storage || !storage.getAllUsers || !storage.getSubjectProgramMappings) {
            console.error('⚠️ Storage not properly initialized for email notifications');
            return;
          }
          console.log(`📧 Sending exam availability notifications to eligible students...`);
          
          // Get all student users
          const allUsers = await storage.getAllUsers();
          const students = allUsers.filter(u => u.role === "student" && u.email);
          
          // Filter students who are eligible for this subject
          let eligibleStudents = students;
          
          // Filter by year level if subject has one
          if (subject.yearLevel) {
            eligibleStudents = eligibleStudents.filter(s => s.yearLevel === subject.yearLevel);
          }
          
          // Filter by program if subject has program assignments
          const allSubjectPrograms = await storage.getSubjectProgramMappings();
          const subjectPrograms = allSubjectPrograms.filter(sp => sp.subjectId === subjectId);
          if (subjectPrograms.length > 0) {
            const programIds = new Set(subjectPrograms.map((sp: { subjectId: string; programId: string }) => sp.programId));
            eligibleStudents = eligibleStudents.filter(s => s.programId && programIds.has(s.programId));
          }
          
          console.log(`📧 Found ${eligibleStudents.length} eligible students for notifications`);
          
          // Send notifications in parallel (non-blocking)
          const { sendExamAvailabilityNotification } = await import('./email');
          const notificationPromises = eligibleStudents.map(student =>
            sendExamAvailabilityNotification({
              recipientEmail: student.email!,
              recipientName: student.firstName || 'Student',
              subjectName: subject.name,
              subjectCode: subject.description?.match(/\((.*?)\)/)?.[1],
              yearLevel: subject.yearLevel || '1',
              materialType: materialType as "midterm" | "finals",
            }).catch(error => {
              console.error(`Failed to send notification to ${student.email}:`, error);
              return null; // Return null for failed sends
            })
          );
          
          // Send all notifications in parallel
          const results = await Promise.allSettled(notificationPromises);
          const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
          const failCount = results.length - successCount;
          
          console.log(`✓ Exam availability notifications sent: ${successCount} successful, ${failCount} failed`);
        } catch (notificationError) {
          // Don't fail the entire request if notifications fail
          console.error(`⚠️ Error sending exam availability notifications:`, notificationError);
        }
      })().catch(err => {
        // Catch any uncaught rejections from the async IIFE
        console.error('⚠️ Uncaught error in notification background task:', err);
      });
      
      res.json(materialSet);
    } catch (error: any) {
      console.error("❌ Error marking material set as complete:", error);
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
      
      // Provide specific error messages
      if (error.message?.includes("Failed to generate")) {
        return res.status(500).json({ 
          message: "Failed to generate exams using AI. Please try again later.",
          error: error.message 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to mark material set as complete",
        error: error.message 
      });
    }
  });

  // Undo material set completion
  app.post("/api/material-sets/undo", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Only admins can undo material set completion" });
      }

      const { subjectId, materialType } = req.body;
      if (!subjectId || !materialType) {
        return res.status(400).json({ message: "subjectId and materialType are required" });
      }

      console.log(`⏳ Undoing completion for material set: ${subjectId} (${materialType})...`);
      
      const materialSet = await storage.undoMaterialSetCompletion({
        subjectId,
        materialType: materialType as "midterm" | "finals",
      });

      console.log(`✓ Material set completion undone. Associated quizzes have been archived.`);
      res.json(materialSet);
    } catch (error: any) {
      console.error("❌ Error undoing material set completion:", error);
      res.status(500).json({ 
        message: error.message || "Failed to undo material set completion",
      });
    }
  });

  // Exam routes (Pre-Tests and Post-Tests)
  app.get("/api/exams/available", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "student") {
        return res.status(403).json({ message: "Only students can access available exams" });
      }

      // Determine which subjects the student can access
      let subjectIds: string[] = [];
      
      // First check if student has an active study plan
      const studyPlan = await storage.getStudyPlan(userId);
      if (studyPlan && studyPlan.isActive) {
        // Get subjects from study plan
        const planSubjects = await storage.getStudyPlanSubjects(studyPlan.id);
        subjectIds = planSubjects.map(ps => ps.subjectId);
      } else if (!user.isRegular) {
        // Irregular student - get assigned subjects
        const assignments = await storage.getStudentAssignments(userId);
        subjectIds = assignments.map((a: any) => a.subjectId);
      }
      // For regular students without a study plan, use yearLevel filter (no subjectIds)

      // Fetch available exams with attempt metadata, filtering by program
      const exams = await storage.getAvailableExams(
        userId,
        user.yearLevel || undefined,
        subjectIds.length > 0 ? subjectIds : undefined,
        user.programId || undefined
      );

      res.json(exams);
    } catch (error) {
      console.error("Error fetching available exams:", error);
      res.status(500).json({ message: "Failed to fetch available exams" });
    }
  });

  // Quiz routes
  app.post("/api/quizzes/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subjectId, difficulty, questionCount, materialIds } = req.body;

      if (!subjectId || !difficulty || !questionCount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const subject = await storage.getSubject(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      let materials = await storage.getStudyMaterials(subjectId);

      if (materialIds && Array.isArray(materialIds) && materialIds.length > 0) {
        const requestedMaterialIds = new Set(materialIds);
        materials = materials.filter(m => requestedMaterialIds.has(m.id));
        
        if (materials.length === 0) {
          return res.status(400).json({ message: "No valid materials found for the selected IDs" });
        }

        const allBelongToSubject = materials.every(m => m.subjectId === subjectId);
        if (!allBelongToSubject) {
          return res.status(400).json({ message: "Some materials do not belong to the selected subject" });
        }
      }

      if (materials.length === 0) {
        return res.status(400).json({ message: "No study materials available for this subject" });
      }

      const materialContext = materials.map(m => `${m.title}: ${m.description}`).join("\n");

      const quizData = await generateQuiz(subject.name, difficulty, questionCount, materialContext);

      const quiz = await storage.createQuiz({
        userId,
        subjectId,
        title: quizData.title || `${subject.name} Quiz - ${difficulty}`,
        difficulty: difficulty as "easy" | "medium" | "hard",
        questions: quizData.questions,
      });

      res.json(quiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
    }
  });

  // Admin Quiz endpoints
  app.get("/api/admin/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all quizzes for admins (no userId filter)
      const quizzes = await storage.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching all quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  // Get filtered exams for admin reports with server-side filtering
  app.get("/api/admin/exams/filtered", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { programId, yearLevel, examType, materialType, subjectId } = req.query;
      
      const exams = await storage.getFilteredExamsForAdmin({
        programId: programId && programId !== 'all' ? programId as string : undefined,
        yearLevel: yearLevel && yearLevel !== 'all' ? yearLevel as string : undefined,
        examType: examType && examType !== 'all' ? examType as string : undefined,
        materialType: materialType && materialType !== 'all' ? materialType as string : undefined,
        subjectId: subjectId && subjectId !== 'all' ? subjectId as string : undefined,
      });

      res.json(exams);
    } catch (error) {
      console.error("Error fetching filtered exams:", error);
      res.status(500).json({ message: "Failed to fetch filtered exams" });
    }
  });

  app.get("/api/admin/quiz-attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all quiz attempts for admins (no userId filter)
      const attempts = await storage.getAllQuizAttempts();
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching all quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.get("/api/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subjectId } = req.query;
      // Always filter by userId to prevent data exposure
      const quizzes = await storage.getQuizzes(userId, subjectId as string);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Check if quiz is archived
      if (quiz.isArchived) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      // Allow access if:
      // 1. User owns the quiz (regular quiz)
      // 2. Quiz is a public exam (pre_test or post_test) for students
      const isOwner = quiz.userId === userId;
      const isPublicExam = quiz.examType === "pre_test" || quiz.examType === "post_test";
      
      if (!isOwner && !isPublicExam) {
        return res.status(403).json({ message: "Not authorized to access this quiz" });
      }
      
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.delete("/api/quizzes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quiz = await storage.getQuiz(req.params.id);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      if (quiz.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this quiz" });
      }

      await storage.deleteQuiz(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Quiz Attempt routes
  app.post("/api/quiz-attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertQuizAttemptSchema.parse({ ...req.body, userId });
      const attempt = await storage.createQuizAttempt(validatedData);
      res.json(attempt);
    } catch (error: any) {
      console.error("Error creating quiz attempt:", error);
      res.status(400).json({ message: error.message || "Failed to create quiz attempt" });
    }
  });

  app.get("/api/quiz-attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quizId } = req.query;
      const attempts = await storage.getQuizAttempts(userId, quizId as string);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.get("/api/quiz-attempts/:id", isAuthenticated, async (req, res) => {
    try {
      const attempt = await storage.getQuizAttempt(req.params.id);
      if (!attempt) {
        return res.status(404).json({ message: "Quiz attempt not found" });
      }
      res.json(attempt);
    } catch (error) {
      console.error("Error fetching quiz attempt:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempt" });
    }
  });

  // Performance analytics routes
  app.get("/api/analytics/performance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserPerformanceStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching performance stats:", error);
      res.status(500).json({ message: "Failed to fetch performance stats" });
    }
  });

  app.post("/api/analytics/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserPerformanceStats(userId);
      
      const insights = await analyzePerformance(
        stats.map((s: any) => ({
          subject: s.subjectName,
          score: s.averageScore,
          correctAnswers: s.correctAnswers,
          totalQuestions: s.totalQuestions,
        }))
      );
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Exam performance analytics (Pre-Test and Post-Test breakdown)
  app.get("/api/analytics/exam-performance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all quiz attempts for the user
      const attempts = await storage.getQuizAttempts(userId);
      
      // Get all quizzes to map exam types
      const quizzes = await storage.getQuizzes();
      const quizMap = new Map(quizzes.map(q => [q.id, q]));
      
      // Get all subjects for names
      const subjects = await storage.getSubjects();
      const subjectMap = new Map(subjects.map(s => [s.id, s]));
      
      // Group attempts by subject and exam type
      const performanceBySubject = new Map<string, {
        subjectId: string;
        subjectName: string;
        preTestScores: number[];
        postTestScores: number[];
        preTestAttempts: number;
        postTestAttempts: number;
      }>();
      
      for (const attempt of attempts) {
        const quiz = quizMap.get(attempt.quizId);
        if (!quiz || quiz.examType === 'quiz') continue; // Skip regular quizzes
        
        const subject = subjectMap.get(quiz.subjectId);
        if (!subject) continue;
        
        const key = quiz.subjectId;
        if (!performanceBySubject.has(key)) {
          performanceBySubject.set(key, {
            subjectId: quiz.subjectId,
            subjectName: subject.name,
            preTestScores: [],
            postTestScores: [],
            preTestAttempts: 0,
            postTestAttempts: 0,
          });
        }
        
        const data = performanceBySubject.get(key)!;
        if (quiz.examType === 'pre_test') {
          data.preTestScores.push(attempt.score);
          data.preTestAttempts++;
        } else if (quiz.examType === 'post_test') {
          data.postTestScores.push(attempt.score);
          data.postTestAttempts++;
        }
      }
      
      // Calculate averages and improvement
      const examPerformance = Array.from(performanceBySubject.values()).map(data => {
        const preTestAvg = data.preTestScores.length > 0
          ? Math.round(data.preTestScores.reduce((sum, s) => sum + s, 0) / data.preTestScores.length)
          : null;
        const postTestAvg = data.postTestScores.length > 0
          ? Math.round(data.postTestScores.reduce((sum, s) => sum + s, 0) / data.postTestScores.length)
          : null;
        const improvement = (preTestAvg !== null && postTestAvg !== null)
          ? postTestAvg - preTestAvg
          : null;
        
        return {
          subjectId: data.subjectId,
          subjectName: data.subjectName,
          preTestAvg,
          postTestAvg,
          improvement,
          preTestAttempts: data.preTestAttempts,
          postTestAttempts: data.postTestAttempts,
        };
      });
      
      // Calculate overall summary
      const allPreTestScores = examPerformance
        .filter(e => e.preTestAvg !== null)
        .map(e => e.preTestAvg!);
      const allPostTestScores = examPerformance
        .filter(e => e.postTestAvg !== null)
        .map(e => e.postTestAvg!);
      
      const overallPreTestAvg = allPreTestScores.length > 0
        ? Math.round(allPreTestScores.reduce((sum, s) => sum + s, 0) / allPreTestScores.length)
        : null;
      const overallPostTestAvg = allPostTestScores.length > 0
        ? Math.round(allPostTestScores.reduce((sum, s) => sum + s, 0) / allPostTestScores.length)
        : null;
      const overallImprovement = (overallPreTestAvg !== null && overallPostTestAvg !== null)
        ? overallPostTestAvg - overallPreTestAvg
        : null;
      
      res.json({
        summary: {
          preTestAvg: overallPreTestAvg,
          postTestAvg: overallPostTestAvg,
          improvement: overallImprovement,
          totalPreTests: allPreTestScores.length,
          totalPostTests: allPostTestScores.length,
        },
        bySubject: examPerformance,
      });
    } catch (error) {
      console.error("Error fetching exam performance:", error);
      res.status(500).json({ message: "Failed to fetch exam performance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
