# Busla API Examples & Testing

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Add your Cohere API key to .env
COHERE_API_KEY=hf_your_key_here

# 3. Install and start
npm install
npm run init-db
npm run dev
```

Server runs on `http://localhost:3001`

---

## Complete Workflow Example

### Step 1: Create Session & Profile

```bash
# Create anonymous session
curl -X POST http://localhost:3001/api/sessions/create
```

**Response:**

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "session_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876"
}
```

Save these IDs. Use them in subsequent requests.

### Step 2: Create User Profile

```bash
curl -X POST http://localhost:3001/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "major": "Computer Science",
    "year": "2nd",
    "learning_style": "practice-based",
    "subjects_of_interest": ["Algorithms", "Web Development", "Machine Learning"],
    "difficulty_level": "intermediate"
  }'
```

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "major": "Computer Science",
  "year": "2nd",
  "learning_style": "practice-based",
  "subjects_of_interest": ["Algorithms", "Web Development", "Machine Learning"],
  "language_preference": "en",
  "difficulty_level": "intermediate",
  "created_at": 1704067200000,
  "updated_at": 1704067200000
}
```

### Step 3: Chat with AI

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "message": "I struggle with understanding Big O notation. Can you explain it?"
  }'
```

**Response:**

```json
{
  "session_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
  "answer": "Big O notation is a way to describe the performance of an algorithm as the input size grows...",
  "sources": [
    {
      "title": "Algorithms",
      "category": "course_patterns"
    }
  ],
  "confidence": 0.88
}
```

### Step 4: Get Chat History

```bash
curl http://localhost:3001/api/chat/history/f1e2d3c4-b5a6-9876-5432-10fedcba9876
```

**Response:**

```json
{
  "session_id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
  "messages": [
    {
      "role": "user",
      "content": "I struggle with understanding Big O notation. Can you explain it?"
    },
    {
      "role": "assistant",
      "content": "Big O notation is a way to describe the performance of an algorithm..."
    }
  ]
}
```

### Step 5: Create Study Plan

```bash
curl -X POST http://localhost:3001/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Prepare for Algorithms Midterm",
    "subject": "Algorithms",
    "deadline": 1704240000000,
    "milestones": [
      "Review Big O notation",
      "Practice sorting algorithms",
      "Study graph algorithms",
      "Take practice test"
    ]
  }'
```

**Response:**

```json
{
  "id": "p1a2n3-e5f6-7890-abcd-ef1234567890",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Prepare for Algorithms Midterm",
  "subject": "Algorithms",
  "deadline": 1704240000000,
  "milestones": [
    "Review Big O notation",
    "Practice sorting algorithms",
    "Study graph algorithms",
    "Take practice test"
  ],
  "progress": 0,
  "created_at": 1704067200000,
  "updated_at": 1704067200000
}
```

### Step 6: Add Tasks to Plan

```bash
curl -X POST http://localhost:3001/api/plans/p1a2n3-e5f6-7890-abcd-ef1234567890/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Read Big O chapter",
    "description": "Read chapter 3 of CLRS",
    "due_date": 1704153600000
  }'
```

**Response:**

```json
{
  "id": "t1a2s3-e5f6-7890-abcd-ef1234567890",
  "plan_id": "p1a2n3-e5f6-7890-abcd-ef1234567890",
  "title": "Read Big O chapter",
  "description": "Read chapter 3 of CLRS",
  "status": "pending",
  "due_date": 1704153600000,
  "created_at": 1704067200000,
  "updated_at": 1704067200000
}
```

### Step 7: Get Recommendations

```bash
curl http://localhost:3001/api/recommendations/user/a1b2c3d4-e5f6-7890-abcd-ef1234567890?limit=5
```

**Response:**

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
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
    },
    {
      "id": "study_practice-based_1",
      "topic": "Study Strategy - practice-based",
      "type": "study_tip",
      "title": "Hands-on Projects",
      "description": "Apply knowledge through practical projects",
      "recommendation_type": "study_method"
    },
    {
      "id": "path_Algorithms",
      "topic": "Algorithms",
      "type": "learning_path",
      "title": "Master Algorithms",
      "description": "A structured path to develop expertise in Algorithms",
      "recommendation_type": "learning_path"
    }
  ]
}
```

### Step 8: Update Task Status

