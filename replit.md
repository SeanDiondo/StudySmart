# CCIT Study Plan - Personalized Learning System

## Overview

CCIT Study Plan is an AI-powered educational platform designed for CCIT students. It provides personalized study planning, adaptive quiz generation, and intelligent performance analytics to enhance the learning experience. The system supports **multiple degree programs (BSIT, BSCS)** with program-specific filtering across all features. The system supports two primary user roles: Students, who create study plans, access materials, take quizzes, and track progress; and Administrators, who manage educational content including subject validation and program assignments. The project aims to provide an advanced, AI-driven learning platform with strong market potential in the education technology sector.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state management, shadcn/ui (built on Radix UI) for components, and Tailwind CSS for styling. It features a custom design system with Inter and Lexend fonts, a defined spacing system, and a HSL-based color palette supporting light/dark modes. State management leverages TanStack Query for server state, React Context for theme, and react-hook-form with Zod for form state. Routing is structured for public, authenticated, and admin-specific routes.

### Backend Architecture

The backend is built with Express.js and TypeScript, using Drizzle ORM for database interactions with Neon PostgreSQL. It integrates the OpenAI API for AI functionalities and Passport.js with OpenID Connect for Replit authentication. The API follows RESTful principles with authentication and role-based authorization middleware. Authentication uses session-based management with `express-session` and a PostgreSQL session store.

### Database Schema

The database uses Neon PostgreSQL and includes core tables such as `users`, `subjects`, `study_plans`, `study_plan_subjects`, `study_materials`, `quizzes`, `quiz_attempts`, `sessions`, `programs`, and `subject_programs`. Key design decisions include PostgreSQL enums, UUID primary keys, timestamp fields, JSONB fields for flexible data, and foreign key relationships with cascading deletes.

**Multi-Program Support**: The platform supports multiple degree programs (BSIT, BSCS) through the `programs` table and `subject_programs` join table. Each subject can be associated with one or more programs and year levels. Students are assigned to a program via `users.programId`. All exam and material filtering respects program boundaries to ensure students only see content relevant to their degree program.

**Subject Validation System**: When administrators upload study materials, subject names are validated against the database. If a subject name is not recognized for the student's program/year level combination, the material is flagged as "pending" with the `rawSubjectName` stored for admin review. Admins can then map pending materials to existing subjects or create new subject entries. This ensures data integrity while allowing flexible content uploads.

**Soft Delete Implementation**: Quizzes use soft delete (archiving) to preserve student performance data. The `quizzes` table has an `isArchived` boolean field (default: false). When a quiz is "deleted", it's archived (`isArchived = true`) instead of being permanently removed. This preserves all quiz attempts and performance analytics while hiding the quiz from student-facing lists. Archived quizzes can still be accessed for reporting and analytics purposes.

### AI Integration

The system integrates with OpenAI's GPT-5 model for AI features. This includes dynamic quiz generation based on subject, difficulty, and question count, with structured JSON output and optional material context. AI also powers performance analysis by generating insights, identifying strengths/weaknesses, and providing personalized study recommendations. Rate limiting and retry logic are implemented for robust API interaction.

### Email Reminder System

The platform includes an automated email reminder system that helps students stay on track with their study schedules:

-   **Scheduled Reminders**: A background scheduler runs every minute to check for upcoming study sessions. Reminders are sent 15 minutes and 5 minutes before each scheduled study time.
-   **Personalized Content**: Each email includes complete study session details: subject name and code, year level, day of the week, start/end times, session duration, and study tips.
-   **Resend Integration**: Utilizes Resend email service with HTML-formatted templates for professional, readable emails.
-   **Duplicate Prevention**: In-memory tracking prevents duplicate reminder emails during the same time window.
-   **Active Plans**: Only active study plans are monitored; reminders are sent for each subject in the student's study plan.

The scheduler initializes on server startup and operates continuously in the background, matching current time against study plan time slots stored in the database.

### Materials Organization

Study materials are displayed in a subject-grouped layout on the Materials Library page:

-   **Subject Grouping**: Materials are organized into sections by subject, making it easy to find all resources related to a specific topic (e.g., all "IT Era" materials appear together).
-   **Visual Hierarchy**: Each subject section displays a header with the subject name, description, and a badge showing the material count.
-   **Alphabetical Sorting**: Subject sections are sorted alphabetically for easy navigation.
-   **Preserved Functionality**: Search and filter capabilities remain intact, working seamlessly with the grouped display.

### AI-Generated Pre-Test/Post-Test System (Phase 1: Admin Completion Workflow)

The platform includes an automated exam generation system that creates Pre-Tests and Post-Tests based on completed study materials:

**Phase 1 - Material Set Completion (Implemented):**

-   **Material Type Classification**: Study materials are classified as either "Midterm" or "Finals" during upload. This categorization determines which exam period the materials belong to.
-   **Material Set Tracking**: The system tracks material sets using the `materialSets` table, which stores completion status for each unique combination of subject and material type (e.g., "Database Systems - Midterm").
-   **Admin Completion Workflow**: Administrators can mark a material set as "completed" once all materials for that subject/type have been uploaded. This triggers the preparation for AI exam generation.
-   **Completion Persistence**: Material set completion status is persisted in the database with metadata including completion timestamp and the admin who marked it complete.
-   **UI Status Display**: The Admin Materials page features a "Material Set Status" section that displays all uploaded material sets grouped by subject and type, showing material count, completion status, and completion date.

