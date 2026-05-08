# Busla Backend

Production-ready Node.js backend for the Busla academic assistant chatbot.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your COHERE_API_KEY
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001`

## Project Structure

```
backend/
├── src/
│   ├── db/                    # Database layer
│   │   ├── connection.js      # SQLite connection
│   │   ├── schema.js          # Table definitions
│   │   ├── queries.js         # CRUD operations
│   │   └── init.js            # DB initialization
│   │
│   ├── services/              # Business logic
│   │   ├── chatService.js     # Chat processing
│   │   ├── profileService.js  # User profiles
│   │   ├── plannerService.js  # Study plans
│   │   ├── recommendationService.js
│   │   └── llmClient.js       # Cohere API wrapper
│   │
│   ├── routes/                # API endpoints
│   │   ├── sessions.js
│   │   ├── profiles.js
│   │   ├── chat.js
│   │   ├── plans.js
│   │   └── recommendations.js
│   │
│   ├── utils/                 # Utilities
│   │   ├── knowledgeBase.js   # KB search
│   │   ├── errorHandler.js
│   │   └── validators.js
│   │
│   └── index.js               # Entry point
│
├── data/
│   ├── knowledge_base.json    # Academic content
│   └── busla.db               # SQLite database (created)
│
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

### Sessions

```
POST   /api/sessions/create          # Create new session
GET    /api/sessions/:sessionId      # Get session info
```

### Profiles

```
POST   /api/profiles                 # Create profile
GET    /api/profiles/:userId         # Get profile
PUT    /api/profiles/:userId         # Update profile
DELETE /api/profiles/:userId         # Delete profile
```

### Chat

```
POST   /api/chat                     # Send message
GET    /api/chat/history/:sessionId  # Get history
DELETE /api/chat/history/:sessionId  # Clear history
```

### Plans

```
POST   /api/plans                    # Create plan
GET    /api/plans/user/:userId       # Get user's plans
GET    /api/plans/:planId            # Get plan
PUT    /api/plans/:planId            # Update plan
DELETE /api/plans/:planId            # Delete plan
GET    /api/plans/:planId/recommendations # Get plan recommendations
POST   /api/plans/:planId/tasks      # Add task
GET    /api/plans/:planId/tasks      # Get tasks
PUT    /api/plans/tasks/:taskId      # Update task
DELETE /api/plans/tasks/:taskId      # Delete task
```

### Recommendations

```
GET    /api/recommendations/user/:userId           # Generate recommendations
GET    /api/recommendations/user/:userId/saved     # Get saved recommendations
```

## Example Requests

### Create Session

```bash
curl -X POST http://localhost:3001/api/sessions/create
```

Response:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
}
```

### Create Profile

```bash
curl -X POST http://localhost:3001/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "major": "Computer Science",
    "year": "2nd",
    "learning_style": "practice-based",
    "subjects_of_interest": ["Algorithms", "Web Development"],
    "difficulty_level": "intermediate"
  }'
```

Response:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "major": "Computer Science",
  "year": "2nd",
  "learning_style": "practice-based",
  "subjects_of_interest": ["Algorithms", "Web Development"],
  "language_preference": "en",
  "difficulty_level": "intermediate",
  "created_at": 1704067200000,
  "updated_at": 1704067200000
}
```

### Send Chat Message

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "How can I improve my study habits?"
  }'
```

Response:

```json
{
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "answer": "Here are some effective study habits... [AI response]",
  "sources": [
    {
      "title": "Active Learning Techniques",
      "category": "study_tips"
    }
  ],
  "confidence": 0.85
}
```

### Create Study Plan

```bash
curl -X POST http://localhost:3001/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Prepare for Algorithms Final",
    "subject": "Algorithms",
    "deadline": 1704153600000,
    "milestones": ["Learn concepts", "Practice problems", "Take practice test"]
  }'
```

Response:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440111",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Prepare for Algorithms Final",
  "subject": "Algorithms",
  "deadline": 1704153600000,
  "milestones": ["Learn concepts", "Practice problems", "Take practice test"],
  "progress": 0,
  "created_at": 1704067200000,
  "updated_at": 1704067200000
}
```

### Get Recommendations

```bash
curl http://localhost:3001/api/recommendations/user/550e8400-e29b-41d4-a716-446655440000?limit=5
```

Response:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "recommendations": [
    {
      "id": "course_Computer_Science_2nd_0",
      "topic": "Computer Science - Year 2nd",
      "type": "course",
      "title": "Data Structures",
      "description": "Foundation for efficient programming",
      "difficulty": "intermediate",
      "recommendation_type": "course_path"
    },
    {
      "id": "study_practice-based_0",
      "topic": "Study Strategy - practice-based",
      "type": "study_tip",
      "title": "Problem Sets",
      "description": "Solve many problems to reinforce learning",
      "recommendation_type": "study_method"
    }
  ]
}
```

## Environment Variables

```
PORT=3001
NODE_ENV=development
COHERE_API_KEY=your_api_key
LLM_MODEL=command-a-reasoning-08-2025
DB_PATH=./data/busla.db
CORS_ORIGIN=http://localhost:3000
SESSION_EXPIRY_HOURS=24
MAX_CONVERSATION_TURNS=20
```

## Tech Stack

- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3)
- **API:** RESTful
- **LLM:** Cohere API
- **Runtime:** Node.js 16+

## Features

✓ User profiles (voluntary data only)
✓ Multi-turn chat with conversation history
✓ LLM integration (Cohere)
✓ Personalized recommendations
✓ Study plan management
✓ Task tracking
✓ Anonymous sessions
✓ Privacy-first design

## License

MIT
