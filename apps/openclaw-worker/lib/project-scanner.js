/**
 * AGI Level 4: Self-Planning Scanner — 始計→謀攻
 *
 * Quét toàn bộ project để lập kế hoạch cải thiện dài hạn.
 * Khác với Auto-CTO (chỉ fix lỗi build/test), Scanner tập trung vào:
 * 1. Tech debt (TODO/FIXME)
 * 2. Git status (uncommitted changes)
 * 3. Architectural improvements (via Gemini analysis)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config');
const { log } = require('./brain-tmux');

let scannerInterval = null;

async function analyzeProjectHealth(project, projectDir) {
  const stats = {
    project,
    timestamp: new Date().toISOString(),
    build: 'UNKNOWN',
    techDebt: {},
    gitStatus: 'CLEAN',
    recommendations: []
  };

  log(`[SCANNER] Analyzing health: ${project}...`);

  // 1. Check Build
  try {
    execSync('npm run build 2>&1', { cwd: projectDir, timeout: 60000 });
    stats.build = 'GREEN';
  } catch (e) {
    stats.build = 'RED';
  }

  // 2. Tech Debt (Count TODO/FIXME)
  try {
    const todoOutput = execSync(`grep -rE "TODO|FIXME" . --exclude-dir={node_modules,dist,.next,.claude} 2>/dev/null | wc -l`, { cwd: projectDir }).toString().trim();
    stats.techDebt.todos = parseInt(todoOutput) || 0;

    const consoleLogs = execSync(`grep -r "console.log" . --exclude-dir={node_modules,dist,.next,.claude} 2>/dev/null | wc -l`, { cwd: projectDir }).toString().trim();
    stats.techDebt.consoleLogs = parseInt(consoleLogs) || 0;
  } catch (e) {
    stats.techDebt.todos = 0;
    stats.techDebt.consoleLogs = 0;
    stats.techDebt.error = e.message;
  }

  // 3. Git Status
  try {
    const gitStatus = execSync('git status --porcelain', { cwd: projectDir }).toString().trim();
    stats.gitStatus = gitStatus ? 'DIRTY' : 'CLEAN';
  } catch (e) {
    stats.gitStatus = 'NOT_A_REPO';
  }

  // 4. LLM Strategy Analysis (始計)
  try {
    const summary = `Project: ${project}
Build: ${stats.build}
TODOs: ${stats.techDebt.todos}
Console Logs: ${stats.techDebt.consoleLogs}
Git Status: ${stats.gitStatus}`;

    const response = await fetch(`${config.CLOUD_BRAIN_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.FALLBACK_MODEL_NAME,
        messages: [
          { role: "system", content: "You are an AI CTO. Analyze project stats and provide 3 prioritized missions. Respond in TIẾNG VIỆT. Format as JSON: { missions: [{ title: string, priority: 'HIGH'|'MEDIUM', reason: string }] }" },
          { role: "user", content: summary }
        ],
        temperature: 0.2
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const analysis = JSON.parse(content);
      stats.recommendations = analysis.missions;
    }
  } catch (e) {
    log(`[SCANNER] LLM Analysis failed: ${e.message}`);
  }

  return stats;
}

async function runFullScan() {
  log(`[SCANNER] Starting Full Project Scan (Level 4)...`);
  const report = [];

  for (const project of config.PROJECTS) {
    const projectDir = path.join(config.MEKONG_DIR, 'apps', project);
    if (fs.existsSync(projectDir)) {
      const health = await analyzeProjectHealth(project, projectDir);
      report.push(health);

      // Auto-create missions for HIGH priority recommendations
      for (const mission of health.recommendations) {
        if (mission.priority === 'HIGH') {
          const filename = `HIGH_mission_${project}_planned_${Date.now()}.txt`;
          const content = `/cook "Trả lời bằng TIẾNG VIỆT. Planned Mission: ${mission.title}. Reason: ${mission.reason}" --auto`;
          fs.writeFileSync(path.join(config.WATCH_DIR, filename), content);
          log(`[SCANNER] Created HIGH priority mission for ${project}: ${mission.title}`);
        }
      }
    }
  }

  // Save central report
  const reportPath = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/health-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`[SCANNER] Full scan complete. Report saved to data/health-report.json`);
}

function startScanner() {
  if (scannerInterval) return;

  // Chạy ngay lần đầu
  runFullScan();

  scannerInterval = setInterval(runFullScan, config.SCANNER_INTERVAL_MS || 1800000);
}

function stopScanner() {
  if (scannerInterval) {
    clearInterval(scannerInterval);
    scannerInterval = null;
  }
}

module.exports = { startScanner, stopScanner };
