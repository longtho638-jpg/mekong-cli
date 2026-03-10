/**
 * Project Profiler — Dynamic project health analysis
 *
 * TASK 19/22: CTO Brain Upgrade
 *
 * Analyzes project health: ts_errors, lint_errors, test_coverage,
 * dependency_freshness, last_commit_age, health_score (0-100).
 * Feeds into Auto-CTO for intelligent task generation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config');

const STATE_FILE = path.join(config.MEKONG_DIR || '.', '.tom_hum_state.json');

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [profiler] ${msg}\n`;
	try {
		fs.appendFileSync(config.LOG_FILE, line);
	} catch (_) {}
}

function safeExec(cmd, cwd, timeout = 15000) {
	try {
		return execSync(cmd, { cwd, encoding: 'utf-8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
	} catch (e) {
		return '';
	}
}

/**
 * Analyze a project directory and return health profile
 * @param {string} projectDir - Absolute path to project
 * @returns {object} ProjectProfile
 */
function analyzeProject(projectDir) {
	if (!fs.existsSync(projectDir)) {
		return { error: `Directory not found: ${projectDir}`, healthScore: 0 };
	}

	const projectName = path.basename(projectDir);
	const profile = {
		project: projectName,
		dir: projectDir,
		analyzedAt: new Date().toISOString(),
		metrics: {},
		healthScore: 0,
		issues: [],
		recommendations: [],
	};

	// 1. TypeScript errors
	const hasTsConfig = fs.existsSync(path.join(projectDir, 'tsconfig.json'));
	if (hasTsConfig) {
		const tsOutput = safeExec('npx tsc --noEmit 2>&1 | tail -5', projectDir, 30000);
		const errorMatch = tsOutput.match(/Found (\d+) error/);
		profile.metrics.tsErrors = errorMatch ? parseInt(errorMatch[1]) : 0;
		if (profile.metrics.tsErrors > 50) {
			profile.issues.push(`${profile.metrics.tsErrors} TypeScript errors`);
			profile.recommendations.push('Run /cook "fix all TypeScript errors" --auto');
		}
	} else {
		profile.metrics.tsErrors = -1; // N/A
	}

	// 2. Lint errors (quick count)
	const hasEslint =
		fs.existsSync(path.join(projectDir, '.eslintrc.json')) ||
		fs.existsSync(path.join(projectDir, '.eslintrc.js')) ||
		fs.existsSync(path.join(projectDir, 'eslint.config.js')) ||
		fs.existsSync(path.join(projectDir, 'eslint.config.mjs'));
	if (hasEslint) {
		const lintOutput = safeExec('npx eslint . --format compact 2>&1 | tail -3', projectDir, 30000);
		const lintMatch = lintOutput.match(/(\d+) problem/);
		profile.metrics.lintErrors = lintMatch ? parseInt(lintMatch[1]) : 0;
		if (profile.metrics.lintErrors > 20) {
			profile.issues.push(`${profile.metrics.lintErrors} lint errors`);
			profile.recommendations.push('Run /cook "fix all lint errors" --auto');
		}
	} else {
		profile.metrics.lintErrors = -1;
	}

	// 3. Last commit age
	const lastCommit = safeExec('git log -1 --format=%ci 2>/dev/null', projectDir);
	if (lastCommit) {
		const commitDate = new Date(lastCommit);
		const daysAgo = Math.floor((Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24));
		profile.metrics.lastCommitDaysAgo = daysAgo;
		if (daysAgo > 30) {
			profile.issues.push(`Last commit ${daysAgo} days ago`);
			profile.recommendations.push('Project may be stale — review for relevance');
		}
	}

	// 4. Dependency freshness
	const hasPackageJson = fs.existsSync(path.join(projectDir, 'package.json'));
	if (hasPackageJson) {
		const outdatedOutput = safeExec('npm outdated --json 2>/dev/null | wc -l', projectDir);
		const outdatedCount = parseInt(outdatedOutput) || 0;
		profile.metrics.outdatedDeps = Math.max(0, outdatedCount - 2); // JSON wrapper lines
		if (profile.metrics.outdatedDeps > 10) {
			profile.issues.push(`${profile.metrics.outdatedDeps} outdated dependencies`);
			profile.recommendations.push('Run npm audit and update critical deps');
		}
	}

	// 5. Test existence check
	const hasTests = safeExec('find . -name "*.test.*" -o -name "*.spec.*" | head -5', projectDir);
	profile.metrics.hasTests = hasTests.length > 0;
	profile.metrics.testFileCount = hasTests ? hasTests.split('\n').filter(Boolean).length : 0;
	if (!profile.metrics.hasTests) {
		profile.issues.push('No test files found');
		profile.recommendations.push('Run /cook "add unit tests for core modules" --auto');
	}

	// 6. File count (project size indicator)
	const fileCount = safeExec(
		'find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | wc -l',
		projectDir,
	);
	profile.metrics.sourceFileCount = parseInt(fileCount) || 0;

	// Calculate health score (0-100)
	let score = 100;
	if (profile.metrics.tsErrors > 0) score -= Math.min(30, profile.metrics.tsErrors);
	if (profile.metrics.lintErrors > 0) score -= Math.min(20, profile.metrics.lintErrors / 2);
	if (profile.metrics.lastCommitDaysAgo > 30) score -= 10;
	if (profile.metrics.outdatedDeps > 10) score -= 10;
	if (!profile.metrics.hasTests) score -= 20;
	profile.healthScore = Math.max(0, Math.min(100, score));

	return profile;
}

/**
 * Analyze all configured projects
 * @returns {Array<object>} Array of project profiles
 */
function analyzeAllProjects() {
	const profiles = [];
	const projects = config.PROJECTS || [];
	const mekongDir = config.MEKONG_DIR || path.join(process.env.HOME || '', 'mekong-cli');

	for (const project of projects) {
		const projectDir = path.join(mekongDir, 'apps', project);
		if (fs.existsSync(projectDir)) {
			log(`Profiling: ${project}`);
			const profile = analyzeProject(projectDir);
			profiles.push(profile);
		}
	}

	// Sort by health score (lowest = neediest)
	profiles.sort((a, b) => a.healthScore - b.healthScore);
	return profiles;
}

/**
 * Save profiles to state file for persistence
 */
function saveProfiles(profiles) {
	try {
		let state = {};
		if (fs.existsSync(STATE_FILE)) {
			state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
		}
		state.projectProfiles = {
			timestamp: new Date().toISOString(),
			profiles,
		};
		fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
	} catch (e) {
		/* non-critical */
	}
}

/**
 * Load saved profiles
 * @returns {Array<object>|null}
 */
function loadProfiles() {
	try {
		if (!fs.existsSync(STATE_FILE)) return null;
		const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
		return state.projectProfiles?.profiles || null;
	} catch (e) {
		return null;
	}
}

/**
 * Get the neediest project (lowest health score)
 * @returns {object|null}
 */
function getNeediest() {
	const profiles = loadProfiles() || analyzeAllProjects();
	return profiles.length > 0 ? profiles[0] : null;
}

module.exports = {
	analyzeProject,
	analyzeAllProjects,
	saveProfiles,
	loadProfiles,
	getNeediest,
};
