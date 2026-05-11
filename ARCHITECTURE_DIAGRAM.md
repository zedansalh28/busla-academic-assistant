# Busla — Architecture Diagram Reference

Use this as a guide for draw.io, Excalidraw, or Canva.

---

## System Overview (Top-Level)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BUSLA SYSTEM                                │
│                                                                     │
│   ┌─────────────┐     HTTP/REST      ┌──────────────────────────┐  │
│   │   Browser   │ ◄────────────────► │   Express.js Backend     │  │
│   │  Next.js 14 │                    │   Node.js / Port 3001    │  │
│   │  Port 3000  │                    └──────────────────────────┘  │
│   └─────────────┘                              │                    │
│                                                ▼                    │
│                                    ┌──────────────────────────┐    │
│                                    │   SQLite Database        │    │
│                                    │   38 Tables              │    │
│                                    └──────────────────────────┘    │
│                                                │                    │
│                                                ▼                    │
│                                    ┌──────────────────────────┐    │
│                                    │   Cohere API (external)  │    │
│                                    │   command-r LLM          │    │
│                                    └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Layer — Pages & Components

```
Frontend (Next.js 14 + TypeScript)
├── Pages (11 routes)
│   ├── /              → Landing Hero (AI system showcase)
│   ├── /dashboard     → Overview: risk score, schedule, predictions
│   ├── /chat          → AI conversation interface
│   ├── /courses       → Course enrollment
│   ├── /planner       → Study plan management
│   ├── /optimizer     → AI schedule generation
│   ├── /risk          → Academic load check
│   ├── /analytics     → Behavioral intelligence dashboard
│   ├── /predictions   → Exam risk + interventions
│   ├── /learning-brain → Concept mastery + forgetting alerts
│   └── /profile       → User preferences
│
├── Components (organized by feature)
│   ├── Common/    → Sidebar, Layout, Loading
│   ├── LearningBrain/  → 6 memory visualization components
│   ├── Analytics/ → 6 chart/gauge components
│   ├── Predictions/ → 5 risk visualization components
│   ├── Chat/      → Message, Input, History
│   └── Dashboard/ → ProfileSummary, RecommendationsCard
│
├── Hooks (custom state management)
│   ├── useAuth.ts       → User session
│   ├── useMemory.ts     → Learning brain data
│   ├── usePredictions.ts → Exam risk data
│   ├── useAnalytics.ts  → Behavior patterns
│   └── usePlans.ts      → Study plan CRUD
│
└── Services (API clients)
    ├── memoryService.ts
    ├── predictionsService.ts
    ├── analyticsService.ts
    ├── optimizerService.ts
    └── ...
```

---

## Backend Layer — Services & Routes

```
Backend (Express.js 4.18)
│
├── Routes (13 modules)
│   ├── /api/chat        → chatService → Cohere LLM
│   ├── /api/memory      → memoryEngine
│   ├── /api/predictions → predictionEngine
│   ├── /api/optimizer   → optimizerService
│   ├── /api/analytics   → adaptiveEngine + patternEngine
│   ├── /api/risk        → riskService
│   └── /api/demo        → demo loader + intelligence seeder
│
├── Intelligence Services
│   ├── memoryEngine.js
│   │   ├── Concept extraction (27 SCE concepts)
│   │   ├── Signal detection (confusion, understanding, ...)
│   │   ├── Mastery scoring (+2 base, ±adjustments)
│   │   ├── Ebbinghaus forgetting curve
│   │   └── Prerequisite gap detection (14 chains)
│   │
│   ├── predictionEngine.js
│   │   ├── 6 risk scores (failure, burnout, schedule, exam, productivity, recovery)
│   │   ├── Factor-weighted scoring
│   │   ├── Memory integration (avg_mastery, forgetting_alerts, gaps)
│   │   └── Intervention generation
│   │
│   ├── adaptiveEngine.js
│   │   ├── Behavior pattern analysis
│   │   ├── Explanation depth calibration
│   │   └── Focus subject detection
│   │
│   ├── patternEngine.js → Raw event → pattern extraction
│   ├── interventionEngine.js → Ranked intervention recommendations
│   ├── chatService.js → LLM prompt orchestration
│   └── behaviorTracker.js → Event recording
│
└── Database Layer
    └── database.js (better-sqlite3)
        ├── Schema initialization (38 tables)
        └── Query functions (~60 operations)
```

