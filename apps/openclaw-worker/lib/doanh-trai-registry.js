/**
 * 🏯 DOANH TRẠI REGISTRY — Military Division Mapping
 *
 * Maps every file to its military division per DOANH_TRAI.md org chart.
 * Validates at boot that no file is unmapped (rogue soldier).
 *
 * This is the SINGLE SOURCE OF TRUTH for the Doanh Trại structure.
 * When adding new files, YOU MUST register them here.
 *
 * Strategy: Files stay FLAT in lib/ (Node.js require works natively).
 *           This registry provides LOGICAL organization without physical moves.
 *           Think of it as the 編制 (biên chế) roster — not the barracks layout.
 *
 * 2500-year principle: 法 (Pháp) = tổ chức, biên chế, hậu cần
 */

const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// 🏯 DOANH TRẠI DIVISIONS (from DOANH_TRAI.md)
// ═══════════════════════════════════════════════════════════════

const DIVISIONS = {
	// 🧠 軍師 Quân Sư — Brain Command (state machine, dispatch, strategy)
	'quan-su': {
		label: '🧠 Quân Sư (Brain Command)',
		files: [
			'lib/brain-process-manager.js',
			'lib/brain-state-machine.js',
			'lib/brain-boot-sequence.js',
			'lib/brain-spawn-manager.js',
			'lib/brain-mission-runner.js',
			'lib/brain-respawn-controller.js',
			'lib/brain-tmux-controller.js',
			'lib/brain-dispatch-helpers.js',
			'lib/mission-dispatcher.js',
			'lib/mission-complexity-classifier.js',
			'lib/auto-cto-pilot.js',
			'lib/task-queue.js',
			'lib/mission-recovery.js',
			'lib/auto-task-chain.js',
			'lib/brain-supervisor.js',
			'lib/mission-generator.js',
			'lib/project-commander.js',
			'lib/strategic-brain.js',
			'lib/swarm-intelligence.js',
			'lib/tactical-responder.js',
		],
	},

	// ⚔️ 前隊 Tiền Đội — Frontline (scanning, gate)
	'tien-doi': {
		label: '⚔️ Tiền Đội (Frontline)',
		files: [
			'lib/hunter-scanner.js',
			'lib/post-mission-gate.js',
			'lib/project-scanner.js',
			'lib/web-researcher.js',
			'lib/project-profiler.js',
			'lib/perception-engine.js',
		],
	},

	// 🔨 中軍 Trung Quân — Core Force (safety, dedup, mutex, law)
	'trung-quan': {
		label: '🔨 Trung Quân (Core Force)',
		files: [
			'lib/safety-guard.js',
			'lib/task-deduplicator.js',
			'lib/team-mutex.js',
			'lib/quan-luat-enforcer.js',
			'lib/binh-phap-registry.js',
			'lib/binh-phap-strategist.js',
			'lib/mission-journal.js',
			'lib/post-mortem-reflector.js',
			'lib/strategy-optimizer.js',
			'lib/circuit-breaker.js',
			'lib/hands-registry.js',
			'lib/system-status-registry.js',
		],
	},

	// 🎓 後軍 Hậu Cần — Logistics (API, cooling, healing, comms)
	'hau-can': {
		label: '🎓 Hậu Cần (Logistics)',
		files: [
			'lib/nvidia-client.js',
			'lib/api-rate-gate.js',
			'lib/quota-tracker.js',
			'lib/telegram-client.js',
			'lib/m1-cooling-daemon.js',
			'lib/resource-governor.js',
			'lib/self-healer.js',
			'lib/doanh-trai-registry.js',
			'lib/claudekit-updater.js',
			'lib/cto-visual-dashboard.js',
			'lib/monitor-24-7.js',
			'lib/token-tracker.js',
			'lib/throughput-maximizer.js',
			'lib/brain-logger.js',
			'lib/brain-health-server.js',
			'lib/brain-heartbeat.js',
			'lib/brain-system-monitor.js',
			'lib/brain-output-hash-stagnation-watchdog.js',
		],
	},

	// 📚 參謀 Tham Mưu — Intelligence (deep analysis, knowledge)
	'tham-muu': {
		label: '📚 Tham Mưu (Intelligence)',
		files: [
			'lib/live-mission-viewer.js',
			'lib/signal-bus.js',
			'lib/dynamic-syllabus.js',
			'lib/evolution-engine.js',
			'lib/gemini-agentic.js',
			'lib/google-ultra.js',
			'lib/jules-agent.js',
			'lib/knowledge-synthesizer.js',
			'lib/learning-engine.js',
			'lib/llm-interpreter.js',
			'lib/question-handler.js',
			'lib/self-analyzer.js',
			'lib/skill-factory.js',
			'lib/vector-service.js',
			'lib/agi-score-calculator.js',
			'lib/openclaw-rl-client.js',
		],
	},

	// 🏯 Daemons — Standalone daemon entry points (by combat role)
	'daemons-tien-doi': {
		label: '⚔️ Daemons: Tiền Đội',
		files: ['daemons/hunter-daemon.js', 'daemons/dispatcher-daemon.js', 'daemons/operator-daemon.js'],
	},
	'daemons-trung-quan': {
		label: '🔨 Daemons: Trung Quân',
		files: ['daemons/builder-daemon.js', 'daemons/reviewer-daemon.js', 'daemons/scribe-daemon.js'],
	},
	'daemons-hau-can': {
		label: '🎓 Daemons: Hậu Cần',
		files: ['daemons/diplomat-daemon.js', 'daemons/merchant-daemon.js', 'daemons/artist-daemon.js'],
	},
	'daemons-tham-muu': {
		label: '📚 Daemons: Tham Mưu',
		files: ['daemons/architect-daemon.js', 'daemons/sage-daemon.js'],
	},

	// 🔒 Root — Command post (config, entry point)
	root: {
		label: '🔒 Bản Doanh (HQ)',
		files: ['config.js', 'task-watcher.js', 'package.json', 'bridge-server.js', 'ecosystem.config.js'],
	},
};

