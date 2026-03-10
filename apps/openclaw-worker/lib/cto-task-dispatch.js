/**
 * cto-task-dispatch.js
 * CTO Nhà Máy RaaS — Agent Role mapping + chuyên môn hoá từng pane.
 * Task selection: REALITY scan → External queue → Specialised pool fallback.
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────────────
// PANE ROLES — Mỗi pane là 1 phòng ban chuyên môn
// P0 = Chairman (IRON GUARD, không dispatch)
// ──────────────────────────────────────────────────────────────
const PANE_ROLES = {
	1: {
		role: 'backend-developer',
		department: 'Backend Engineering',
		skills: ['senior-backend', 'databases', 'payment-integration', 'devops'],
		focus: 'API, database, server logic, WebSocket, exchange engines',
		bootFlags: '--role backend-developer',
	},
	2: {
		role: 'frontend-developer',
		department: 'Frontend & UX',
		skills: ['frontend-development', 'ui-styling', 'react-best-practices', 'web-testing'],
		focus: 'UI components, i18n, responsive design, error boundaries, UX polish',
		bootFlags: '--role frontend-developer',
	},
	3: {
		role: 'qa-tester',
		department: 'Quality Assurance',
		skills: ['test', 'web-testing', 'code-review', 'debug'],
		focus: 'Test suites, E2E tests, build verification, deploy checks, security audit',
		bootFlags: '--role qa-tester',
	},
	4: {
		role: 'strategic-architect',
		department: 'Strategic Planning',
		skills: ['senior-architect', 'software-architecture', 'plan'],
		focus: 'Architecture decisions, cross-project coordination, ROI analysis',
		bootFlags: '--role strategic-architect',
	},
};

/**
 * Get role config for a pane index.
 * @param {number} paneIdx
 * @returns {{ role: string, department: string, skills: string[], focus: string, bootFlags: string } | null}
 */
function getPaneRole(paneIdx) {
	return PANE_ROLES[paneIdx] || null;
}

// ──────────────────────────────────────────────────────────────
// PROJECT_BACKLOGS — full pipeline per project, ordered by priority
// Worker nhận nguyên backlog, tự chạy hết. CTO không inject từng task.
// ──────────────────────────────────────────────────────────────
const PROJECT_BACKLOGS = {
	'algo-trader': [
		'1. WebSocket reconnect — auto-reconnect on disconnect, exponential backoff, state recovery',
		'2. Order book sync — stale data detection, depth snapshot recovery, latency tracking',
		'3. API key rotate — secure key storage, rotation script, per-exchange rate limit tracking',
		'4. Exchange engine perf — spread calculation edge cases, slippage protection, benchmark latency',
		'5. Database schema — migrate order history to TimescaleDB, add indexes for time-range queries',
		'6. Risk engine — position sizing, max drawdown limits, portfolio-level stop-loss',
		'7. Backtesting — historical data replay, strategy comparison, performance metrics',
		'8. Monitoring — Grafana dashboards for P&L, latency, order fill rates',
		'9. Unit tests — full test coverage for exchange adapters, order matching, fee calculation',
		'10. CI pipeline — GitHub Actions green, lint, test, build verification',
	],
	well: [
		'1. i18n audit — grep t() calls vs vi.ts/en.ts, fix missing keys, verify no raw strings in JSX',
		'2. Error boundary — add React error boundaries for all route segments, fallback UI, error logging',
		'3. Auth flow UI — login/register/forgot-password forms, loading states, validation messages',
		'4. Responsive audit — test all pages on 375px/768px/1024px breakpoints, fix layout issues',
		'5. Component polish — skeleton loaders, empty states with illustrations, toast notifications',
		'6. PayOS webhook — verify signature validation, idempotency key, retry logic, error codes',
		'7. Supabase RLS — audit all tables have row-level security, test with anon/auth roles',
		'8. SEO meta tags — dynamic OG images, structured data, sitemap generation',
		'9. Performance — lazy load routes, image optimization, bundle splitting',
		'10. Accessibility — WCAG 2.1 AA audit, keyboard navigation, screen reader support',
	],
	'sophia-ai-factory': [
		'1. E2E test suite — Playwright tests for video upload, campaign creation, checkout flow',
		'2. Deploy verify — TypeScript strict mode, build errors, verify Vercel deploy passes clean',
		'3. Security audit — check CSP headers, XSS prevention, API key exposure, input validation',
		'4. Performance test — Lighthouse audit, bundle size analysis, image optimization check',
		'5. Video pipeline — ffmpeg transcoding errors, timeout handling, retry logic, progress tracking',
		'6. Campaign template — fix broken variables, preview mode, mobile responsive, edge cases',
		'7. AI service test — verify all AI endpoints respond, error handling, rate limit degradation',
		'8. Checkout flow — Polar.sh integration, tier pricing, redirect verification, error states',
		'9. Analytics — user tracking, conversion funnels, campaign performance metrics',
		'10. Documentation — API docs, deployment guide, user manual updates',
	],
	'mekong-cli': [
		'1. Pytest fix — run full test suite, fix broken tests, ensure 100% pass rate',
		'2. Agent module audit — fix imports in git_agent/file_agent/shell_agent, error handling',
		'3. CI pipeline — fix pytest failures, flaky test detection, verify GitHub Actions green',
		'4. Vibe SDK types — Pydantic models, type hints on all public methods, mypy clean',
		'5. Recipe engine — plan/execute/verify pipeline edge cases, rollback on failure',
		'6. NLU classifier — intent detection accuracy, add new intents for agent routing',
		'7. Gateway API — FastAPI endpoints, WebSocket streaming, health checks',
		'8. Memory store — persistent context, cross-session recall, cleanup policy',
		'9. Telemetry — execution tracing, performance metrics, error tracking',
		'10. Security — input validation, secret detection, dependency audit',
	],
};