**Database Schema Enhancements:**

-   Added `materialType` enum ("midterm" | "finals") to the `studyMaterials` table
-   Added `examType` enum ("quiz" | "pre_test" | "post_test") to the `quizzes` table
-   Created `materialSets` table to track completion status with fields: `id`, `subjectId`, `materialType`, `isCompleted`, `completedAt`, `completedBy`, `preTestQuizId`, `postTestQuizId`
-   Unique constraint on (`subjectId`, `materialType`) to prevent duplicate material sets

**Backend API:**

-   `GET /api/material-sets/status`: Retrieves completion status for a specific subject+materialType combination
-   `POST /api/material-sets/mark-complete`: Marks a material set as completed (admin-only), validates materials exist, and triggers AI exam generation
-   `GET /api/study-materials`: Enhanced with optional `materialType` query parameter for filtering

**Phase 2 - AI Exam Generation (Implemented):**

-   **Automated Exam Creation**: When administrators mark a material set as complete, the system automatically generates both Pre-Test and Post-Test using OpenAI GPT-5.
-   **System User Attribution**: All AI-generated exams are attributed to a dedicated "AI System" user (system@ccitstudy.local) to maintain clean analytics and prevent skewing admin statistics.
-   **Intelligent Question Generation**:
    -   Pre-Tests: 15 questions designed to assess baseline/prerequisite knowledge before students study the materials
    -   Post-Tests: 20 questions providing comprehensive assessment after studying all materials
    -   Questions include detailed explanations for each answer
-   **Enriched AI Context**: AI generation uses both material titles and descriptions to create relevant, topic-specific questions.
-   **Sequential Generation**: Pre-Test is generated first, followed by Post-Test, with robust retry logic and error handling for API reliability.
-   **Database Integration**: Generated quizzes are stored with proper `examType` (pre_test/post_test), `materialType` (midterm/finals), and linked to material sets via foreign keys.
-   **Admin Feedback**: Console logs track generation progress with clear status messages and error reporting.

**Phase 3 - Student Exam Dashboard & Admin Reports (Implemented):**

-   **Student Dashboard Integration:**
    -   Added "Available Exams" section displaying Pre-Tests and Post-Tests based on student's **program**, year level, and study plan
    -   Subject resolution: Active study plan → Irregular student assignments → Year-level defaults
    -   **Program Filtering**: When student has programId assigned, exams are filtered to show only content for their degree program (graceful degradation for students without program assignment)
    -   Exam cards show: Title, subject, exam type badge, material type badge, attempt metadata (count + last attempt date)
    -   "Take Exam" or "Retake Exam" buttons linking to quiz interface
    -   Backend endpoint: `GET /api/exams/available` with smart filtering by examType, yearLevel, subjectIds, and programId
    -   Updated quiz access: Students can now access pre_test/post_test quizzes regardless of creator

-   **Admin Reports System:**
    -   New Reports page at `/admin/reports` with comprehensive exam analytics
    -   Overall statistics: Total exams, total attempts, unique students participated, average score
    -   Advanced filtering: Search, **program** (BSIT/BSCS), year level, exam type (Pre-Test/Post-Test), material type (Midterm/Finals), subject
    -   Server-side filtering via `GET /api/admin/exams/filtered` with efficient database joins on subjectPrograms table
    -   Statistics table displaying per-exam: Title, subject, type badges, attempt count, unique students, average score
    -   Color-coded scores: Green (≥70%), yellow (≥50%), red (<50%)
    -   Admin endpoints: `GET /api/admin/quizzes` and `GET /api/admin/quiz-attempts` for comprehensive data access
    -   Memoized query URLs prevent unnecessary refetches while maintaining filter reactivity

## External Dependencies

### Third-Party Services

-   **Replit Platform Integration**: Used for authentication (Replit Auth via OIDC), environment variables, and development tools.
-   **Neon PostgreSQL**: The primary serverless PostgreSQL database, utilizing `@neondatabase/serverless` for connection pooling.
-   **OpenAI API**: Provides the GPT-5 model for AI-driven quiz generation and performance analysis.
-   **Resend**: Email delivery service for automated study session reminders, integrated via Replit Connectors for secure API key management.

### UI Component Library

-   **shadcn/ui**: Utilizes Radix UI primitives for accessible and customizable components, including integration with Recharts for data visualization.

### Key NPM Packages

-   **Frontend**: `@tanstack/react-query`, `react-hook-form`, `zod`, `date-fns`, `recharts`.
-   **Backend**: `drizzle-orm`, `passport`, `openid-client`, `express-session`, `p-limit`, `p-retry`, `memoizee`.
-   **Development**: `typescript`, `tsx`, `esbuild`, `vite`, `tailwindcss`.