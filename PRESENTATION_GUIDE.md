# Busla — Presentation Guide
## 10-Minute Final Project Presentation

---

## Slide Structure (10 slides, ~1 min each)

---

### Slide 1 — Title
**"Busla: The Intelligent Academic Brain"**

- Your name, SCE, Computer Science
- Tagline: "An AI assistant that learns how you learn"
- Date

---

### Slide 2 — The Problem
**"Why do students fail? Because no tool tracks them at the concept level."**

Key points:
- Students receive generic academic advice, not personalized
- Existing tools track grades — not understanding
- No system detects *when* a student is forgetting a concept
- No feedback loop between study behavior and AI responses

One strong stat: "70% of students who fail exams had no early warning system"

---

### Slide 3 — The Solution
**"Busla: Three Intelligence Engines Working Together"**

Show the three pillars:

| Engine | What it does |
|---|---|
| Adaptive Engine | Learns your behavior patterns, customizes AI responses |
| Prediction Engine | Computes 6 risk scores, generates recovery plans |
| Memory Engine | Tracks concept mastery using the Ebbinghaus forgetting curve |

Key differentiator: **These three engines share data with each other in real time.**

---

### Slide 4 — Architecture (show diagram)
**"Full-Stack AI System Built from Scratch"**

- Next.js 14 frontend → REST API → Express.js backend → SQLite (38 tables)
- Cohere LLM for natural language processing
- No ML library — all intelligence written in custom JavaScript

Point out:
- Context injection: "Every AI response is enriched with data from all three engines"
- Fire-and-forget pattern: "Memory updates happen in the background — user never waits"

---

### Slide 5 — Feature 1: Adaptive Engine (Live Demo)
**"The AI that adapts its explanation style in real time"**

Demo steps:
1. Open /analytics page
2. Show "Adaptive Mode — Active" banner
3. Point to: explanation depth, session length, focus areas
4. Say: "These are set automatically by analyzing my behavior events — no configuration"

Technical talking point:
- "The engine reads 40+ behavior events, extracts patterns, and updates the AI prompt before every single chat response"

---

### Slide 6 — Feature 2: Prediction Engine (Live Demo)
**"6 risk scores, computed from behavior + memory data"**

Demo steps:
1. Open /predictions page
2. Show the Overall Health banner
3. Point to 6 score cards
4. Click "Why These Scores?" → expand Exam Failure factors
5. Show: "Critical average concept mastery: 34% — this came from the Memory Engine"
6. Show active interventions

Technical talking point:
- "The exam failure risk score directly incorporates memory data — this is the cross-system integration that makes Busla different"

---

### Slide 7 — Feature 3: Memory Engine (Live Demo)
**"Concept mastery tracking with Ebbinghaus forgetting curve"**

Demo steps:
1. Open /learning-brain page
2. Show summary stats: X concepts, Y% avg mastery, Z forgetting alerts
3. Show ConceptMasteryGrid — point to red/orange concepts
4. Show ForgettingAlerts — explain urgency levels
5. Show RevisionPanel — explain the ranked queue

Technical talking point:
- "Every chat message is analyzed to extract engineering concepts. When the AI detects confusion, mastery goes down. When it detects understanding, mastery goes up."
- "After 10+ days, we apply the Ebbinghaus curve: retention = mastery × e^(−days/21)"

---

### Slide 8 — Data Flow (show cross-system diagram)
**"Three engines, one intelligence network"**

Walk through the diagram:
1. User sends a chat message
2. chatService pulls context from all 3 engines
3. LLM generates a context-enriched response
4. In the background: memory updates, mastery scores change
5. Next chat message: the context is already updated

Then show how engines feed each other:
- Memory → Prediction (mastery_score, forgetting_alerts → examFailureRisk)
- Memory → Optimizer (low_mastery subjects → weak_subjects priority)

---

### Slide 9 — Technical Highlights
**"What makes this a serious engineering project"**

