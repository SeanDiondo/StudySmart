import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json, pgEnum, index, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const dayOfWeekEnum = pgEnum("day_of_week", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
export const yearLevelEnum = pgEnum("year_level", ["1", "2", "3", "4"]);

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (integrated with Replit Auth + password for testing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For testing - hashed with bcrypt
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("student"),
  yearLevel: yearLevelEnum("year_level").default("1"), // 1st to 4th year
  isRegular: boolean("is_regular").notNull().default(true), // Regular vs irregular student
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Subjects table (both default CCIT subjects and custom subjects for irregular students)
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  yearLevel: yearLevelEnum("year_level").default("1"), // Subject's year level (1-4)
  isDefault: boolean("is_default").notNull().default(false), // true for CCIT standard subjects
  userId: varchar("user_id").references(() => users.id), // null for default subjects, user id for custom subjects
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

// Student Subject Assignments table (for irregular students - admin assigns specific subjects)
export const studentSubjectAssignments = pgTable("student_subject_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id), // Admin who assigned
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("unique_student_subject").on(table.studentId, table.subjectId),
]);

export const insertStudentSubjectAssignmentSchema = createInsertSchema(studentSubjectAssignments).omit({
  id: true,
  assignedAt: true,
});

export type InsertStudentSubjectAssignment = z.infer<typeof insertStudentSubjectAssignmentSchema>;
export type StudentSubjectAssignment = typeof studentSubjectAssignments.$inferSelect;

// Study Plans table
export const studyPlans = pgTable("study_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  learningGoals: text("learning_goals").notNull(),
  availableDays: json("available_days").$type<string[]>().notNull(), // Array of days: ["monday", "tuesday"]
  availableTimeSlots: json("available_time_slots").$type<{day: string, startTime: string, endTime: string}[]>().notNull(),
  hoursPerWeek: integer("hours_per_week").notNull(),
  targetCompletionDate: timestamp("target_completion_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlans.$inferSelect;

// Study Plan Subjects junction table (many-to-many relationship)
export const studyPlanSubjects = pgTable("study_plan_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studyPlanId: varchar("study_plan_id").notNull().references(() => studyPlans.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  hoursAllocated: integer("hours_allocated").notNull(), // Weekly hours for this subject
  priority: integer("priority").notNull().default(1), // 1 (highest) to 5 (lowest)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudyPlanSubjectSchema = createInsertSchema(studyPlanSubjects).omit({
  id: true,
  createdAt: true,
});

export type InsertStudyPlanSubject = z.infer<typeof insertStudyPlanSubjectSchema>;
export type StudyPlanSubject = typeof studyPlanSubjects.$inferSelect;

// Study Materials table (admin-uploaded PDFs and resources)
export const studyMaterials = pgTable("study_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertStudyMaterialSchema = createInsertSchema(studyMaterials).omit({
  id: true,
  uploadedAt: true,
});

export type InsertStudyMaterial = z.infer<typeof insertStudyMaterialSchema>;
export type StudyMaterial = typeof studyMaterials.$inferSelect;

// Quizzes table (AI-generated quizzes)
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  title: text("title").notNull(),
  difficulty: difficultyEnum("difficulty").notNull().default("medium"),
  questions: json("questions").$type<{questionText: string, options: string[], correctAnswer: string, explanation: string}[]>().notNull(),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Quiz Questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"), // multiple_choice, true_false
  options: json("options").$type<string[]>().notNull(), // Array of answer options
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

// Quiz Attempts table (when students take quizzes)
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  score: integer("score").notNull(), // percentage (0-100)
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  timeSpentMinutes: integer("time_spent_minutes").notNull(),
  answers: json("answers").$type<{questionIndex: number, userAnswer: string, isCorrect: boolean}[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  createdAt: true,
});

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

// Quiz Answers table (individual question responses)
export const quizAnswers = pgTable("quiz_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
  questionId: varchar("question_id").notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
  userAnswer: text("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
});

export const insertQuizAnswerSchema = createInsertSchema(quizAnswers).omit({
  id: true,
});

export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;
export type QuizAnswer = typeof quizAnswers.$inferSelect;

// Performance Data table (AI-analyzed strengths and weaknesses)
export const performanceData = pgTable("performance_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  strengths: json("strengths").$type<string[]>().notNull(), // AI-identified strong topics
  weaknesses: json("weaknesses").$type<string[]>().notNull(), // AI-identified weak topics
  recommendations: text("recommendations"), // AI-generated study recommendations
  averageScore: integer("average_score").notNull(), // Average percentage across all quizzes
  totalQuizzesTaken: integer("total_quizzes_taken").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertPerformanceDataSchema = createInsertSchema(performanceData).omit({
  id: true,
  lastUpdated: true,
});

export type InsertPerformanceData = z.infer<typeof insertPerformanceDataSchema>;
export type PerformanceData = typeof performanceData.$inferSelect;

// Default CCIT subjects (will be seeded into the database)
export const defaultCCITSubjects = [
  { name: "Programming Fundamentals", description: "Introduction to programming concepts and logic" },
  { name: "Data Structures and Algorithms", description: "Study of data organization and algorithmic problem solving" },
  { name: "Database Systems", description: "Database design, SQL, and database management" },
  { name: "Web Development", description: "Frontend and backend web technologies" },
  { name: "Software Engineering", description: "Software development methodologies and best practices" },
  { name: "Computer Networks", description: "Network architecture, protocols, and security" },
  { name: "Operating Systems", description: "OS concepts, processes, and memory management" },
  { name: "Information Security", description: "Cybersecurity principles and practices" },
  { name: "Mobile Application Development", description: "iOS and Android app development" },
  { name: "System Analysis and Design", description: "Requirements analysis and system design" },
];
