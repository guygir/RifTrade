# Next Task Handoff Guide: Home Chores Management App

## 🎯 Project Requirements

You are building a **simple, accessible, phone-friendly home chores management app** for two users (no authentication needed - single user or shared access).

### Core Features

1. **Task Management Page**
   - Add/edit/remove tasks
   - Task details:
     - Task name/description
     - Occurrence pattern (daily, weekly, custom schedule)
     - Time of day (when the task should be done)
     - Importance/priority level
     - Other relevant metadata

2. **Today Page**
   - Shows all tasks that need to be completed today
   - Displays task details: time, importance, etc.
   - Checkbox for each task - when checked, shows as completed (green)
   - Visual indication of completion status

3. **Optional Integrations** (Nice to have)
   - Google Calendar integration for reminders
   - iPhone notifications/alerts
   - These are optional - prioritize core functionality first

### Design Principles

- **Simple**: Minimal UI, easy to understand
- **Accessible**: Works well for all users
- **Phone-friendly**: Mobile-first design, responsive
- **No Auth**: Single user or shared access (no login required)

---

## 📚 Lessons Learned from Rift Project

### What Worked Well

#### 1. **Next.js 14+ App Router with TypeScript**
- **Why**: Fast development, excellent TypeScript support, great for Cursor AI assistance
- **Structure**: 
  ```
  app/
    page.tsx          # Home/landing page
    tasks/            # Task management page
      page.tsx
    today/            # Today's tasks page
      page.tsx
  components/         # Reusable components
  lib/                # Utilities and helpers
  ```
- **Key Pattern**: Use `'use client'` directive for interactive components, keep server components when possible

#### 2. **Supabase for Backend** ⭐ **Highly Recommended**
- **Why**: No server maintenance, built-in database, easy to query
- **Experience**: Worked excellently in Rift project - reliable, fast, easy to use
- **Pattern**: Direct client-side queries with Row Level Security (RLS) for data protection
- **Client Setup**: Singleton pattern to avoid multiple instances
  ```typescript
  // lib/supabase/client.ts
  let supabaseClient: SupabaseClient | null = null;
  
  export function createSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    // ... create and cache
  }
  ```

#### 3. **Database Migrations**
- **Why**: Version control for schema changes, easy to apply to production
- **Structure**: `supabase/migrations/001_initial_schema.sql`, `002_add_feature.sql`, etc.
- **Best Practice**: Always use `IF NOT EXISTS` and `IF EXISTS` for idempotent migrations
  ```sql
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS importance TEXT DEFAULT 'medium';
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  ```

#### 4. **Error Handling Patterns**
- **AbortError Handling**: In development (React Strict Mode), requests can be aborted. Always handle gracefully:
  ```typescript
  try {
    // ... async operation
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('AbortError')) {
      console.log('Request aborted (normal in development)');
      return; // or setLoading(false)
    }
    // Handle real errors
  }
  ```
- **Loading States**: Always set `setLoading(false)` in `finally` blocks or before early returns

#### 5. **State Management**
- **Pattern**: Use `useState` for local state, `useEffect` for side effects
- **Memoization**: Use `useCallback` and `useMemo` to prevent unnecessary re-renders
  ```typescript
  const toggleTheme = useCallback(() => {
    // ... logic
  }, [dependencies]);
  
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme, toggleTheme]);
  ```

#### 6. **TypeScript Types**
- **Pattern**: Define types in `lib/supabase/types.ts` or co-located with components
- **Database Types**: Generate from Supabase or define manually
  ```typescript
  export interface Task {
    id: string;
    name: string;
    occurrence: 'daily' | 'weekly' | 'custom';
    time_of_day?: string;
    importance: 'low' | 'medium' | 'high';
    completed_at?: string;
  }
  ```

#### 7. **Build Before Commit**
- **CRITICAL**: Always run `npm run build` before committing
- **Why**: Catches TypeScript errors that don't show in dev mode
- **Command**: `npm run build` (or `npx tsc --noEmit` for type checking only)

### What Didn't Work / Common Pitfalls

#### 1. **Multi-Tab Supabase Conflicts**
- **Problem**: Multiple tabs open can cause Web Lock conflicts, leading to AbortErrors
- **Solution**: Handle AbortErrors gracefully, consider single-tab usage or implement proper multi-tab sync
- **Status**: Still an open issue - see CONTRIBUTING.md for details

#### 2. **React Strict Mode Double Renders**
- **Problem**: In development, React Strict Mode causes double renders, leading to AbortErrors
- **Solution**: Handle AbortErrors gracefully, don't panic - it's expected behavior in dev mode
- **Note**: This doesn't happen in production

#### 3. **Missing Error Handling**
- **Problem**: Early returns in catch blocks without setting loading states
- **Solution**: Always ensure `setLoading(false)` is called, use `finally` blocks when possible
  ```typescript
  try {
    setLoading(true);
    // ... operation
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      setLoading(false); // CRITICAL: Don't forget this!
      return;
    }
    // ... handle error
  } finally {
    setLoading(false); // Or here
  }
  ```

