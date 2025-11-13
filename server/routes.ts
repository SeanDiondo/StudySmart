// Reference: blueprint:javascript_log_in_with_replit
// Reference: blueprint:javascript_object_storage
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateQuiz, analyzePerformance } from "./openai";
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
      const { subjectId } = req.query;
      const materials = await storage.getStudyMaterials(subjectId as string);
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

      // Add uploadedBy field from authenticated user
      const dataWithUser = {
        ...req.body,
        uploadedBy: user.id,
      };

      // Validate and sanitize input
      const validatedData = insertStudyMaterialSchema.parse(dataWithUser);
      
      // Basic URL validation to prevent injection
      if (validatedData.fileUrl && !validatedData.fileUrl.match(/^https?:\/\//)) {
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

      // Add uploadedBy field from authenticated user
      const dataWithUser = {
        ...req.body,
        uploadedBy: user.id,
      };

      // Validate and sanitize input
      const validatedData = insertStudyMaterialSchema.parse(dataWithUser);
      
      // Basic URL validation to prevent injection
      if (validatedData.fileUrl && !validatedData.fileUrl.match(/^https?:\/\//)) {
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
      
      // Basic URL validation if fileUrl is being updated
      if (validatedData.fileUrl && !validatedData.fileUrl.match(/^https?:\/\//)) {
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

  // Quiz routes
  app.post("/api/quizzes/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { subjectId, difficulty, questionCount } = req.body;

      if (!subjectId || !difficulty || !questionCount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const subject = await storage.getSubject(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      const materials = await storage.getStudyMaterials(subjectId);
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
      // Verify ownership
      if (quiz.userId !== userId) {
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

  const httpServer = createServer(app);
  return httpServer;
}