---

## Database — 38 Tables in 6 Groups

```
SQLite Database
│
├── Core (3 tables)
│   ├── users
│   ├── user_profiles
│   └── sessions
│
├── Chat (2 tables)
│   ├── conversations
│   └── messages
│
├── Planning (2 tables)
│   ├── study_plans
│   └── study_tasks
│
├── Intelligence / Behavior (6 tables)
│   ├── behavior_events
│   ├── behavior_patterns
│   ├── adaptive_profiles
│   ├── weak_topics
│   ├── topic_questions
│   └── pattern_cache
│
├── Predictions (4 tables)
│   ├── risk_assessments
│   ├── academic_predictions
│   ├── prediction_factors
│   └── interventions
│
└── Memory / Learning Brain (10 tables)
    ├── concept_memories
    ├── student_learning_profiles
    ├── knowledge_gaps
    ├── explanation_effectiveness
    ├── memory_snapshots
    ├── prerequisite_violations
    ├── mastery_history
    ├── revision_sessions
    ├── concept_relationships
    └── learning_milestones
```

---

## Cross-System Intelligence Data Flow

```
                    CHAT MESSAGE
                         │
                         ▼
              ┌─────────────────────┐
              │    chatService.js   │
              │                     │
              │  System prompt =    │
              │  base_prompt +      │
              │  adaptive_context ◄─┼── adaptiveEngine (explanation depth,
              │  + prediction ◄─────┼── predictionEngine (risk summary)
              │  + memory_context ◄─┼── memoryEngine (concept mastery snapshot)
              └─────────────────────┘
                         │
                         ▼
                    Cohere LLM
                         │
                    AI Response
                         │
                         ├──► Sent to user immediately
                         │
                         └──► (background, non-blocking)
                               memoryEngine.updateConceptFromChat()
                                     │
                                     ├── Extract concepts from message
                                     ├── Detect signals (confusion/understanding)
                                     ├── Update concept_memories in DB
                                     └── Recompute student_learning_profile

ON DEMAND (user or system trigger):
     memoryEngine.getDashboard()
           │
           ├──► predictionEngine: avg_mastery + forgetting_alerts + knowledge_gaps
           │                      → adds to examFailureRisk score
           │
           └──► optimizerService: low_mastery subjects
                                  → added to weak_subjects input
```

---

## Ebbinghaus Forgetting Curve (Key Algorithm)

```
                     Mastery Score (0-100)
                     │
              100%   │  ●  (just learned)
                     │   \
               65%   │    \  ← retention threshold
                     │     \
               30%   │      \______
                     │             \_________
                0%   └──────────────────────────► Time (days)
                     0    7    14   21   28

Formula: retention = mastery × e^(-days/21)

Flagged for URGENT REVISION when:
  retention < mastery × 0.65   AND   days_since > 10
```

---

## For draw.io / Excalidraw

**Recommended layout**: Left-to-right flow
1. **Box 1 (left)**: Browser / Next.js Frontend — list all 11 pages
2. **Arrow**: REST API calls (HTTP)
3. **Box 2 (center)**: Express.js Backend — list routes and services
4. **Arrow down**: SQL queries
5. **Box 3 (bottom-center)**: SQLite — 38 tables, 6 groups
6. **Arrow right from center**: External API call
7. **Box 4 (right)**: Cohere LLM (cloud)

**Color coding suggestion**:
- Frontend: Blue (#3B82F6)
- Backend routes: Gray (#6B7280)  
- Intelligence engines: Purple (#8B5CF6)
- Database: Green (#10B981)
- External (Cohere): Orange (#F59E0B)
- Data flow arrows: Dark gray with labels
