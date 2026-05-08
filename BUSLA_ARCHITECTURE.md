# BUSLA – Intelligent Academic Assistant Chatbot

## Complete System Architecture

---

## 1. SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Web/Mobile)                 │
│                  React/Vue + TypeScript                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS/WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  API GATEWAY (FastAPI)                   │
│              (/chat, /profile, /recommend, etc)          │
└──────────────────────┬──────────────────────────────────┘
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
   ┌────▼───┐  ┌──────▼─────┐  ┌────▼────┐  ┌─────▼────┐
   │Chatbot │  │ Profile    │  │Knowledge│  │Recommend│
   │Engine  │  │ Manager    │  │Base     │  │Engine   │
   └────┬───┘  └──────┬─────┘  └────┬────┘  └─────┬────┘
        │             │             │             │
        └─────────────┼─────────────┼─────────────┘
                      │
        ┌─────────────▼──────────────┐
        │    PostgreSQL Database     │
        │  (Non-sensitive data only) │
        └────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   Redis Cache Layer        │
        │   (Sessions, History)      │
        └────────────────────────────┘

    ┌──────────────────────────────────┐
    │  AI Models (Cohere/OpenAI API)   │
    │  - Chat Completions              │
    │  - Embeddings                    │
    │  - Reasoning Models              │
    └──────────────────────────────────┘

    ┌──────────────────────────────────┐
    │  External Services               │
    │  - Wikipedia API (Knowledge)     │
    │  - arXiv API (Research)          │
    │  - Course materials (public)     │
    └──────────────────────────────────┘
```

---

## 2. DATA FLOW ARCHITECTURE

### User Query Flow:

```
1. User sends message → Frontend (React)
2. Frontend → API Gateway (/chat endpoint)
3. API Gateway:
   - Validates session (Redis)
   - Retrieves user profile (voluntary inputs only)
   - Fetches context from Knowledge Base
4. Chatbot Engine:
   - Retrieves conversation history (Redis)
   - Builds context with user preferences
   - Calls LLM (Cohere/OpenAI)
5. LLM Response → Cache (Redis) → Database (analytics only) → Frontend
```

### Privacy-First Data Handling:

```
STORED IN DATABASE:
✓ User preferences (major, year, interests)
✓ Anonymous analytics (feature usage, not content)
✓ Conversation metadata (timestamps, turn count)
✓ Public knowledge base content

NOT STORED:
✗ Student IDs, grades, or institutional data
✗ Personal identifiable information
✗ University database links
✗ Sensitive conversation content (deleted after session)
```

---

## 3. MODULES & COMPONENTS

### 3.1 User Profile Module

**Purpose:** Self-managed voluntary user data

**Data Model:**

```python
UserProfile:
  - user_id (anonymous UUID)
  - major (string: "Computer Science", "Biology", etc.)
  - year (string: "1st", "2nd", "3rd", "4th")
  - learning_style (string: "visual", "conceptual", "practice-based")
  - subjects_of_interest (list of strings)
  - language_preference (string)
  - difficulty_level (string: "beginner", "intermediate", "advanced")
  - created_at (timestamp)
  - updated_at (timestamp)
```

### 3.2 Chatbot Engine Module

**Purpose:** Core conversation logic

**Key Functions:**

- `start_session()` → Create anonymous session
- `process_message(session_id, message)` → Parse & respond
- `retrieve_context(query)` → Get relevant knowledge
- `call_llm(messages, params)` → LLM API call
- `store_conversation(session_id, exchange)` → Save anonymously

### 3.3 Knowledge Base Module

**Purpose:** Non-sensitive academic content

**Sources:**

- Public academic materials (textbooks, wikis)
- arXiv papers (abstracts & summaries)
- Wikipedia API
- Uploaded public syllabi/guides
- General academic concepts

**Storage:**

```
Vector embeddings (for semantic search):
  - Cohere/OpenAI embeddings API
  - Pinecone/Weaviate vector DB (optional)

Metadata:
  - source (string)
  - topic (string)
  - difficulty (string)
  - created_at (timestamp)
