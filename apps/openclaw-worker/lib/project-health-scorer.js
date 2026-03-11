/**
 * Project Health Scorer — Score project health 0-100
 *
 * Scoring:
 *   Build check     +20: npm run build or tsc --noEmit succeeds
 *   Test check      +25: npm test succeeds
 *   Lint check      +15: no critical errors
 *   README check    +10: README.md exists and > 100 bytes
 *   package.json    +10: has name, version, scripts
 *   Git clean       +10: no uncommitted changes
 *   Production URL  +10: curl returns HTTP 200 (optional)
 *
 * Score meaning:
 *   < 70    → FIX mode (prioritize Phase 2)
 *   70–89   → STANDARD pipeline
 *   >= 90   → SHIP mode (fast-track Phase 5)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCORE_WEIGHTS = {
	build: 20,
	test: 25,
	lint: 15,
	readme: 10,
	packageJson: 10,
	gitClean: 10,
	production: 10,
};

/**
 * Run shell command, return { ok: bool, output: string }
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
 * Check README.md exists and has enough content (> 100 bytes)
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
 * Check package.json has name, version, scripts
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
 * Check git working tree is clean (no uncommitted changes)
 */
function checkGitClean(projectDir) {
	const result = runCheck('git status --porcelain', projectDir, 10000);
	if (!result.ok) return false;
	// Empty output = clean working tree
	return result.output.trim().length === 0;
}

/**
 * Check production URL returns HTTP 200
 * Reads URL from package.json (field "homepage") or vercel.json
 */
function checkProductionUrl(projectDir) {
	let url = null;

	// Try reading from package.json
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
		if (pkg.homepage && pkg.homepage.startsWith('http')) url = pkg.homepage;
	} catch (e) {
		/* ignore */
	}

	// Try reading from vercel.json (alias field)
	if (!url) {
		try {
			const vcfg = JSON.parse(fs.readFileSync(path.join(projectDir, 'vercel.json'), 'utf-8'));
			const aliases = vcfg.alias || vcfg.aliases || [];
			if (aliases.length > 0) url = `https://${aliases[0]}`;
		} catch (e) {
			/* ignore */
		}
	}

	// No URL → skip check (no score penalty)
	if (!url) return null;

	const result = runCheck(`curl -sI "${url}" | head -1`, projectDir, 8000);
	return result.ok && result.output.includes('200');
}

/**
 * Score project health.
 * @param {string} projectDir - Absolute path to project directory
 * @returns {Promise<{score: number, details: object, mode: string}>}
 */
async function scoreProject(projectDir) {
	const details = {};
	let score = 0;

	// Check directory exists
	if (!fs.existsSync(projectDir)) {
		return { score: 0, details: { error: 'Project directory not found' }, mode: 'FIX' };
	}

	// --- package.json (+10) ---
	const hasPkg = checkPackageJson(projectDir);
	details.packageJson = hasPkg;
	if (hasPkg) score += SCORE_WEIGHTS.packageJson;

	// Read scripts if package.json exists
	let scripts = {};
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
		scripts = pkg.scripts || {};
	} catch (e) {
		/* no package.json */
	}

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
		// No build script → SKIP (no points added or deducted)
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

	// --- Production URL check (+10, optional) ---
	const prodOk = checkProductionUrl(projectDir);
	details.production = prodOk;
	if (prodOk === true) score += SCORE_WEIGHTS.production;
	// prodOk === null → skip, no score impact

	// Normalize score to max 100
	// When some checks are SKIP (null), recalculate achievable max
	let maxPossible = 100;
	if (details.build === null) maxPossible -= SCORE_WEIGHTS.build;
	if (details.test === null) maxPossible -= SCORE_WEIGHTS.test;
	if (details.lint === null) maxPossible -= SCORE_WEIGHTS.lint;
	if (details.production === null) maxPossible -= SCORE_WEIGHTS.production;

	// Scale score to 100 if max < 100
	const normalizedScore = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0;

	// Determine mode based on score
	let mode;
	if (normalizedScore >= 90) {
		mode = 'SHIP'; // Fast-track Phase 5
	} else if (normalizedScore >= 70) {
		mode = 'STANDARD'; // Normal pipeline
	} else {
		mode = 'FIX'; // Prioritize Phase 2 — fix errors
	}

	return { score: normalizedScore, rawScore: score, maxPossible, details, mode };
}

module.exports = { scoreProject, SCORE_WEIGHTS };