#### 4. **Hydration Mismatches**
- **Problem**: Server-rendered content differs from client-rendered content
- **Solution**: Use `suppressHydrationWarning` on elements that differ between server/client
  ```tsx
  <div suppressHydrationWarning>
    {typeof window !== 'undefined' ? clientContent : serverContent}
  </div>
  ```

#### 5. **Database Column Existence**
- **Problem**: Querying columns that don't exist yet (before migration runs)
- **Solution**: Handle PostgreSQL error code `42703` (column does not exist)
  ```typescript
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, name, tag');
  } catch (err: any) {
    if (err?.code === '42703') {
      // Column doesn't exist, retry without it
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name');
    }
  }
  ```

#### 6. **TypeScript Template String Types**
- **Problem**: Template strings inferred as literal types causing type errors
- **Solution**: Explicitly type variables as `string`
  ```typescript
  let titleText: string = title; // Not: let titleText = title;
  titleText = `${title} [Tagged: ${tag}]`; // Now works
  ```

#### 7. **Image Optimization**
- **Problem**: Large file sizes for exports (PDF/PNG)
- **Solution**: 
  - Resize images before adding to canvas/PDF (max 200-400px width)
  - Reduce JPEG quality (0.75)
  - Use appropriate DPI (150-186 for PNG, 72 for PDF)
  - Compress PDFs with 'FAST' compression

---

## 🏗️ Architecture Recommendations

### Project Structure

```
chores-app/
├── app/
│   ├── layout.tsx           # Root layout with navigation
│   ├── page.tsx             # Home/landing page
│   ├── tasks/
│   │   └── page.tsx         # Task management page
│   └── today/
│       └── page.tsx         # Today's tasks page
├── components/
│   ├── Navigation.tsx      # Global navigation
│   ├── TaskForm.tsx         # Add/edit task form
│   ├── TaskList.tsx         # Display list of tasks
│   └── TaskCard.tsx         # Individual task card
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Supabase client (singleton)
│   │   └── types.ts         # TypeScript types
│   ├── task-utils.ts        # Task calculation utilities
│   └── date-utils.ts        # Date/time helpers
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_add_features.sql
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

### Database Schema (Conceptual)

```sql
-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  occurrence TEXT NOT NULL, -- 'daily', 'weekly', 'custom'
  occurrence_config JSONB, -- For custom schedules
  time_of_day TIME, -- When task should be done
  importance TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task completions (track when tasks were completed)
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_date DATE NOT NULL -- For daily tracking
);

-- Indexes for performance
CREATE INDEX idx_tasks_occurrence ON tasks(occurrence);
CREATE INDEX idx_task_completions_date ON task_completions(completed_date);
CREATE INDEX idx_task_completions_task_date ON task_completions(task_id, completed_date);
```

### Key Design Decisions

1. **No Authentication**: Single user or shared access. Consider using localStorage or a simple "admin mode" toggle if needed.

2. **Task Occurrence**: 
   - Store occurrence pattern as text/enum
   - Use JSONB for custom schedules (e.g., "every Monday and Wednesday")
   - Calculate "today's tasks" on the fly based on occurrence pattern

3. **Completion Tracking**:
   - Separate `task_completions` table to track history
   - Check if task is completed today by querying `task_completions` for today's date
   - Allows for historical tracking and statistics

4. **Today Page Logic**:
   ```typescript
   // lib/task-utils.ts
   export function getTodaysTasks(tasks: Task[]): Task[] {
     const today = new Date();
     return tasks.filter(task => {
       if (task.occurrence === 'daily') return true;
       if (task.occurrence === 'weekly') {
         // Check if today matches the weekly pattern
         return matchesWeeklyPattern(task, today);
       }
       // Handle custom patterns
       return matchesCustomPattern(task, today);
     });
   }
   ```

---

## 🛠️ Technology Stack Recommendations

### Core Stack (Same as Rift - **Highly Recommended**)

**✅ Use Vercel and Supabase - they worked excellently in the Rift project!**

- **Next.js 14+** (App Router) - Fast, great TypeScript support
- **TypeScript** - Type safety, better AI assistance
- **Tailwind CSS** - Rapid styling, mobile-friendly
- **Supabase** - Backend/database (PostgreSQL) - **Strongly recommended, worked perfectly in Rift**
- **Vercel** - Hosting (free tier sufficient) - **Strongly recommended, seamless deployment from Rift project**

**Why Vercel + Supabase?**
- Zero server maintenance
- Free tier is sufficient for personal/small apps
- Excellent developer experience
- Automatic HTTPS and deployments
- Easy environment variable management
- Proven to work well together (as demonstrated in Rift project)

### Additional Libraries (If Needed)

- **date-fns** or **dayjs** - Date manipulation for task scheduling
- **react-hook-form** - Form handling (optional, but helpful)
- **zod** - Schema validation (optional, but recommended)

### Avoid

- Complex state management libraries (Redux, Zustand) - not needed for simple app
- Heavy UI libraries - Tailwind is sufficient
- Over-engineering - keep it simple!

---

## ✅ Development Checklist

### Before Starting

- [ ] Set up Next.js project with TypeScript and Tailwind
- [ ] Set up Supabase project
- [ ] Create initial database schema migration
- [ ] Configure environment variables (`.env.local`)
- [ ] Set up Git repository

### During Development

- [ ] Use `'use client'` for interactive components
- [ ] Handle AbortErrors gracefully in all async operations
- [ ] Always set loading states correctly
- [ ] Test on mobile devices early and often
- [ ] Run `npm run build` frequently to catch TypeScript errors
- [ ] Use meaningful variable names and comments

### Before Committing

- [ ] Run `npm run build` - **MANDATORY**
- [ ] Test all functionality manually
- [ ] Check mobile responsiveness
- [ ] Verify error handling works
- [ ] Remove console.logs and debug code

---

## 🎨 UI/UX Guidelines

### Mobile-First Design

- Use Tailwind's responsive classes: `sm:`, `md:`, `lg:`
- Test on actual mobile devices, not just browser dev tools
- Large touch targets (min 44x44px)
- Readable font sizes (min 16px for body text)

### Accessibility

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Proper heading hierarchy (`h1`, `h2`, `h3`)
- ARIA labels where needed
- Keyboard navigation support
- Sufficient color contrast

### Visual Feedback

- Loading states for async operations
- Success/error messages
- Visual indication of completed tasks (green checkmark, strikethrough)
- Smooth transitions where appropriate

---

## 🔧 Common Patterns & Code Snippets

### Loading Pattern

```typescript
const [loading, setLoading] = useState(true);
const [tasks, setTasks] = useState<Task[]>([]);

