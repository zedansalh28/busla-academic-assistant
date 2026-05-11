# Busla — Intelligent Academic Brain

> A full-stack AI academic assistant that **learns how you learn** using three interconnected intelligence engines: Adaptive Engine, Prediction Engine, and Memory Engine.

Built as a final-year Computer Science project at SCE (Shamoon College of Engineering).

---

## What Makes This Project Advanced

| Feature | Basic Chatbot | Busla |
|---|---|---|
| AI responses | Static LLM call | Context-enriched with adaptive + memory signals |
| Personalization | Profile fields | Live behavior pattern analysis |
| Exam risk | None | Multi-factor prediction (behavior + memory + patterns) |
| Study planning | Manual | AI-optimized with weak-subject detection |
| Learning memory | None | Ebbinghaus forgetting curve per concept |
| Data flow | Isolated | Three engines share data bidirectionally |

---

## Three Intelligence Systems

### 1. Adaptive Engine (`services/adaptiveEngine.js`)
Analyzes raw behavior events (page views, chat messages, plan updates) to extract real-time learning patterns. Detects weak subjects, peak performance hours, and engagement depth. Feeds signals to the chat system prompt and the study optimizer.

### 2. Prediction Engine (`services/predictionEngine.js`)
Computes an **exam failure risk score** (0–100) from six factor categories:
- Activity gaps and engagement frequency
- Study plan progress and deadline proximity
- Behavior diversity (passive vs. active actions)
- **Memory mastery**: average concept mastery below 35% adds 20 risk points
- **Forgetting alerts**: 3+ forgotten concepts adds 15 risk points
- **Knowledge gaps**: adds 5 risk points per gap cluster

Generates personalized interventions and ranks them by urgency.

### 3. Memory Engine (`services/memoryEngine.js`)
Tracks concept-level understanding using the **Ebbinghaus forgetting curve**:

```
retention = mastery × e^(−days_since_interaction / 21)
```

Extracts 27 SCE engineering concepts from chat messages. Detects confusion/understanding signals and adjusts mastery scores accordingly. Flags concepts for revision when retention drops below 65% of original mastery after 10+ days.

---

## Intelligence Data Flow

```
User Chat Message
      │
      ▼
 chatService.js
      │── builds system prompt ──► adaptiveEngine context
      │                        ──► predictionEngine context
      │                        ──► memoryEngine context (concept mastery snapshot)
      │
      ▼
  Cohere LLM
      │
      ▼
 AI Response sent to user
      │
      └── (background, fire-and-forget)
            memoryEngine.updateConceptFromChat()
                  │── extract concepts from message
                  │── detect signals (confusion, understanding, example_request)
                  │── update mastery scores in DB
                  └── recompute student learning profile

Nightly / on-demand:
  predictionEngine ◄── memoryEngine (avg_mastery, forgetting_alerts, knowledge_gaps)
  optimizer        ◄── memoryEngine (low_mastery subjects → weak_subjects)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14, React 18 |
| Styling | Tailwind CSS 3.4 |
| Language | TypeScript 5.3 |
| Backend framework | Express.js 4.18 |
| Database | SQLite via better-sqlite3 |
| LLM | Cohere API (command-r) |
| Icons | Lucide React |
| HTTP client | Axios |
| Date utilities | date-fns |
| ID generation | uuid v4 |

---

## Project Structure

```
final-project/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── database.js          # 38-table SQLite schema + all queries
│   │   ├── services/
│   │   │   ├── adaptiveEngine.js    # Behavior pattern analysis
│   │   │   ├── predictionEngine.js  # Exam risk scoring + interventions
│   │   │   ├── memoryEngine.js      # Ebbinghaus forgetting + concept mastery
│   │   │   ├── patternEngine.js     # Study pattern extraction
│   │   │   ├── interventionEngine.js# Personalized recommendation generation
│   │   │   ├── chatService.js       # LLM orchestration + context injection
│   │   │   ├── knowledgeBase.js     # SCE course knowledge retrieval
│   │   │   └── behaviorTracker.js   # Event recording
│   │   ├── routes/
│   │   │   ├── chat.js              # POST /chat, GET /history
│   │   │   ├── optimizer.js         # Study schedule AI optimization
│   │   │   ├── predictions.js       # Risk scores + interventions
│   │   │   ├── memory.js            # Learning brain API
│   │   │   ├── analytics.js         # Behavioral analytics
│   │   │   ├── risk.js              # Academic load check
│   │   │   ├── demo.js              # Demo user loader + intelligence seeder
│   │   │   └── ...                  # profiles, plans, sessions, courses
│   │   └── utils/
│   │       └── errorHandler.js
│   ├── scripts/
│   │   └── seed-demo.js             # Standalone demo intelligence seeder
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx            # Hero landing page
│   │   │   ├── dashboard.tsx        # Main dashboard
│   │   │   ├── chat.tsx             # AI chat interface
│   │   │   ├── courses.tsx          # Course management
│   │   │   ├── planner.tsx          # Study planner
│   │   │   ├── optimizer.tsx        # AI schedule optimizer
│   │   │   ├── risk.tsx             # Academic load check
│   │   │   ├── analytics.tsx        # Behavioral analytics
│   │   │   ├── predictions.tsx      # Exam risk predictions
│   │   │   ├── learning-brain.tsx   # Memory & concept mastery
│   │   │   └── profile.tsx          # User profile
│   │   ├── components/
│   │   │   ├── Common/              # Sidebar, Layout, shared UI
│   │   │   ├── LearningBrain/       # 6 memory visualization components
│   │   │   │   ├── ConceptMasteryGrid.tsx
│   │   │   │   ├── ForgettingAlerts.tsx
│   │   │   │   ├── ExplanationProfile.tsx
│   │   │   │   ├── KnowledgeGapMap.tsx
│   │   │   │   ├── RevisionPanel.tsx
│   │   │   │   └── LearningEvolution.tsx
│   │   │   ├── Chat/
│   │   │   ├── Dashboard/
│   │   │   └── Planner/
│   │   ├── services/                # API client functions
│   │   ├── hooks/                   # Custom React hooks
│   │   └── types/index.ts           # All TypeScript interfaces
│   └── .env.local.example
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- A Cohere API key (free tier works)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your COHERE_API_KEY
npm run dev
# Runs on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# Runs on http://localhost:3000
```

### Load Demo Data

Navigate to the landing page and click **"Load Demo Student"** to populate all three intelligence engines with realistic academic data (16 concepts, 40+ behavior events, study plans, knowledge gaps, predictions).

---

## Environment Variables

### Backend `.env`

```
COHERE_API_KEY=your_cohere_api_key_here
DATABASE_PATH=./data/busla.db
PORT=3001
NODE_ENV=development
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## API Routes

