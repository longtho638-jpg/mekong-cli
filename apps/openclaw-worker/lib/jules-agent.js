/**
 * Jules Agent — Google's AI Coding Agent Integration
 * AGI Level 10+: 「九地」CTO dispatches coding tasks to Jules
 *
 * 📜 Binh Pháp Ch.11 九地: 「投之亡地然後存」
 *    "Throw them into desperate ground and they survive"
 *    Jules works autonomously on GitHub repos to fix, improve, and create PRs.
 *
 * API: jules.googleapis.com/v1alpha/
 * Capabilities:
 * - Create coding sessions (tasks) on any connected GitHub repo
 * - Auto-approve plans or require review
 * - Auto-create PRs with changes
 * - Track session progress and activities
 * - Multi-repo orchestration
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const JULES_API_KEY = 'AQ.Ab8RN6KicvJMEHFwFSa5E6BIRfhXpPBVo9h9VypgZgRV_wZ44g';
const JULES_HOST = 'jules.googleapis.com';
const DATA_DIR = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data');
const JULES_DIR = path.join(DATA_DIR, 'jules-sessions');

if (!fs.existsSync(JULES_DIR)) fs.mkdirSync(JULES_DIR, { recursive: true });

function log(msg) {
	const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
	try {
		fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', `[${ts}] [tom-hum] [JULES] ${msg}\n`);
	} catch (e) {}
}

// ═══════════════════════════════════════════════════
// Core Jules API Call
// ═══════════════════════════════════════════════════

function julesAPI(method, endpoint, body = null) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('Jules API timeout')), 60000);

		const options = {
			hostname: JULES_HOST,
			path: `/v1alpha/${endpoint}`,
			method,
			headers: {
				'X-Goog-Api-Key': JULES_API_KEY,
				'Content-Type': 'application/json',
			},
		};

		const req = https.request(options, (res) => {
			let data = '';
			res.on('data', (c) => (data += c));
			res.on('end', () => {
				clearTimeout(timer);
				try {
					const r = JSON.parse(data);
					if (r.error) {
						reject(new Error(r.error.message || JSON.stringify(r.error)));
						return;
					}
					resolve(r);
				} catch (e) {
					// Sometimes response is empty for success
					resolve(data ? JSON.parse(data) : { success: true });
				}
			});
		});

		req.on('error', (e) => {
			clearTimeout(timer);
			reject(e);
		});
		if (body) req.write(JSON.stringify(body));
		req.end();
	});
}

// ═══════════════════════════════════════════════════
// Source Management — List connected GitHub repos
// ═══════════════════════════════════════════════════

// Map project names to Jules source IDs
const REPO_MAP = {
	well: 'sources/github/longtho638-jpg/Well',
	'mekong-cli': 'sources/github/longtho638-jpg/mekong-cli',
	'openclaw-worker': 'sources/github/longtho638-jpg/openclaw-worker',
	'apex-os': 'sources/github/longtho638-jpg/apex-os',
	'sophia-ai-factory': 'sources/github/longtho638-jpg/sophia-ai-factory',
	'84tea': 'sources/github/longtho638-jpg/84tea',
	'mekong-landing': 'sources/github/longtho638-jpg/mekong-landing',
	'vn30-quantum': 'sources/github/longtho638-jpg/vn30-quantum',
	'agencyos-starter': 'sources/github/longtho638-jpg/agencyos-starter',
	'mekong-docs': 'sources/github/longtho638-jpg/mekong-docs',
};

async function listSources() {
	log('📋 Listing connected GitHub sources...');
	const result = await julesAPI('GET', 'sources');
	const sources = (result.sources || []).map((s) => s.id);
	log(`📋 Found ${sources.length} sources: ${sources.join(', ')}`);
	return result.sources || [];
}

// ═══════════════════════════════════════════════════
// Session Management — Create & Track Coding Tasks
// ═══════════════════════════════════════════════════

/**
 * Create a Jules coding session — dispatches an AI coding task to a GitHub repo.
 * Jules will analyze the repo, create a plan, execute it, and optionally create a PR.
 *
 * @param {string} project - Project name (maps to REPO_MAP)
 * @param {string} prompt - What to do (e.g., "Fix all TypeScript errors")
 * @param {object} options - { branch, autoCreatePR, requirePlanApproval, title }
 */
