# CCIT Study Plan - Personalized Learning System

## Overview

CCIT Study Plan is an AI-powered educational platform designed specifically for CCIT (Computer and Communications Information Technology) students. The application provides personalized study planning, adaptive quiz generation, and intelligent performance analytics to enhance the learning experience.

The system serves two primary user roles:
- **Students**: Create personalized study plans, access study materials, take AI-generated quizzes, and track their learning progress
- **Administrators**: Manage study materials, subjects, and oversee the educational content ecosystem

Key features include:
- AI-generated quizzes with adaptive difficulty using OpenAI GPT-5
- Personalized study plan creation based on subject selection and learning goals
- Performance analytics with AI-powered insights
- Study materials library with subject-based organization
- Role-based access control (student/admin)

## Recent Changes

**November 11, 2025 - Google Calendar-Style Weekly Schedule Interface**

Replaced simple day checkboxes with an interactive weekly calendar for study plan creation:

**✅ New Features:**
- **Google Calendar-Style Grid**: Visual weekly calendar showing time slots from 6 AM to 11 PM for each day
- **Click-to-Select Interface**: Click any time block to select/deselect availability hours
- **Real-Time Hours Counter**: Shows total hours selected with automatic calculation
- **Non-Contiguous Time Preservation**: Properly preserves gaps (e.g., 9-10 AM and 3-4 PM saved as separate blocks, not collapsed)
- **Visual Feedback**: Selected blocks highlight with checkmark and primary color
- **Clear All Button**: Quick reset of all selections
- **Responsive Design**: Mobile-friendly with abbreviated day names

**Technical Implementation:**
- Time slots stored as key-value pairs: `{ "monday-09:00": true, "tuesday-14:00": true }`
- Contiguous block grouping algorithm preserves gaps between non-adjacent hours
- EndTime calculated as one hour after last selected block
- Step 3 summary synchronized with calendar selections (days/hours derived from selectedTimeSlots state)
- React key warnings resolved using `contents` className for grid fragments

**Previous Update - November 11, 2025 - Admin User Management Enhancement**

Added comprehensive user editing and deletion capabilities:

**✅ New Features:**
- **Edit User Details**: Admins can update user firstName, lastName, and email via dialog
- **Delete Users**: Admins can delete users with confirmation dialog (cannot delete self)
- **Input Validation**: Server-side validation for email format and non-empty names
- **Improved Table Layout**: Fixed column widths for better alignment (Name: 200px, Email: 250px, Role: 120px, Joined: 150px)
- **Enhanced Storage Interface**: Added `updateUser` and `deleteUser` methods to IStorage

**Previous Update - November 11, 2025 - Bug Fixes & Stabilization**

Fixed critical bugs preventing study plan creation:

**✅ Fixes:**
- **Study Plan Creation**: Fixed validation errors by separating subjects array from plan data
- **Database Schema Sync**: Removed obsolete `subject_id` column from `study_plans` table
- **Infinite Loop Error**: Replaced Radix UI Checkbox with custom checkbox implementation to prevent React state update loops
- **API Data Flow**: Fixed frontend-backend data mismatch for availableDays and availableTimeSlots fields

**Previous Update - November 11, 2025 - File Upload & Admin Management Features**

Added comprehensive admin management tools and file upload capabilities:

**✅ New Features:**
- **File Upload System**: Admins can now upload actual files (PDF, DOC, PPT) up to 50MB using Replit Object Storage
- **Dual Upload Options**: Tab-based interface supporting both file uploads and URL links
- **Admin Subject Management**: Create, edit, and delete subjects (both default CCIT and custom)
- **Admin User Management**: View all users, change roles (student/admin), search functionality
- **Object Storage Integration**: Secure file storage with access control and presigned URLs

**Previous MVP Implementation - November 11, 2025**

All core features implemented:
- Frontend: All pages and components with proper loading/error/empty states
- Backend: Full API implementation with password-based auth, PostgreSQL, and OpenAI GPT-5
- Authentication: Password-based login with bcrypt hashing and session management
- Study Plans: Creation, editing, subject selection with priorities
- AI Quizzes: Generation → Taking (with timer) → Results (with explanations)
- Performance Dashboard: Statistics, charts (recharts), AI-generated insights
- Study Materials: Admin upload/edit/delete, student library view
- Database: Complete schema with proper relationships and indexes

**Technical Implementation:**
- Object storage uses Google Cloud Storage via Replit's sidecar endpoint
- File uploads use presigned URLs for direct client-to-storage transfers
- ACL policies manage file access permissions
- Uppy library provides drag-and-drop upload UI with progress tracking

**Technical Highlights:**
- Quiz timer uses `timerInitialized` ref to prevent premature submission before data loads
- Authentication queries use `on401: "returnNull"` to gracefully handle unauthenticated states
- All mutations properly invalidate TanStack Query cache
- Denormalized quiz questions stored as JSONB array for performance
- AI insights generated on-demand to minimize API costs

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**:
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design system

**Design System**:
- Typography: Inter (UI/body text) and Lexend (headings) via Google Fonts
- Custom spacing system based on Tailwind units (2, 4, 6, 8, 12, 16)
- Custom color palette with HSL-based theming supporting light/dark modes
- Consistent component styling through shadcn/ui's "new-york" preset
- Responsive layout patterns with mobile-first approach