// Legacy/experimental/test files (not part of active roster)
const LEGACY = [
	'lib/brain-headless-per-mission.js',
	'lib/brain-terminal-app.js',
	'lib/brain-vscode-terminal.js',
	'lib/v2/cli-worker.js',
	'lib/v2/mission-executor.js',
	'lib/v2/worker-pool.js',
	'lib/v2/worker-pool.js',
	// Root test/utility files
	'dummy_bug.js',
	'_test_dedup.js',
	'test-safety.js',
	'src/index.ts',
];

// ═══════════════════════════════════════════════════════════════
// 🔍 VALIDATION
// ═══════════════════════════════════════════════════════════════

function validateRegistry(rootDir) {
	const warnings = [];
	const allRegistered = new Set();

	// Check all registered files exist
	for (const [div, info] of Object.entries(DIVISIONS)) {
		for (const file of info.files) {
			allRegistered.add(file);
			const fullPath = path.join(rootDir, file);
			// Follow symlinks for daemons/docs
			if (!fs.existsSync(fullPath)) {
				warnings.push(`${info.label}: MISSING ${file}`);
			}
		}
	}

	// Check for unregistered .js files (rogue soldiers)
	const libFiles = fs
		.readdirSync(path.join(rootDir, 'lib'))
		.filter((f) => f.endsWith('.js'))
		.map((f) => `lib/${f}`);

	for (const f of libFiles) {
		if (!allRegistered.has(f) && !LEGACY.includes(f)) {
			warnings.push(`⚠️ ROGUE SOLDIER: ${f} not assigned to any division!`);
		}
	}

	return warnings;
}

function printRoster(rootDir) {
	process.stderr.write('\n🏯 DOANH TRẠI ROSTER:\n');
	for (const [div, info] of Object.entries(DIVISIONS)) {
		const count = info.files.filter((f) => fs.existsSync(path.join(rootDir, f))).length;
		process.stderr.write(`  ${info.label}: ${count}/${info.files.length} binh sĩ\n`);
	}
	process.stderr.write('\n');
}

function validateDivisions() {
	const rootDir = path.join(__dirname, '..');
	const warnings = validateRegistry(rootDir);

	if (warnings.length === 0) {
		process.stderr.write(`[🏯 DOANH TRẠI] ✅ All divisions accounted for\n`);
		printRoster(rootDir);
		return true;
	}

	process.stderr.write(`[🏯 DOANH TRẠI] ⚠️ ${warnings.length} issue(s):\n`);
	for (const w of warnings) {
		process.stderr.write(`  ${w}\n`);
	}
	return false;
}

module.exports = { DIVISIONS, LEGACY, validateDivisions, validateRegistry, printRoster };
