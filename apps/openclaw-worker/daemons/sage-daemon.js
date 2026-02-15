const fs = require('fs');
const path = require('path');
const config = require('./config');
const QL = require('./lib/quan-luat-enforcer');

// ═══════════════════════════════════════════════════════════════
// 🏯 SAGE DAEMON — 賢哲 (Hiền Triết)
// ═══════════════════════════════════════════════════════════════
// Rank: HIEN_TRIET (Hiền Triết — Philosopher)
// Territory: knowledge
// 36 Kế: #9 Cách Ngạn Quan Hỏa, #26 Chỉ Tang Mạ Hòe
// Điều 3: CHỈ SYNTHESIZE + QUERY, KHÔNG MODIFY CODE
// Điều 4: Gemini Flash tier (FREE)
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'sage';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const SAGE_INTERVAL = 6 * 60 * 60 * 1000;

async function callGeminiFlash(prompt) {
    // 🏭 HẬU CẦN: NVIDIA DIRECT (bypass proxy — PERMANENT RULE)
    try {
        const nvidia = require('./lib/nvidia-client');
        const result = await nvidia.analyze(prompt, {
            daemon: DAEMON_NAME,
            tier: 'heavy', // Sage needs deep reasoning (Qwen3-480B)
            maxTokens: 4096,
            system: 'You are the Sage Agent (Knowledge Keeper). Analyze Knowledge Items (KIs) for obsolescence or gaps. Return JSON: { status: "current"|"outdated", gaps: [], mission_prompt: string }.',
        });

        let content = result.content;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(content);
    } catch (e) {
        QL.logQuanLuat(DAEMON_NAME, `❌ NVIDIA Call Failed: ${e.message}`);
        return null;
    }
}

function scanKnowledgeBase() {
    try {
        const KNOWLEDGE_DIR = path.join(config.MEKONG_DIR, '.gemini/antigravity/knowledge');
        if (!fs.existsSync(KNOWLEDGE_DIR)) return "Knowledge Base not found.";
        const kiSummary = require('child_process').execSync(`find ${KNOWLEDGE_DIR} -name "*.md" -o -name "*.json"`, { encoding: 'utf-8' });
        return kiSummary;
    } catch (e) {
        return `Error scanning KIs: ${e.message}`;
    }
}

async function sageLoop() {
    QL.logQuanLuat(DAEMON_NAME, '🦉 Sage Daemon STARTED');
    if (!QL.checkTerritory(DAEMON_NAME, 'synthesize')) return;

    const libraryIndex = scanKnowledgeBase();
    QL.logQuanLuat(DAEMON_NAME, 'Library Scanned. Contemplating...');

    const analysis = await callGeminiFlash(`Review this index of Knowledge Items. Are there any critical missing domains for an AGI System (e.g. Ethics, Self-Correction, Meta-Learning)?\n\n${libraryIndex}`);

    if (analysis && analysis.gaps && analysis.gaps.length > 0) {
        if (!QL.checkQueueDiscipline(DAEMON_NAME)) return;

        const filename = `LOW_mission_sage_knowledge_gap_${Date.now()}.txt`;
        const instruction = `/plan:hard "Sage Agent Insight: The Knowledge Base is missing: ${analysis.gaps.join(', ')}. Please research and create new Knowledge Items for these domains."`;
        fs.writeFileSync(path.join(config.MEKONG_DIR, 'tasks', filename), instruction);
        QL.logQuanLuat(DAEMON_NAME, `📜 Requested New Knowledge: ${filename}`);
        QL.createSignal(DAEMON_NAME, 'dispatcher', 'INTEL', { gaps: analysis.gaps }, 'LOW');
    } else {
        QL.logQuanLuat(DAEMON_NAME, `✅ Knowledge Base appears complete (Status: ${analysis ? analysis.status : 'Unknown'}).`);
    }
}

sageLoop();
setInterval(sageLoop, SAGE_INTERVAL);
