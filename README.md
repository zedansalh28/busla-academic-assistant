# Busla - AI Academic Assistant

Complete full-stack system for an intelligent academic assistant chatbot with privacy-first design.

## 📁 Project Structure

```
final-project/
├── backend/                    # Node.js Express backend
│   ├── src/
│   │   ├── db/                # Database layer
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API endpoints
│   │   └── utils/             # Utilities
│   ├── package.json
│   └── index.js
├── frontend/                  # Next.js React frontend
│   ├── src/
│   │   ├── pages/             # Next.js pages
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom hooks
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilities
│   │   └── styles/            # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
└── BUSLA_ARCHITECTURE.md      # System architecture
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`

## 🏗️ Architecture

### Backend

- **Framework**: Express.js 4.18
- **Database**: SQLite with better-sqlite3
- **LLM**: Cohere API integration
- **Structure**: Service-oriented architecture
- **API**: 18 REST endpoints

### Frontend

- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS 3.4
- **State**: Custom React hooks
- **Types**: TypeScript 5.3
- **Icons**: Lucide React

## 📚 Core Features

### User Authentication

- Anonymous session-based system
- Privacy-first design (no passwords)
- UUID-based user identification

### Chat System

- Multi-turn conversation with context
- Real-time message history
- Knowledge base integration
- Source attribution

### Study Planning

- Create and manage study plans
- Task-based milestones
- Progress tracking
- Deadline management

### Personalization

- Major and academic year selection
- Learning style preferences
- Subject interests
- Difficulty level customization

### Recommendations

- AI-powered study suggestions
- Resource recommendations
- Learning strategy suggestions
- Personalized based on profile

## 📊 Database Schema

### Core Tables

- **users**: User profiles with preferences
- **user_profiles**: Extended profile information
- **sessions**: Anonymous session management
- **conversations**: Chat session metadata
- **messages**: Individual chat messages
- **study_plans**: User study plans
- **study_tasks**: Tasks within plans
- **recommendations**: Personalized recommendations

## 🔌 API Endpoints

### Sessions (2)

- `POST /sessions/create` - Create new session
- `GET /sessions/:id` - Get session details

### Chat (3)

- `POST /chat` - Send message and get response
- `GET /chat/history/:sessionId` - Get chat history
- `DELETE /chat/history/:sessionId` - Clear history

### Profiles (4)

- `POST /profiles` - Create profile
- `GET /profiles/:userId` - Get profile
- `PUT /profiles/:userId` - Update profile
- `DELETE /profiles/:userId` - Delete profile

### Study Plans (7)

- `POST /plans` - Create plan
- `GET /plans/user/:userId` - Get user plans
- `GET /plans/:planId` - Get plan details
- `PUT /plans/:planId` - Update plan
- `DELETE /plans/:planId` - Delete plan
- `POST /plans/:planId/tasks` - Add task
- `GET /plans/:planId/tasks` - Get plan tasks

### Tasks (3)

- `PUT /plans/tasks/:taskId` - Update task
- `DELETE /plans/tasks/:taskId` - Delete task
- `GET /plans/:planId/recommendations` - Get recommendations

### Recommendations (2)

- `GET /recommendations/user/:userId` - Get recommendations
- `GET /recommendations/user/:userId/saved` - Get saved recommendations

## 🎯 User Flow

1. **Onboarding**: User completes 3-step profile setup
2. **Dashboard**: View profile summary and recommendations
3. **Chat**: Interact with AI assistant for academic help
4. **Planning**: Create and manage study plans
5. **Profile**: Edit profile preferences anytime

## 🔐 Privacy

- No sensitive data storage
- Anonymous UUID-based sessions
- No authentication required
- Voluntary data collection only
- GDPR compliant design

## 🛠️ Tech Stack

### Backend

- Express.js 4.18
- SQLite (better-sqlite3)
- Cohere API
- dotenv
- uuid
- axios

### Frontend

- Next.js 14
- React 18.2
- TypeScript 5.3
- Tailwind CSS 3.4
- Lucide React
- axios
- date-fns

## 📝 Configuration

### Backend (.env)

```
COHERE_API_KEY=your_key
DATABASE_PATH=./data.db
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🚢 Deployment

### Backend

```bash
npm run build
npm start
```

### Frontend

```bash
npm run build
npm start
```

## 📖 Documentation

- [System Architecture](./BUSLA_ARCHITECTURE.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [API Examples](./backend/API_EXAMPLES.md)

## ✨ Features

✅ AI-powered chat with context awareness
✅ Multi-user support (anonymous sessions)
✅ Study plan creation and management
✅ Personalized recommendations
✅ Responsive mobile-first design
✅ Real-time message streaming
✅ Progress tracking
✅ Privacy-first architecture

## 🔄 Development

### File Structure Convention

**Backend**: Service → Route → Database pattern
**Frontend**: Page → Component → Hook → Service pattern

### Component Structure

```
src/components/
├── Common/          # Reusable UI components
├── Chat/            # Chat interface components
├── Forms/           # Form components
├── Dashboard/       # Dashboard components
└── Planner/         # Study planner components
```

### Hooks Structure

```
src/hooks/
├── useAuth.ts       # Authentication and profile
├── useChat.ts       # Chat operations
└── usePlans.ts      # Study plans, tasks, recommendations
```

## 🤝 Contributing

1. Follow the established patterns
2. Maintain type safety with TypeScript
3. Use component-based architecture
4. Keep components reusable and testable

## 📄 License

MIT License

---

Built with ❤️ for academic excellence