### Authentication & Sessions
| Method | Route | Description |
|---|---|---|
| POST | `/api/sessions/create` | Create anonymous session |
| GET | `/api/sessions/:id` | Get session info |

### Chat
| Method | Route | Description |
|---|---|---|
| POST | `/api/chat` | Send message (context-enriched LLM call) |
| GET | `/api/chat/history/:sessionId` | Get message history |
| DELETE | `/api/chat/history/:sessionId` | Clear history |

### Intelligence
| Method | Route | Description |
|---|---|---|
| GET | `/api/predictions/:userId` | Exam risk score + interventions |
| GET | `/api/optimizer/:userId` | AI-optimized study schedule |
| GET | `/api/analytics/:userId` | Behavior analytics dashboard |
| GET | `/api/risk/:userId` | Academic load assessment |

### Learning Brain (Memory Engine)
| Method | Route | Description |
|---|---|---|
| GET | `/api/memory/dashboard/:userId` | Full memory dashboard |
| GET | `/api/memory/profile/:userId` | Student learning profile |
| GET | `/api/memory/concepts/:userId` | All concepts with retention scores |
| GET | `/api/memory/gaps/:userId` | Knowledge gap map |
| GET | `/api/memory/revision/:userId` | Ranked revision queue |
| POST | `/api/memory/compute/:userId` | Recompute learning profile |

### Study Management
| Method | Route | Description |
|---|---|---|
| POST | `/api/plans` | Create study plan |
| GET | `/api/plans/user/:userId` | Get all user plans |
| PUT | `/api/plans/:planId` | Update plan |
| POST | `/api/plans/:planId/tasks` | Add task |
| GET | `/api/courses/:userId` | Get enrolled courses |

### Demo
| Method | Route | Description |
|---|---|---|
| GET | `/api/demo/users` | List demo profiles |
| GET | `/api/demo/load/:index` | Load demo user + seed intelligence |
| POST | `/api/demo/seed/:userId` | Manually seed intelligence for user |

---

## Database Overview

38 tables organized into 6 groups:

| Group | Tables | Purpose |
|---|---|---|
| Core | users, user_profiles, sessions | Identity and preferences |
| Chat | conversations, messages | Message history with context |
| Planning | study_plans, study_tasks | Academic planning |
| Intelligence | behavior_events, behavior_patterns, adaptive_profiles | Behavior analysis |
| Predictions | risk_assessments, interventions, academic_predictions | Risk scoring |
| Memory | concept_memories, student_learning_profiles, knowledge_gaps, explanation_effectiveness, memory_snapshots | Learning brain |

