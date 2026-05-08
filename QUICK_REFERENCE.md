# Quick Reference Guide

## Setup (2 minutes)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env, add COHERE_API_KEY
npm run init-db
npm run dev
```

Server: `http://localhost:3001`

---

## Essential Endpoints

| Action                  | Command                                 |
| ----------------------- | --------------------------------------- |
| **Create Session**      | `POST /api/sessions/create`             |
| **Create Profile**      | `POST /api/profiles`                    |
| **Send Chat**           | `POST /api/chat`                        |
| **Get Recommendations** | `GET /api/recommendations/user/:userId` |
| **Create Plan**         | `POST /api/plans`                       |
| **Add Task**            | `POST /api/plans/:planId/tasks`         |

---

## Chat Example

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "user_id": "user-123",
    "message": "How to study effectively?"
  }'
```

Response includes: `answer`, `sources`, `confidence`

---

## Key Files

- **index.js** - Entry point
- **db/queries.js** - All database operations
- **services/** - Business logic
- **routes/** - API endpoints
- **data/knowledge_base.json** - Academic resources

---

## Environment Variables

```
COHERE_API_KEY=hf_...        # Required
PORT=3001
NODE_ENV=development
DB_PATH=./data/busla.db
MAX_CONVERSATION_TURNS=20
```

---

## Database

Auto-initialized with 8 tables:

- users, user_profiles, sessions
- conversations, messages
- study_plans, study_tasks
- recommendations, feedback

File: `./data/busla.db`

---

## Services Overview

| Service                   | Purpose                      |
| ------------------------- | ---------------------------- |
| **chatService**           | Multi-turn chat with LLM     |
| **profileService**        | User profile management      |
| **plannerService**        | Study plans & tasks          |
| **recommendationService** | Personalized recommendations |
| **llmClient**             | Cohere API integration       |

---

## Error Responses

```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad request
- `404` - Not found
- `500` - Server error

---

## Rate Limiting

Not implemented. Add for production:

- 100 req/min per session
- 1000 req/hour per user

---

## Common Issues

**"COHERE_API_KEY not set"**

- Add key to .env file

**"Database not found"**

- Run `npm run init-db`

**"Module not found"**

- Run `npm install`

---

## Documentation

- **README.md** - Full setup & features
- **API_EXAMPLES.md** - Complete API reference
- **IMPLEMENTATION_SUMMARY.md** - Implementation details

---

## Stack

- Node.js + Express
- SQLite (better-sqlite3)
- Cohere LLM API
- Production-ready code

---

## Privacy

✓ No student IDs stored
✓ No grades tracked
✓ Anonymous UUIDs
✓ User data only
✓ GDPR compliant
✓ Session auto-expiry

---

Last updated: 2026