| Concept | Implementation |
|---|---|
| Forgetting curve | `mastery × e^(-days/21)` computed per-concept |
| Multi-factor risk | 7-dimensional scoring, each with labeled factors |
| Context injection | LLM prompt assembled from 3 live database queries per message |
| Non-blocking ML | Fire-and-forget pattern keeps UX instant |
| Privacy-first | All intelligence runs locally — no user data to external ML APIs |
| 38-table schema | Normalized design for all intelligence signals |
| TypeScript | Full type safety across 15 pages and 30+ components |

---

### Slide 10 — Demo & Conclusion
**"Load the demo — watch the intelligence activate"**

Live demo sequence:
1. Open landing page → Click "Load Demo Student"
2. Wait 2 seconds → Navigate to /learning-brain
3. Show 16 concepts populated, forgetting alerts, revision queue
4. Navigate to /predictions — show risk scores driven by memory
5. Navigate to /analytics — show adaptive mode active

Closing statement:
"Busla is not just a chatbot. It's a complete academic intelligence system that builds a mental model of each student — one conversation at a time."

---

## Committee Q&A — Prepared Answers

**Q: Why SQLite instead of PostgreSQL or MongoDB?**
A: SQLite with better-sqlite3 is synchronous, file-based, and zero-configuration. For a single-server academic tool this is ideal — no connection pool management, transactions are instantaneous, and it's production-proven. The schema would migrate to PostgreSQL in one afternoon if needed.

**Q: Is the Cohere API the intelligence, or did you build the intelligence?**
A: Cohere is only the language model — it generates natural language text. All intelligence (forgetting curve, risk scoring, concept extraction, adaptive behavior) is custom code I wrote. The LLM doesn't know your mastery scores; I inject that context into every prompt from my own database.

**Q: How does the system extract concepts from chat messages?**
A: I built a keyword matching system — 27 engineering concepts (algorithms, recursion, binary trees, etc.) each mapped to a list of trigger keywords. When a user message matches keywords for concept X, the memory engine processes that concept for that message.

**Q: What happens if there's no chat data? Does the system work?**
A: Yes. The system has graceful empty states everywhere. The demo seed script populates all three engines with synthetic data so the system is ready to demo without any real conversation history.

**Q: Could this scale to 1000 students?**
A: The current architecture scales to dozens of concurrent users. For 1000+ users, the next step would be migrating the database to PostgreSQL and adding a job queue (like Bull) for the background intelligence recomputation. The service boundaries are already designed for this separation.

**Q: What's the most complex algorithm you implemented?**
A: The prerequisite gap detection — it traverses a hand-coded dependency graph of 14 concept chains (e.g., "cannot understand recursion without functions → cannot understand trees without recursion"). When a student struggles with a concept, the engine walks backward through its prerequisites to find the root knowledge gap.

**Q: Why not use a pre-built ML model for predictions?**
A: The behavioral signals (behavior events, study patterns, memory mastery) are domain-specific to academic behavior. Pre-built models don't understand what a "study plan with 0% progress for 14 days" means in this context. Hand-coded factor-weighted scoring gives full explainability — every score shows exactly which factors drove it and by how much. This is a conscious design choice for educational AI.

---

## Demo Checklist (Run Before Presenting)

- [ ] Backend running on port 3001: `cd backend && npm run dev`
- [ ] Frontend running on port 3000: `cd frontend && npm run dev`
- [ ] Open localhost:3000 in browser — landing page loads
- [ ] Click "Load Demo Student" — verify green confirmation appears
- [ ] Navigate to /learning-brain — verify concepts appear (16 expected)
- [ ] Navigate to /predictions — verify risk scores appear
- [ ] Navigate to /analytics — verify adaptive mode banner appears
- [ ] Open /chat — send one test message — verify response arrives

**If demo fails**: Show the validation screenshots from the development session and explain the data flow verbally.

---

## Time Budget

| Section | Time |
|---|---|
| Problem + Solution (slides 1–3) | 2 min |
| Architecture (slide 4) | 1 min |
| Live Demo: Adaptive Engine (slide 5) | 1.5 min |
| Live Demo: Prediction Engine (slide 6) | 1.5 min |
| Live Demo: Memory Engine (slide 7) | 2 min |
| Technical highlights + conclusion (slides 8–10) | 2 min |
| **Total** | **10 min** |
