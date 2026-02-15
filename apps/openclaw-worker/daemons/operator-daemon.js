const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');
const QL = require('./lib/quan-luat-enforcer');
const { emit, SIGNALS } = require('./lib/signal-bus');

// ═══════════════════════════════════════════════════════════════
// 🏯 OPERATOR DAEMON — 哨兵 (Lính Canh)
// ═══════════════════════════════════════════════════════════════
// Rank: LINH_CANH (Lính Canh — Sentinel)
// Territory: system_health
// 36 Kế: #6 Thanh Đông Kích Tây, #15 Điệu Hổ Ly Sơn
// Điều 6: CANH GÁC BẮT BUỘC — Health check every 5min
// Điều 4: Gemini Flash tier (FREE)
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'operator';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const OPERATOR_INTERVAL = 5 * 60 * 1000;

async function callGeminiFlash(prompt) {
    const MODEL = 'gemini-2.5-flash';
    if (!QL.validateModelTier(DAEMON_NAME, MODEL)) return null;

    try {
        const PROXY_URL = 'http://127.0.0.1:8080/v1/messages';
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "user", content: `You are the Operator Agent (DevOps SRE). Analyze system health metrics. Return JSON: { status: 'healthy'|'warning'|'critical', action_needed: boolean, mission_prompt: string }. \n\n${prompt}` }
                ],
                max_tokens: 4096,
                temperature: 0.2
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

function getSystemMetrics() {
    try {
        const uptime = execSync('uptime').toString().trim();
        const disk = execSync('df -h /').toString().trim();
        const memory = execSync('vm_stat').toString().trim();
        return `UPTIME: ${uptime}\nDISK:\n${disk}\nMEMORY:\n${memory}`;
    } catch (e) {
        return `Error gathering metrics: ${e.message}`;
    }
}

function sendSignal(type, payload, priority = 'MEDIUM', to = 'dispatcher') {
    // Điều 2: Signal chuẩn qua QL enforcer
    const signal = QL.createSignal(DAEMON_NAME, to, type, payload, priority);
    const inboxDir = path.join(config.MEKONG_DIR, 'signals', 'inbox');
    try {
        if (!fs.existsSync(inboxDir)) fs.mkdirSync(inboxDir, { recursive: true });
        fs.writeFileSync(path.join(inboxDir, `${signal.id}.json`), JSON.stringify(signal, null, 2));
    } catch (e) { /* silent */ }
    QL.logQuanLuat(DAEMON_NAME, `📡 Signal: ${type} → ${to} (${priority})`);
}

async function operatorLoop() {
    QL.logQuanLuat(DAEMON_NAME, '🛠️ Operator Daemon STARTED');
    if (!QL.checkTerritory(DAEMON_NAME, 'health_check')) return;

    const metrics = getSystemMetrics();
    const analysis = await callGeminiFlash(`Analyze these system metrics for a MacOS development environment. Identify any critical resource exhaustion or hung processes.\n\n${metrics}`);

    if (analysis && analysis.action_needed) {
        QL.logQuanLuat(DAEMON_NAME, `🚨 Condition Red: ${analysis.status}`);
        sendSignal('HEALTH_ALERT', {
            issue: `System Health Check Failed: ${analysis.status}`,
            action: analysis.mission_prompt, metrics
        }, 'HIGH', 'dispatcher');
        emit(SIGNALS.HEALTH_ALERT, { source: DAEMON_NAME, detail: `Condition Red: ${analysis.status}` });
    } else {
        QL.logQuanLuat(DAEMON_NAME, `✅ System Healthy. Status: ${analysis ? analysis.status : 'Unknown'}`);
        QL.createSignal(DAEMON_NAME, 'scribe', 'HEALTH_ALERT', { status: 'healthy' }, 'LOW');
    }
}

operatorLoop();
setInterval(operatorLoop, OPERATOR_INTERVAL);
