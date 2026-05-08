# Frontend Setup & Installation Guide

## Prerequisites

- Node.js 16+
- npm or yarn
- Backend running on `http://localhost:3001` (optional for development)

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Update with your backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will auto-reload on file changes.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── pages/              # Next.js pages (file-based routing)
│   ├── _app.tsx       # App wrapper
│   ├── _document.tsx  # HTML document
│   ├── index.tsx      # Home/onboarding
│   ├── dashboard.tsx  # Main dashboard
│   ├── chat.tsx       # Chat interface
│   ├── profile.tsx    # Profile edit
│   └── planner.tsx    # Study planner
├── components/        # React components
│   ├── Common/        # Shared components (Header, Sidebar, etc.)
│   ├── Chat/          # Chat UI components
│   ├── Forms/         # Profile and onboarding forms
│   ├── Dashboard/     # Dashboard specific components
│   └── Planner/       # Study planner components
├── services/          # API integration
│   ├── api.ts         # Axios configuration
│   ├── sessionService.ts
│   ├── profileService.ts
│   ├── chatService.ts
│   └── plannerService.ts
├── hooks/             # Custom React hooks
│   ├── useAuth.ts     # Authentication logic
│   ├── useChat.ts     # Chat management
│   └── usePlans.ts    # Study plans management
├── types/             # TypeScript interfaces
│   └── index.ts       # All type definitions
├── utils/             # Utility functions
│   ├── constants.ts   # App constants
│   └── storage.ts     # localStorage wrapper
└── styles/            # Global styles
    └── globals.css    # Tailwind + global CSS
```

## Key Features

### Pages

- **Home** (`/`) - Onboarding for new users
- **Dashboard** (`/dashboard`) - Profile summary & recommendations
- **Chat** (`/chat`) - AI assistant chat interface
- **Profile** (`/profile`) - Edit user profile
- **Planner** (`/planner`) - Study plan management

### Components

#### Common

- `Header` - Page header with title
- `Sidebar` - Navigation menu
- `DashboardLayout` - Main layout wrapper
- `Loading` - Loading spinner
- `ErrorAlert` - Error messages
- `Modal` - Reusable modal dialog

#### Chat

- `ChatWindow` - Message display area
- `ChatMessage` - Individual message component
- `ChatInput` - Message input with send button

#### Forms

- `OnboardingForm` - 3-step profile creation
- `ProfileForm` - Profile editing

#### Dashboard

- `ProfileSummary` - User info display
- `RecommendationsCard` - AI recommendations

#### Planner

- `PlanList` - Study plans grid
- `TaskList` - Tasks for a plan
- `AddTaskModal` - Add new task modal

### Custom Hooks

- **useAuth** - Manages user authentication and profile
  - `user` - Current user object
  - `sessionId` - Current session
  - `loading` - Loading state
  - `createProfile()` - Create new profile
  - `updateProfile()` - Update profile
  - `logout()` - Clear session

- **useChat** - Manages chat operations
  - `messages` - Chat history
  - `loading` - Message sending state
  - `sendMessage()` - Send a message
  - `loadHistory()` - Load chat history
  - `clearHistory()` - Clear conversation

- **usePlans** - Manages study plans
  - `plans` - Array of study plans
  - `createPlan()` - Create new plan
  - `updatePlan()` - Update plan
  - `deletePlan()` - Delete plan

- **useTasks** - Manages study tasks
  - `tasks` - Array of tasks
  - `addTask()` - Add new task
  - `updateTask()` - Update task
  - `deleteTask()` - Delete task

- **useRecommendations** - Manages recommendations
  - `recommendations` - Array of recommendations
  - `refresh()` - Reload recommendations

## API Services

All services use axios and handle error management:

### sessionService

```typescript
sessionService.createSession();
sessionService.getSession(id);
sessionService.getStoredSession();
sessionService.clearSession();
```

### profileService

```typescript
profileService.createProfile(data);
profileService.getProfile(userId);
profileService.updateProfile(userId, data);
profileService.deleteProfile(userId);
profileService.getStoredProfile();
```

### chatService

```typescript
chatService.sendMessage(sessionId, userId, message);
chatService.getHistory(sessionId);
chatService.clearHistory(sessionId);
```

### plannerService

```typescript
plannerService.createPlan(userId, data);
plannerService.getUserPlans(userId);
plannerService.getPlan(planId);
plannerService.updatePlan(planId, data);
plannerService.deletePlan(planId);
plannerService.addTask(planId, data);
plannerService.getPlanTasks(planId);
plannerService.updateTask(taskId, data);
plannerService.deleteTask(taskId);
```

### recommendationService

```typescript
recommendationService.getRecommendations(userId, limit);
recommendationService.getSavedRecommendations(userId, limit);
```

## Styling

### Tailwind CSS

The project uses Tailwind CSS 3.4 with custom configuration:

**Custom Colors:**

- Primary (Blue): `#3B82F6`
- Secondary (Dark): `#1E293B`
- Accent (Green): `#10B981`
- Danger (Red): `#EF4444`

