const express = require('express');
const db = require('../db/queries');

const router = express.Router();

const DEMO_PROFILES = [
  {
    name: 'Struggling First-Year — Software Engineering',
    description: 'First-year SE student overwhelmed by Calculus 1 and Introduction to Programming simultaneously',
    profile: {
      major: 'Software Engineering',
      year: '1st',
      learning_style: 'Kinesthetic',
      difficulty_level: 'beginner',
      subjects_of_interest: ['Calculus 1', 'Introduction to Programming', 'Discrete Mathematics'],
    },
    conversations: [
      {
        user: 'I am a first-year software engineering student and I am completely lost in Calculus 1. Derivatives make no sense to me. Where do I start?',
        assistant: `You are not alone — Calculus 1 is the course that challenges most first-year engineering students at SCE. Here is how to start rebuilding your understanding step by step.

**Step 1 — Understand what a derivative actually means**
A derivative is the rate of change. That's it. Before touching any formula, ask yourself: if I change x slightly, how much does f(x) change? A car's speedometer shows a derivative — the rate at which position changes with time.

**Step 2 — Master the basic rules first**
Start here, in this exact order:
→ Power rule: d/dx[xⁿ] = n · xⁿ⁻¹
→ Sum rule: (f + g)' = f' + g'
→ Product rule: (fg)' = f'g + fg'
→ Chain rule: d/dx[f(g(x))] = f'(g(x)) · g'(x)

**Step 3 — Practice one rule at a time**
Do 10 problems on the power rule alone before moving to the product rule. Do not mix rules until each feels automatic.

**Example to try right now:**
Find the derivative of f(x) = 3x⁴ - 2x² + 7
Answer: f'(x) = 12x³ - 4x

**Step 4 — Use past SCE exams**
Find past Calculus 1 exams from your department. The exam format at SCE is consistent — you will see the same question types repeated.

You have got this. What specific rule or topic is giving you the most trouble right now?`,
      },
      {
        user: 'I have a programming assignment due tomorrow and I do not know how to write a function in Python. Help me.',
        assistant: `Okay, let us get you through this. A Python function is simpler than it looks. Here is everything you need.

**Basic function structure:**
\`\`\`python
def function_name(parameter1, parameter2):
    # code here
    return result
\`\`\`

**Real example — a function that adds two numbers:**
\`\`\`python
def add(a, b):
    return a + b

result = add(3, 5)   # result = 8
print(result)        # prints: 8
\`\`\`

**Common assignment patterns at SCE intro level:**

1. Function with a loop:
\`\`\`python
def sum_list(numbers):
    total = 0
    for num in numbers:
        total += num
    return total
\`\`\`

2. Function with a condition:
\`\`\`python
def is_even(n):
    if n % 2 == 0:
        return True
    else:
        return False
\`\`\`

**What you need to do right now:**
1. Read the assignment question carefully — what input does the function take? What should it return?
2. Write the function header (def + name + parameters)
3. Write the body step by step
4. Test it with 2-3 sample inputs

What exactly does your assignment ask you to do? Share the task description and I will help you structure the solution.`,
      },
    ],
  },
  {
    name: 'Overloaded Second-Year — Electrical Engineering',
    description: 'Second-year EE student juggling Circuit Analysis, Electronics 1, and Signals simultaneously',
    profile: {
      major: 'Electrical and Electronics Engineering',
      year: '2nd',
      learning_style: 'Analytical',
      difficulty_level: 'intermediate',
      subjects_of_interest: ['Circuit Analysis', 'Electronics 1', 'Signals and Systems', 'Calculus 2'],
    },
    conversations: [
      {
        user: 'I have three exams in one week — Circuits, Signals, and Calculus 2. How do I prioritize and not fail all three?',
        assistant: `This is the classic second-year EE crunch. Here is a realistic survival plan.

**Step 1 — Rank them by: (weight × your current weakness)**

Typically for EE second year:
- Circuit Analysis carries the most weight in your degree progression — failing it blocks Electronics 2
- Signals and Systems is the most conceptually dense
- Calculus 2 is foundational but has more predictable exam patterns

**Suggested time split (assuming 6 days before first exam):**

| Day | Focus |
|-----|-------|
| Day 1 | Circuits — KVL, KCL, Thevenin, Norton review |
| Day 2 | Circuits — AC analysis, phasors, past exam problems |
| Day 3 | Signals — Fourier Transform, convolution, LTI systems |
| Day 4 | Signals — past exam problems only |
| Day 5 | Calculus 2 — integration techniques, series |
| Day 6 | Review your worst topic from each, rest early |

**For Circuits specifically:**
→ Every problem starts with a diagram. Draw the circuit first.
→ KVL: sum of voltages around any closed loop = 0
→ KCL: sum of currents into a node = 0
→ Thevenin: remove the load, find Voc and Rth

**For Signals specifically:**
→ Memorize the standard Fourier Transform pairs — they appear in every exam
→ Understand convolution graphically before algebraically

Which of the three feels most dangerous right now?`,
      },
      {
        user: 'Explain Thevenin equivalent circuit in simple terms.',
        assistant: `Thevenin's theorem is one of the most powerful tools in circuit analysis. Here is the clearest way to understand it.

**The Core Idea**
Any complex linear circuit, no matter how many resistors and voltage sources it has, can be replaced by:
- One voltage source (Vth)
- One resistor in series (Rth)

From the perspective of your load, the simplified circuit behaves identically.

**How to Find Thevenin Equivalent — Step by Step:**

**Step 1 — Remove the load**
Disconnect whatever component you are analyzing (the load) and leave the two terminals open.

**Step 2 — Find Vth (open-circuit voltage)**
Calculate the voltage across the open terminals. Use KVL, voltage divider, or node analysis. This is your Vth.

**Step 3 — Find Rth (Thevenin resistance)**
Turn off all independent sources:
→ Voltage sources → short circuit (replace with wire)
→ Current sources → open circuit (remove them)
Then calculate the resistance seen from the two open terminals.

**Step 4 — Draw the Thevenin equivalent**
A single voltage source Vth in series with Rth, connected to your load.

**Concrete Example:**
Imagine a circuit with a 12V battery and two resistors (6Ω and 3Ω) feeding a load.
- Vth = voltage at load terminals with load removed
- Rth = 6Ω ∥ 3Ω = 2Ω (if battery is shorted)
- Thevenin circuit: Vth source + 2Ω resistor + load

**Why it matters:** Once you have the Thevenin equivalent, calculating current through any load is trivial: I = Vth / (Rth + Rload).

Want me to walk through a specific problem from your course?`,
      },
    ],
  },
  {
    name: 'Final Year — Software Engineering Capstone',
    description: 'Fourth-year SE student managing a team final project while taking advanced electives',
    profile: {
      major: 'Software Engineering',
      year: '4th',
      learning_style: 'Visual',
      difficulty_level: 'advanced',
      subjects_of_interest: ['Final Project', 'Software Engineering', 'AI & Machine Learning', 'Web Development'],
    },
    conversations: [
      {
        user: 'Our team final project is falling behind. We are 5 weeks in and have almost nothing working. What should we do?',
        assistant: `This is a recoverable situation but you need to act today, not next week. Here is a structured rescue plan.

**Step 1 — Emergency scope reduction (today)**
Sit with your team and list every feature you planned. Now divide them into:
- **Must have** — the project cannot be demonstrated without this
- **Nice to have** — adds value but not essential for the demo
- **Cut** — remove completely

Be brutal. A working core feature is worth more than 10 broken ones.

**Step 2 — Identify the blocker**
Why is nothing working? Honest options:
- No one owns anything — everyone is waiting for someone else
- Technical problem that blocked everyone (dependency, architecture choice)
- Team communication breakdown
- Scope was never clearly defined

Diagnosing this correctly determines the fix.

**Step 3 — Reassign ownership immediately**
Each team member must own one complete working piece by end of week:
- Person A: database schema + one working API endpoint
- Person B: frontend skeleton with one screen rendering real data
- Person C: one core feature end-to-end, even if rough

**Step 4 — Daily 10-minute standups**
Every day: what did I do yesterday, what will I do today, what is blocking me. No exceptions.

**Step 5 — Talk to your supervisor now**
Do not hide the delay. Supervisors respond much better to "we identified a problem and have a plan" than to a failed demo. Schedule a meeting this week.

**What specifically is not working — the frontend, the backend, the database, or the integration between them?**`,
      },
      {
        user: 'How do I write a good Software Requirements Specification (SRS) for the final project?',
        assistant: `A good SRS is the document that prevents misunderstandings between you, your team, and your supervisor. Here is a practical structure for SCE final projects.

**SRS Structure for SCE Final Projects:**

**1. Introduction**
- Purpose of the document
- Scope: what the system does and what it does NOT do
- Definitions and abbreviations

**2. System Overview**
One paragraph describing the product. Example: "Busla is a web-based AI academic assistant for SCE engineering students that provides personalized study recommendations without accessing private student data."

**3. Functional Requirements**
Use the format: FR-01, FR-02, etc.
Each requirement should be:
→ Specific: "The system shall allow users to upload PDF files up to 10 MB"
→ Measurable: "The system shall respond to chat messages within 5 seconds"
→ Testable: you can write a test case to verify it

**4. Non-Functional Requirements**
- Performance: response times, load capacity
- Security: authentication method, data privacy
- Usability: accessibility, supported browsers
- Reliability: uptime expectations

**5. Use Cases or User Stories**
Format: "As a [user type], I want to [action] so that [benefit]"
Example: "As an SCE student, I want to upload my lecture notes so that Busla can answer questions about them."

**6. System Architecture Diagram**
A simple diagram showing: Frontend → Backend API → Database → External services (LLM API, etc.)

**Common mistakes in SCE SRS documents:**
- Requirements that are not testable ("the system shall be fast")
- Missing non-functional requirements
- No clear boundary between what the system does and what it does not do

How large is your team and what type of system are you building? I can help you write the first draft of your FR section.`,
      },
    ],
  },
];

