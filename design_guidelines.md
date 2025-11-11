# Design Guidelines: Personalized Study Plan for CCIT Students

## Design Approach

**Selected Approach**: Design System with Productivity Tool Inspiration

Drawing from modern educational and productivity platforms (Notion, Linear, Khan Academy), this system prioritizes clarity, efficiency, and focus. The interface emphasizes information hierarchy, scannable content, and purposeful interactions that support learning workflows.

**Core Principles**:
- Information clarity over visual embellishment
- Consistent patterns that reduce cognitive load
- Data visualization that makes progress tangible
- Streamlined workflows for both students and admins

---

## Typography System

**Font Selection**: Google Fonts via CDN
- **Primary**: Inter (400, 500, 600, 700) - UI elements, body text, data
- **Display**: Lexend (600, 700) - Headlines, section titles

**Hierarchy**:
- Page Titles: text-4xl to text-5xl, font-bold, Lexend
- Section Headers: text-2xl to text-3xl, font-semibold, Lexend
- Card Titles: text-lg to text-xl, font-semibold, Inter
- Body Text: text-base, font-normal, Inter
- Labels/Metadata: text-sm, font-medium, Inter
- Captions: text-xs, font-normal, Inter

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing: gap-2, p-2 (chip groups, inline elements)
- Standard: gap-4, p-4, m-4 (cards, form fields)
- Comfortable: gap-6, p-6 (card interiors, sections)
- Generous: gap-8, p-8, py-12, py-16 (page sections, major divisions)

**Container Strategy**:
- Max width: max-w-7xl for main content areas
- Dashboard grids: max-w-screen-2xl for data-heavy views
- Forms/Reading: max-w-2xl for focused tasks
- Consistent horizontal padding: px-4 md:px-6 lg:px-8

---

## Component Library

### Navigation
**Top Navigation Bar**:
- Fixed header with logo, primary navigation links, user profile dropdown
- Height: h-16
- Include notification bell icon (for study reminders)
- Active state: Subtle underline indicator

**Sidebar (Admin Panel)**:
- Width: w-64
- Collapsible on mobile
- Navigation items with icons (from Heroicons)
- Current page highlight treatment

### Dashboard Components

**Study Plan Cards**:
- Bordered cards with subtle shadow (border rounded-lg shadow-sm)
- Header with subject name and edit icon
- Progress bar showing completion percentage
- List of upcoming study sessions with time badges
- Quick action buttons at bottom

**Performance Analytics**:
- Large stat cards in 3-column grid (lg:grid-cols-3)
- Each card displays: metric label, large number, trend indicator (up/down arrow)
- Bar chart or line graph for weekly/monthly progress
- Strengths/Weaknesses section using tag-style badges (green for strengths, amber for areas to improve)

**Quiz Cards** (Available Quizzes):
- 2-column grid on desktop (md:grid-cols-2)
- Each card: subject, difficulty badge, question count, estimated time
- Prominent "Start Quiz" button
- Lock icon for prerequisite quizzes

### Quiz Interface

**Quiz Taking View**:
- Full-width container with max-w-4xl
- Fixed header showing: progress bar, question counter (3/10), timer
- Question text: text-2xl, generous spacing
- Answer options: Large touch targets (min-h-14), radio button or checkbox style
- Navigation: Previous/Next buttons, Submit button (disabled until answered)

**Results Screen**:
- Hero-style score display with circular progress indicator
- Breakdown by topic/category in table format
- AI-generated feedback panel with insights
- Retry button and Review Answers option

### Materials Library

**Grid Layout**:
- 3-column grid (md:grid-cols-2 lg:grid-cols-3)
- Each material card shows: document icon, title, subject tag, file size, upload date
- Download button with icon
- Search bar and filter dropdowns above grid

### Forms & Inputs

**Study Plan Creation Form**:
- Multi-step wizard with progress indicator at top
- Step 1: Subject selection (checkbox grid)
- Step 2: Available time slots (calendar-style picker)
- Step 3: Learning goals (textarea with character count)
- Navigation: Back/Next buttons, Cancel link

**Standard Inputs**:
- Text fields: border-2, rounded-lg, p-3, focus:ring treatment
- Labels: Above input, text-sm, font-medium
- Helper text: Below input, text-xs
- Error states: Red border and error message

**Admin Material Upload**:
- Drag-and-drop zone with dashed border
- File type indicator
- Upload progress bar
- Form fields: Title, Subject dropdown, Description textarea

### Data Display

**Tables** (Admin Material Management):
- Striped rows for readability
- Sortable column headers
- Action column with icon buttons (Edit, Delete)
- Pagination at bottom

**Tags/Badges**:
- Rounded-full, px-3, py-1, text-xs, font-medium
- Subject tags, difficulty indicators, status labels

### Buttons & Actions

**Primary Actions**: Large, rounded-lg, px-6, py-3, font-semibold
**Secondary Actions**: Outlined style, same sizing
**Icon Buttons**: Square (w-10 h-10), rounded-lg, icon centered
**Text Links**: Underline on hover, appropriate font-weight

---

## Hero Section (Landing/Login Page)

**Hero Layout**:
- Two-column layout (lg:grid-cols-2)
- Left: Headline (text-5xl, font-bold), subheading, CTA buttons (Sign Up, Learn More), trust indicator ("Join 500+ CCIT students")
- Right: Large hero image showing students studying with laptops/tablets
- Background: Subtle gradient or geometric pattern
- Height: min-h-screen with centered content

**Images Section**:
- **Hero Image**: Students collaborating with study materials and devices, modern educational setting, bright and inviting - positioned right side of hero
- **Dashboard Screenshot**: Placeholder for actual interface preview in "How It Works" section
- **Feature Icons**: Use Heroicons for feature highlights (brain for AI quizzes, calendar for planning, chart for analytics)

---

## Page-Specific Layouts

### Student Dashboard
- Grid layout: Sidebar (upcoming sessions) + Main content area (3-column stat cards, recent quizzes, progress charts)
- Quick actions panel at top right

### Admin Panel
- Sidebar navigation + Content area
- Content uses full width for tables
- Floating action button for "Add Material"

### Subject Customization
- Modal overlay or dedicated page
- Two-column layout: Available subjects (left), Selected subjects (right)
- Drag-and-drop or click-to-add interaction

---

## Responsive Behavior

**Breakpoints**:
- Mobile (base): Single column, stacked layouts, collapsible navigation
- Tablet (md): 2-column grids, visible sidebar
- Desktop (lg): Full multi-column layouts, expanded data views

**Mobile Optimizations**:
- Bottom tab navigation for students (Dashboard, Quizzes, Materials, Profile)
- Swipeable quiz interface
- Accordion-style collapsible sections

---

## Icons

**Library**: Heroicons (via CDN)
**Usage**:
- Navigation: outline style, w-6 h-6
- Buttons: mini style, w-5 h-5
- Status indicators: solid style, w-4 h-4
- Feature sections: outline style, w-12 h-12

---

## Animations

**Minimal, Purposeful Motion**:
- Page transitions: Smooth fade-in
- Card hover: Subtle lift (translate-y-1, shadow increase)
- Button interactions: Built-in states, no custom animations
- Loading states: Spinner or skeleton screens for data fetching
- No scroll-triggered animations

---

This system creates a focused, efficient learning environment that scales from individual study sessions to comprehensive performance analytics while maintaining clarity and usability across all user touchpoints.