async function createSession(project, prompt, options = {}) {
	const { branch = 'main', autoCreatePR = true, requirePlanApproval = false, title = `[CTO-AGI] ${prompt.slice(0, 60)}` } = options;

	const source = REPO_MAP[project.toLowerCase()] || `sources/github/longtho638-jpg/${project}`;
	log(`🚀 CREATING SESSION: "${prompt.slice(0, 80)}..." on ${project} (branch: ${branch})`);

	const body = {
		prompt,
		sourceContext: {
			source,
			githubRepoContext: { startingBranch: branch },
		},
		title,
		...(autoCreatePR ? { automationMode: 'AUTO_CREATE_PR' } : {}),
		...(requirePlanApproval ? { requirePlanApproval: true } : {}),
	};

	try {
		const session = await julesAPI('POST', 'sessions', body);
		log(`✅ SESSION CREATED: ${session.id} — "${title}"`);

		// Save session tracking
		fs.writeFileSync(
			path.join(JULES_DIR, `session_${session.id}.json`),
			JSON.stringify(
				{
					...session,
					project,
					createdAt: new Date().toISOString(),
				},
				null,
				2,
			),
		);

		return session;
	} catch (e) {
		log(`❌ SESSION CREATE FAILED: ${e.message}`);
		return null;
	}
}

/**
 * Get session status.
 */
async function getSession(sessionId) {
	return julesAPI('GET', `sessions/${sessionId}`);
}

/**
 * List all sessions.
 */
async function listSessions(pageSize = 10) {
	return julesAPI('GET', `sessions?pageSize=${pageSize}`);
}

/**
 * Approve a session's plan (if requirePlanApproval was true).
 */
async function approvePlan(sessionId) {
	log(`✅ APPROVING PLAN for session ${sessionId}`);
	return julesAPI('POST', `sessions/${sessionId}:approvePlan`);
}

// ═══════════════════════════════════════════════════
// Strategic Dispatch — CTO sends tasks to Jules
// ═══════════════════════════════════════════════════

/**
 * Dispatch a strategic improvement task to Jules.
 * CTO identifies what needs improvement, Jules executes it autonomously.
 */
async function dispatchStrategicTask(project, task) {
	log(`🧠 STRATEGIC DISPATCH to Jules: ${project} — "${task.slice(0, 60)}..."`);

	const session = await createSession(project, task, {
		autoCreatePR: true,
		title: `[CTO-AGI] ${task.slice(0, 60)}`,
	});

	if (session) {
		log(`🎯 Jules is working on: ${task.slice(0, 60)}... → PR will be auto-created`);
	}

	return session;
}

/**
 * Check all active Jules sessions and log their status.
 */
async function checkActiveSessions() {
	log('🔍 Checking active Jules sessions...');
	try {
		const result = await listSessions(10);
		const sessions = result.sessions || [];

		for (const s of sessions) {
			const outputs = s.outputs || [];
			const pr = outputs.find((o) => o.pullRequest);
			if (pr) {
				log(`✅ SESSION ${s.id}: PR created → ${pr.pullRequest.url}`);
			} else {
				log(`⏳ SESSION ${s.id}: "${s.title}" — in progress`);
			}
		}

		return sessions;
	} catch (e) {
		log(`Session check failed: ${e.message}`);
		return [];
	}
}

// ═══════════════════════════════════════════════════
// Health Check
// ═══════════════════════════════════════════════════

async function checkJulesStatus() {
	try {
		const result = await julesAPI('GET', 'sources');
		return (result.sources || []).length > 0 ? 'ONLINE' : 'NO_REPOS';
	} catch (e) {
		return 'OFFLINE';
	}
}

module.exports = {
	julesAPI,
	listSources,
	createSession,
	getSession,
	listSessions,
	approvePlan,
	dispatchStrategicTask,
	checkActiveSessions,
	checkJulesStatus,
	REPO_MAP,
};
