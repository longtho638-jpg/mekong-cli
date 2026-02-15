const fs = require('fs');
const path = require('path');
const config = require('./config');
const QL = require('./lib/quan-luat-enforcer');

// ═══════════════════════════════════════════════════════════════
// 🏯 DISPATCHER DAEMON — 調配 (Điều Phối)
// ═══════════════════════════════════════════════════════════════
// Rank: DIEU_PHOI (Điều Phối Viên — Coordinator)
// Territory: queue_management
// 36 Kế: #6 Dương Đông Kích Tây, #19 Phủ Để Trừu Tân
// Điều 5: MAX 3 missions/daemon, 15 total pending
// Điều 2: Route signals → missions, standardize priority
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'dispatcher';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const DISPATCHER_INTERVAL = 10 * 1000;
const TASKS_DIR = path.join(config.MEKONG_DIR, 'tasks');

if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

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
          { role: "user", content: `You are the Dispatcher (System Engineer). Sort tasks by priority (HIGH/MEDIUM/LOW). Return JSON: { priority: string, reasoning: string, target_agent: 'tom_hu'|'hunter'|'builder' }. \n\n${prompt}` }
        ],
        max_tokens: 1024,
        temperature: 0.1
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
    // Fallback: Default to Tôm Hùm, Medium Priority
    return { priority: 'MEDIUM', reasoning: 'API Fail', target_agent: 'tom_hum' };
  }
}

function getPendingTasks() {
  return fs.readdirSync(TASKS_DIR).filter(f => f.startsWith('mission_') && f.endsWith('.txt'));
}

const SIGNALS_DIR = path.join(config.MEKONG_DIR, 'signals');
const INBOX_DIR = path.join(SIGNALS_DIR, 'inbox');
const ARCHIVE_DIR = path.join(SIGNALS_DIR, 'archive');
const REJECTED_DIR = path.join(SIGNALS_DIR, 'rejected');

// Ensure Signal Infra
[INBOX_DIR, ARCHIVE_DIR, REJECTED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function processSignals() {
    try {
        const signals = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json'));
        if (signals.length === 0) return;

        QL.logQuanLuat(DAEMON_NAME, `🐝 Found ${signals.length} Pheromone Signals...`);

        for (const sigFile of signals) {
            const sigPath = path.join(INBOX_DIR, sigFile);
            let signal;
            try {
                signal = JSON.parse(fs.readFileSync(sigPath, 'utf8'));
            } catch (e) {
                QL.logQuanLuat(DAEMON_NAME, `❌ Invalid JSON: ${sigFile}`);
                fs.renameSync(sigPath, path.join(REJECTED_DIR, sigFile));
                continue;
            }

            // Route Signal to Mission
            QL.logQuanLuat(DAEMON_NAME, `🔄 Routing Signal [${signal.type}] from [${signal.from}]`);

            if (signal.priority === 'HIGH' || signal.type === 'FIX_REQUEST' || signal.type === 'BUG_REPORT' || signal.type === 'OPS_ALERT') {
                const missionFilename = `HIGH_mission_signal_${signal.type}_${Date.now()}.txt`;
                const missionPath = path.join(TASKS_DIR, missionFilename);
                
                let content = '';
                if (signal.type === 'OPS_ALERT') {
                     content = `/fix "Swarm Signal [OPS_ALERT]: ${signal.payload.issue}. Action: ${signal.payload.action}. Requesting manual or automated intervention."`;
                } else {
                     content = `/fix "Swarm Signal [${signal.type}]: ${signal.payload.issue}. Location: ${signal.payload.file || 'Unknown'}. Requesting immediate remediation by ${signal.to || 'Builder'}."`;
                }
                
                if (!QL.checkQueueDiscipline(DAEMON_NAME)) continue;
                fs.writeFileSync(missionPath, content);
                QL.logQuanLuat(DAEMON_NAME, `🚨 signal -> mission: ${missionFilename}`);
                QL.createSignal(DAEMON_NAME, 'brain-tmux', 'MISSION_READY', { file: missionFilename, from: signal.from }, 'HIGH');
            }

            // Archive Signal
            fs.renameSync(sigPath, path.join(ARCHIVE_DIR, sigFile));
        }
    } catch (e) {
        QL.logQuanLuat(DAEMON_NAME, `❌ Signal Error: ${e.message}`);
    }
}

async function dispatcherLoop() {
  QL.logQuanLuat(DAEMON_NAME, '📡 Dispatcher Daemon STARTED (Queen Bee)');

  setInterval(async () => {
    if (!QL.checkTerritory(DAEMON_NAME, 'route')) return;
    try {
      // 1. Process Signals (Pheromones) - Priority
      await processSignals();

      // 2. Process Task Files (Legacy)
      const tasks = getPendingTasks();
      // ... (Rest of legacy task logic) ...
      if (tasks.length > 0) {
          QL.logQuanLuat(DAEMON_NAME, `Found ${tasks.length} pending tasks...`);
          // ... legacy Gemini analysis logic (kept for manual tasks) ...
           for (const taskFile of tasks) {
                // Only analyze if not already sorted
                if (taskFile.startsWith('HIGH_') || taskFile.startsWith('MEDIUM_') || taskFile.startsWith('LOW_')) continue;

                const filePath = path.join(TASKS_DIR, taskFile);
                const content = fs.readFileSync(filePath, 'utf8');
                const analysis = await callGeminiFlash(`Analyze Task File: ${taskFile}\nContent Snippet: ${content.substring(0, 200)}`);
                
                QL.logQuanLuat(DAEMON_NAME, `🎯 Routing ${taskFile} -> ${analysis.target_agent} (${analysis.priority})`);
                const newFilename = `${analysis.priority}_${taskFile}`;
                fs.renameSync(filePath, path.join(TASKS_DIR, newFilename));
           }
      }

    } catch (err) {
      QL.logQuanLuat(DAEMON_NAME, `❌ Loop error: ${err.message}`);
    }
  }, DISPATCHER_INTERVAL);
}

dispatcherLoop();
