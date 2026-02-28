/**
 * Self-Analyzer — CTO Self-Improvement Engine
 * AGI Level 10: Full AGI Convergence
 *
 * 📜 Binh Pháp Ch.13 用間: 「明君賢將，能以上智為間者，必成大功」
 *    "The enlightened sovereign and wise general who use the highest intelligence succeed"
 *
 * CTO analyzes its OWN code, identifies improvement patterns,
 * and generates self-improvement suggestions. Cross-session memory
 * persists learnings across restarts.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const config = require('../config');

const DATA_DIR = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data');
const MEMORY_FILE = path.join(DATA_DIR, 'cross-session-memory.json');
const SELF_ANALYSIS_FILE = path.join(DATA_DIR, 'self-analysis.json');
const PROXY_PORT = config.PROXY_PORT || 20128;

function log(msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    try { fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', `[${ts}] [tom-hum] [AGI-10] ${msg}\n`); } catch (e) { }
}

// ═══════════════════════════════════════════════════
// Cross-Session Memory
// ═══════════════════════════════════════════════════

function loadMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    } catch (e) { }
    return {
        sessions: [],
        knowledgeGraph: {},
        bugPatterns: [],
        architectureInsights: [],
        createdAt: new Date().toISOString()
    };
}

function saveMemory(mem) {
    mem.updatedAt = new Date().toISOString();
    try {
        const tmp = MEMORY_FILE + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(mem, null, 2));
        fs.renameSync(tmp, MEMORY_FILE); // atomic write
    } catch (e) { }
}

/**
 * Record session start — captures what CTO knows at boot time.
 */
function recordSessionStart() {
    const mem = loadMemory();
    const session = {
        id: Date.now(),
        startedAt: new Date().toISOString(),
        missionsDispatched: 0,
        missionsSucceeded: 0,
        bugsFixed: 0,
        lessonsLearned: []
    };
    mem.sessions.push(session);
    if (mem.sessions.length > 50) mem.sessions = mem.sessions.slice(-50);
    saveMemory(mem);
    log(`SESSION START: #${mem.sessions.length} — cross-session memory loaded (${Object.keys(mem.knowledgeGraph).length} knowledge nodes)`);
    return session.id;
}

/**
 * Update session stats after each mission completes.
 * 🦞 FIX 2026-02-28: Cross-session memory was NEVER updated post-mission.
 * All 50 sessions showed missionsDispatched: 0 — this function closes the gap.
 */
function updateSessionStats({ dispatched = false, succeeded = false, bugFixed = false, lesson = null } = {}) {
    const mem = loadMemory();
    if (mem.sessions.length === 0) return;
    const current = mem.sessions[mem.sessions.length - 1];
    if (dispatched) current.missionsDispatched = (current.missionsDispatched || 0) + 1;
    if (succeeded) current.missionsSucceeded = (current.missionsSucceeded || 0) + 1;
    if (bugFixed) current.bugsFixed = (current.bugsFixed || 0) + 1;
    if (lesson && !current.lessonsLearned.includes(lesson)) {
        current.lessonsLearned.push(lesson);
        if (current.lessonsLearned.length > 20) current.lessonsLearned = current.lessonsLearned.slice(-20);
    }
    saveMemory(mem);
}

/**
 * Record a bug pattern for future avoidance.
 */
function recordBugPattern(pattern, fix, source) {
    const mem = loadMemory();
    // Deduplicate
    if (mem.bugPatterns.some(p => p.pattern === pattern)) return;
    mem.bugPatterns.push({
        pattern, fix, source,
        recordedAt: new Date().toISOString(),
        timesAvoided: 0
    });
    if (mem.bugPatterns.length > 100) mem.bugPatterns = mem.bugPatterns.slice(-100);
    saveMemory(mem);
    log(`BUG PATTERN RECORDED: "${pattern}" → fix: "${fix}"`);
}

/**
 * Record architecture insight for long-term knowledge.
 */
function recordInsight(project, insight, category) {
    const mem = loadMemory();
    mem.architectureInsights.push({
        project, insight, category,
        recordedAt: new Date().toISOString()
    });
    if (mem.architectureInsights.length > 100) mem.architectureInsights = mem.architectureInsights.slice(-100);

    // Build knowledge graph
    if (!mem.knowledgeGraph[project]) mem.knowledgeGraph[project] = {};
    if (!mem.knowledgeGraph[project][category]) mem.knowledgeGraph[project][category] = [];
    mem.knowledgeGraph[project][category].push(insight);

    saveMemory(mem);
    log(`INSIGHT: [${project}/${category}] ${insight.slice(0, 80)}`);
}

