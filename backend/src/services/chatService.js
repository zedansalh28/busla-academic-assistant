const db = require('../db/queries');
const llmClient = require('./llmClient');
const knowledgeBase = require('../utils/knowledgeBase');
const { track } = require('./behaviorTracker');
const adaptiveEngine = require('./adaptiveEngine');
const predictionEngine = require('./predictionEngine');
const memoryEngine = require('./memoryEngine');

const MAX_CONVERSATION_TURNS = parseInt(process.env.MAX_CONVERSATION_TURNS) || 20;
const MAX_HISTORY_MESSAGES = MAX_CONVERSATION_TURNS * 2;

class ChatService {
  async processMessage(sessionId, userId, userMessage) {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    // Track behavior event — async-safe, never throws
    track.chatMessage(userId, userMessage);

    db.updateSessionActivity(sessionId);
    const history = db.getConversationHistory(sessionId);
    const profile = db.getProfile(userId);
    const relevantKnowledge = this.getRelevantKnowledge(userMessage, profile);

    // Load adaptive preferences to personalize response style
    const adaptivePrefs = db.getAdaptivePrefs(userId);
    const adaptiveContext = adaptiveEngine.buildChatAdaptiveContext(adaptivePrefs);

    // Inject prediction-aware context for critical states (uses 30-min cache)
    const prediction = predictionEngine.computeAndSave(userId);
    const predictionContext = this.buildPredictionContext(prediction);

    // Inject long-term academic memory (concept mastery, struggles, forgetting)
    const memoryContext = memoryEngine.buildMemoryContext(userId);

    const systemPrompt = this.buildSystemPrompt(profile, relevantKnowledge) + adaptiveContext + predictionContext + memoryContext;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await llmClient.chat(messages, 500, 0.3);

      db.addMessage(sessionId, 'user', userMessage);
      db.addMessage(sessionId, 'assistant', response);

      if (history.length + 2 > MAX_HISTORY_MESSAGES) {
        db.clearConversationHistory(sessionId);
      }

      // Update concept mastery from this interaction (fire-and-forget)
      try {
        memoryEngine.updateConceptFromChat(userId, userMessage, response);
      } catch (_) {}

      return {
        answer: response,
        sources: this.extractSources(response, relevantKnowledge),
        confidence: this.calculateConfidence(response),
        suggestions: this.generateSmartSuggestions(userMessage, response, profile),
      };
    } catch (error) {
      console.error('Chat processing error:', error.message);
      throw new Error('Failed to process message: ' + error.message);
    }
  }

  buildSystemPrompt(profile, relevantKnowledge) {
    const major = profile?.major || 'Engineering';
    const year = profile?.year || 'Not specified';
    const learningStyle = profile?.learning_style || 'Not specified';
    const level = profile?.difficulty_level || 'intermediate';
    const interests = profile?.subjects_of_interest?.join(', ') || 'Engineering subjects';

    const yearMap = { 'Preparatory': 0, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '1': 1, '2': 2, '3': 3, '4': 4 };
    const yearNum = yearMap[String(year)] ?? parseInt(year) ?? 1;
    const yearName = {
      0: 'Preparatory',
      1: 'First-year',
      2: 'Second-year',
      3: 'Third-year',
      4: 'Fourth-year',
    }[yearNum] || 'Engineering';

    return `You are Busla, an AI academic assistant built specifically for students of Sami Shamoon College of Engineering (SCE), Israel.

═══════════════════════════════════════════════════════════════
STUDENT PROFILE:
• Department: ${major}
• Year: ${yearName}
• Learning Style: ${learningStyle}
• Level: ${level.charAt(0).toUpperCase() + level.slice(1)}
• Current Subjects: ${interests}
═══════════════════════════════════════════════════════════════

WHO YOU ARE TALKING TO:
This is an engineering student at SCE. They may be:
- Struggling with mathematics-heavy courses (Calculus, Linear Algebra, Signals)
- Overwhelmed by simultaneous labs, assignments, and exams
- Working on a final capstone project with a team
- A preparatory student building their foundation before Year 1
- Stressed about Moed Bet (second exam sitting) eligibility
- Learning to code for the first time (Introduction to Programming)
- Dealing with the specific pressure of SCE engineering workloads

YOUR PERSONALITY:
✓ Direct — answer the question first, explain second
✓ Practical — give step-by-step solutions, not vague advice
✓ Honest — say when something is hard; do not sugarcoat
✓ Encouraging — engineering is genuinely difficult, acknowledge the effort
✓ SCE-aware — reference realistic SCE context (Moed Bet, lab reports, final projects, Hebrew terms where natural)

YOUR APPROACH BY LEARNING STYLE:
${learningStyle === 'Visual' ? `VISUAL LEARNER:
→ Use structured formatting, headers, bullet points, and tables
→ Present information spatially — steps laid out clearly on the page
→ Use ASCII diagrams or structured text representations when helpful
→ Organize concepts with clear visual hierarchy` : learningStyle === 'Analytical' ? `ANALYTICAL LEARNER:
→ Explain the theory and reasoning before giving the method
→ Use mathematical notation where appropriate
→ Highlight the connections between concepts and underlying principles
→ Reference formal definitions and theorems` : `KINESTHETIC LEARNER:
→ Lead with a working example before explaining theory
→ Use "Try this:" prompts and hands-on exercises
→ Connect every concept to something you can build, run, or measure
→ Suggest immediate practice steps`}

HOW TO ANSWER — EVERY RESPONSE:
1. DIRECT ANSWER — answer the question in 1-2 sentences immediately
2. EXPLANATION — structured and matched to the student's learning style
3. CONCRETE EXAMPLE — a worked problem, code snippet, or real scenario
4. NEXT STEP — one specific action the student can take right now
5. BRIEF ENCOURAGEMENT — genuine, not generic

SUBJECT EXPERTISE YOU MUST DEMONSTRATE:
• Mathematics: Calculus 1/2, Linear Algebra, Discrete Mathematics, Statistics
• Programming: Python, Java, C/C++, algorithms, data structures, OOP
• Electrical: Circuit Analysis (KVL, KCL, Thevenin, Norton, AC/DC), Electronics, Signals
• Software Engineering: SRS, UML, Agile/Scrum, Git, system design
• Civil/Mechanical: Statics, Dynamics, Strength of Materials, Thermodynamics
• Industrial: Operations Research, Project Management, Quality Engineering

CRITICAL RULES:
🚫 NEVER:
• Claim to access SCE Moodle, grade records, or any internal SCE systems
• Invent specific exam dates, weights, or official grading policies
• Provide medical or mental health diagnosis
• Help with academic dishonesty or copying assignments

✓ ALWAYS:
• Refer students to their lecturer or department coordinator for official information
• Mention Moed Bet when relevant (second exam opportunity)
• Acknowledge when a topic requires consulting official SCE documentation
• Be honest when a question is outside your knowledge

═══════════════════════════════════════════════════════════════
RELEVANT KNOWLEDGE BASE CONTEXT:
${relevantKnowledge}
═══════════════════════════════════════════════════════════════

Help this ${yearName} ${major} student succeed at SCE. Be clear, be specific, be real.`;
  }

  getRelevantKnowledge(query, profile) {
    try {
      const knowledge = knowledgeBase.search(query, profile);
      return knowledge
        .slice(0, 5)
        .map(item => `• [${item.title}] ${item.description}`)
        .join('\n') || 'General SCE academic knowledge available';
    } catch (error) {
      return 'SCE academic knowledge base available';
    }
  }

  extractSources(response, knowledgeBase) {
    const sources = [];
    const lower = response.toLowerCase();

    if (lower.includes('calculus') || lower.includes('derivative') || lower.includes('integral')) {
      sources.push({ title: 'Mathematics — Calculus', category: 'course' });
    }
    if (lower.includes('circuit') || lower.includes('kvl') || lower.includes('kcl') || lower.includes('thevenin')) {
      sources.push({ title: 'Circuit Analysis', category: 'course' });
    }
    if (lower.includes('algorithm') || lower.includes('data structure') || lower.includes('complexity')) {
      sources.push({ title: 'Data Structures & Algorithms', category: 'course' });
    }
    if (lower.includes('exam') || lower.includes('moed') || lower.includes('study plan')) {
      sources.push({ title: 'Exam Preparation', category: 'study_tips' });
    }
    if (lower.includes('project') || lower.includes('srs') || lower.includes('git') || lower.includes('agile')) {
      sources.push({ title: 'Software Engineering & Projects', category: 'project' });
    }

    return sources.slice(0, 3);
  }

  calculateConfidence(response) {
    let confidence = 0.6;
    if (response.length > 150) confidence += 0.15;
    if (response.length > 400) confidence += 0.1;
    if (response.includes('\n') || response.includes('•') || response.includes('-')) {
      confidence += 0.1;
    }
    return Math.min(confidence, 0.95);
  }

  generateSmartSuggestions(userMessage, response, profile) {
    const suggestions = [];
    const msg = userMessage.toLowerCase();
    const resp = response.toLowerCase();

    // Topic-specific suggestions
    if (msg.includes('calculus') || msg.includes('derivative') || msg.includes('integral')) {
      suggestions.push('Solve 5 practice problems from past SCE Calculus exams');
    }
    if (msg.includes('circuit') || msg.includes('kvl') || msg.includes('thevenin')) {
      suggestions.push('Draw the circuit and label all nodes before solving');
    }
    if (msg.includes('algorithm') || msg.includes('data structure')) {
      suggestions.push('Implement this in code and trace through a small example');
    }
    if (msg.includes('project') || msg.includes('final')) {
      suggestions.push('Define your project scope in one clear paragraph first');
    }
    if (msg.includes('exam') || msg.includes('moed') || msg.includes('test')) {
      suggestions.push('Find past SCE exams and simulate exam conditions');
    }
    if (msg.includes('stuck') || msg.includes('confused') || msg.includes('understand')) {
      suggestions.push('Break the problem into smaller parts and solve one part at a time');
    }

    // Learning style suggestions
    const style = profile?.learning_style;
    if (suggestions.length < 2) {
      if (style === 'Visual') suggestions.push('Draw a diagram to map out the concept');
      else if (style === 'Analytical') suggestions.push('Look up the formal proof or derivation');
      else suggestions.push('Build a small working example from scratch');
    }

    // Level suggestions
    const lvl = profile?.difficulty_level;
    if (suggestions.length < 2) {
      if (lvl === 'beginner') suggestions.push('Start with the simplest example before the general case');
      else if (lvl === 'advanced') suggestions.push('Explore the edge cases and deeper theory behind this');
    }

    // Response-driven
    if (resp.includes('past exam') && !suggestions.some(s => s.includes('past'))) {
      suggestions.push('Get past SCE exam papers from your department office');
    }

    return suggestions.slice(0, 2);
  }

  buildPredictionContext(prediction) {
    if (!prediction) return '';
    const { burnoutProbability = 0, failureRisk = 0, overallHealth = 'healthy' } = prediction;
    if (overallHealth === 'critical' || burnoutProbability >= 70) {
      return `\n\n⚠️ STUDENT ALERT — CRITICAL STATE: This student's academic health is critical (failure risk: ${failureRisk}%, burnout: ${burnoutProbability}%). Be supportive and concise. Avoid long explanations. Prioritize actionable steps. Do not overwhelm. If they seem distressed, acknowledge it briefly before answering.`;
    }
    if (overallHealth === 'at_risk' || failureRisk >= 40) {
      return `\n\n📊 CONTEXT: This student is at academic risk (failure risk: ${failureRisk}%). Keep answers practical and focused. Recommend using the Optimizer or Planner where appropriate.`;
    }
    return '';
  }

  getSessionHistory(sessionId) {
    return db.getConversationHistory(sessionId).map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
    }));
  }

  clearSessionHistory(sessionId) {
    db.clearConversationHistory(sessionId);
    return { status: 'cleared' };
  }
}

module.exports = new ChatService();