```

### 3.4 Recommendation System

**Purpose:** Personalized learning suggestions

**Inputs:**

- User profile (major, year, learning style)
- Conversation history (topics discussed)
- User preferences

**Outputs:**

- Recommended topics
- Study resources
- Learning paths
- Related questions

**Algorithm:**

- Content-based filtering (major + interests)
- Collaborative filtering (similar learner patterns)
- Semantic similarity (conversation topics)

### 3.5 Planner System

**Purpose:** Help organize study schedules

**Features:**

- Study schedule generator
- Assignment deadline tracker (user-entered)
- Topic breakdown & milestones
- Progress tracking (user-defined)

**Data:**

```python
StudyPlan:
  - user_id (UUID)
  - title (string)
  - subject (string)
  - deadline (datetime, user-provided)
  - milestones (list)
  - created_at (timestamp)
```

---

## 4. DATABASE SCHEMA

### PostgreSQL Tables

```sql
-- Users (Anonymous)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles (Voluntary Data Only)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  major VARCHAR(100),
  year VARCHAR(20),
  learning_style VARCHAR(50),
  subjects_of_interest TEXT[], -- Array of strings
  language_preference VARCHAR(10) DEFAULT 'en',
  difficulty_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id)
);

-- Sessions (Anonymous)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Conversation Analytics (No Sensitive Content)
CREATE TABLE conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  topic VARCHAR(200),
  turn_count INT,
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Knowledge Base
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500),
  content TEXT,
  source VARCHAR(200),
  topic VARCHAR(200),
  difficulty_level VARCHAR(50),
  embedding VECTOR(1536), -- For semantic search
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study Plans (User-Defined)
CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(200),
  subject VARCHAR(200),
  deadline TIMESTAMP,
  milestones JSONB,
  progress INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Feedback (Anonymous)
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  topic VARCHAR(200),
  recommendation_type VARCHAR(50), -- 'topic', 'resource', 'path'
  content JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Redis (Sessions & Cache)

```
Keys:
- session:{session_id}:history → Array of messages
- session:{session_id}:metadata → Session info
- user:{user_id}:profile → User profile cache
- kb:index → Knowledge base index
- rate_limit:{user_id} → Request count
```

---

## 5. API ENDPOINTS

### Authentication & Sessions

```
POST /sessions/create
  → Returns: { session_id, user_id }

POST /sessions/end
  → Body: { session_id }
  → Returns: { status: "closed" }
```

### User Profile

```
GET /profile/{user_id}
  → Returns: UserProfile

POST /profile
  → Body: {
      major: string,
      year: string,
      learning_style: string,
      subjects_of_interest: [string],
      language_preference: string,
      difficulty_level: string
    }
  → Returns: UserProfile

PUT /profile/{user_id}
  → Body: Partial UserProfile
  → Returns: UserProfile

DELETE /profile/{user_id}
  → Returns: { status: "deleted" }
```

### Chat

```
POST /chat
  → Body: {
      session_id: UUID,
      message: string
    }
  → Returns: {
      session_id: UUID,
      answer: string,
      sources: [{ title, url }],
      confidence: float
    }

GET /chat/history/{session_id}
  → Returns: Array of messages (current session only)

DELETE /chat/history/{session_id}
  → Returns: { status: "deleted" }
```

### Knowledge Base

```
GET /knowledge/search
  → Query: { q: string, topic: string, limit: int }
  → Returns: Array of KnowledgeItem

GET /knowledge/{id}
  → Returns: KnowledgeItem

POST /knowledge/index
  → Admin only: Re-index KB
```

### Recommendations

```
GET /recommendations/{user_id}
  → Query: { type: string, limit: int }
  → Returns: Array of Recommendations

POST /recommendations/{user_id}/regenerate
  → Returns: Array of Recommendations
```

### Study Plans

