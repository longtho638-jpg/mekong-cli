/**
 * Google Ultra Integration — CTO Full Google Ecosystem Access
 * AGI Level 10+: 「用間」Dual-Ultra Intelligence Network
 *
 * 📜 Binh Pháp Ch.13 用間: 「故三軍之事，莫親於間」
 *    "Nothing is more intimate to the army than its spies"
 *
 * CTO uses gogcli with 2 Ultra accounts (billwill & cashback) to access
 * Google Drive, Docs, Sheets, Gmail, Calendar for deep intelligence gathering.
 * All data is synthesized via LLM and injected into mission context.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_DIR = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data');
const INTEL_DIR = path.join(DATA_DIR, 'google-intel');
const GOG = '/opt/homebrew/bin/gog';

// Dual Ultra accounts
const ACCOUNTS = {
	billwill: process.env.GOG_ACCOUNT_1 || '', // Set after OAuth
	cashback: process.env.GOG_ACCOUNT_2 || '', // Set after OAuth
};

if (!fs.existsSync(INTEL_DIR)) fs.mkdirSync(INTEL_DIR, { recursive: true });

function log(msg) {
	const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
	try {
		fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', `[${ts}] [tom-hum] [GOOGLE-ULTRA] ${msg}\n`);
	} catch (e) {}
}

/**
 * Get the first available authenticated account.
 */
function getAccount() {
	// Method 1: Parse gog auth status plain text output
	try {
		const status = execSync(`${GOG} auth status -p 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 });
		const accountMatch = status.match(/^account\s+(.+@.+)$/m);
		if (accountMatch) return accountMatch[1].trim();
	} catch (e) {}

	// Method 2: Hardcoded accounts (known Ultra accounts)
	const knownAccounts = ['billwill.mentor@gmail.com', 'cashback.mentoring@gmail.com'];
	for (const acc of knownAccounts) {
		try {
			execSync(`${GOG} me -a "${acc}" --no-input 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 });
			return acc;
		} catch (e) {}
	}

	return null;
}

/**
 * Execute a gog command with JSON output.
 */
function gog(command, account = null) {
	const acc = account || getAccount();
	if (!acc) {
		log('ERROR: No authenticated account — run `gog login <email>` first');
		return null;
	}
	try {
		const cmd = `${GOG} ${command} -a "${acc}" --json --results-only 2>/dev/null`;
		const result = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
		return JSON.parse(result);
	} catch (e) {
		log(`GOG ERROR: ${e.message?.slice(0, 100)}`);
		return null;
	}
}

// ═══════════════════════════════════════════════════
// Google Drive — Search & Read documents
// ═══════════════════════════════════════════════════

/**
 * Search Google Drive for documents related to a query.
 */
function searchDrive(query, maxResults = 5) {
	log(`🔍 DRIVE SEARCH: "${query}"`);
	const results = gog(`drive search "${query}" --limit ${maxResults}`);
	if (!results) return [];

	const files = (Array.isArray(results) ? results : results.files || []).slice(0, maxResults);
	log(`📂 Found ${files.length} files`);
	return files.map((f) => ({
		id: f.id,
		name: f.name,
		mimeType: f.mimeType,
		modifiedTime: f.modifiedTime,
		webViewLink: f.webViewLink,
	}));
}

/**
 * Read a Google Doc's content.
 */
function readDoc(fileId) {
	log(`📄 READING DOC: ${fileId}`);
	const result = gog(`docs export ${fileId} --format txt`);
	return result;
}

// ═══════════════════════════════════════════════════
// Google Sheets — Read project data
// ═══════════════════════════════════════════════════

/**
 * Read data from a Google Sheet.
 */
function readSheet(sheetId, range = 'A1:Z100') {
	log(`📊 READING SHEET: ${sheetId} [${range}]`);
	const result = gog(`sheets get ${sheetId} --range "${range}"`);
	return result;
}

// ═══════════════════════════════════════════════════
// Gmail — Search for technical discussions
// ═══════════════════════════════════════════════════

/**
 * Search Gmail for relevant technical discussions.
 */
function searchGmail(query, maxResults = 5) {
	log(`📧 GMAIL SEARCH: "${query}"`);
	const results = gog(`gmail search "${query}" --limit ${maxResults}`);
	if (!results) return [];

	const messages = (Array.isArray(results) ? results : results.messages || []).slice(0, maxResults);
	log(`📧 Found ${messages.length} emails`);
	return messages;
}

// ═══════════════════════════════════════════════════
// Calendar — Check project deadlines
// ═══════════════════════════════════════════════════

/**
 * Get upcoming events (deadlines, meetings).
 */
function getCalendarEvents(maxResults = 10) {
	log(`📅 CALENDAR: Getting upcoming events`);
	const results = gog(`calendar list --limit ${maxResults}`);
	return results;
}

// ═══════════════════════════════════════════════════
// Intelligence Pipeline — Search → Synthesize → Apply
// ═══════════════════════════════════════════════════

/**
 * Full intelligence gathering for a project.
 * Searches Drive, Gmail, and Calendar for relevant project intel.
 */