```bash
curl -X PUT http://localhost:3001/api/plans/tasks/t1a2s3-e5f6-7890-abcd-ef1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

**Response:**

```json
{
  "id": "t1a2s3-e5f6-7890-abcd-ef1234567890",
  "plan_id": "p1a2n3-e5f6-7890-abcd-ef1234567890",
  "title": "Read Big O chapter",
  "description": "Read chapter 3 of CLRS",
  "status": "completed",
  "due_date": 1704153600000,
  "created_at": 1704067200000,
  "updated_at": 1704067300000
}
```

---

## API Reference

### Sessions API

| Method | Endpoint                   | Description                  |
| ------ | -------------------------- | ---------------------------- |
| POST   | `/api/sessions/create`     | Create new anonymous session |
| GET    | `/api/sessions/:sessionId` | Get session details          |

### Profiles API

| Method | Endpoint                | Description                            |
| ------ | ----------------------- | -------------------------------------- |
| POST   | `/api/profiles`         | Create user profile                    |
| GET    | `/api/profiles/:userId` | Get profile details                    |
| PUT    | `/api/profiles/:userId` | Update profile                         |
| DELETE | `/api/profiles/:userId` | Delete profile and all associated data |

**Profile Fields:**

- `major` (string, required): "Computer Science", "Biology", "Engineering", etc.
- `year` (string, required): "1st", "2nd", "3rd", "4th"
- `learning_style` (string, required): "visual", "conceptual", "practice-based"
- `subjects_of_interest` (array): e.g., ["Algorithms", "Web Development"]
- `language_preference` (string): default "en"
- `difficulty_level` (string): "beginner", "intermediate", "advanced"

### Chat API

| Method | Endpoint                       | Description                   |
| ------ | ------------------------------ | ----------------------------- |
| POST   | `/api/chat`                    | Send message and get response |
| GET    | `/api/chat/history/:sessionId` | Get conversation history      |
| DELETE | `/api/chat/history/:sessionId` | Clear conversation history    |

**Chat Request:**

```json
{
  "session_id": "string (required)",
  "user_id": "string (required)",
  "message": "string (required)"
}
```

**Chat Response:**

```json
{
  "session_id": "string",
  "answer": "string",
  "sources": [
    {
      "title": "string",
      "category": "string"
    }
  ],
  "confidence": "float (0-1)"
}
```

### Plans API

| Method | Endpoint                             | Description              |
| ------ | ------------------------------------ | ------------------------ |
| POST   | `/api/plans`                         | Create study plan        |
| GET    | `/api/plans/user/:userId`            | Get all user's plans     |
| GET    | `/api/plans/:planId`                 | Get specific plan        |
| PUT    | `/api/plans/:planId`                 | Update plan              |
| DELETE | `/api/plans/:planId`                 | Delete plan              |
| GET    | `/api/plans/:planId/recommendations` | Get plan recommendations |

**Plan Fields:**

- `user_id` (string, required): User UUID
- `title` (string, required): Plan title
- `subject` (string, required): Subject name
- `deadline` (number): Unix timestamp
- `milestones` (array): List of milestone strings
- `progress` (number): 0-100

### Tasks API

| Method | Endpoint                   | Description      |
| ------ | -------------------------- | ---------------- |
| POST   | `/api/plans/:planId/tasks` | Add task to plan |
| GET    | `/api/plans/:planId/tasks` | Get plan's tasks |
| PUT    | `/api/plans/tasks/:taskId` | Update task      |
| DELETE | `/api/plans/tasks/:taskId` | Delete task      |

**Task Fields:**

- `title` (string, required)
- `description` (string)
- `due_date` (number): Unix timestamp
- `status` (string): "pending", "in-progress", "completed"

### Recommendations API

| Method | Endpoint                                  | Description                           |
| ------ | ----------------------------------------- | ------------------------------------- |
| GET    | `/api/recommendations/user/:userId`       | Generate personalized recommendations |
| GET    | `/api/recommendations/user/:userId/saved` | Get saved recommendations             |

**Query Parameters:**

- `limit` (number): Number of recommendations (default: 5)

---

## Error Handling

All errors return JSON with status code:

```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

**Common Status Codes:**

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Server Error

---

## Testing with Postman

Import this collection into Postman:

```json
{
  "info": { "name": "Busla API" },
  "item": [
    {
      "name": "Create Session",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/sessions/create"
      }
    },
    {
      "name": "Create Profile",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/profiles",
        "body": {
          "major": "Computer Science",
          "year": "2nd",
          "learning_style": "practice-based",
          "difficulty_level": "intermediate"
        }
      }
    }
  ]
}
```

---

## Rate Limiting

Current implementation: No rate limiting. For production, implement:

- 100 requests per minute per session
- 1000 requests per hour per user
- Use Redis for rate limit tracking

---

## Next Steps

1. Set up frontend (React/Vue)
2. Add authentication if needed
3. Implement rate limiting
4. Add monitoring & logging
5. Deploy to production
