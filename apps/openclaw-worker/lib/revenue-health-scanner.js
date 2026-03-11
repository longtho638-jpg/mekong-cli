/**
 * Revenue Health Scanner — 第二篇 作戰: Managing war resources
 *
 * Integrated into Auto-CTO loop to:
 *   1. Check RaaS credit system health
 *   2. Monitor billing webhook status
 *   3. Detect revenue bottlenecks
 *   4. Auto-create optimization missions
 *
 * Cooldown: 60 minutes — no scan spam
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./brain-process-manager');
const config = require('../config');

const RAAS_DB_PATH = path.join(process.env.HOME || '/tmp', '.mekong/raas/tenants.db');
const REVENUE_STATE_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/revenue-health.json');
const COOLDOWN_MS = 60 * 60 * 1000; // 60 minutes

// --- State ---

function loadRevenueState() {
	try {
		if (fs.existsSync(REVENUE_STATE_FILE)) {
			return JSON.parse(fs.readFileSync(REVENUE_STATE_FILE, 'utf-8'));
		}
	} catch (e) {
		/* ignore */
	}
	return { lastScan: 0, issues: [], metrics: {} };
}

function saveRevenueState(state) {
	try {
		const dir = path.dirname(REVENUE_STATE_FILE);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(REVENUE_STATE_FILE, JSON.stringify(state, null, 2));
	} catch (e) {
		log(`[REVENUE] Error saving state: ${e.message}`);
	}
}

// --- Health Checks ---

function checkRaaSModules() {
	const issues = [];
	const raasDir = path.join(config.MEKONG_DIR, 'src/raas');

	if (!fs.existsSync(raasDir)) {
		issues.push({ severity: 'critical', module: 'raas', message: 'src/raas/ does not exist' });
		return issues;
	}

	// Check required modules
	const requiredModules = ['auth.py', 'billing.py', 'credits.py', 'missions.py', 'tenant.py', 'dashboard.py', 'registry.py', 'sse.py'];

	for (const mod of requiredModules) {
		const modPath = path.join(raasDir, mod);
		if (!fs.existsSync(modPath)) {
			issues.push({ severity: 'critical', module: mod, message: `Module ${mod} missing` });
		}
	}

	return issues;
}

function checkGateway() {
	const issues = [];
	const gwPath = path.join(config.MEKONG_DIR, 'apps/raas-gateway/index.js');

	if (!fs.existsSync(gwPath)) {
		issues.push({ severity: 'high', module: 'gateway', message: 'raas-gateway/index.js missing' });
		return issues;
	}

	const content = fs.readFileSync(gwPath, 'utf-8');

	// Check security patterns
	if (!content.includes('X-Telegram-Bot-Api-Secret-Token')) {
		issues.push({ severity: 'high', module: 'gateway', message: 'Missing Telegram webhook security' });
	}
	if (!/sql.{0,10}injection/i.test(content)) {
		issues.push({ severity: 'medium', module: 'gateway', message: 'Missing SQL injection protection' });
	}

	return issues;
}

function checkDashboard() {
	const issues = [];
	const webDir = path.join(config.MEKONG_DIR, 'apps/agencyos-web');

	if (!fs.existsSync(webDir)) {
		issues.push({ severity: 'medium', module: 'dashboard', message: 'agencyos-web does not exist' });
		return issues;
	}

	// Check revenue routes
	const revDir = path.join(webDir, 'app/dashboard/revenue');
	if (!fs.existsSync(revDir)) {
		issues.push({
			severity: 'medium',
			module: 'dashboard',
			message: 'Missing revenue dashboard routes (app/dashboard/revenue/)',
		});
	}

	return issues;
}

// --- Main Scanner ---

/**
 * Scan full revenue pipeline health.
 * Returns { healthy: boolean, issues: Array, metrics: Object }
 */
function scanRevenueHealth() {
	const state = loadRevenueState();

	// Cooldown check
	if (Date.now() - state.lastScan < COOLDOWN_MS) {
		return null; // Not time to scan yet
	}

	log('[REVENUE 作戰]: Starting revenue health scan...');

	const issues = [...checkRaaSModules(), ...checkGateway(), ...checkDashboard()];

	// Count actual module count
	const raasDir = path.join(config.MEKONG_DIR, 'src/raas');
	let actualModuleCount = 0;
	try {
		actualModuleCount = fs.readdirSync(raasDir).filter((f) => f.endsWith('.py')).length;
	} catch (e) {
		/* ignore */
	}

	const metrics = {
		raasModuleCount: actualModuleCount,
		gatewayStatus: issues.some((i) => i.module === 'gateway') ? 'degraded' : 'healthy',
		dashboardStatus: issues.some((i) => i.module === 'dashboard') ? 'missing' : 'healthy',
		dbExists: fs.existsSync(RAAS_DB_PATH),
		totalIssues: issues.length,
		criticalCount: issues.filter((i) => i.severity === 'critical').length,
		scanTimestamp: new Date().toISOString(),
	};

	const result = {
		healthy: issues.length === 0,
		issues,
		metrics,
	};

	// Save state
	state.lastScan = Date.now();
	state.issues = issues;
	state.metrics = metrics;
	saveRevenueState(state);

	if (issues.length === 0) {
		log('[REVENUE 作戰]: Pipeline healthy ✅');
	} else {
		log(`[REVENUE 作戰]: ${issues.length} issues detected (${metrics.criticalCount} critical)`);
		for (const i of issues.slice(0, 3)) {
			log(`  [${i.severity.toUpperCase()}] ${i.module}: ${i.message}`);
		}
	}

	return result;
}

/**
 * Create a fix mission for revenue issues.
 * Called from auto-cto-pilot when revenue scan detects a problem.
 */
function generateRevenueMission(issue) {
	const prompt = `/cook "Fix revenue pipeline: ${issue.message} in module ${issue.module}. Verify with python3 -m pytest tests/test_raas_integration.py after fixing." --auto`;
	const filename = `HIGH_mission_revenue_fix_${issue.module}_${Date.now()}.txt`;
	return { prompt, filename };
}

module.exports = { scanRevenueHealth, generateRevenueMission };
