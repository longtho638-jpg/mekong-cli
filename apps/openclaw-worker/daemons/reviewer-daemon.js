const fs = require('fs');
const path = require('path');
const config = require('./config');
const QL = require('./lib/quan-luat-enforcer');

// ═══════════════════════════════════════════════════════════════
// 🏯 REVIEWER DAEMON — 憲兵 (Hiến Binh)
// ═══════════════════════════════════════════════════════════════
// Rank: HIEN_BINH (Hiến Binh — Military Police)
// Territory: code_quality
// 36 Kế: #27 Giả Si Bất Điên, #35 Liên Hoàn Kế
// Điều 3: CHỈ AUDIT + RATE, KHÔNG FIX → chuyển Builder
// Điều 4: Gemini Flash tier (FREE)
// ═══════════════════════════════════════════════════════════════

const DAEMON_NAME = 'reviewer';
const DAEMON_RANK = QL.RANKS[DAEMON_NAME];
const REVIEW_INTERVAL = 30 * 60 * 1000;
const PROJECTS_DIR = path.join(config.MEKONG_DIR, 'apps');
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next'];

async function callGeminiFlash(prompt) {
  // 🏭 HẬU CẦN: NVIDIA DIRECT (bypass proxy — PERMANENT RULE)
  try {
    const nvidia = require('./lib/nvidia-client');
    const result = await nvidia.analyze(prompt, {
      daemon: DAEMON_NAME,
      tier: 'heavy', // Reviewer needs deep code analysis (DeepSeek-V3.1)
      maxTokens: 4096,
      system: 'You are the Senior Code Reviewer of AgencyOS. Analyze the code. Return JSON: { score: number(1-10), issues: string[], suggestion: string }. Strict quality standards.',
    });

    let content = result.content;
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(content);
  } catch (e) {
    QL.logQuanLuat(DAEMON_NAME, `❌ NVIDIA Call Failed: ${e.message}`);
    return null;
  }
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (IGNORE_DIRS.includes(file)) return;
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (['.js', '.ts', '.tsx', '.jsx'].includes(path.extname(file))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

async function reviewerLoop() {
  QL.logQuanLuat(DAEMON_NAME, '🧐 Reviewer Daemon STARTED');

  setInterval(async () => {
    if (!QL.checkTerritory(DAEMON_NAME, 'audit')) return;
    try {
      const allFiles = getAllFiles(PROJECTS_DIR);
      if (allFiles.length === 0) return;

      // Pick 1 random file to audit
      const randomFile = allFiles[Math.floor(Math.random() * allFiles.length)];
      const relativePath = path.relative(config.MEKONG_DIR, randomFile);

      QL.logQuanLuat(DAEMON_NAME, `Auditing: ${relativePath}`);
      const content = fs.readFileSync(randomFile, 'utf8');

      if (content.length > 10000) {
        QL.logQuanLuat(DAEMON_NAME, `Skipped ${relativePath} (Too large)`);
        return;
      }

      const review = await callGeminiFlash(`File: ${relativePath}\n\nCode:\n${content}`);

      if (review && review.score < 6) {
        QL.logQuanLuat(DAEMON_NAME, `🚨 Low Quality Detected (${review.score}/10): ${relativePath}`);
        QL.logQuanLuat(DAEMON_NAME, `Issues: ${review.issues.join(', ')}`);

        // 虛實 BOM CONTEXT: Include actual code + issues in mission (CC CLI skips scanning)
        const missionContent = `COMPLEXITY: SIMPLE
TIMEOUT: 15
PROJECT: all

/cook "虛實 REVIEWER INTEL: Code quality ${review.score}/10 — ${relativePath}. Trả lời bằng TIẾNG VIỆT.

🎯 PRE-ANALYZED BY HẬU CẦN (CC CLI KHÔNG CẦN SCAN):

📍 File: ${relativePath}
📊 Score: ${review.score}/10 (cần > 8/10)

🔍 Issues found:
${review.issues.map(i => '  ❌ ' + i).join('\n')}

💡 Suggestion: ${review.suggestion}

📋 Code snippet (first 100 lines):
${content.split('\n').slice(0, 100).map((l, i) => `  ${i + 1}: ${l}`).join('\n')}

Task:
1. Fix ĐÚNG issues đã liệt kê ở trên tại ${relativePath}.
2. Không scan, vì Hậu Cần đã scan xong.
3. Verify: build/lint.
4. Report: FIXED_COUNT, NEW_SCORE." --auto
`;
        const filename = `mission_reviewer_fix_${path.basename(randomFile, path.extname(randomFile))}_${Date.now()}.txt`;
        const missionPath = path.join(config.MEKONG_DIR, 'tasks', filename);
        if (!QL.checkQueueDiscipline(DAEMON_NAME)) return;
        fs.writeFileSync(missionPath, missionContent);
        QL.logQuanLuat(DAEMON_NAME, `👮 Generated Fix Mission: ${filename}`);
        QL.createSignal(DAEMON_NAME, 'builder', 'REVIEW_REQUEST', { file: relativePath, score: review.score, issues: review.issues }, 'MEDIUM');
      } else {
        QL.logQuanLuat(DAEMON_NAME, `✅ Passed Audit (${review ? review.score : 'N/A'}/10): ${relativePath}`);
      }

    } catch (err) {
      QL.logQuanLuat(DAEMON_NAME, `❌ Audit error: ${err.message}`);
    }
  }, REVIEW_INTERVAL);
}

reviewerLoop();