// Track which backlog cycle each project is on (for respawn with fresh backlog)
const backlogCycle = {};

/**
 * Build a single MISSION BRIEF command for a project's full backlog.
 * Worker receives entire list and self-executes sequentially.
 * @param {string} project
 * @returns {string|null} - A /cook command with full backlog embedded
 */
function getProjectMissionBrief(project) {
	const backlog = PROJECT_BACKLOGS[project];
	if (!backlog || backlog.length === 0) return null;

	if (!backlogCycle[project]) backlogCycle[project] = 0;
	backlogCycle[project]++;

	const taskList = backlog.join('\\n');

	return (
		`/cook "MISSION BRIEF #${backlogCycle[project]} for ${project}. ` +
		`You are autonomous. Execute ALL tasks below in order. ` +
		`After each task: run build/test, commit if clean, then proceed to next. ` +
		`If stuck on one task >5min, skip it and move to next. ` +
		`BACKLOG:\\n${taskList}" --auto`
	);
}

/** @deprecated Use getProjectMissionBrief instead */
function getNextPoolTask(project) {
	return getProjectMissionBrief(project);
}

/**
 * Wrap command with pane role context for CC CLI.
 * Prepends role instruction so CC CLI knows its specialisation.
 * @param {string} cmd - Original /cook or /debug command
 * @param {number} paneIdx
 * @returns {string}
 */
