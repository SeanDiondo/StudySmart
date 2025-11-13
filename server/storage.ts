// Reference: blueprint:javascript_database and blueprint:javascript_log_in_with_replit
import {
  users,
  subjects,
  studyPlans,
  studyPlanSubjects,
  studyMaterials,
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
  type Quiz,
  type InsertQuiz,
  type QuizAttempt,
  type InsertQuizAttempt,
  type StudentSubjectAssignment,
  type InsertStudentSubjectAssignment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createTestUser(user: { email: string; password: string; firstName: string; lastName: string; role: "student" | "admin" }): Promise<User>;
  updateUserRole(id: string, role: "student" | "admin"): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>): Promise<User>;
  updateUserStudentStatus(id: string, yearLevel: "1" | "2" | "3" | "4", isRegular: boolean): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Subject operations
  getSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  getSubjectsForStudent(studentId: string): Promise<Subject[]>;
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
  getStudyMaterials(subjectId?: string): Promise<StudyMaterial[]>;
  getStudyMaterial(id: string): Promise<StudyMaterial | undefined>;
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;
  updateStudyMaterial(id: string, material: Partial<InsertStudyMaterial>): Promise<StudyMaterial>;
  deleteStudyMaterial(id: string): Promise<void>;
  
  // Quiz operations
  getQuizzes(userId?: string, subjectId?: string): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;
  
  // Quiz Attempt operations
  getQuizAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]>;
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

  async createTestUser(userData: { email: string; password: string; firstName: string; lastName: string; role: "student" | "admin" }): Promise<User> {
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

  async updateUserRole(id: string, role: "student" | "admin"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'email'>>): Promise<User> {
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
  async getStudyMaterials(subjectId?: string): Promise<StudyMaterial[]> {
    if (subjectId) {
      return await db.select().from(studyMaterials).where(eq(studyMaterials.subjectId, subjectId));
    }
    return await db.select().from(studyMaterials);
  }

  async getStudyMaterial(id: string): Promise<StudyMaterial | undefined> {
    const [material] = await db.select().from(studyMaterials).where(eq(studyMaterials.id, id));
    return material || undefined;
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

  // Quiz operations
  async getQuizzes(userId?: string, subjectId?: string): Promise<Quiz[]> {
    let query = db.select().from(quizzes);
    
    if (userId && subjectId) {
      return await query.where(and(eq(quizzes.userId, userId), eq(quizzes.subjectId, subjectId)));
    } else if (userId) {
      return await query.where(eq(quizzes.userId, userId));
    } else if (subjectId) {
      return await query.where(eq(quizzes.subjectId, subjectId));
    }
    
    return await query;
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
    await db.delete(quizzes).where(eq(quizzes.id, id));
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
