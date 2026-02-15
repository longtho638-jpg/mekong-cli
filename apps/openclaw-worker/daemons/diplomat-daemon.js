const fs = require('fs');
const path = require('path');
const config = require('./config');
const QL = require('./lib/quan-luat-enforcer');

// ═══════════════════════════════════════════════════════════════
// 🏯 DIPLOMAT DAEMON — 外交 (Ngoại Giao)
// ═══════════════════════════════════════════════════════════════
// Rank: NGOAI_GIAO (Ngoại Giao Quan — Diplomat)
// Territory: documentation
// 36 Kế: #11 Lý Đại Đào Cương, #22 Quan Môn Tróc Tặc
// Điều 3: CHỈ UPDATE DOCS, KHÔNG CODE → đọc + viết README/CHANGELOG
// Điều 8: Liên lạc không đứt — docs phải current
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'diplomat';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const DIPLOMAT_INTERVAL = 60 * 60 * 1000;
const PROJECTS_DIR = path.join(config.MEKONG_DIR, 'apps');

async function callGeminiFlash(prompt) {
  // 🏭 HẬU CẦN: NVIDIA DIRECT (bypass proxy — PERMANENT RULE)
  try {
    const nvidia = require('./lib/nvidia-client');
    const result = await nvidia.analyze(prompt, {
      daemon: DAEMON_NAME,
      tier: 'light', // Diplomat = doc analysis, fast models ok
      maxTokens: 4096,
      system: 'You are the Diplomat of AgencyOS. Update documentation. Read the provided code structure and update the README.md to reflect the current state. Return ONLY the markdown content for README.md.',
    });
    return result.content.trim();
  } catch (e) {
    QL.logQuanLuat(DAEMON_NAME, `❌ NVIDIA Call Failed: ${e.message}`);
    return null;
  }
}

function getProjectDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(file => fs.statSync(path.join(srcpath, file)).isDirectory());
}

async function diplomatLoop() {
  QL.logQuanLuat(DAEMON_NAME, '🕊️ Diplomat Daemon STARTED');

  setInterval(async () => {
    if (!QL.checkTerritory(DAEMON_NAME, 'scan_docs')) return;
    try {
      const projects = getProjectDirectories(PROJECTS_DIR);

      for (const project of projects) {
        const projectPath = path.join(PROJECTS_DIR, project);
        const readmePath = path.join(projectPath, 'README.md');

        let shouldUpdate = false;

        if (!fs.existsSync(readmePath)) {
          shouldUpdate = true;
          QL.logQuanLuat(DAEMON_NAME, `Missing README in ${project}. Creating...`);
        } else {
          const stats = fs.statSync(readmePath);
          const daysOld = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
          if (daysOld > 7) {
            shouldUpdate = true;
            QL.logQuanLuat(DAEMON_NAME, `README in ${project} is ${Math.floor(daysOld)} days old. Updating...`);
          }
        }

        if (shouldUpdate) {
          const files = fs.readdirSync(projectPath).slice(0, 20).join(', ');
          const packageJsonPath = path.join(projectPath, 'package.json');
          let pkgInfo = '';
          if (fs.existsSync(packageJsonPath)) {
            pkgInfo = fs.readFileSync(packageJsonPath, 'utf8');
          }

          const prompt = `Project: ${project}\nFiles: ${files}\nPackage.json: ${pkgInfo}\n\nGenerate a professional README.md for this project.`;

          const newReadme = await callGeminiFlash(prompt);

          if (newReadme) {
            fs.writeFileSync(readmePath, newReadme);
            QL.logQuanLuat(DAEMON_NAME, `✅ Updated README.md for ${project}`);
            QL.createSignal(DAEMON_NAME, 'scribe', 'DOCS_UPDATED', { project, file: readmePath }, 'LOW');
          }
        }
      }

    } catch (err) {
      QL.logQuanLuat(DAEMON_NAME, `❌ Scan error: ${err.message}`);
    }
  }, DIPLOMAT_INTERVAL);
}

diplomatLoop();
