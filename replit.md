# CCIT Study Plan - Personalized Learning System

## Overview

CCIT Study Plan is an AI-powered educational platform designed for CCIT students. It provides personalized study planning, adaptive quiz generation, and intelligent performance analytics to enhance the learning experience. The system supports two primary user roles: Students, who create study plans, access materials, take quizzes, and track progress; and Administrators, who manage educational content. The project aims to provide an advanced, AI-driven learning platform with strong market potential in the education technology sector.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state management, shadcn/ui (built on Radix UI) for components, and Tailwind CSS for styling. It features a custom design system with Inter and Lexend fonts, a defined spacing system, and a HSL-based color palette supporting light/dark modes. State management leverages TanStack Query for server state, React Context for theme, and react-hook-form with Zod for form state. Routing is structured for public, authenticated, and admin-specific routes.

### Backend Architecture

The backend is built with Express.js and TypeScript, using Drizzle ORM for database interactions with Neon PostgreSQL. It integrates the OpenAI API for AI functionalities and Passport.js with OpenID Connect for Replit authentication. The API follows RESTful principles with authentication and role-based authorization middleware. Authentication uses session-based management with `express-session` and a PostgreSQL session store.

### Database Schema

The database uses Neon PostgreSQL and includes core tables such as `users`, `subjects`, `study_plans`, `study_plan_subjects`, `study_materials`, `quizzes`, `quiz_attempts`, and `sessions`. Key design decisions include PostgreSQL enums, UUID primary keys, timestamp fields, JSONB fields for flexible data, and foreign key relationships with cascading deletes.

**Soft Delete Implementation**: Quizzes use soft delete (archiving) to preserve student performance data. The `quizzes` table has an `isArchived` boolean field (default: false). When a quiz is "deleted", it's archived (`isArchived = true`) instead of being permanently removed. This preserves all quiz attempts and performance analytics while hiding the quiz from student-facing lists. Archived quizzes can still be accessed for reporting and analytics purposes.

### AI Integration

The system integrates with OpenAI's GPT-5 model for AI features. This includes dynamic quiz generation based on subject, difficulty, and question count, with structured JSON output and optional material context. AI also powers performance analysis by generating insights, identifying strengths/weaknesses, and providing personalized study recommendations. Rate limiting and retry logic are implemented for robust API interaction.

## External Dependencies

### Third-Party Services

-   **Replit Platform Integration**: Used for authentication (Replit Auth via OIDC), environment variables, and development tools.
-   **Neon PostgreSQL**: The primary serverless PostgreSQL database, utilizing `@neondatabase/serverless` for connection pooling.
-   **OpenAI API**: Provides the GPT-5 model for AI-driven quiz generation and performance analysis.

### UI Component Library

-   **shadcn/ui**: Utilizes Radix UI primitives for accessible and customizable components, including integration with Recharts for data visualization.

### Key NPM Packages

-   **Frontend**: `@tanstack/react-query`, `react-hook-form`, `zod`, `date-fns`, `recharts`.
-   **Backend**: `drizzle-orm`, `passport`, `openid-client`, `express-session`, `p-limit`, `p-retry`, `memoizee`.
-   **Development**: `typescript`, `tsx`, `esbuild`, `vite`, `tailwindcss`.