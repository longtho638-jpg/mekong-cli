/**
 * Ship Pipeline — Manages 5-phase ZERO-TO-SHIP for each project
 *
 * Phase 1: SCOUT   → /scout "scan project health, find critical bugs"
 * Phase 2: FIX     → /cook "fix all critical issues found by scout"
 * Phase 3: TEST    → /test "run full test suite"
 * Phase 4: REVIEW  → /review:codebase "audit code quality + security"
 * Phase 5: SHIP    → /check-and-commit "commit + push if all GREEN"
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

// State file for pipeline — shared with Tôm Hùm state file
const PIPELINE_STATE_FILE = config.STATE_FILE;

// Define the 5 phases of the ship pipeline
// ⚠️ CRITICAL: Each command MUST contain the specific project name
// so CC CLI does NOT wander to other projects in the monorepo!
const PHASES = [
	{
		id: 1,
		name: 'SCOUT',
		// Scan project health, find critical bugs
		// __PROJECT__ will be replaced with the actual project name
		command:
			'/scout "scan __PROJECT__ project health ONLY within this directory, find all critical bugs and issues. DO NOT look at other projects in the monorepo."',
	},
	{
		id: 2,
		name: 'FIX',
		// Fix all critical issues found in SCOUT phase
		command: '/cook "fix all critical issues found in __PROJECT__ — ONLY files in current directory. No git commit yet." --auto',
	},
	{
		id: 3,
		name: 'TEST',
		// Run the full test suite
		command: '/test "run __PROJECT__ test suite, report failures. ONLY test files in current directory."',
	},
	{
		id: 4,
		name: 'REVIEW',
		// Check code quality and security
		command: '/review:codebase "audit __PROJECT__ code quality, security, type safety. ONLY review current directory."',
	},
	{
		id: 5,
		name: 'SHIP',
		// Commit + push if all GREEN
		command: '/check-and-commit "__PROJECT__: all phases passed — commit and push to production"',
	},
];

// --- Read/write pipeline state ---

function loadPipelineState() {
	try {
		if (fs.existsSync(PIPELINE_STATE_FILE)) {
			const raw = JSON.parse(fs.readFileSync(PIPELINE_STATE_FILE, 'utf-8'));
			return raw.pipelines || {};
		}
	} catch (e) {
		/* ignore file read errors */
	}
	return {};
}

function savePipelineState(pipelines) {
	try {
		// Read current state to merge — do not overwrite other fields
		let existing = {};
		if (fs.existsSync(PIPELINE_STATE_FILE)) {
			try {
				existing = JSON.parse(fs.readFileSync(PIPELINE_STATE_FILE, 'utf-8'));
			} catch (e) {}
		}
		const merged = Object.assign({}, existing, { pipelines });
		const tmp = `${PIPELINE_STATE_FILE}.tmp`;
		fs.writeFileSync(tmp, JSON.stringify(merged, null, 2));
		fs.renameSync(tmp, PIPELINE_STATE_FILE);
	} catch (e) {
		/* atomic write failed — ignore */
	}
}

function getProjectState(projectName) {
	const all = loadPipelineState();
	return all[projectName] || null;
}

// --- Public API ---

/**
 * Get the command for the next phase of a project.
 * Returns null if the pipeline is complete or not yet initialized.
 */
function getNextPhaseCommand(projectName) {
	const all = loadPipelineState();
	const state = all[projectName];

	// No pipeline yet → start phase 1
	if (!state) {
		return PHASES[0].command.replace(/__PROJECT__/g, projectName);
	}

	// Already shipped
	if (state.currentPhase > PHASES.length) {
		return null;
	}

	// Phase not complete → return command for current phase
	// ⚠️ CRITICAL: Replace __PROJECT__ with actual project name
	// so CC CLI does NOT wander to other projects!
	const phase = PHASES.find((p) => p.id === state.currentPhase);
	return phase ? phase.command.replace(/__PROJECT__/g, projectName) : null;
}

/**
 * Mark the current phase as complete and advance to the next phase.
 * result: 'PASS' | 'FAIL' | 'SKIP'
 */
function advancePhase(projectName, result) {
	const all = loadPipelineState();
	const state = all[projectName] || {
		currentPhase: 1,
		phaseResults: {},
		startedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	const donedPhase = state.currentPhase;
	state.phaseResults[donedPhase] = result;
	state.updatedAt = new Date().toISOString();

	if (result === 'PASS' || result === 'SKIP') {
		state.currentPhase = donedPhase + 1;
	}
	// FAIL → keep same phase, retry next time

	all[projectName] = state;
	savePipelineState(all);
	return state;
}

/**
 * Return the current pipeline status of a project.
 */
function getPipelineStatus(projectName) {
	return getProjectState(projectName);
}

/**
 * Reset pipeline back to phase 1.
 */
function resetPipeline(projectName) {
	const all = loadPipelineState();
	all[projectName] = {
		currentPhase: 1,
		phaseResults: {},
		startedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	savePipelineState(all);
}

/**
 * Check whether the pipeline has completed all 5 phases with PASS.
 */
function isShipComplete(projectName) {
	const state = getProjectState(projectName);
	if (!state) return false;
	if (state.currentPhase <= PHASES.length) return false;
	// Check all phases must be PASS
	for (const phase of PHASES) {
		if (state.phaseResults[phase.id] !== 'PASS') return false;
	}
	return true;
}

/**
 * Get phase name by ID.
 */
function getPhaseName(phaseId) {
	const phase = PHASES.find((p) => p.id === phaseId);
	return phase ? phase.name : 'UNKNOWN';
}

module.exports = {
	PHASES,
	getNextPhaseCommand,
	advancePhase,
	getPipelineStatus,
	resetPipeline,
	isShipComplete,
	getPhaseName,
};