```
GET /plans/{user_id}
  → Returns: Array of StudyPlan

POST /plans
  → Body: {
      user_id: UUID,
      title: string,
      subject: string,
      deadline: datetime,
      milestones: [object]
    }
  → Returns: StudyPlan

PUT /plans/{plan_id}
  → Body: Partial StudyPlan
  → Returns: StudyPlan

DELETE /plans/{plan_id}
  → Returns: { status: "deleted" }

POST /plans/{plan_id}/update-progress
  → Body: { progress: int }
  → Returns: StudyPlan
```

### Analytics & Feedback

```
POST /feedback
  → Body: {
      session_id: UUID,
      rating: int,
      feedback_text: string
    }
  → Returns: { status: "saved" }

GET /analytics/dashboard (Admin)
  → Returns: Dashboard metrics (no sensitive data)
```

---

## 6. FOLDER STRUCTURE

```
busla/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Configuration & env vars
│   │   ├── dependencies.py         # DI & middleware
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── router.py           # Main router
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── chat.py         # Chat endpoints
│   │   │   │   ├── profile.py      # Profile endpoints
│   │   │   │   ├── knowledge.py    # KB endpoints
│   │   │   │   ├── recommendations.py
│   │   │   │   ├── plans.py
│   │   │   │   └── feedback.py
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── chatbot.py          # Chatbot engine
│   │   │   ├── knowledge_base.py   # KB manager
│   │   │   ├── recommender.py      # Recommendation logic
│   │   │   ├── planner.py          # Plan manager
│   │   │   └── llm_client.py       # LLM API wrapper
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py             # Pydantic models
│   │   │   ├── chat.py
│   │   │   ├── knowledge.py
│   │   │   └── plan.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── requests.py         # Request DTOs
│   │   │   └── responses.py        # Response DTOs
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # SQLAlchemy base
│   │   │   ├── models.py           # ORM models
│   │   │   ├── session.py          # Session factory
│   │   │   ├── redis_client.py     # Redis wrapper
│   │   │   └── migrations/
│   │   │       └── alembic/        # Database migrations
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── user_service.py     # User logic
│   │   │   ├── chat_service.py
│   │   │   ├── kb_service.py
│   │   │   ├── recommend_service.py
│   │   │   ├── plan_service.py
│   │   │   └── analytics_service.py
│   │   │
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── security.py         # JWT, hashing
│   │   │   ├── validators.py
│   │   │   ├── logger.py
│   │   │   └── embeddings.py       # Vector operations
│   │   │
│   │   └── exceptions/
│   │       ├── __init__.py
│   │       └── custom.py           # Custom exceptions
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── unit/
│   │   │   ├── test_chatbot.py
│   │   │   ├── test_kb.py
│   │   │   └── test_recommender.py
│   │   └── integration/
│   │       └── test_api.py
│   │
│   ├── requirements.txt
│   ├── .env.example
│   ├── docker-compose.yml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.vue
│   │   │   ├── ProfileForm.vue
│   │   │   ├── RecommendationCard.vue
│   │   │   ├── PlanManager.vue
│   │   │   └── Sidebar.vue
│   │   │
│   │   ├── pages/
│   │   │   ├── Chat.vue
│   │   │   ├── Profile.vue
│   │   │   ├── Plans.vue
│   │   │   └── Dashboard.vue
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts             # API client
│   │   │   ├── auth.ts
│   │   │   └── storage.ts
│   │   │
│   │   ├── store/
│   │   │   └── index.ts           # Vuex/Pinia store
│   │   │
│   │   └── App.vue
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── data/
│   ├── knowledge_base/
│   │   ├── topics.json
│   │   └── materials/
│   │
│   └── seeds/
│       └── initial_kb.sql
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── PRIVACY_POLICY.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml
├── .env.example
├── README.md
└── LICENSE
```

---

## 7. TECH STACK

### Backend

```
Framework:        FastAPI 0.104+
Language:         Python 3.11+
Database:         PostgreSQL 15+
Cache:            Redis 7+
ORM:              SQLAlchemy 2.0+
API Validation:   Pydantic V2
Migration Tool:   Alembic
Testing:          pytest, pytest-asyncio
LLM APIs:         Cohere / OpenAI
Embeddings:       Cohere / OpenAI embeddings
Vector DB:        Pinecone / Weaviate (optional)
Deploy:           Docker, Kubernetes
```

