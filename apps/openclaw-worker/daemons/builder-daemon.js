const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');
const QL = require('./lib/quan-luat-enforcer');
const { emit, SIGNALS } = require('./lib/signal-bus');

// ═══════════════════════════════════════════════════════════════
// 🏯 BUILDER DAEMON — 工兵 (Công Binh)
// ═══════════════════════════════════════════════════════════════
// Rank: CONG_BINH (Công Binh — Engineer)
// Territory: tech_debt
// 36 Kế: #3 Tá Đao Sát Nhân, #14 Tá Thi Hoàn Hồn
// Điều 3: KHÔNG SCAN, CHỈ FIX → nhận signal từ Hunter
// Điều 4: Gemini Flash tier (FREE) — CẤM dùng Premium
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'builder';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const BUILDER_INTERVAL = 45 * 60 * 1000;
const MEKONG_DIR = config.MEKONG_DIR;

async function callGeminiFlash(prompt) {
  // 🏭 HẬU CẦN: NVIDIA DIRECT (bypass proxy — PERMANENT RULE)
  try {
    const nvidia = require('./lib/nvidia-client');
    const result = await nvidia.analyze(prompt, {
      daemon: DAEMON_NAME,
      tier: 'heavy', // Builder needs deep reasoning (Qwen3-480B/DeepSeek)
      maxTokens: 4096,
      system: 'You are the Master Builder (Tech Lead). Analyze code and return actionable JSON when possible.',
    });

    let content = result.content;
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    try { return JSON.parse(content); } catch (e) { return content; }
  } catch (e) {
    QL.logQuanLuat(DAEMON_NAME, `❌ NVIDIA Call Failed: ${e.message}`);
    return null;
  }
}

