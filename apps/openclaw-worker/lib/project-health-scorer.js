/**
 * Project Health Scorer — Chấm điểm sức khỏe project 0-100
 *
 * Scoring:
 *   Build check     +20: npm run build hoặc tsc --noEmit thành công
 *   Test check      +25: npm test thành công
 *   Lint check      +15: không có lỗi nghiêm trọng
 *   README check    +10: README.md tồn tại và > 100 bytes
 *   package.json    +10: có name, version, scripts
 *   Git clean       +10: không có thay đổi uncommitted
 *   Production URL  +10: curl trả về HTTP 200 (tùy chọn)
 *
 * Ý nghĩa điểm:
 *   < 70    → FIX mode (ưu tiên Phase 2)
 *   70–89   → STANDARD pipeline
 *   >= 90   → SHIP mode (fast-track Phase 5)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCORE_WEIGHTS = {
  build:      20,
  test:       25,
  lint:       15,
  readme:     10,
  packageJson: 10,
  gitClean:   10,
  production: 10,
};

/**
 * Chạy lệnh shell, trả về { ok: bool, output: string }
 */
function runCheck(cmd, cwd, timeoutMs) {
  try {
    const output = execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      timeout: timeoutMs || 60000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, output: output || '' };
  } catch (e) {
    return { ok: false, output: (e.stdout || '') + (e.stderr || '') };
  }
}

/**
 * Kiểm tra README.md tồn tại và đủ nội dung (> 100 bytes)
 */
function checkReadme(projectDir) {
  const readmePath = path.join(projectDir, 'README.md');
  try {
    const stat = fs.statSync(readmePath);
    return stat.size > 100;
  } catch (e) {
    return false;
  }
}

/**
 * Kiểm tra package.json có đầy đủ name, version, scripts
 */
function checkPackageJson(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return !!(pkg.name && pkg.version && pkg.scripts);
  } catch (e) {
    return false;
  }
}

/**
 * Kiểm tra git working tree sạch (không có file thay đổi chưa commit)
 */
function checkGitClean(projectDir) {
  const result = runCheck('git status --porcelain', projectDir, 10000);
  if (!result.ok) return false;
  // Output rỗng = working tree sạch
  return result.output.trim().length === 0;
}

/**
 * Kiểm tra production URL trả về HTTP 200
 * Đọc URL từ package.json (field "homepage") hoặc vercel.json
 */
function checkProductionUrl(projectDir) {
  let url = null;

  // Thử đọc từ package.json
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
    if (pkg.homepage && pkg.homepage.startsWith('http')) url = pkg.homepage;
  } catch (e) { /* bỏ qua */ }

  // Thử đọc từ vercel.json (alias field)
  if (!url) {
    try {
      const vcfg = JSON.parse(fs.readFileSync(path.join(projectDir, 'vercel.json'), 'utf-8'));
      const aliases = vcfg.alias || vcfg.aliases || [];
      if (aliases.length > 0) url = `https://${aliases[0]}`;
    } catch (e) { /* bỏ qua */ }
  }

  // Không có URL → bỏ qua kiểm tra (không trừ điểm)
  if (!url) return null;

  const result = runCheck(`curl -sI "${url}" | head -1`, projectDir, 8000);
  return result.ok && result.output.includes('200');
}

/**
 * Chấm điểm sức khỏe project.
 * @param {string} projectDir - Đường dẫn tuyệt đối tới thư mục project
 * @returns {Promise<{score: number, details: object, mode: string}>}
 */
async function scoreProject(projectDir) {
  const details = {};
  let score = 0;

  // Kiểm tra thư mục tồn tại
  if (!fs.existsSync(projectDir)) {
    return { score: 0, details: { error: 'Project directory not found' }, mode: 'FIX' };
  }

  // --- package.json (+10) ---
  const hasPkg = checkPackageJson(projectDir);
  details.packageJson = hasPkg;
  if (hasPkg) score += SCORE_WEIGHTS.packageJson;

  // Đọc scripts nếu có package.json
  let scripts = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
    scripts = pkg.scripts || {};
  } catch (e) { /* không có package.json */ }

  // --- Build check (+20) ---
  if (scripts.build) {
    const buildResult = runCheck('npm run build 2>&1', projectDir, 120000);
    details.build = buildResult.ok;
    if (buildResult.ok) score += SCORE_WEIGHTS.build;
  } else if (fs.existsSync(path.join(projectDir, 'tsconfig.json'))) {
    // Fallback: tsc --noEmit
    const tscResult = runCheck('npx tsc --noEmit 2>&1', projectDir, 60000);
    details.build = tscResult.ok;
    if (tscResult.ok) score += SCORE_WEIGHTS.build;
  } else {
    // Không có build script → SKIP (không cộng, không trừ)
    details.build = null;
  }

  // --- Test check (+25) ---
  if (scripts.test) {
    const testResult = runCheck('npm test 2>&1', projectDir, 120000);
    details.test = testResult.ok;
    if (testResult.ok) score += SCORE_WEIGHTS.test;
  } else {
    details.test = null;
  }

  // --- Lint check (+15) ---
  if (scripts.lint) {
    const lintResult = runCheck('npm run lint 2>&1', projectDir, 60000);
    details.lint = lintResult.ok;
    if (lintResult.ok) score += SCORE_WEIGHTS.lint;
  } else {
    details.lint = null;
  }

  // --- README check (+10) ---
  details.readme = checkReadme(projectDir);
  if (details.readme) score += SCORE_WEIGHTS.readme;

  // --- Git clean check (+10) ---
  details.gitClean = checkGitClean(projectDir);
  if (details.gitClean) score += SCORE_WEIGHTS.gitClean;

  // --- Production URL check (+10, tùy chọn) ---
  const prodOk = checkProductionUrl(projectDir);
  details.production = prodOk;
  if (prodOk === true) score += SCORE_WEIGHTS.production;
  // prodOk === null → bỏ qua, không ảnh hưởng điểm

  // Chuẩn hóa điểm về tối đa 100
  // Khi một số kiểm tra bị SKIP (null), tính lại max có thể đạt được
  let maxPossible = 100;
  if (details.build === null) maxPossible -= SCORE_WEIGHTS.build;
  if (details.test === null) maxPossible -= SCORE_WEIGHTS.test;
  if (details.lint === null) maxPossible -= SCORE_WEIGHTS.lint;
  if (details.production === null) maxPossible -= SCORE_WEIGHTS.production;

  // Scale điểm về 100 nếu max < 100
  const normalizedScore = maxPossible > 0
    ? Math.round((score / maxPossible) * 100)
    : 0;

  // Xác định mode dựa trên điểm
  let mode;
  if (normalizedScore >= 90) {
    mode = 'SHIP';       // Fast-track Phase 5
  } else if (normalizedScore >= 70) {
    mode = 'STANDARD';  // Pipeline bình thường
  } else {
    mode = 'FIX';       // Ưu tiên Phase 2 — sửa lỗi
  }

  return { score: normalizedScore, rawScore: score, maxPossible, details, mode };
}

module.exports = { scoreProject, SCORE_WEIGHTS };