---

## Key Algorithms

### Ebbinghaus Forgetting Curve
```js
// retention_score = current effective mastery
retention = mastery * Math.exp(-daysSince / 21)

// flagged for urgent revision when:
retention < mastery * 0.65 AND daysSince > 10
```

### Exam Failure Risk Score
```
base = 30
+ activity_gap_penalty    (0–20 pts)
+ low_frequency_penalty   (0–15 pts)
+ plan_progress_penalty   (0–20 pts)
+ diversity_penalty       (0–10 pts)
+ memory_mastery_penalty  (0–20 pts)
+ forgetting_penalty      (0–15 pts)
+ knowledge_gap_penalty   (0–10 pts)
= clamped to [0, 100]
```

### Concept Mastery Update
```
delta = base(+2)
      + confusion_signal(-5)
      + understanding_signal(+6)
      + example_request_signal(-2)
      + depth_question_signal(+3)
new_mastery = clamp(prev + delta, 0, 100)
```

---

## Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Hero with live AI preview cards |
| Dashboard | `/dashboard` | Overview: risk, plans, quick stats |
| Chat | `/chat` | Context-aware AI conversation |
| Courses | `/courses` | Course enrollment management |
| Planner | `/planner` | Study plan creation and tracking |
| Optimizer | `/optimizer` | AI-generated optimal study schedule |
| Load Check | `/risk` | Academic load risk assessment |
| Analytics | `/analytics` | Behavioral pattern visualization |
| Predictions | `/predictions` | Exam failure risk + interventions |
| Learning Brain | `/learning-brain` | Concept mastery, forgetting alerts, revision queue |
| Profile | `/profile` | User preferences and settings |

---

## Screenshots

> (Run the demo and navigate each page for live screenshots)

- **Landing Page** — AI intelligence system overview with live preview cards
- **Learning Brain** — Concept mastery grid with color-coded retention scores
- **Predictions** — Exam risk gauge with weighted factor breakdown
- **Optimizer** — Weekly study schedule with weak-subject prioritization
- **Analytics** — Behavior event timeline and engagement patterns

---

## Future Work

1. **Spaced Repetition Quiz Engine** — Auto-generate concept review quizzes based on forgetting curve data
2. **Collaborative Study Groups** — Aggregate anonymized memory profiles to detect shared knowledge gaps across a cohort
3. **LMS Integration** — Connect with Moodle/Canvas to pull real grade data into the prediction engine
4. **Voice Interface** — Speech-to-text chat input with audio concept explanations
5. **Mobile App** — React Native port with offline memory sync
6. **Instructor Dashboard** — Aggregate student risk scores with privacy-preserving cohort view
7. **Multi-language Support** — Hebrew + Arabic UI with same intelligence backend

---

## Academic Innovation

This project demonstrates several non-trivial academic concepts implemented in working code:

1. **Cognitive science applied to software** — Ebbinghaus forgetting curve drives real-time study recommendations
2. **Multi-signal fusion** — Three independent engines combine behavioral, temporal, and semantic signals
3. **Context-aware LLM prompting** — System prompt dynamically assembled from live database state per user per message
4. **Fire-and-forget background intelligence** — Memory updates are non-blocking; user never waits for ML computation
5. **Prerequisite graph traversal** — Knowledge gap detection uses a hand-coded dependency graph of 14 concept chains
6. **Privacy-first AI** — All intelligence runs locally; no user data leaves the server to external ML APIs
7. **Demo-driven architecture** — Full intelligence seeding in a single API call for reproducible demonstrations

---

## Development Notes

### Adding a New Intelligence Signal

1. Record a `behavior_event` via `behaviorTracker.track.*`
2. Add extraction logic to `patternEngine.extractPatterns()`
3. Consume the pattern in `adaptiveEngine.computeAdaptiveProfile()`
4. Inject into chat context via `chatService.buildSystemPrompt()`

### Running Intelligence Manually

```bash
# From backend/
node -e "
  const db = require('./src/db/database');
  const pred = require('./src/services/predictionEngine');
  const result = pred.computePredictions('your-user-id');
  console.log(JSON.stringify(result, null, 2));
"
```

---

## License

MIT License — built for academic demonstration purposes at SCE, 2025–2026.

---

Built with dedication by Marae Nasara — SCE Computer Science, Final Year Project
