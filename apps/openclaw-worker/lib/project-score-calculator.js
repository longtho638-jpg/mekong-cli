'use strict';

/**
 * 🎯 RaaS AGI Project Score Calculator
 * 10 dimensions × 10 pts = 100/100
 * Ánh xạ 13 chương Binh Pháp → tiêu chí đo lường tự động.
 *
 * Grade S (≥90): RaaS AGI Ready — Vibe Factory ngừng inject task
 * Grade A (80-89): Near-ready
 * Grade B (60-79): In Progress
 * Grade C (40-59): Needs Work
 * Grade F (0-39): Critical
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper: run command safely, return { ok, output }
function run(cmd, cwd, timeoutMs = 15000) {
    try {
        const output = execSync(cmd, { cwd, encoding: 'utf-8', timeout: timeoutMs, stdio: ['pipe', 'pipe', 'pipe'] });
        return { ok: true, output: output.trim() };
    } catch (e) {
        return { ok: false, output: (e.stdout || e.stderr || e.message || '').toString().trim() };
    }
}

// 1. 始計 Planning — plans/ folder exists with plan.md
function scorePlanning(dir) {
    try {
        const plansDir = path.join(dir, 'plans');
        if (!fs.existsSync(plansDir)) return 0;
        const result = run(`find "${plansDir}" -name "plan.md" -type f 2>/dev/null | head -5`, dir);
        const count = result.output.split('\n').filter(l => l.trim()).length;
        if (count >= 3) return 10;
        if (count >= 1) return 7;
        return 3; // plans dir exists but no plan.md
    } catch { return 0; }
}

// 2. 作戰 Resources — Dependencies up-to-date
function scoreResources(dir) {
    if (!fs.existsSync(path.join(dir, 'package.json'))) return 0;
    const result = run('npm outdated --json 2>/dev/null', dir, 20000);
    if (!result.ok && !result.output) return 5; // command failed
    try {
        const outdated = JSON.parse(result.output || '{}');
        const count = Object.keys(outdated).length;
        if (count === 0) return 10;
        if (count <= 3) return 7;
        if (count <= 10) return 4;
        return 1;
    } catch { return 5; }
}

// 3. 謀攻 CI/CD — Pipeline exists
function scoreCICD(dir) {
    const ghActions = path.join(dir, '.github', 'workflows');
    const hasGH = fs.existsSync(ghActions);
    const hasVercel = fs.existsSync(path.join(dir, 'vercel.json'));
    const hasDocker = fs.existsSync(path.join(dir, 'Dockerfile'));
    let score = 0;
    if (hasGH) score += 6;
    if (hasVercel) score += 2;
    if (hasDocker) score += 2;
    // Check parent monorepo for CI
    if (score === 0) {
        const parentGH = path.join(dir, '..', '..', '.github', 'workflows');
        if (fs.existsSync(parentGH)) score += 4;
    }
    return Math.min(score, 10);
}

// 4. 軍形 Build — npm run build passes
function scoreBuild(dir) {
    if (!fs.existsSync(path.join(dir, 'package.json'))) return 0;
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
        if (!pkg.scripts || !pkg.scripts.build) return 3; // no build script
    } catch { return 0; }
    const result = run('npm run build 2>&1 | tail -5', dir, 60000);
    return result.ok ? 10 : 2;
}

// 5. 兵勢 Tests — npm test passes
function scoreTests(dir) {
    if (!fs.existsSync(path.join(dir, 'package.json'))) return 0;
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
        if (!pkg.scripts || !pkg.scripts.test) return 0; // no test script
    } catch { return 0; }
    const result = run('npm test 2>&1 | tail -5', dir, 60000);
    return result.ok ? 10 : 3;
}

// 6. 虛實 Security — npm audit
function scoreSecurity(dir) {
    if (!fs.existsSync(path.join(dir, 'package.json'))) return 5;
    const result = run('npm audit --json 2>/dev/null', dir, 20000);
    try {
        const audit = JSON.parse(result.output || '{}');
        const critical = (audit.metadata?.vulnerabilities?.critical || 0) + (audit.metadata?.vulnerabilities?.high || 0);
        if (critical === 0) return 10;
        if (critical <= 2) return 6;
        if (critical <= 5) return 3;
        return 0;
    } catch {
        return result.ok ? 7 : 4;
    }
}

// 7. 軍爭 Performance — Source file count as proxy (lean = fast)
function scorePerformance(dir) {
    const result = run(`find "${dir}/src" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l`, dir);
    const count = parseInt(result.output) || 0;
    if (count === 0) return 3; // no src
    if (count <= 50) return 10; // lean
    if (count <= 150) return 8;
    if (count <= 500) return 5;
    return 3; // bloated
}

// 8. 九變 Flexibility — TypeScript strict mode
function scoreTypeScript(dir) {
    const tsconfig = path.join(dir, 'tsconfig.json');
    if (!fs.existsSync(tsconfig)) return 3; // no TS
    try {
        const content = fs.readFileSync(tsconfig, 'utf-8');
        const hasStrict = /"strict"\s*:\s*true/.test(content);
        const hasNoAny = /"noImplicitAny"\s*:\s*true/.test(content);
        let score = 4; // has tsconfig
        if (hasStrict) score += 4;
        if (hasNoAny) score += 2;
        return Math.min(score, 10);
    } catch { return 3; }
}

// 9. 地形 Production — Git clean + commits
function scoreProduction(dir) {
    const gitStatus = run('git status --porcelain 2>/dev/null | wc -l', dir);
    const dirtyFiles = parseInt(gitStatus.output) || 0;
    const commitCount = run('git rev-list --count HEAD 2>/dev/null', dir);
    const commits = parseInt(commitCount.output) || 0;
    let score = 0;
    if (commits >= 10) score += 4;
    else if (commits >= 3) score += 2;
    if (dirtyFiles === 0) score += 6;
    else if (dirtyFiles <= 5) score += 3;
    return Math.min(score, 10);
}

// 10. 用間 Docs — README + docs/
function scoreDocs(dir) {
    let score = 0;
    if (fs.existsSync(path.join(dir, 'README.md'))) score += 4;
    if (fs.existsSync(path.join(dir, 'docs'))) score += 3;
    if (fs.existsSync(path.join(dir, 'CLAUDE.md')) || fs.existsSync(path.join(dir, 'AGENTS.md'))) score += 3;
    return Math.min(score, 10);
}

/**
 * Calculate project score — FAST mode (skip build/test) or FULL mode.
 * @param {string} projectDir - Absolute path to project
 * @param {object} [opts] - { fast: true } skips npm build/test (expensive)
 * @returns {{ total: number, breakdown: object, grade: string }}
 */
function calculateProjectScore(projectDir, opts = {}) {
    const fast = opts.fast !== false; // default: fast mode (skip build/test)

    const breakdown = {
        planning: scorePlanning(projectDir),
        resources: fast ? 5 : scoreResources(projectDir),
        ci_cd: scoreCICD(projectDir),
        build: fast ? 5 : scoreBuild(projectDir),
        tests: fast ? 5 : scoreTests(projectDir),
        security: fast ? 5 : scoreSecurity(projectDir),
        performance: scorePerformance(projectDir),
        typescript: scoreTypeScript(projectDir),
        production: scoreProduction(projectDir),
        docs: scoreDocs(projectDir),
    };

    const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
    const grade = total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'F';

    return { total, breakdown, grade, calculatedAt: new Date().toISOString() };
}

module.exports = { calculateProjectScore };
