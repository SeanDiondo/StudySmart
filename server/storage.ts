// Reference: blueprint:javascript_database and blueprint:javascript_log_in_with_replit
import {
  users,
  subjects,
  subjectPrograms,
  studyPlans,
  studyPlanSubjects,
  studyMaterials,
  materialSets,
  quizzes,
  quizAttempts,
  studentSubjectAssignments,
  type User,
  type UpsertUser,
  type Subject,
  type InsertSubject,
  type StudyPlan,
  type InsertStudyPlan,
  type StudyPlanSubject,
  type InsertStudyPlanSubject,
  type StudyMaterial,
  type InsertStudyMaterial,
  type MaterialSet,
  type InsertMaterialSet,
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type StudentSubjectAssignment,
  type InsertStudentSubjectAssignment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createTestUser(user: { email: string; password: string; firstName: string; lastName: string; role: "student" | "professor" | "admin" }): Promise<User>;
  updateUserRole(id: string, role: "student" | "professor" | "admin"): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'password'>>): Promise<User>;
  updateUserStudentStatus(id: string, yearLevel: "1" | "2" | "3" | "4", isRegular: boolean): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Subject operations
  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  getSubjectsForStudent(studentId: string): Promise<Subject[]>;
  getSubjectProgramMappings(): Promise<Array<{ subjectId: string; programId: string }>>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, subject: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  
  // Student Subject Assignment operations
  getStudentAssignments(studentId: string): Promise<StudentSubjectAssignment[]>;
  assignSubjectToStudent(assignment: InsertStudentSubjectAssignment): Promise<StudentSubjectAssignment>;
  removeSubjectFromStudent(studentId: string, subjectId: string): Promise<void>;
  
  // Study Plan operations
  getStudyPlan(userId: string): Promise<StudyPlan | undefined>;
  getAllStudyPlans(userId: string): Promise<StudyPlan[]>;
  getAllActiveStudyPlans(): Promise<StudyPlan[]>;
  getStudyPlanById(planId: string): Promise<StudyPlan | undefined>;
  createStudyPlan(plan: InsertStudyPlan): Promise<StudyPlan>;
  updateStudyPlan(id: string, plan: Partial<InsertStudyPlan>): Promise<StudyPlan>;
  deleteStudyPlan(id: string): Promise<void>;
  
  // Study Plan Subjects operations
  getStudyPlanSubjects(planId: string): Promise<StudyPlanSubject[]>;
  createStudyPlanSubject(planSubject: InsertStudyPlanSubject): Promise<StudyPlanSubject>;
  updateStudyPlanSubject(id: string, planSubject: Partial<InsertStudyPlanSubject>): Promise<StudyPlanSubject>;
  deleteStudyPlanSubject(id: string): Promise<void>;
  deleteStudyPlanSubjectsByPlanId(planId: string): Promise<void>;
  
  // Study Materials operations
  getStudyMaterials(subjectId?: string, materialType?: "midterm" | "finals"): Promise<StudyMaterial[]>;
  getStudyMaterial(id: string): Promise<StudyMaterial | undefined>;
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;
  updateStudyMaterial(id: string, material: Partial<InsertStudyMaterial>): Promise<StudyMaterial>;
  deleteStudyMaterial(id: string): Promise<void>;
  getPendingMaterials(): Promise<StudyMaterial[]>;
  resolvePendingMaterial(params: {materialId: string, subjectId: string, validatedBy: string}): Promise<StudyMaterial>;
  
  // Material Set operations (Phase 1: Admin completion workflow)
  getMaterialSet(subjectId: string, materialType: "midterm" | "finals"): Promise<MaterialSet | undefined>;
  upsertMaterialSet(materialSetData: InsertMaterialSet): Promise<MaterialSet>;
  markMaterialSetCompleted(params: {subjectId: string, materialType: "midterm" | "finals", completedBy: string, preTestQuizId?: string, postTestQuizId?: string}): Promise<MaterialSet>;
  undoMaterialSetCompletion(params: {subjectId: string, materialType: "midterm" | "finals"}): Promise<MaterialSet>;
  
  // Quiz operations
  getQuizzes(userId?: string, subjectId?: string): Promise<Quiz[]>;
  getAllQuizzes(): Promise<Quiz[]>;
  getFilteredExamsForAdmin(filters: { programId?: string; yearLevel?: string; examType?: string; materialType?: string; subjectId?: string }): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  getAvailableExams(studentId: string, yearLevel?: string, subjectIds?: string[], programId?: string): Promise<Array<Quiz & { attemptCount: number; lastAttemptAt: Date | null; preTestAttempted?: boolean }>>;
  
  // Quiz Attempt operations
  getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]>;
  getAllQuizAttempts(): Promise<QuizAttempt[]>;
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getUserPerformanceStats(userId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createTestUser(userData: { email: string; password: string; firstName: string; lastName: string; role: "student" | "professor" | "admin" }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: "student" | "professor" | "admin"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'password'>>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStudentStatus(id: string, yearLevel: "1" | "2" | "3" | "4", isRegular: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ yearLevel, isRegular, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Subject operations
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async getSubjectsForStudent(studentId: string): Promise<Subject[]> {
    // Get student info to determine year level and regular status
    const student = await this.getUser(studentId);
    if (!student) return [];

    // If student is regular, return all default subjects for their year level
    if (student.isRegular && student.yearLevel) {
      return await db
        .select()
        .from(subjects)
        .where(
          and(
            eq(subjects.isDefault, true),
            eq(subjects.yearLevel, student.yearLevel)
          )
        );
    }

    // If student is irregular, return only assigned subjects
    const assignments = await db
      .select({ subjectId: studentSubjectAssignments.subjectId })
      .from(studentSubjectAssignments)
      .where(eq(studentSubjectAssignments.studentId, studentId));

    if (assignments.length === 0) return [];

    const subjectIds = assignments.map(a => a.subjectId);
    return await db
      .select()
      .from(subjects)
      .where(sql`${subjects.id} IN (${sql.join(subjectIds.map(id => sql`${id}`), sql`, `)})`);
  }

  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(subjectData).returning();
    return subject;
  }

  async updateSubject(id: string, subjectData: Partial<InsertSubject>): Promise<Subject> {
    const [subject] = await db
      .update(subjects)
      .set(subjectData)
      .where(eq(subjects.id, id))
      .returning();
    return subject;
  }

  async deleteSubject(id: string): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  async getSubjectProgramMappings(): Promise<Array<{ subjectId: string; programId: string }>> {
    return await db
      .select({
        subjectId: subjectPrograms.subjectId,
        programId: subjectPrograms.programId,
      })
      .from(subjectPrograms);
  }

  // Student Subject Assignment operations
  async getStudentAssignments(studentId: string): Promise<StudentSubjectAssignment[]> {
    const assignments = await db
      .select({
        id: studentSubjectAssignments.id,
        studentId: studentSubjectAssignments.studentId,
        subjectId: studentSubjectAssignments.subjectId,
        assignedBy: studentSubjectAssignments.assignedBy,
        assignedAt: studentSubjectAssignments.assignedAt,
        subject: subjects,
      })
      .from(studentSubjectAssignments)
      .innerJoin(subjects, eq(studentSubjectAssignments.subjectId, subjects.id))
      .where(eq(studentSubjectAssignments.studentId, studentId));
    
    return assignments as any; // Type assertion needed due to JOIN
  }

  async assignSubjectToStudent(assignment: InsertStudentSubjectAssignment): Promise<StudentSubjectAssignment> {
    const [result] = await db
      .insert(studentSubjectAssignments)
      .values(assignment)
      .returning();
    return result;
  }

  async removeSubjectFromStudent(studentId: string, subjectId: string): Promise<void> {
    await db
      .delete(studentSubjectAssignments)
      .where(
        and(
          eq(studentSubjectAssignments.studentId, studentId),
          eq(studentSubjectAssignments.subjectId, subjectId)
        )
      );
  }

  // Study Plan operations
  async getStudyPlan(userId: string): Promise<StudyPlan | undefined> {
    const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.userId, userId)).orderBy(desc(studyPlans.createdAt));
    return plan || undefined;
  }

  async getAllStudyPlans(userId: string): Promise<StudyPlan[]> {
    return await db.select().from(studyPlans).where(eq(studyPlans.userId, userId)).orderBy(desc(studyPlans.createdAt));
  }

  async getAllActiveStudyPlans(): Promise<StudyPlan[]> {
    return await db.select().from(studyPlans).where(eq(studyPlans.isActive, true));
  }

  async getStudyPlanById(planId: string): Promise<StudyPlan | undefined> {
    const [plan] = await db.select().from(studyPlans).where(eq(studyPlans.id, planId));
    return plan || undefined;
  }

  async createStudyPlan(planData: InsertStudyPlan): Promise<StudyPlan> {
    const [plan] = await db.insert(studyPlans).values(planData).returning();
    return plan;
  }

  async updateStudyPlan(id: string, planData: Partial<InsertStudyPlan>): Promise<StudyPlan> {
    const [plan] = await db
      .update(studyPlans)
      .set(planData)
      .where(eq(studyPlans.id, id))
      .returning();
    return plan;
  }

  async deleteStudyPlan(id: string): Promise<void> {
    await db.delete(studyPlans).where(eq(studyPlans.id, id));
  }

  // Study Plan Subjects operations
  async getStudyPlanSubjects(planId: string): Promise<StudyPlanSubject[]> {
    const planSubjectsWithDetails = await db
      .select({
        id: studyPlanSubjects.id,
        studyPlanId: studyPlanSubjects.studyPlanId,
        subjectId: studyPlanSubjects.subjectId,
        priority: studyPlanSubjects.priority,
        subject: subjects,
      })
      .from(studyPlanSubjects)
      .innerJoin(subjects, eq(studyPlanSubjects.subjectId, subjects.id))
      .where(eq(studyPlanSubjects.studyPlanId, planId));
    
    return planSubjectsWithDetails as any; // Type assertion needed due to JOIN
  }

  async createStudyPlanSubject(planSubjectData: InsertStudyPlanSubject): Promise<StudyPlanSubject> {
    const [planSubject] = await db.insert(studyPlanSubjects).values(planSubjectData).returning();
    return planSubject;
  }

  async updateStudyPlanSubject(id: string, planSubjectData: Partial<InsertStudyPlanSubject>): Promise<StudyPlanSubject> {
    const [planSubject] = await db
      .update(studyPlanSubjects)
      .set(planSubjectData)
      .where(eq(studyPlanSubjects.id, id))
      .returning();
    return planSubject;
  }

  async deleteStudyPlanSubject(id: string): Promise<void> {
    await db.delete(studyPlanSubjects).where(eq(studyPlanSubjects.id, id));
  }

  async deleteStudyPlanSubjectsByPlanId(planId: string): Promise<void> {
    await db.delete(studyPlanSubjects).where(eq(studyPlanSubjects.studyPlanId, planId));
  }

  // Study Materials operations
  async getStudyMaterials(subjectId?: string, materialType?: "midterm" | "finals"): Promise<StudyMaterial[]> {
    let conditions = [];
    if (subjectId) conditions.push(eq(studyMaterials.subjectId, subjectId));
    if (materialType) conditions.push(eq(studyMaterials.materialType, materialType));
    
    if (conditions.length > 0) {
      return await db.select().from(studyMaterials).where(and(...conditions));
    }
    return await db.select().from(studyMaterials);
  }

  async getStudyMaterial(id: string): Promise<StudyMaterial | undefined> {
    const [material] = await db.select().from(studyMaterials).where(eq(studyMaterials.id, id));
    return material || undefined;
  }

  // Subject validation for material uploads
  async validateSubjectByName(params: {
    subjectName: string;
    programId?: string;
    yearLevel?: string;
  }): Promise<{ subjectId: string | null; status: "valid" | "pending" }> {
    const { subjectName, programId, yearLevel } = params;
    
    // Normalize subject name for matching
    const normalizedName = subjectName.trim().toLowerCase();
    
    // Try to find subject by name (case-insensitive)
    const matchingSubjects = await db
      .select()
      .from(subjects)
      .where(sql`LOWER(${subjects.name}) = ${normalizedName}`);
    
    if (matchingSubjects.length === 0) {
      // Subject not found
      return { subjectId: null, status: "pending" };
    }
    
    // If we have a program, try to find subject-program mapping
    if (programId) {
      const subjectIds = matchingSubjects.map(s => s.id);
      const subjectProgramMappings = await db
        .select()
        .from(subjectPrograms)
        .where(and(
          inArray(subjectPrograms.subjectId, subjectIds),
          eq(subjectPrograms.programId, programId)
        ));
      
      if (subjectProgramMappings.length > 0) {
        // Found a subject-program match
        return { subjectId: subjectProgramMappings[0].subjectId, status: "valid" };
      }
    }
    
    // If we have a year level, try to match by year level
    if (yearLevel) {
      const subjectWithYear = matchingSubjects.find(s => s.yearLevel === yearLevel);
      if (subjectWithYear) {
        return { subjectId: subjectWithYear.id, status: "valid" };
      }
    }
    
    // Return first matching subject if no program/year filtering
    return { subjectId: matchingSubjects[0].id, status: "valid" };
  }

  async createStudyMaterial(materialData: InsertStudyMaterial): Promise<StudyMaterial> {
    const [material] = await db.insert(studyMaterials).values(materialData).returning();
    return material;
  }

  async updateStudyMaterial(id: string, materialData: Partial<InsertStudyMaterial>): Promise<StudyMaterial> {
    const [material] = await db
      .update(studyMaterials)
      .set(materialData)
      .where(eq(studyMaterials.id, id))
      .returning();
    return material;
  }

  async deleteStudyMaterial(id: string): Promise<void> {
    await db.delete(studyMaterials).where(eq(studyMaterials.id, id));
  }

  async getPendingMaterials(): Promise<StudyMaterial[]> {
    return await db
      .select()
      .from(studyMaterials)
      .where(eq(studyMaterials.subjectValidationStatus, "pending"))
      .orderBy(desc(studyMaterials.uploadedAt));
  }

  async resolvePendingMaterial(params: {
    materialId: string;
    subjectId: string;
    validatedBy: string;
  }): Promise<StudyMaterial> {
    const { materialId, subjectId, validatedBy } = params;
    
    // Verify material exists and is pending
    const existingMaterial = await this.getStudyMaterial(materialId);
    if (!existingMaterial) {
      throw new Error("Material not found");
    }
    if (existingMaterial.subjectValidationStatus !== "pending") {
      throw new Error("Material is not in pending status");
    }
    
    // Verify subject exists
    const subject = await this.getSubject(subjectId);
    if (!subject) {
      throw new Error("Subject not found");
    }
    
    const [material] = await db
      .update(studyMaterials)
      .set({
        subjectId,
        subjectValidationStatus: "valid",
        validatedBy,
        validatedAt: new Date(),
        rawSubjectName: null,
      })
      .where(eq(studyMaterials.id, materialId))
      .returning();
    
    if (!material) {
      throw new Error("Failed to update material");
    }
    
    return material;
  }

  // Material Set operations (Phase 1: Admin completion workflow)
  async getMaterialSet(subjectId: string, materialType: "midterm" | "finals"): Promise<MaterialSet | undefined> {
    const [materialSet] = await db
      .select()
      .from(materialSets)
      .where(and(
        eq(materialSets.subjectId, subjectId),
        eq(materialSets.materialType, materialType)
      ));
    return materialSet || undefined;
  }

  async upsertMaterialSet(materialSetData: InsertMaterialSet): Promise<MaterialSet> {
    const [materialSet] = await db
      .insert(materialSets)
      .values(materialSetData)
      .onConflictDoUpdate({
        target: [materialSets.subjectId, materialSets.materialType],
        set: {
          isCompleted: materialSetData.isCompleted ?? false,
          completedBy: materialSetData.completedBy,
          completedAt: materialSetData.isCompleted ? sql`NOW()` : null,
        },
      })
      .returning();
    return materialSet;
  }

  async markMaterialSetCompleted(params: {
    subjectId: string;
    materialType: "midterm" | "finals";
    completedBy: string;
    preTestQuizId?: string;
    postTestQuizId?: string;
  }): Promise<MaterialSet> {
    const updateData: any = {
      isCompleted: true,
      completedBy: params.completedBy,
      completedAt: sql`NOW()`,
    };
    
    if (params.preTestQuizId) updateData.preTestQuizId = params.preTestQuizId;
    if (params.postTestQuizId) updateData.postTestQuizId = params.postTestQuizId;

    const [materialSet] = await db
      .update(materialSets)
      .set(updateData)
      .where(and(
        eq(materialSets.subjectId, params.subjectId),
        eq(materialSets.materialType, params.materialType)
      ))
      .returning();
    
    if (!materialSet) {
      const [newSet] = await db
        .insert(materialSets)
        .values({
          subjectId: params.subjectId,
          materialType: params.materialType,
          isCompleted: true,
          completedBy: params.completedBy,
          completedAt: sql`NOW()`,
          preTestQuizId: params.preTestQuizId,
          postTestQuizId: params.postTestQuizId,
        })
        .returning();
      return newSet;
    }
    
    return materialSet;
  }

  async undoMaterialSetCompletion(params: {
    subjectId: string;
    materialType: "midterm" | "finals";
  }): Promise<MaterialSet> {
    console.log(`Finding material set for subject ${params.subjectId}, type ${params.materialType}`);
    const materialSet = await this.getMaterialSet(params.subjectId, params.materialType);
    
    if (!materialSet) {
      console.error(`ERROR: Material set not found for subject ${params.subjectId}, type ${params.materialType}`);
      throw new Error("Material set not found");
    }

    console.log(`Found material set:`, { id: materialSet.id, isCompleted: materialSet.isCompleted, preTestQuizId: materialSet.preTestQuizId, postTestQuizId: materialSet.postTestQuizId });

    if (!materialSet.isCompleted) {
      console.error(`ERROR: Material set is not completed`);
      throw new Error("Material set is not completed");
    }

    // Archive the associated quizzes (soft delete)
    if (materialSet.preTestQuizId) {
      console.log(`Archiving Pre-Test quiz: ${materialSet.preTestQuizId}`);
      const result = await db
        .update(quizzes)
        .set({ isArchived: true })
        .where(eq(quizzes.id, materialSet.preTestQuizId))
        .returning();
      console.log(`Pre-Test archived:`, result.length > 0 ? 'success' : 'no rows updated');
    }

    if (materialSet.postTestQuizId) {
      console.log(`Archiving Post-Test quiz: ${materialSet.postTestQuizId}`);
      const result = await db
        .update(quizzes)
        .set({ isArchived: true })
        .where(eq(quizzes.id, materialSet.postTestQuizId))
        .returning();
      console.log(`Post-Test archived:`, result.length > 0 ? 'success' : 'no rows updated');
    }

    // Unmark the material set as completed
    console.log(`Updating material set to mark as not completed...`);
    const [updatedSet] = await db
      .update(materialSets)
      .set({
        isCompleted: false,
        completedBy: null,
        completedAt: null,
        preTestQuizId: null,
        postTestQuizId: null,
      })
      .where(and(
        eq(materialSets.subjectId, params.subjectId),
        eq(materialSets.materialType, params.materialType)
      ))
      .returning();

    if (!updatedSet) {
      console.error(`ERROR: Failed to update material set - no rows matched`);
      throw new Error("Failed to update material set");
    }

    console.log(`Material set updated successfully:`, { id: updatedSet.id, isCompleted: updatedSet.isCompleted });
    return updatedSet;
  }

  // Quiz operations
  async getQuizzes(userId?: string, subjectId?: string): Promise<Quiz[]> {
    if (userId && subjectId) {
      return await db.select().from(quizzes).where(and(
        eq(quizzes.userId, userId), 
        eq(quizzes.subjectId, subjectId),
        eq(quizzes.isArchived, false)
      ));
    } else if (userId) {
      return await db.select().from(quizzes).where(and(
        eq(quizzes.userId, userId),
        eq(quizzes.isArchived, false)
      ));
    } else if (subjectId) {
      return await db.select().from(quizzes).where(and(
        eq(quizzes.subjectId, subjectId),
        eq(quizzes.isArchived, false)
      ));
    }
    
    return await db.select().from(quizzes).where(eq(quizzes.isArchived, false));
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    // Admin endpoint - get all quizzes including archived
    return await db.select().from(quizzes);
  }

  async getFilteredExamsForAdmin(filters: { programId?: string; yearLevel?: string; examType?: string; materialType?: string; subjectId?: string }): Promise<Quiz[]> {
    // Build conditions array - always start with base condition
    const conditions: any[] = [
      sql`(${quizzes.examType} = 'pre_test' OR ${quizzes.examType} = 'post_test')`
    ];

    // Apply exam type filter
    if (filters.examType && filters.examType !== 'all') {
      conditions.push(eq(quizzes.examType, filters.examType as any));
    }

    // Apply material type filter
    if (filters.materialType && filters.materialType !== 'all') {
      conditions.push(eq(quizzes.materialType, filters.materialType as any));
    }

    // Apply subject filter
    if (filters.subjectId && filters.subjectId !== 'all') {
      conditions.push(eq(quizzes.subjectId, filters.subjectId));
    }

    // Apply year level filter (requires subjects join)
    if (filters.yearLevel) {
      conditions.push(eq(subjects.yearLevel, filters.yearLevel));
    }

    // Apply program filter (requires subjectPrograms join)
    if (filters.programId) {
      conditions.push(eq(subjectPrograms.programId, filters.programId));
    }

    // Build single query with proper joins - use innerJoin to ensure valid subjects
    let query = db
      .select({ quiz: quizzes })
      .from(quizzes)
      .innerJoin(subjects, eq(quizzes.subjectId, subjects.id));

    // Conditionally add subjectPrograms innerJoin if program filter is specified
    if (filters.programId) {
      query = query.innerJoin(subjectPrograms, eq(subjects.id, subjectPrograms.subjectId)) as any;
    }

    // Execute query with all conditions - safe because conditions always has at least one element
    const results = await query.where(conditions.length > 0 ? and(...conditions) : undefined);
    
    // Return only the quiz objects
    return results.map((r: any) => r.quiz);
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(quizData).returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    // Soft delete - archive the quiz instead of deleting it
    await db.update(quizzes)
      .set({ isArchived: true })
      .where(eq(quizzes.id, id));
  }

  async getAvailableExams(studentId: string, yearLevel?: string, subjectIds?: string[], programId?: string): Promise<Array<Quiz & { attemptCount: number; lastAttemptAt: Date | null; preTestAttempted?: boolean }>> {
    // Build conditions array
    const conditions: any[] = [
      sql`${quizzes.examType} IN ('pre_test', 'post_test')`,
      eq(quizzes.isArchived, false)
    ];

    // Add optional filters to conditions
    if (yearLevel) {
      conditions.push(eq(subjects.yearLevel, yearLevel as any));
    }
    
    if (subjectIds && subjectIds.length > 0) {
      conditions.push(inArray(subjects.id, subjectIds));
    }

    // Add program filter if provided - enforce program membership
    if (programId) {
      conditions.push(eq(subjectPrograms.programId, programId));
    }

    // Build query with conditional subjectPrograms join for program scoping
    let query = db
      .select({
        quiz: quizzes,
        attemptCount: sql<number>`CAST(COUNT(DISTINCT ${quizAttempts.id}) AS INTEGER)`.as('attempt_count'),
        lastAttemptAt: sql<Date | null>`MAX(${quizAttempts.createdAt})`.as('last_attempt_at'),
      })
      .from(quizzes)
      .innerJoin(subjects, eq(quizzes.subjectId, subjects.id));

    // Only join subjectPrograms if programId is provided - enforces program scoping when available
    if (programId) {
      query = query.innerJoin(subjectPrograms, eq(subjects.id, subjectPrograms.subjectId)) as any;
    }

    query = query.leftJoin(
        quizAttempts,
        and(
          eq(quizAttempts.quizId, quizzes.id),
          eq(quizAttempts.userId, studentId)
        )
      ) as any;

    const results = await query
      .where(and(...conditions))
      .groupBy(quizzes.id);

    // Transform results and add preTestAttempted flag for Post-Tests
    const exams = results.map((row: any) => ({
      ...row.quiz,
      attemptCount: row.attemptCount || 0,
      lastAttemptAt: row.lastAttemptAt || null,
    }));

    // For Post-Tests, check if corresponding Pre-Test has been attempted
    for (const exam of exams) {
      if (exam.examType === 'post_test') {
        // Find corresponding Pre-Test (same subjectId and materialType)
        const preTest = exams.find(e => 
          e.examType === 'pre_test' && 
          e.subjectId === exam.subjectId && 
          e.materialType === exam.materialType
        );
        // Set flag based on whether Pre-Test has attempts
        exam.preTestAttempted = preTest ? preTest.attemptCount > 0 : false;
      }
    }

    return exams;
  }

  // Quiz Attempt operations
  async getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]> {
    if (quizId) {
      return await db
        .select()
        .from(quizAttempts)
        .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
        .orderBy(desc(quizAttempts.createdAt));
    }
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt));
  }

  async getAllQuizAttempts(): Promise<QuizAttempt[]> {
    // Admin endpoint - get all quiz attempts
    return await db
      .select()
      .from(quizAttempts)
      .orderBy(desc(quizAttempts.createdAt));
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt || undefined;
  }

  async createQuizAttempt(attemptData: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(attemptData).returning();
    return attempt;
  }

  async getUserPerformanceStats(userId: string): Promise<any> {
    const attempts = await this.getQuizAttempts(userId);
    
    const subjectPerformance = new Map<string, { total: number; correct: number; attempts: number }>();
    
    for (const attempt of attempts) {
      const quiz = await this.getQuiz(attempt.quizId);
      if (!quiz) continue;
      
      const existing = subjectPerformance.get(quiz.subjectId) || { total: 0, correct: 0, attempts: 0 };
      existing.total += attempt.totalQuestions;
      existing.correct += attempt.correctAnswers;
      existing.attempts += 1;
      subjectPerformance.set(quiz.subjectId, existing);
    }
    
    const stats = [];
    for (const [subjectId, data] of subjectPerformance) {
      const subject = await this.getSubject(subjectId);
      stats.push({
        subjectId,
        subjectName: subject?.name || "Unknown",
        totalQuestions: data.total,
        correctAnswers: data.correct,
        attempts: data.attempts,
        averageScore: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      });
    }
    
    return stats;
  }
}

export const storage = new DatabaseStorage();