async function gatherProjectIntel(projectName) {
	log(`🧠 GATHERING INTEL for: ${projectName}`);

	const account = getAccount();
	if (!account) {
		log(`❌ No authenticated accounts — CTO cannot access Google ecosystem`);
		return { error: 'No authenticated Google accounts', setupCmd: 'gog login <email>' };
	}

	const intel = {
		project: projectName,
		account,
		timestamp: new Date().toISOString(),
		drive: [],
		emails: [],
		calendar: [],
	};

	// Search Drive for project docs
	try {
		intel.drive = searchDrive(`${projectName} specification design`, 5);
	} catch (e) {
		log(`Drive search failed: ${e.message}`);
	}

	// Search Gmail for project discussions
	try {
		intel.emails = searchGmail(`${projectName} bug fix deploy`, 3);
	} catch (e) {
		log(`Gmail search failed: ${e.message}`);
	}

	// Get upcoming deadlines
	try {
		intel.calendar = getCalendarEvents(5);
	} catch (e) {
		log(`Calendar failed: ${e.message}`);
	}

	// Save intel
	const filename = `intel_${projectName}_${Date.now()}.json`;
	try {
		fs.writeFileSync(path.join(INTEL_DIR, filename), JSON.stringify(intel, null, 2));
	} catch (e) {}

	const totalItems = (intel.drive?.length || 0) + (intel.emails?.length || 0) + (intel.calendar?.length || 0);
	log(`✅ INTEL GATHERED: ${totalItems} items for ${projectName} → ${filename}`);

	return intel;
}

// ═══════════════════════════════════════════════════
// Google Tasks — Mission Tracking
// ═══════════════════════════════════════════════════

/**
 * Create a Google Task for mission tracking.
 */
function createTask(title, notes = '') {
	log(`📋 CREATING TASK: "${title}"`);
	const escaped = title.replace(/"/g, '\\"');
	const notesEsc = notes.replace(/"/g, '\\"');
	return gog(`tasks add "${escaped}" --notes "${notesEsc}"`);
}

/**
 * List current Google Tasks.
 */
function listTasks(maxResults = 10) {
	log(`📋 LISTING TASKS`);
	return gog(`tasks list --limit ${maxResults}`);
}

// ═══════════════════════════════════════════════════
// Enhanced Drive Search — Multi-query for deeper intel
// ═══════════════════════════════════════════════════

/**
 * Deep Drive search with multiple queries for comprehensive project intel.
 */
function deepDriveSearch(projectName) {
	const queries = [
		`${projectName} specification`,
		`${projectName} design architecture`,
		`${projectName} bug report`,
		`${projectName} roadmap plan`,
		`${projectName} api documentation`,
	];

	const allFiles = [];
	for (const q of queries) {
		try {
			const files = searchDrive(q, 3);
			for (const f of files) {
				if (!allFiles.some((existing) => existing.id === f.id)) {
					allFiles.push(f);
				}
			}
		} catch (e) {}
		if (allFiles.length >= 10) break;
	}

	log(`📂 DEEP SEARCH: Found ${allFiles.length} unique files for ${projectName}`);
	return allFiles;
}

/**
 * Upload a report/artifact to Google Drive.
 */
function uploadToDrive(localPath, folderId = null) {
	log(`📤 UPLOADING: ${path.basename(localPath)}`);
	let cmd = `drive upload "${localPath}"`;
	if (folderId) cmd += ` --parent "${folderId}"`;
	return gog(cmd);
}

// ═══════════════════════════════════════════════════
// Periodic Intel Loop — Background intelligence gathering
// ═══════════════════════════════════════════════════

let intelLoopRef = null;
const INTEL_INTERVAL = 10 * 60 * 1000; // 10 minutes

/**
 * Start periodic intelligence gathering loop.
 * Runs every 10 minutes, searches all Google services,
 * records insights to cross-session memory.
 */
function startIntelLoop(projects = ['well']) {
	if (intelLoopRef) return;

	log(`🔄 INTEL LOOP: Started (${INTEL_INTERVAL / 60000}min interval, projects: ${projects.join(', ')})`);

	intelLoopRef = setInterval(async () => {
		const acc = getAccount();
		if (!acc) return;

		for (const project of projects) {
			try {
				// Gather fresh intel
				const intel = await gatherProjectIntel(project);
				if (!intel || intel.error) continue;

				// Record insights to cross-session memory
				try {
					const { recordInsight } = require('./self-analyzer');
					const driveCount = (intel.drive || []).length;
					const emailCount = (intel.emails || []).length;

					if (driveCount > 0) {
						const fileNames = intel.drive.map((f) => f.name).join(', ');
						recordInsight(project, `Drive has ${driveCount} docs: ${fileNames}`, 'documentation');
					}
					if (emailCount > 0) {
						recordInsight(project, `${emailCount} relevant email discussions found`, 'communication');
					}
				} catch (e) {}

				// Create/update Google Task for tracking
				try {
					createTask(
						`[CTO] ${project} intel scan — ${new Date().toLocaleDateString()}`,
						`Drive: ${(intel.drive || []).length} files, Gmail: ${(intel.emails || []).length} emails, Calendar: ${(intel.calendar || []).length} events`,
					);
				} catch (e) {}
			} catch (e) {
				log(`INTEL LOOP ERROR [${project}]: ${e.message}`);
			}
		}
	}, INTEL_INTERVAL);
}

function stopIntelLoop() {
	if (intelLoopRef) {
		clearInterval(intelLoopRef);
		intelLoopRef = null;
	}
}

/**
 * Check auth status for both Ultra accounts.
 */
function checkAuthStatus() {
	try {
		const result = execSync(`${GOG} auth status 2>&1`, { encoding: 'utf-8', timeout: 5000 });
		log(`AUTH STATUS: ${result.trim().slice(0, 100)}`);
		return result;
	} catch (e) {
		return 'No accounts authenticated';
	}
}

module.exports = {
	searchDrive,
	readDoc,
	readSheet,
	searchGmail,
	getCalendarEvents,
	gatherProjectIntel,
	uploadToDrive,
	checkAuthStatus,
	getAccount,
	gog,
	createTask,
	listTasks,
	deepDriveSearch,
	startIntelLoop,
	stopIntelLoop,
};