// POST /api/demo/init
router.post('/init', (req, res) => {
  try {
    const demoUsers = [];

    for (const demo of DEMO_PROFILES) {
      const userId = db.createUser();
      db.createOrUpdateProfile(userId, demo.profile);
      const sessionId = db.createSession(userId);

      for (const conversation of demo.conversations) {
        db.addMessage(sessionId, 'user', conversation.user);
        db.addMessage(sessionId, 'assistant', conversation.assistant);
      }

      demoUsers.push({ userId, sessionId, name: demo.name, profile: demo.profile });
    }

    res.json({
      success: true,
      message: 'Demo mode initialized with 3 SCE engineering profiles',
      demoUsers,
    });
  } catch (error) {
    console.error('Demo init error:', error);
    res.status(500).json({ error: 'Failed to initialize demo mode' });
  }
});

// GET /api/demo/users
router.get('/users', (req, res) => {
  try {
    const demoUsers = DEMO_PROFILES.map((demo) => ({
      name: demo.name,
      description: demo.description,
      profile: demo.profile,
      conversationCount: demo.conversations.length,
    }));
    res.json({ success: true, demoUsers, total: demoUsers.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demo users' });
  }
});

// POST /api/demo/load/:index
router.post('/load/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);

    if (index < 0 || index >= DEMO_PROFILES.length) {
      return res.status(400).json({ error: 'Invalid demo profile index' });
    }

    const demo = DEMO_PROFILES[index];
    const userId = db.createUser();
    db.createOrUpdateProfile(userId, demo.profile);
    const sessionId = db.createSession(userId);

    for (const conversation of demo.conversations) {
      db.addMessage(sessionId, 'user', conversation.user);
      db.addMessage(sessionId, 'assistant', conversation.assistant);
    }

    res.json({
      success: true,
      userId,
      sessionId,
      profile: demo.profile,
      message: `Loaded "${demo.name}" profile`,
    });
  } catch (error) {
    console.error('Demo load error:', error);
    res.status(500).json({ error: 'Failed to load demo profile' });
  }
});

module.exports = router;
