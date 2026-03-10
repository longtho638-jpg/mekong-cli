/**
 * ClaudeKit Auto-Updater — Deep Fix v2.0
 *
 * Binh Pháp 軍形 (Jun Xing): Maintain edge — auto-update ClaudeKit toolchain.
 *
 * Algorithm:
 * 1. On boot (+3min delay): Check `ck --version` vs `npm view claudekit-cli@latest version`
 * 2. If outdated: `npm install -g claudekit-cli@latest` with retry (3x, exponential backoff)
 * 3. After successful install: `ck init --yes` in project root
 * 4. Repeat every 12 hours
 */

const { execSync, exec } = require('child_process');
const config = require('../config');

// Lazy log import to prevent circular deps
let _log;
function log(msg) {
	if (!_log) _log = require('./brain-process-manager').log;
	_log(msg);
}

let updateInterval = null;

/**
 * Get currently installed ClaudeKit version
 * @returns {string|null} version string or null if not installed
 */
function getInstalledVersion() {
	try {
		const ver = execSync('ck --version 2>/dev/null || echo "NOT_INSTALLED"', {
			encoding: 'utf-8',
			timeout: 10000,
		}).trim();
		// ck --version may output "claudekit-cli/2.9.1" or just "2.9.1"
		const match = ver.match(/(\d+\.\d+\.\d+)/);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

/**
 * Get latest available version from npm registry
 * @returns {string|null} version string or null on failure
 */
function getLatestVersion() {
	try {
		const ver = execSync('npm view claudekit-cli@latest version 2>/dev/null', {
			encoding: 'utf-8',
			timeout: 15000,
		}).trim();
		const match = ver.match(/(\d+\.\d+\.\d+)/);
		return match ? match[1] : null;
	} catch {
		return null;
	}
}

/**
 * Compare two semver strings
 * @returns {boolean} true if latest > installed
 */
function isOutdated(installed, latest) {
	if (!installed || !latest) return true; // If can't determine, try updating
	const iParts = installed.split('.').map(Number);
	const lParts = latest.split('.').map(Number);
	for (let i = 0; i < 3; i++) {
		if ((lParts[i] || 0) > (iParts[i] || 0)) return true;
		if ((lParts[i] || 0) < (iParts[i] || 0)) return false;
	}
	return false; // Equal
}

/**
 * Run shell command as Promise with timeout
 */
function execAsync(cmd, options = {}) {
	return new Promise((resolve, reject) => {
		const child = exec(cmd, { timeout: 120000, ...options }, (error, stdout, stderr) => {
			if (error) reject(error);
			else resolve({ stdout, stderr });
		});
	});
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - async function to retry
 * @param {number} maxRetries - max retry count
 * @param {string} label - log label
 */
async function withRetry(fn, maxRetries = 3, label = 'operation') {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
			if (attempt < maxRetries) {
				log(`⚠️ [AUTO-UPDATER] ${label} attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delay / 1000}s...`);
				await new Promise((r) => setTimeout(r, delay));
			} else {
				log(`❌ [AUTO-UPDATER] ${label} failed after ${maxRetries} attempts: ${error.message}`);
				throw error;
			}
		}
	}
}

/**
 * Main update check + install logic
 */
async function performUpdate() {
	try {
		// [BINH PHAP] NEVER interrupt an active mission with a global toolchain update.
		try {
			const brainManager = require('./brain-process-manager');
			if (brainManager.isMissionActive && brainManager.isMissionActive()) {
				log(`🔄 [AUTO-UPDATER] Postponed: Active mission is currently running. Skipping update cycle.`);
				return { updated: false, reason: 'mission_active' };
			}
		} catch (e) {
			// Safe fallback if module not loaded
		}

		const installed = getInstalledVersion();
		const latest = getLatestVersion();

		log(`🔄 [AUTO-UPDATER] Version check — installed: ${installed || 'N/A'}, latest: ${latest || 'N/A'}`);

		if (!isOutdated(installed, latest)) {
			log(`✅ [AUTO-UPDATER] ClaudeKit ${installed} is up to date.`);
			return { updated: false, version: installed };
		}

		log(`📦 [AUTO-UPDATER] Updating ClaudeKit: ${installed || 'N/A'} → ${latest || 'latest'}...`);

		// Step 1: Install globally with retry
		await withRetry(
			async () => {
				await execAsync('npm install -g claudekit-cli@latest', {
					timeout: 120000, // 2 min timeout for npm install
				});
			},
			3,
			'npm install',
		);

		// Step 2: Run ck init in project root
		const projectRoot = config.PROJECT_ROOT || '/Users/macbookprom1/mekong-cli';
		try {
			await execAsync('ck init --yes 2>/dev/null || true', {
				cwd: projectRoot,
				timeout: 30000,
			});
			log(`✅ [AUTO-UPDATER] ck init completed in ${projectRoot}`);
		} catch (initErr) {
			// ck init failure is non-fatal — skills/agents still work from global
			log(`⚠️ [AUTO-UPDATER] ck init warning (non-fatal): ${initErr.message}`);
		}

		// Verify new version
		const newVersion = getInstalledVersion();
		log(`✅ [AUTO-UPDATER] ClaudeKit updated: ${installed || 'N/A'} → ${newVersion || 'unknown'}`);

		return { updated: true, oldVersion: installed, newVersion };
	} catch (error) {
		log(`❌ [AUTO-UPDATER] Update cycle failed: ${error.message}`);
		return { updated: false, error: error.message };
	}
}

/**
 * Start the periodic updater
 * Called from task-watcher.js safeBoot()
 */
function startUpdater() {
	// First check 3 minutes after boot (avoid slowing startup)
	setTimeout(
		() => {
			performUpdate().catch((e) => log(`❌ [AUTO-UPDATER] Initial check error: ${e.message}`));
		},
		3 * 60 * 1000,
	);

	// Then check every 12 hours
	updateInterval = setInterval(
		() => {
			performUpdate().catch((e) => log(`❌ [AUTO-UPDATER] Periodic check error: ${e.message}`));
		},
		12 * 60 * 60 * 1000,
	);

	log('🔄 [AUTO-UPDATER] Scheduled: first check in 3min, then every 12h');
}

/**
 * Stop the periodic updater
 */
function stopUpdater() {
	if (updateInterval) {
		clearInterval(updateInterval);
		updateInterval = null;
		log('🔄 [AUTO-UPDATER] Stopped.');
	}
}

module.exports = { startUpdater, stopUpdater, performUpdate, getInstalledVersion, getLatestVersion, isOutdated };