### Frontend

```
Framework:        Vue 3 or React 18+
Language:         TypeScript
State:            Pinia or Redux
HTTP:             Axios / Fetch
Styling:          TailwindCSS
UI Library:       Shadcn/ui or Material-UI
Build:            Vite or Webpack
Deploy:           Vercel / Netlify
```

### DevOps

```
Containerization: Docker
Orchestration:    Kubernetes (optional)
CI/CD:            GitHub Actions / GitLab CI
Monitoring:       Prometheus, Grafana
Logging:          ELK Stack / DataDog
```

---

## 8. SECURITY & PRIVACY PRINCIPLES

### Data Minimization

- ✓ Collect only voluntary, user-provided data
- ✓ No automatic university data integration
- ✓ No grade/performance tracking
- ✓ No institutional identifiers

### Encryption

- ✓ TLS/HTTPS for all communications
- ✓ Sensitive data encrypted at rest (Redis)
- ✓ API keys in environment variables only

### Session Management

- ✓ Anonymous UUID-based sessions
- ✓ Auto-expiration (24 hours)
- ✓ Conversation history cleared after logout
- ✓ Redis TTL for session data

### Access Control

- ✓ No user authentication required (session-based)
- ✓ Rate limiting per session
- ✓ CORS configured for frontend origin only
- ✓ Admin endpoints behind authentication

### Compliance

- ✓ GDPR: Data deletion on user request
- ✓ Right to access: User can export data
- ✓ Transparent privacy policy
- ✓ No third-party data sharing

---

## 9. DEPLOYMENT ARCHITECTURE

### Development

```bash
# Local setup
docker-compose up -d
# Runs: PostgreSQL, Redis, Backend, Frontend
```

### Production

```
Frontend (Vercel/Netlify)
    ↓ HTTPS
API Gateway (Kubernetes)
    ├─ Backend Replicas (3x)
    ├─ PostgreSQL (Managed: AWS RDS)
    ├─ Redis (Managed: AWS ElastiCache)
    └─ Vector DB (Pinecone)

CDN: CloudFront / Cloudflare
Monitoring: Prometheus + Grafana
Backup: Automated daily snapshots
```

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: MVP (4-6 weeks)

- [ ] FastAPI backend scaffold
- [ ] PostgreSQL + Redis setup
- [ ] Basic chat endpoint (Cohere integration)
- [ ] User profile system
- [ ] Frontend (React/Vue) with chat UI

### Phase 2: Intelligence (4-6 weeks)

- [ ] Knowledge base with embeddings
- [ ] Context retrieval (semantic search)
- [ ] Recommendation engine (content-based)
- [ ] Study plan generator

### Phase 3: Advanced (4-6 weeks)

- [ ] Collaborative filtering recommendations
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-language support

### Phase 4: Production (2-4 weeks)

- [ ] Load testing & optimization
- [ ] Security audit
- [ ] Kubernetes deployment
- [ ] Monitoring & alerting

---

## 11. KEY METRICS & SUCCESS CRITERIA

```
User Engagement:
  - Daily active users
  - Average session duration
  - Messages per session

System Performance:
  - API response time < 2s
  - 99.9% uptime
  - Concurrent users: 10,000+

Quality:
  - User satisfaction rating > 4.5/5
  - Recommendation accuracy > 80%
  - Error rate < 0.1%

Privacy:
  - Zero data breaches
  - GDPR compliance score: 100%
  - User trust score > 4.0/5
```

---

## 12. CONCLUSION

**Busla** is designed as a **scalable, privacy-first, academically-focused chatbot** that:

- Stores NO sensitive institutional data
- Collects only voluntary user inputs
- Provides personalized learning assistance
- Maintains user trust through transparency
- Scales to support thousands of concurrent users
- Deploys on modern cloud infrastructure

The system prioritizes **user privacy and data minimization** while delivering powerful, personalized academic support.
