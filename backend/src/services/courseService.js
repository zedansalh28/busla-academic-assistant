const db = require('../db/queries');

// ==================== TEXT EXTRACTION ====================

async function extractText(buffer, mimetype, originalname) {
  const ext = (originalname || '').toLowerCase().split('.').pop();

  if (mimetype === 'text/plain' || ext === 'txt') {
    return buffer.toString('utf-8');
  }

  if (mimetype === 'application/pdf' || ext === 'pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch {
      throw new Error('Failed to parse PDF. Make sure it is a valid PDF file.');
    }
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch {
      throw new Error('Failed to parse DOCX. Make sure it is a valid Word document.');
    }
  }

  throw new Error(`Unsupported file type: ${ext || mimetype}. Supported: txt, pdf, docx`);
}

// ==================== RAG CHUNKING & SEARCH ====================

function chunkText(text, chunkSize = 600, overlap = 100) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // keep last overlap chars as context
      current = current.slice(-overlap) + ' ' + sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function scoreChunk(chunk, query) {
  const chunkLower = chunk.toLowerCase();
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let score = 0;
  for (const word of words) {
    const count = (chunkLower.match(new RegExp(word, 'g')) || []).length;
    score += count;
  }
  return score;
}

function searchMaterials(materials, query, topK = 4) {
  const allChunks = [];

  for (const material of materials) {
    if (!material.content) continue;
    const chunks = chunkText(material.content);
    for (const chunk of chunks) {
      allChunks.push({ chunk, materialTitle: material.title, score: scoreChunk(chunk, query) });
    }
  }

  return allChunks
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function buildCourseContext(course, materials, query) {
  const relevant = searchMaterials(materials, query, 4);

  if (relevant.length === 0) {
    // Fall back to first 800 chars of each material as context
    const fallback = materials
      .slice(0, 3)
      .map((m) => `[${m.title}]\n${m.content.slice(0, 800)}`)
      .join('\n\n---\n\n');
    return fallback || null;
  }

  return relevant
    .map((r) => `[From: ${r.materialTitle}]\n${r.chunk}`)
    .join('\n\n---\n\n');
}

// ==================== DEMO COURSES ====================

const DEMO_COURSES = [
  {
    name: 'Preparatory Mathematics',
    code: 'MATH-PREP',
    description: 'Fundamental algebra, fractions, and arithmetic for engineering students.',
    materials: [
      {
        title: 'Course Overview',
        material_type: 'text',
        content: `Preparatory Mathematics at SCE covers the foundational mathematics needed before calculus.

Topics include:
1. Number systems: integers, rationals, irrationals, reals
2. Algebraic expressions: simplifying, expanding, factoring
3. Equations and inequalities: linear, quadratic, absolute value
4. Functions: definition, domain, range, basic types
5. Coordinate geometry: lines, slopes, distance, midpoint
6. Trigonometry basics: angles, unit circle, sin/cos/tan
7. Exponentials and logarithms: laws and applications

Learning goals: Students should be able to solve quadratic equations, work with functions, and understand basic trigonometric ratios before entering Calculus 1.

Sample exam questions:
- Solve: 2x^2 - 5x + 3 = 0
- Simplify: (x^2 - 9) / (x - 3)
- Find the domain of f(x) = sqrt(4 - x^2)
- If sin(θ) = 3/5 and θ is in the first quadrant, find cos(θ) and tan(θ)`,
      },
    ],
  },
  {
    name: 'Calculus 1',
    code: 'MATH101',
    description: 'Limits, derivatives, and integrals — the foundation of engineering mathematics.',
    materials: [
      {
        title: 'Limits and Continuity',
        material_type: 'text',
        content: `Calculus 1 - Limits and Continuity

A limit describes the value a function approaches as the input approaches some value.

Definition: lim(x→a) f(x) = L means f(x) gets arbitrarily close to L as x approaches a.

Key limit laws:
- Sum: lim[f(x) + g(x)] = lim f(x) + lim g(x)
- Product: lim[f(x) · g(x)] = lim f(x) · lim g(x)
- L'Hôpital's Rule: if lim f/g = 0/0 or ∞/∞, then lim f/g = lim f'/g'

Continuity: f is continuous at x=a if lim(x→a) f(x) = f(a).

Derivatives:
- Definition: f'(x) = lim(h→0) [f(x+h) - f(x)] / h
- Power rule: d/dx[x^n] = n·x^(n-1)
- Product rule: (fg)' = f'g + fg'
- Chain rule: d/dx[f(g(x))] = f'(g(x))·g'(x)

Integration:
- Antiderivative: F'(x) = f(x)
- ∫x^n dx = x^(n+1)/(n+1) + C (n ≠ -1)
- Fundamental Theorem: ∫(a to b) f(x) dx = F(b) - F(a)

Exam tips:
- Practice chain rule with composite functions
- Understand when L'Hôpital's rule applies
- Know the standard derivative table: sin, cos, e^x, ln(x)`,
      },
      {
        title: 'Sample Exercises',
        material_type: 'text',
        content: `Calculus 1 - Practice Problems

Limits:
1. Find lim(x→2) (x^2 - 4)/(x - 2)
   Solution: Factor numerator → (x-2)(x+2)/(x-2) = x+2 → limit = 4

2. Find lim(x→0) sin(x)/x
   Solution: = 1 (standard limit)

Derivatives:
3. Differentiate f(x) = 3x^4 - 2x^2 + 7
   Solution: f'(x) = 12x^3 - 4x

4. Differentiate g(x) = sin(x^2)
   Solution: g'(x) = cos(x^2) · 2x = 2x·cos(x^2) [chain rule]

5. Find dy/dx for y = (x^2 + 1)^5
   Solution: 5(x^2+1)^4 · 2x = 10x(x^2+1)^4

Integrals:
6. ∫(3x^2 + 2x - 1)dx = x^3 + x^2 - x + C

7. ∫(0 to 2) x^2 dx = [x^3/3](0 to 2) = 8/3 - 0 = 8/3

Study plan: Do 5 derivatives and 3 integrals daily. Review L'Hôpital when limits give 0/0.`,
      },
    ],
  },
  {
    name: 'Linear Algebra',
    code: 'MATH201',
    description: 'Vectors, matrices, linear transformations, eigenvalues and eigenvectors.',
    materials: [
      {
        title: 'Matrices and Linear Systems',
        material_type: 'text',
        content: `Linear Algebra - Matrices and Linear Systems

A matrix is a rectangular array of numbers. An m×n matrix has m rows and n columns.

Matrix operations:
- Addition: Add corresponding elements (same size required)
- Scalar multiplication: Multiply every element by the scalar
- Matrix multiplication: (AB)_ij = Σ A_ik · B_kj (A must be m×n, B must be n×p)

Row operations (for solving systems):
1. Swap two rows
2. Multiply a row by a nonzero constant
3. Add a multiple of one row to another

Gaussian Elimination:
- Convert to row echelon form
- Back-substitute to find solution

Determinant:
- For 2×2: det([a,b;c,d]) = ad - bc
- For 3×3: Expand along first row (cofactor expansion)
- det(A) ≠ 0 ↔ A is invertible

Inverse: A^(-1) exists iff det(A) ≠ 0. Use [A|I] → [I|A^(-1)] by row reduction.

Eigenvalues and Eigenvectors:
- Av = λv where v ≠ 0
- Find λ by solving det(A - λI) = 0 (characteristic equation)
- Find v by solving (A - λI)v = 0

Applications: Linear systems, image transformations, machine learning (PCA).`,
      },
    ],
  },
  {
    name: 'Physics 1',
    code: 'PHYS101',
    description: 'Classical mechanics: kinematics, dynamics, energy, momentum, and waves.',
    materials: [
      {
        title: 'Mechanics Summary',
        material_type: 'text',
        content: `Physics 1 - Classical Mechanics

Kinematics (motion without forces):
- Position, velocity, acceleration: v = dx/dt, a = dv/dt
- Uniform acceleration equations:
  v = v₀ + at
  x = x₀ + v₀t + ½at²
  v² = v₀² + 2a(x - x₀)

Newton's Laws:
1. An object remains at rest or in uniform motion unless acted upon by a net force.
2. F = ma (Force = mass × acceleration)
3. For every action there is an equal and opposite reaction.

Work and Energy:
- Work: W = F·d·cos(θ)
- Kinetic energy: KE = ½mv²
- Potential energy (gravity): PE = mgh
- Conservation of energy: KE + PE = constant (no friction)

Momentum:
- p = mv (linear momentum)
- Conservation: p_before = p_after (in isolated system)
- Impulse: J = F·Δt = Δp

Rotational Motion:
- τ = I·α (torque = moment of inertia × angular acceleration)
- Moment of inertia: I = Σmr²

Exam tips:
- Always draw a free-body diagram before writing equations.
- Check units at every step.
- Energy conservation solves many problems faster than kinematics.`,
      },
    ],
  },
  {
    name: 'Introduction to Programming',
    code: 'CS101',
    description: 'First programming course: Python fundamentals, control flow, functions, and OOP basics.',
    materials: [
      {
        title: 'Python Fundamentals',
        material_type: 'text',
        content: `Introduction to Programming - Python Fundamentals

Variables and Types:
- int: whole numbers (age = 20)
- float: decimal numbers (height = 1.75)
- str: text ("hello")
- bool: True/False

Control Flow:
if condition:
    # runs if condition is True
elif other_condition:
    # else if
else:
    # otherwise

Loops:
for i in range(10):       # iterates 0 to 9
    print(i)

while condition:           # runs while condition is True
    do_something()

Functions:
def greet(name):
    return f"Hello, {name}!"

result = greet("Ahmad")   # returns "Hello, Ahmad!"

Lists:
numbers = [1, 2, 3, 4]
numbers.append(5)         # add to end
numbers[0]                # first element = 1
len(numbers)              # length = 5

Dictionaries:
student = {"name": "Ali", "grade": 90}
student["name"]           # "Ali"

OOP Basics:
class Dog:
    def __init__(self, name):
        self.name = name
    def bark(self):
        return f"{self.name} says Woof!"

dog = Dog("Rex")
dog.bark()                # "Rex says Woof!"

Common exam questions:
- Write a function to find the maximum in a list
- Implement a simple class with constructor and method
- Trace through a loop and predict output`,
      },
    ],
  },
  {
    name: 'Data Structures',
    code: 'CS201',
    description: 'Arrays, linked lists, stacks, queues, trees, and graphs with complexity analysis.',
    materials: [
      {
        title: 'Core Data Structures',
        material_type: 'text',
        content: `Data Structures - Core Concepts

Array:
- Fixed size, O(1) access by index, O(n) search
- Insert/delete at end: O(1), in middle: O(n)

Linked List:
- Nodes with data + next pointer
- O(1) insert/delete at head, O(n) access by index
- Types: singly linked, doubly linked, circular

Stack (LIFO - Last In First Out):
- push(): add to top → O(1)
- pop(): remove from top → O(1)
- peek(): view top without removing → O(1)
- Uses: function call stack, undo operations, expression parsing

Queue (FIFO - First In First Out):
- enqueue(): add to back → O(1)
- dequeue(): remove from front → O(1)
- Uses: BFS, task scheduling, print queue

Binary Tree:
- Each node has at most 2 children (left, right)
- BST property: left < root < right
- Traversals:
  - Inorder (L-Root-R): gives sorted order in BST
  - Preorder (Root-L-R): good for copying tree
  - Postorder (L-R-Root): good for deletion

Binary Search Tree (BST):
- Search: O(log n) average, O(n) worst case
- Insert: O(log n) average
- Delete: 3 cases (leaf, one child, two children)

Hash Table:
- Key → hash function → index → value
- Average O(1) for insert, delete, search
- Collisions handled by chaining or open addressing

Big O Summary:
| Structure | Access | Search | Insert | Delete |
|-----------|--------|--------|--------|--------|
| Array     | O(1)   | O(n)   | O(n)   | O(n)   |
| LinkedList| O(n)   | O(n)   | O(1)   | O(1)   |
| BST (avg) | O(logn)| O(logn)| O(logn)| O(logn)|
| Hash Table| N/A    | O(1)   | O(1)   | O(1)   |`,
      },
    ],
  },
  {
    name: 'Databases',
    code: 'CS301',
    description: 'Relational databases, SQL, normalization, transactions, and indexes.',
    materials: [
      {
        title: 'SQL and Relational Model',
        material_type: 'text',
        content: `Databases - SQL and Relational Model

Relational Model:
- Data stored in tables (relations)
- Each row is a tuple, each column is an attribute
- Primary key: uniquely identifies each row
- Foreign key: references primary key of another table

Basic SQL:

SELECT name, age FROM students WHERE age > 20 ORDER BY name;

INSERT INTO students (name, age) VALUES ('Ahmad', 21);

UPDATE students SET age = 22 WHERE name = 'Ahmad';

DELETE FROM students WHERE id = 5;

Joins:
- INNER JOIN: returns rows with matching values in both tables
- LEFT JOIN: all rows from left table, matched rows from right
- RIGHT JOIN: all rows from right table, matched rows from left

SELECT s.name, c.course_name
FROM students s
INNER JOIN enrollments e ON s.id = e.student_id
INNER JOIN courses c ON e.course_id = c.id;

Aggregation:
SELECT department, COUNT(*), AVG(grade)
FROM students
GROUP BY department
HAVING AVG(grade) > 75;

Normalization:
- 1NF: atomic values, no repeating groups
- 2NF: 1NF + no partial dependencies on composite key
- 3NF: 2NF + no transitive dependencies

Transactions (ACID):
- Atomicity: all-or-nothing
- Consistency: data remains valid
- Isolation: concurrent transactions don't interfere
- Durability: committed data survives failures

Indexes: Speed up queries, slow down writes. Use on frequently searched columns.`,
      },
    ],
  },
  {
    name: 'Algorithms',
    code: 'CS302',
    description: 'Algorithm design, complexity analysis, sorting, searching, dynamic programming, and graphs.',
    materials: [
      {
        title: 'Sorting and Complexity',
        material_type: 'text',
        content: `Algorithms - Sorting and Complexity Analysis

Big O Notation:
- O(1): constant — array access
- O(log n): logarithmic — binary search
- O(n): linear — linear search
- O(n log n): linearithmic — merge sort
- O(n²): quadratic — bubble sort
- O(2^n): exponential — brute-force subset sum

Sorting Algorithms:
Bubble Sort: O(n²) — compare adjacent, swap if out of order. Simple but slow.
Selection Sort: O(n²) — find min, swap to front. Always O(n²).
Insertion Sort: O(n²) worst, O(n) best (nearly sorted). Good for small arrays.
Merge Sort: O(n log n) — divide and conquer, stable. Uses O(n) extra space.
Quick Sort: O(n log n) average, O(n²) worst — partition around pivot. In-place.
Heap Sort: O(n log n) always — uses max-heap. In-place but not stable.

Binary Search:
- Requires sorted array
- O(log n): compare middle, discard half
- Implementation: low=0, high=n-1, mid=(low+high)/2

Dynamic Programming:
- Solve subproblems once, store results (memoization or tabulation)
- Fibonacci: F(n) = F(n-1) + F(n-2), dp[i] = dp[i-1] + dp[i-2]
- Knapsack, Longest Common Subsequence, Coin Change

Graph Algorithms:
- BFS (breadth-first search): O(V+E), shortest path in unweighted graph
- DFS (depth-first search): O(V+E), cycle detection, topological sort
- Dijkstra: O((V+E)log V), shortest path in weighted graph (non-negative)
- Bellman-Ford: O(VE), handles negative weights

Greedy Algorithms:
- Make locally optimal choice at each step
- Activity selection, Huffman encoding, Minimum spanning tree (Prim/Kruskal)`,
      },
    ],
  },
  {
    name: 'Project Management',
    code: 'PM401',
    description: 'Software project planning, agile methods, risk management, and team coordination.',
    materials: [
      {
        title: 'Agile and SDLC',
        material_type: 'text',
        content: `Project Management - Agile and Software Development Life Cycle

Software Development Life Cycle (SDLC):
1. Requirements: gather and document what the system must do
2. Design: architecture, database, UI/UX
3. Implementation: coding
4. Testing: unit, integration, system, acceptance
5. Deployment: release to production
6. Maintenance: bug fixes, updates

Waterfall vs Agile:
Waterfall: Sequential phases, detailed upfront planning, hard to change requirements.
Agile: Iterative sprints (1-4 weeks), working software over documentation, responds to change.

Scrum (Agile Framework):
- Product Owner: defines what to build (backlog)
- Scrum Master: facilitates process, removes blockers
- Development Team: builds the product
- Sprint: 1-4 week development cycle
- Daily Standup: 15-min meeting (what did I do, what will I do, blockers)
- Sprint Review: demo to stakeholders
- Sprint Retrospective: team reflects on process

Work Breakdown Structure (WBS):
- Decompose project into smaller tasks
- Each task should be 8-80 hours of work
- Assign to team members

Risk Management:
- Identify risks early
- Assess probability and impact
- Mitigation strategies: avoid, transfer, mitigate, accept

Estimation Techniques:
- Story points: relative estimation in Scrum
- Planning poker: team estimation game
- Three-point estimate: (optimistic + 4×most_likely + pessimistic) / 6

Critical Path Method (CPM):
- Identify longest path of dependent tasks
- Any delay on critical path delays the whole project`,
      },
    ],
  },
  {
    name: 'Final Project Seminar',
    code: 'CS499',
    description: 'Capstone project: planning, development, documentation, and presentation.',
    materials: [
      {
        title: 'Project Guidelines',
        material_type: 'text',
        content: `Final Project Seminar - Guidelines and Expectations

Project Requirements:
- Original software project (web app, mobile app, embedded system, or AI system)
- Team size: 2-4 students
- Duration: one full semester
- Language/technology: student choice (must justify)

Deliverables:
1. Week 3: Project proposal (2-3 pages) — problem, solution, tech stack, team roles
2. Week 7: Progress report — what was done, what remains, demo of working prototype
3. Week 12: Final report — complete documentation (SRS, design, testing, user guide)
4. Week 15: Presentation and demo — 15 minutes + Q&A

Documentation Requirements:
- System Requirements Specification (SRS): functional and non-functional requirements
- Architecture diagram: component, database, and deployment diagrams
- API documentation (if applicable)
- Test plan: unit tests, integration tests, user acceptance tests
- User manual: how to install and use the system

Grading Criteria:
- Functionality (40%): does it work as specified?
- Code quality (20%): clean, documented, version-controlled
- Documentation (20%): complete and professional
- Presentation (20%): clear explanation and demo

Tips for success:
- Start early — scope creep is the biggest risk
- Use Git from day one with meaningful commit messages
- Define clear interfaces between team members' work
- Test continuously, not just at the end
- Prepare for demo failures — have backup screenshots/video

Common mistakes to avoid:
- Overshooting scope
- Poor communication within team
- Leaving documentation to the last week
- Not testing on the actual deployment environment`,
      },
    ],
  },
];

async function seedDemoCourses(userId) {
  try {
    if (db.demoCoursesExist(userId)) return;
    for (const courseData of DEMO_COURSES) {
      const course = db.createCourse(userId, courseData, true);
      for (const material of courseData.materials) {
        db.createCourseMaterial(course.id, material);
      }
    }
  } catch {
    // User may not exist yet — seeding skipped, will retry on next load
  }
}

// ==================== COURSE CHAT ====================

function buildCourseSystemPrompt(course, materials, query, profile) {
  const context = buildCourseContext(course, materials, query);
  const hasContext = !!context;
  const major = profile?.major || 'engineering';

  return `You are Busla, an academic assistant helping a ${major} student understand their course materials.

COURSE: ${course.name}${course.code ? ` (${course.code})` : ''}
${course.description ? `DESCRIPTION: ${course.description}` : ''}

${hasContext ? `UPLOADED COURSE MATERIAL (use this as your primary source):
═══════════════════════════════════════════════════════════
${context}
═══════════════════════════════════════════════════════════

When answering:
✓ Base your answer primarily on the material above
✓ Start your response with "Based on the material uploaded for ${course.name}..." when the answer is clearly from the material
✓ Use simple, step-by-step explanations suitable for engineering students
✓ Include examples where helpful
✓ If the question is only partially covered, answer what you can from the material, then add a general explanation` : `No course material has been uploaded for this course yet. You will answer based on general academic knowledge.`}

SAFETY RULE:
If you cannot find the answer in the uploaded material, say:
"I could not find this clearly in the uploaded course material for ${course.name}. I can explain it generally, but please verify with your lecturer or official course page."

IMPORTANT:
- Do NOT claim access to SCE systems, Moodle, or official grade records
- Do NOT invent specific exam dates, weights, or grades
- DO encourage the student to verify official requirements with their lecturer`;
}

module.exports = {
  extractText,
  searchMaterials,
  buildCourseContext,
  buildCourseSystemPrompt,
  seedDemoCourses,
  DEMO_COURSES,
};
