# CCIT Study Plan - Personalized Learning System

## Overview
The CCIT Study Plan is an AI-powered educational platform designed for CCIT students, supporting multiple degree programs (BSIT, BSCS). Its purpose is to provide personalized study planning, adaptive quiz generation, and intelligent performance analytics to enhance the learning experience. The system caters to Students, who create study plans, access materials, take quizzes, and track progress, and Administrators, who manage educational content and program assignments. The project aims to deliver an advanced, AI-driven learning platform with strong market potential in the education technology sector.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state, shadcn/ui for components, and Tailwind CSS for styling. It features a custom design system with Inter and Lexend fonts, defined spacing, and a HSL-based color palette supporting light/dark modes. Navigation is implemented using a collapsible left sidebar (using Shadcn sidebar primitives) with a hamburger menu toggle, starting in collapsed state for a clean interface.

### Backend
The backend is built with Express.js and TypeScript, using Drizzle ORM for Neon PostgreSQL. It integrates the OpenAI API for AI functionalities and Passport.js with OpenID Connect for Replit authentication. The API follows RESTful principles with session-based authentication and role-based authorization.

### Database
The system uses Neon PostgreSQL with tables for users, subjects, study plans, materials, quizzes, and program management. Key design decisions include PostgreSQL enums, UUID primary keys, timestamp fields, JSONB fields, and foreign key relationships. Multi-program support is implemented, filtering content by degree program and year level. A subject validation system ensures data integrity for uploaded materials, allowing administrators to map or create subjects. Quizzes utilize soft delete for data preservation.

### AI Integration
OpenAI's GPT-5 model is integrated for dynamic quiz generation based on subject, difficulty, and question count, providing structured JSON output and performance analysis including insights and personalized recommendations.

### Email System
An automated email system, utilizing Resend, provides two key features:
1. **Study Session Reminders**: Sends personalized reminders 15 and 5 minutes before scheduled study sessions for active study plans.
2. **Study Plan Confirmations**: Sends confirmation emails when students create new study plans, including plan details, selected subjects, study hours per week, and scheduled days. Email sending is asynchronous and non-blocking, with errors logged but not affecting the user experience.

### Materials Organization
Study materials are organized into subject-grouped sections on the Materials Library page, with alphabetical sorting and visual hierarchy, while preserving search and filter capabilities.

### AI-Generated Pre-Test/Post-Test System
The platform includes an automated exam generation system for Pre-Tests and Post-Tests based on completed study materials. Materials are classified as "Midterm" or "Finals". Administrators mark material sets as "completed", triggering AI (GPT-5) to generate Pre-Tests (15 questions for baseline assessment) and Post-Tests (20 questions for comprehensive assessment) with detailed explanations. Exams are attributed to a dedicated "AI System" user. An "Undo Completion" feature allows archiving associated exams and reverting material set status. Students have an "Available Exams" dashboard filtered by program, year level, and study plan. Administrators access a Reports page with comprehensive exam analytics, including filtering by program, year level, exam type, material type, and subject, with color-coded score displays. Automated email notifications are sent to eligible students when new Pre-Tests and Post-Tests become available, ensuring program and year-level relevance. A dedicated student "Exams" page provides summary statistics, subject-grouped exam cards, and direct links for taking/retaking exams.

### Pre-Test Gating System
Post-Test exams are protected by an intelligent gating mechanism that requires students to complete the corresponding Pre-Test before accessing the Post-Test. The system matches exams by subject and material type (Midterm/Finals), and Post-Test buttons are disabled with explanatory messaging ("Take Pre-Test First" and "Complete the Pre-Test to unlock this exam") until the student has attempted the associated Pre-Test. This ensures proper learning progression and baseline assessment completion before comprehensive evaluation.

## External Dependencies

### Third-Party Services
-   **Replit Platform**: Authentication (Replit Auth via OIDC), environment variables.
-   **Neon PostgreSQL**: Serverless PostgreSQL database.
-   **OpenAI API**: GPT-5 model for AI features.
-   **Resend**: Email delivery service for reminders and notifications.

### UI Component Library
-   **shadcn/ui**: Accessible and customizable components built on Radix UI, including Recharts for data visualization.

### Key NPM Packages
-   **Frontend**: `@tanstack/react-query`, `react-hook-form`, `zod`, `date-fns`, `recharts`.
-   **Backend**: `drizzle-orm`, `passport`, `openid-client`, `express-session`, `p-limit`, `p-retry`, `memoizee`.
-   **Development**: `typescript`, `tsx`, `esbuild`, `vite`, `tailwindcss`.