**Custom Utilities:**

- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.card` - Card container style
- `.input` - Input field style

### Global CSS

Located in `src/styles/globals.css`:

- Google Fonts (Inter)
- Tailwind directives
- Custom scrollbar styling
- Global component styles

## TypeScript Types

All types are defined in `src/types/index.ts`:

```typescript
interface User {
  id: string;
  major: string;
  year: string;
  learning_style: string;
  subjects_of_interest: string[];
  difficulty_level: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  deadline: string;
  progress: number;
  milestones: string[];
  created_at: string;
  updated_at: string;
}

interface StudyTask {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  due_date: string;
  created_at: string;
  updated_at: string;
}

interface Recommendation {
  id: string;
  topic: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  recommendation_type: "resource" | "strategy" | "exercise";
}
```

## Constants

Available in `src/utils/constants.ts`:

- `STORAGE_KEYS` - localStorage key names
- `API_BASE_URL` - Backend API URL
- `MAJORS` - Available majors
- `YEARS` - Academic years
- `LEARNING_STYLES` - Learning style options
- `DIFFICULTY_LEVELS` - Difficulty options

## Storage

localStorage is used for:

- User ID (`user_id`)
- Session ID (`session_id`)
- User profile (`profile`)

Access via `storage` utility:

```typescript
storage.setItem(STORAGE_KEYS.USER_ID, value);
storage.getItem(STORAGE_KEYS.USER_ID);
storage.removeItem(STORAGE_KEYS.USER_ID);
storage.clear();
```

## Development Workflow

1. **Create Component**: Add new file in appropriate `components/` subdirectory
2. **Add Types**: Update types in `src/types/index.ts` if needed
3. **Create Service**: Add API service in `src/services/` if needed
4. **Create Hook**: Add custom hook in `src/hooks/` if needed
5. **Add Page**: Create page in `src/pages/` for routing
6. **Style**: Use Tailwind classes and custom utilities

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Clear Next.js Cache

```bash
rm -rf .next
npm run dev
```

### TypeScript Errors

Ensure all imports use proper path aliases:

```typescript
// ✅ Good
import { useAuth } from "@/hooks/useAuth";

// ❌ Bad
import { useAuth } from "../hooks/useAuth";
```

### API Connection Issues

Verify backend is running:

```bash
curl http://localhost:3001/api/health
```

Update `.env.local` if backend is on different URL.

## Testing

Currently no test suite configured. To add:

```bash
npm install --save-dev @testing-library/react jest
```

## Performance

- Images optimized via Next.js Image component
- Code splitting automatic via Next.js
- CSS minified via Tailwind
- JavaScript minified via SWC

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 12+, Android 5+)

---

For backend setup, see [backend README](../backend/README.md)