// ═══════════════════════════════════════════════════
// Self-Analysis
// ═══════════════════════════════════════════════════

/**
 * CTO analyzes its own performance and generates improvement suggestions.
 */
async function selfAnalyze() {
    const { getReport } = require('./learning-engine');
    const report = getReport();
    const mem = loadMemory();

    const prompt = `You are an AGI system analyzing your own performance. Here is your data:

MISSION STATS: ${report.totalMissions} total, ${report.overallRate}% success rate
TASK RATES: ${JSON.stringify(report.taskRates)}
LESSONS: ${JSON.stringify(report.lessons)}
SESSIONS: ${mem.sessions.length} total restarts
BUG PATTERNS: ${mem.bugPatterns.length} recorded

Analyze your performance and suggest:
1. Which task types should be prioritized or deprecated
2. What new improvement areas should be explored
3. Any meta-improvements to your own workflow

Return JSON: {"analysis": "brief summary", "prioritize": ["task_ids"], "deprecate": ["task_ids"], "newAreas": ["descriptions"], "metaImprovements": ["suggestions"]}`;

    return new Promise((resolve) => {
        const body = JSON.stringify({
            model: 'gemini-3-flash', max_tokens: 1024,
            system: 'Return ONLY valid JSON.',
            messages: [{ role: 'user', content: prompt }]
        });

        const timer = setTimeout(() => { resolve(null); }, 15000);

        const req = http.request({
            hostname: '127.0.0.1', port: PROXY_PORT,
            path: '/v1/messages', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': 'ollama', 'anthropic-version': '2023-06-01' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                clearTimeout(timer);
                try {
                    const r = JSON.parse(data);
                    const text = (r.content || []).find(c => c.type === 'text')?.text || '';
                    const result = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, '').trim());

                    // Save analysis
                    try {
                        fs.writeFileSync(SELF_ANALYSIS_FILE, JSON.stringify({
                            ...result,
                            analyzedAt: new Date().toISOString(),
                            missionCount: report.totalMissions,
                            successRate: report.overallRate
                        }, null, 2));
                    } catch (e) { }

                    log(`SELF-ANALYSIS: ${result.analysis?.slice(0, 100)}`);
                    resolve(result);
                } catch (e) {
                    log(`Self-analysis parse error: ${e.message}`);
                    resolve(null);
                }
            });
        });

        req.on('error', () => { clearTimeout(timer); resolve(null); });
        req.write(body);
        req.end();
    });
}

/**
 * Get AGI score — composite intelligence metric.
 * 🦞 FIX 2026-02-26: Included "Wisdom" (Trí tuệ) based on Strategic Brain history
 */
function getAGIScore() {
    const mem = loadMemory();
    const { getReport } = require('./learning-engine');
    let report;
    try { report = getReport(); } catch (e) { report = { totalMissions: 0, overallRate: 0 }; }

    // 📜 WISDOM SCORE: Based on Binh Phap Strategic History
    let wisdomCount = 0;
    try {
        const historyFile = path.join(DATA_DIR, 'strategy-history.json');
        if (fs.existsSync(historyFile)) {
            const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
            wisdomCount = history.length;
        }
    } catch (e) { }

    // Components (6 categories, each 0-100)
    const visionScore = 100; // LLM Vision always active
    const learningScore = Math.min(100, report.totalMissions * 5); // 20 missions = 100
    const autonomyScore = Math.min(100, mem.sessions.length * 10 + mem.bugPatterns.length * 5);
    const memoryScore = Math.min(100, Object.keys(mem.knowledgeGraph).length * 20 + mem.architectureInsights.length * 5);
    const successScore = report.overallRate || 0;
    const wisdomScore = Math.min(100, wisdomCount * 10); // 10 strategized missions = 100

    const total = Math.round((visionScore + learningScore + autonomyScore + memoryScore + successScore + wisdomScore) / 6);

    return {
        total,
        components: { vision: visionScore, learning: learningScore, autonomy: autonomyScore, memory: memoryScore, success: successScore, wisdom: wisdomScore },
        // AGI Levels — Rebranded for Sun Tzu (Tôn Tử) 2500
        level: total >= 90 ? '10 (Tôn Tử AGI)' : 
               total >= 80 ? '9 (Đại Đô Đốc)' : 
               total >= 70 ? '8 (Bậc Thầy Chiến Lược)' : 
               total >= 50 ? '7 (Linh Hồn Trí Tuệ)' : 
               total >= 30 ? '6 (Cựu Binh)' : '5 (Lính Mới)'
    };
}

module.exports = {
    recordSessionStart, updateSessionStats, recordBugPattern, recordInsight,
    selfAnalyze, getAGIScore, loadMemory
};