function findTodos() {
  try {
    // Grep TODOs in apps/ and src/ (limit 10)
    const cmd = `grep -r "TODO" "${path.join(MEKONG_DIR, 'apps')}" "${path.join(MEKONG_DIR, 'src')}" | head -n 10`;
    return execSync(cmd).toString().trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

function findLargeFiles() {
  try {
    // Find files > 300 lines (limit 5)
    // Using find + wc -l approach
    // Note: This matches standard Linux/Mac find/wc behavior
    const cmd = `find "${path.join(MEKONG_DIR, 'apps')}" -name "*.js" -o -name "*.ts" -type f -exec wc -l {} + | awk '$1 > 300' | sort -nr | head -n 5`;
    return execSync(cmd).toString().trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

// ... existing methods ...

const TASKS_DIR = path.join(MEKONG_DIR, 'tasks');
const ARCHIVE_DIR = path.join(MEKONG_DIR, 'tasks', 'archive');
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

async function processAutoFixTasks() {
  try {
    const tasks = fs.readdirSync(TASKS_DIR).filter(f => f.startsWith('HIGH_mission_signal_') && f.endsWith('.txt'));
    QL.logQuanLuat(DAEMON_NAME, `DEBUG: Checking tasks... Found ${tasks.length}`);

    if (tasks.length === 0) return;

    QL.logQuanLuat(DAEMON_NAME, `🔧 Found ${tasks.length} Auto-Fix Missions...`);

    for (const taskFile of tasks) {
      const taskPath = path.join(TASKS_DIR, taskFile);
      const content = fs.readFileSync(taskPath, 'utf8');

      // Parse Mission (Flexible Regex)
      // Pattern A: "Signal [TYPE]: <Issue>. Location: <File>. Requesting..."
      // Pattern B: "Signal [TYPE]: <Issue>. Action: <Action>. Requesting..."

      let type, issue, location;

      const matchLoc = content.match(/Signal \[(.*?)\]: ([\s\S]*?)\. Location: ([\s\S]*?)\. Requesting/);
      const matchAct = content.match(/Signal \[(.*?)\]: ([\s\S]*?)\. Action: ([\s\S]*?)\. Requesting/);

      if (matchLoc) {
        [_, type, issue, location] = matchLoc;
      } else if (matchAct) {
        [_, type, issue, location] = matchAct; // Treat Action as Location/Context
      } else {
        QL.logQuanLuat(DAEMON_NAME, `⚠️ Could not parse mission: ${taskFile}`);
        // Archive to avoid infinite loop
        fs.renameSync(taskPath, path.join(ARCHIVE_DIR, taskFile));
        continue;
      }

      // SPECIAL HANDLER: OPS_ALERT
      if (type === 'OPS_ALERT') {
        QL.logQuanLuat(DAEMON_NAME, `🚨 Received OPS_ALERT (Non-Code Issue): ${issue}`);
        QL.logQuanLuat(DAEMON_NAME, `ℹ️ Action Required: ${location}`);
        // Archive it as "Acknowledged" (Builder cannot fix System Memory)
        fs.renameSync(taskPath, path.join(ARCHIVE_DIR, taskFile));
        continue;
      }

      const absoluteFilePath = location.startsWith('/') || location.startsWith('http') ? location : path.join(MEKONG_DIR, location);

      // For OPS Alerts or URL issues, we can't "fix file content" directly in the same way.
      // But let's let Gemini try to handle it or just log it.
      if (location.startsWith('http')) {
        QL.logQuanLuat(DAEMON_NAME, `⚠️ Skipping URL target for now: ${location}`);
        fs.unlinkSync(taskPath); // Delete properly so it doesn't clutter
        continue;
      }

      if (!fs.existsSync(absoluteFilePath)) {
        QL.logQuanLuat(DAEMON_NAME, `❌ File not found: ${absoluteFilePath}`);
        fs.renameSync(taskPath, path.join(ARCHIVE_DIR, taskFile));
        continue;
      }

      const fileContent = fs.readFileSync(absoluteFilePath, 'utf8');

      QL.logQuanLuat(DAEMON_NAME, `🧬 Evolving Code: ${location}`);

      // Ask Gemini for the Fix
      const prompt = `You are an Autonomous Code Builder.
Fix this issue: "${issue}"
In file: "${location}"

Current Content:
${fileContent}

Return ONLY the full corrected file content. No markdown, no explanations.`;

      const fixedContent = await callGeminiFlash(prompt);

      if (fixedContent && fixedContent !== fileContent && fixedContent.length > 0) {
        // Apply Fix
        fs.writeFileSync(absoluteFilePath, fixedContent);
        QL.logQuanLuat(DAEMON_NAME, `✅ Fix Applied to ${location}`);

        // Emit Signal (CHÍNH: QL + KỲ: signal-bus)
        QL.createSignal(DAEMON_NAME, 'reviewer', 'CLEANUP_DONE', { file: location, issue }, 'MEDIUM');
        emit(SIGNALS.CLEANUP_DONE, { source: DAEMON_NAME, project: location, detail: `Fix applied: ${issue.slice(0, 80)}` });

        // Archive Task
        fs.renameSync(taskPath, path.join(ARCHIVE_DIR, taskFile));
      } else {
        QL.logQuanLuat(DAEMON_NAME, `⚠️ AI could not generate fix or no change needed.`);
        // Move to processed anyway to avoid loop? Or keep? 
        // Let's archive to be safe.
        fs.renameSync(taskPath, path.join(ARCHIVE_DIR, taskFile));
      }
    }
  } catch (e) {
    QL.logQuanLuat(DAEMON_NAME, `❌ Auto-Fix Error: ${e.message}`);
  }
}

async function builderLoop() {
  QL.logQuanLuat(DAEMON_NAME, '👷 Operations Builder Daemon STARTED (Auto-Fixer)');

  setInterval(async () => {
    if (!QL.checkTerritory(DAEMON_NAME, 'fix')) return;
    try {
      // 1. Auto-Fix Cycle (High Priority)
      await processAutoFixTasks();

      // 2. Tech Debt Scan (Low Priority - every 45m)
      // We can use a counter or timestamp to limit this run
      const now = Date.now();
      if (!this.lastScan || now - this.lastScan > BUILDER_INTERVAL) {
        QL.logQuanLuat(DAEMON_NAME, 'Scanning for Tech Debt...');
        const todos = findTodos();
        const largeFiles = findLargeFiles();

        if (todos.length > 0 || largeFiles.length > 0) {
          // ... generate mission logic ...
          // (Keep existing logic here or simplify)
        }
        this.lastScan = now;
      }

    } catch (err) {
      QL.logQuanLuat(DAEMON_NAME, `❌ Loop error: ${err.message}`);
    }
  }, 10000); // Check every 10 seconds for Auto-Fix
}

builderLoop();