function wrapWithRole(cmd, paneIdx) {
	const role = PANE_ROLES[paneIdx];
	if (!role) return cmd;
	// Inject role context as prefix instruction before the actual command
	const rolePrefix = `[ROLE: ${role.role} | DEPT: ${role.department} | FOCUS: ${role.focus}] `;
	// For /cook and /debug commands, insert role context into the quoted task description
	if (/^\/(cook|debug|fix)\s+"/.test(cmd)) {
		return cmd.replace(/^\/(cook|debug|fix)\s+"/, `/$1 "${rolePrefix}`);
	}
	return cmd;
}

/**
 * Smart reality scan: inspect project state → highest-priority task or null.
 * Priority: test fail > uncommitted changes > dirty files > TODO overload > null
 */
function smartTaskFromReality(pane, log) {
	const { dir, project } = pane;

	// 1) npm test — failing tests = broken product
	try {
		const testOut = execSync('npm test 2>&1 | tail -10', {
			cwd: dir,
			encoding: 'utf-8',
			timeout: 30000,
		}).trim();
		const failPat = /FAIL|failing|failed|✕|×|Error:|AssertionError/i;
		if (failPat.test(testOut)) {
			const snippet = testOut
				.split('\n')
				.filter((l) => failPat.test(l))
				.slice(0, 3)
				.join('; ')
				.slice(0, 200)
				.replace(/"/g, '\\"');
			log(`P${pane.idx}: REALITY: npm test FAILED — ${snippet.slice(0, 80)}`);
			return `/debug "${project}: Test failures detected. Analyze: ${snippet}. Fix source code, run npm test to verify." --auto`;
		}
	} catch (e) {
		const stderr = (e.stderr || e.stdout || '').trim();
		if (stderr && !/missing script|ERR!.*test/.test(stderr)) {
			const snippet = stderr.split('\n').slice(-5).join('; ').slice(0, 200).replace(/"/g, '\\"');
			log(`P${pane.idx}: REALITY: npm test CRASHED — ${snippet.slice(0, 80)}`);
			return `/debug "${project}: Tests crashed. Error: ${snippet}. Fix and verify with npm test." --auto`;
		}
	}

	// 2) git diff --stat — uncommitted code changes
	try {
		const diffStat = execSync('git diff --stat 2>/dev/null', {
			cwd: dir,
			encoding: 'utf-8',
			timeout: 5000,
		}).trim();
		if (diffStat) {
			const codeFiles = diffStat
				.split('\n')
				.filter((l) => l.includes('|'))
				.map((l) => l.split('|')[0].trim())
				.filter((f) => /\.(ts|tsx|js|jsx|py)$/.test(f))
				.slice(0, 5);
			if (codeFiles.length > 0) {
				const fileList = codeFiles.join(', ');
				log(`P${pane.idx}: REALITY: ${codeFiles.length} changed files — ${fileList.slice(0, 80)}`);
				return `/cook "${project}: Uncommitted changes in ${fileList}. Review changes, run build/test, fix any errors, commit if clean." --auto`;
			}
		}
	} catch {}

	// 3) git status --porcelain — dirty code files
	try {
		const gs = execSync('git status --porcelain 2>/dev/null | head -5', {
			cwd: dir,
			encoding: 'utf-8',
			timeout: 5000,
		}).trim();
		if (gs) {
			const codeFiles = gs
				.split('\n')
				.filter(Boolean)
				.map((l) => l.trim().slice(3))
				.filter((f) => /\.(ts|tsx|py|js|jsx)$/.test(f));
			if (codeFiles.length > 0) {
				const fileList = codeFiles.slice(0, 3).join(', ');
				log(`P${pane.idx}: REALITY: dirty files — ${fileList}`);
				return `/cook "${project}: Dirty files: ${fileList}. Run build/test, fix errors, commit if clean." --auto`;
			}
		}
	} catch {}

	// 4) TODO/FIXME count > 10
	try {
		const todoOut = execSync(
			'grep -rc "TODO\\|FIXME\\|HACK" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.git --exclude-dir=.claude 2>/dev/null | awk -F: \'{s+=$2} END {print s}\'',
			{ cwd: dir, encoding: 'utf-8', timeout: 5000 },
		).trim();
		const todoCount = parseInt(todoOut) || 0;
		if (todoCount > 10) {
			log(`P${pane.idx}: REALITY: ${todoCount} TODOs found — scheduling cleanup`);
			return `/cook "${project}: ${todoCount} TODO/FIXME found. Clean up top 10 most critical TODOs, resolve or remove stale ones. Run build after." --auto`;
		}
	} catch {}

	return null;
}

/**
 * Check external task queue directory for project-specific .txt files.
 */
function checkExternalQueue(pane, log) {
	const tasksDir = '/Users/macbookprom1/mekong-cli/tasks';
	try {
		if (!fs.existsSync(tasksDir)) return null;
		const files = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.txt'));
		if (files.length === 0) return null;

		const myTasks = files.filter((f) => {
			const n = f.toLowerCase();
			const { project, isOpus } = pane;
			const matchers = {
				'openclaw-worker': n.includes('openclaw') || n.includes('brain') || n.includes('cto'),
				well: n.includes('well') || n.includes('wellnexus'),
				'mekong-cli': n.includes('mekong') || n.includes('vibe') || n.includes('core'),
				'sophia-ai-factory': n.includes('sophia'),
				'algo-trader': n.includes('algo') || n.includes('trading'),
			};
			if (isOpus)
				return n.includes('strategic') || n.includes('roiaas') || n.includes('binh_phap') || n.includes('10x') || n.includes('opus');
			return matchers[project] || false;
		});

		if (myTasks.length === 0) return null;

		myTasks.sort((a, b) => {
			const w = (f) => (f.startsWith('CRITICAL') ? 3 : f.startsWith('HIGH') ? 2 : 1);
			return w(b) - w(a);
		});

		const taskFile = myTasks[0];
		const content = fs.readFileSync(path.join(tasksDir, taskFile), 'utf8');
		const safeContent = content.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`').slice(0, 1500);
		const cookCmd = `/cook "EXTERNAL TASK: ${taskFile}\\n${safeContent}" --auto`;

		const procDir = path.join(tasksDir, 'processed');
		if (!fs.existsSync(procDir)) fs.mkdirSync(procDir);
		fs.renameSync(path.join(tasksDir, taskFile), path.join(procDir, taskFile));
		log(`P${pane.idx}: DISPATCHED external task: ${taskFile}`);
		return cookCmd;
	} catch (e) {
		log(`P${pane.idx}: External queue error: ${e.message}`);
		return null;
	}
}

module.exports = {
	PANE_ROLES,
	getPaneRole,
	PROJECT_BACKLOGS,
	getProjectMissionBrief,
	getNextPoolTask, // deprecated alias
	wrapWithRole,
	smartTaskFromReality,
	checkExternalQueue,
};