useEffect(() => {
  loadTasks();
}, []);

const loadTasks = async () => {
  try {
    setLoading(true);
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTasks(data || []);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      setLoading(false);
      return;
    }
    console.error('Error loading tasks:', err);
  } finally {
    setLoading(false);
  }
};
```

### Optimistic Updates

```typescript
const toggleTaskCompletion = async (taskId: string) => {
  // Optimistically update UI
  setTasks(prev => prev.map(task => 
    task.id === taskId 
      ? { ...task, completed: !task.completed }
      : task
  ));
  
  // Then sync with database
  try {
    const supabase = createSupabaseClient();
    if (isCompleted) {
      await supabase.from('task_completions').insert({
        task_id: taskId,
        completed_date: new Date().toISOString().split('T')[0]
      });
    } else {
      await supabase.from('task_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('completed_date', new Date().toISOString().split('T')[0]);
    }
  } catch (err) {
    // Revert on error
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
    alert('Failed to update task');
  }
};
```

### Date/Time Handling

```typescript
// lib/date-utils.ts
import { format, isToday, parseISO } from 'date-fns';

export function formatTime(timeString: string): string {
  // Convert "14:30" to "2:30 PM"
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function isTaskDueToday(task: Task): boolean {
  // Check if task should appear today based on occurrence
  // ... implementation
}
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended - Worked Great in Rift Project)

**Vercel deployment was seamless in the Rift project - use the same approach here.**

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy! Vercel handles everything automatically

**Benefits from Rift experience:**
- Automatic deployments on push to main branch
- Preview deployments for pull requests
- Easy rollback if needed
- Built-in analytics (optional)

### Database Migrations

- Run migrations in Supabase SQL editor
- Or use Supabase CLI if preferred
- Always test migrations locally first

---

## 📝 Notes on Rift Project Structure

The Rift project structure worked well for a multi-user, authenticated app with complex features (card matching, PDF exports, etc.). For a simple chores app:

- **You may not need**: Complex match calculation logic, PDF export, image processing
- **You may need**: Simpler date/time handling, recurring task logic, completion tracking
- **Consider**: Whether you need the same level of error handling (probably less complex)
- **Consider**: Whether Supabase is overkill (could use simpler solutions like localStorage + sync, but Supabase is still recommended for persistence)

The core patterns (Next.js, TypeScript, Tailwind, component structure) are still applicable and recommended.

---

## 🎯 Priority Order

1. **Core Functionality First**
   - Task CRUD operations
   - Today page with task list
   - Completion tracking

2. **Polish**
   - Mobile optimization
   - Visual feedback
   - Error handling

3. **Nice-to-Have**
   - Google Calendar integration
   - iPhone notifications
   - Statistics/history views

---

## 📞 Questions?

If you encounter issues or need clarification:

1. Check this guide first
2. Review the Rift project code for similar patterns
3. Test in development mode first
4. Run `npm run build` before committing

Good luck building the chores app! 🧹✨
