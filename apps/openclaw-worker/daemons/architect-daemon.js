const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');
const QL = require('./lib/quan-luat-enforcer');

// ═══════════════════════════════════════════════════════════════
// 🏯 ARCHITECT DAEMON — 建築師 (Kiến Trúc Sư)
// ═══════════════════════════════════════════════════════════════
// Rank: KIEN_TRUC_SU (Kiến Trúc Sư — Architect)
// Territory: system_design
// 36 Kế: #4 Dĩ Dật Đãi Lao, #25 Thâu Lương Hoán Trụ
// Điều 3: CHỈ MAP + ANALYZE, KHÔNG CODE → chuyển Builder
// Điều 7: Mọi mission phải qua planning trước khi execute
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'architect';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const ARCHITECT_INTERVAL = 4 * 60 * 60 * 1000;

async function callGeminiFlash(prompt) {
    try {
        const PROXY_URL = 'http://127.0.0.1:8080/v1/messages';
        const MODEL = 'gemini-2.5-flash';

        if (!QL.validateModelTier(DAEMON_NAME, MODEL)) return null;

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "user", content: `You are the Architect Agent. Analyze file structures for cohesion/coupling issues. Return JSON: { score: 0-100, issues: [], refactor_mission: string }. \n\n${prompt}` }
                ],
                max_tokens: 4096,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        let content = data.content[0].text;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(content);
    } catch (e) {
        QL.logQuanLuat(DAEMON_NAME, `❌ API Call Failed: ${e.message}`);
        return null;
    }
}

function generateSystemMap(projectDir) {
    try {
        // CLI Supremacy: 'tree' is faster than any Node.js recursion
        // Limit depth to 3 to keep context light
        const treeMap = execSync(`tree -L 3 -I 'node_modules|dist|build|.git|.next' ${projectDir}`, { encoding: 'utf-8' });
        return treeMap;
    } catch (e) {
        return `Error running tree: ${e.message}`;
    }
}

async function architectLoop() {
    QL.logQuanLuat(DAEMON_NAME, '🏛️ Architect Daemon STARTED (System Designer)');
    if (!QL.checkTerritory(DAEMON_NAME, 'map_structure')) return;

    const project = config.SATELLITE_PROJECTS[Math.floor(Math.random() * config.SATELLITE_PROJECTS.length)];
    const projectDir = path.join(config.MEKONG_DIR, 'apps', project);

    if (!fs.existsSync(projectDir)) {
        QL.logQuanLuat(DAEMON_NAME, `Project dir not found: ${projectDir}`);
        return;
    }

    QL.logQuanLuat(DAEMON_NAME, `Mapping Structure for: ${project}...`);

    const systemMap = generateSystemMap(projectDir);

    const analysis = await callGeminiFlash(`Analyze this project structure for Modular Monolith compliance:\n\n${systemMap}`);

    if (analysis && analysis.score < 70) {
        if (!QL.checkQueueDiscipline(DAEMON_NAME)) return;
        const missionFile = path.join(config.MEKONG_DIR, 'tasks', `MEDIUM_mission_${project}_architect_refactor_${Date.now()}.txt`);
        const instruction = `/plan:hard "Architect Agent Alert: Project ${project} structural integrity is low (${analysis.score}/100). Issues: ${JSON.stringify(analysis.issues)}. Requesting refactoring strategy."`;

        fs.writeFileSync(missionFile, instruction);
        QL.logQuanLuat(DAEMON_NAME, `📐 Created Architecture Mission: ${missionFile}`);
        QL.createSignal(DAEMON_NAME, 'dispatcher', 'ARCH_ISSUE', { project, score: analysis.score, issues: analysis.issues }, 'MEDIUM');
    } else {
        QL.logQuanLuat(DAEMON_NAME, `✅ Structure looks solid (${analysis ? analysis.score : '?'}/100).`);
    }
}

// Run immediately then interval
architectLoop();
setInterval(architectLoop, ARCHITECT_INTERVAL);