**State Management Strategy**:
- Server state managed by TanStack Query with cache invalidation patterns
- Authentication state derived from `/api/auth/user` endpoint
- Theme state managed via React Context with localStorage persistence
- Form state handled by react-hook-form with zod validation

**Routing Structure**:
- Public route: Landing page (`/`)
- Authenticated routes: Dashboard, study plans, quizzes, materials, performance analytics
- Admin-specific routes: Materials management (`/admin/materials`)
- Authentication redirect logic based on user session state

### Backend Architecture

**Technology Stack**:
- Express.js server with TypeScript
- Drizzle ORM for type-safe database operations
- Neon PostgreSQL (serverless) as the primary database
- OpenAI API integration for AI features (GPT-5 model)
- Passport.js with OpenID Connect for Replit authentication

**API Design Pattern**:
- RESTful endpoints under `/api` namespace
- Authentication middleware (`isAuthenticated`) protecting routes
- Role-based authorization (student vs admin) at endpoint level
- JSON request/response format with error handling middleware
- Request logging with response truncation for debugging

**Authentication Flow**:
- OpenID Connect (OIDC) integration with Replit as identity provider
- Session-based authentication using express-session
- PostgreSQL session store (`connect-pg-simple`) for persistence
- JWT token refresh mechanism for long-lived sessions
- Session TTL: 7 days with httpOnly secure cookies

**Data Access Layer**:
- Centralized storage interface (`IStorage`) abstracting database operations
- Drizzle schema definitions with TypeScript inference
- Transaction support for complex operations
- Query result caching via TanStack Query on frontend

### Database Schema

**Core Tables**:
- `users`: User profiles with role-based access (student/admin), integrated with Replit Auth
- `subjects`: Both default CCIT subjects and custom user-created subjects
- `study_plans`: Personalized study plans linked to users
- `study_plan_subjects`: Many-to-many relationship between plans and subjects with priority/hours
- `study_materials`: Educational resources (PDFs, documents, links) organized by subject
- `quizzes`: AI-generated quizzes with metadata (difficulty, subject, questions)
- `quiz_attempts`: Student quiz submissions with scores and timestamps
- `sessions`: Express session storage for authentication persistence

**Schema Design Decisions**:
- PostgreSQL enums for controlled vocabularies (user roles, difficulty levels, days of week)
- UUID primary keys using `gen_random_uuid()` for distributed system compatibility
- Timestamp fields (`createdAt`, `updatedAt`) for audit trails
- JSONB fields for flexible data storage (quiz questions, session data)
- Foreign key relationships with cascading deletes where appropriate
- Indexed session expiry for efficient cleanup

### AI Integration

**OpenAI Integration**:
- Model: GPT-5 (latest available as of August 2025)
- Base URL configured via environment variable for AI integrations endpoint
- Structured JSON output using response_format for quiz generation
- Rate limiting protection with exponential backoff retry logic using `p-retry`
- Concurrency control via `p-limit` for batch operations

**Quiz Generation**:
- Dynamic prompt engineering based on subject, difficulty, and question count
- Optional material context injection for curriculum alignment
- Structured quiz format: title, questions array with options, correct answers, explanations
- Token limit: 8192 max completion tokens for comprehensive quizzes

**Performance Analysis**:
- AI-powered insight generation from quiz attempt data
- Strengths/weaknesses identification based on performance patterns
- Personalized study recommendations using GPT-5's reasoning capabilities

## External Dependencies

### Third-Party Services

**Replit Platform Integration**:
- Replit Auth (OIDC): Primary authentication provider
- Environment: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`
- Development tools: Cartographer, dev banner, runtime error overlay (Replit-specific Vite plugins)

**Neon PostgreSQL**:
- Serverless PostgreSQL database with WebSocket support
- Connection pooling via `@neondatabase/serverless`
- Environment: `DATABASE_URL`
- Migration strategy: Drizzle Kit push-based schema updates

**OpenAI API**:
- GPT-5 model for quiz generation and performance analysis
- Environment: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- Rate limit handling with automatic retry logic
- Error classification for quota/rate limit detection

### UI Component Library

**shadcn/ui**:
- Radix UI primitives for accessible components
- Extensive component set: dialogs, dropdowns, forms, cards, tables, charts
- Recharts integration for data visualization
- Custom theming via CSS variables and Tailwind classes

### Key NPM Packages

**Frontend**:
- `@tanstack/react-query`: Server state management with caching
- `react-hook-form` + `@hookform/resolvers`: Form handling with validation
- `zod` + `drizzle-zod`: Schema validation and type inference
- `date-fns`: Date manipulation utilities
- `recharts`: Chart rendering for analytics dashboards

**Backend**:
- `drizzle-orm`: Type-safe ORM with PostgreSQL support
- `passport` + `openid-client`: Authentication middleware
- `express-session` + `connect-pg-simple`: Session management
- `p-limit` + `p-retry`: Concurrency and retry control
- `memoizee`: Function result caching

**Development**:
- `typescript`: Type checking across full stack
- `tsx`: TypeScript execution for development server
- `esbuild`: Production build bundler for server code
- `vite`: Frontend build tool and dev server
- `tailwindcss` + `postcss` + `autoprefixer`: Styling pipeline