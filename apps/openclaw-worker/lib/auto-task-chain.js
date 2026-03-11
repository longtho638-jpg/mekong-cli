/**
 * 🦞 AUTO TASK CHAIN — Auto-generate next task after each mission completes
 *
 * When CTO finishes a task, this module scans:
 * 1. plans/ folders for unimplemented phase files
 * 2. knowledge/DUAL_AGI_TRACKER.md for ❓ items
 * 3. Creates new task files in the tasks/ folder
 *
 * → CTO never runs out of work
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-process-manager');

const MEKONG_DIR = config.MEKONG_DIR || path.join(__dirname, '../../../');
const TASKS_DIR = path.join(MEKONG_DIR, 'tasks');
const PLANS_DIR = path.join(MEKONG_DIR, 'plans');
const PROCESSED_DIR = path.join(TASKS_DIR, 'processed');

/**
 * Scan plans/ for unimplemented phases
 * Convention: plans/<date>-<name>/<phase-file>.md
 * A phase is "done" if its matching task is in processed/
 */
function findNextPhase() {
	try {
		if (!fs.existsSync(PLANS_DIR)) return null;

		const planDirs = fs
			.readdirSync(PLANS_DIR, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name)
			.sort()
			.reverse(); // Most recent plan first

		for (const planDir of planDirs) {
			const planPath = path.join(PLANS_DIR, planDir);
			const files = fs
				.readdirSync(planPath)
				.filter((f) => f.startsWith('phase-') && f.endsWith('.md'))
				.sort(); // phase-01, phase-02, etc.

			for (const phaseFile of files) {
				// Extract phase number and name
				const match = phaseFile.match(/^phase-(\d+)-(.+)\.md$/);
				if (!match) continue;

				const phaseNum = match[1];
				const phaseName = match[2].replace(/-/g, '_');
				const project = planDir.replace(/^\d+-/, '').replace(/-/g, '_');

				// Check if task already exists (pending or processed)
				const taskPattern = new RegExp(`mission_${project}.*phase${phaseNum}|mission.*phase${phaseNum}.*${phaseName}`, 'i');

				const pendingTasks = fs.existsSync(TASKS_DIR) ? fs.readdirSync(TASKS_DIR).filter((f) => f.endsWith('.txt')) : [];
				const processedTasks = fs.existsSync(PROCESSED_DIR) ? fs.readdirSync(PROCESSED_DIR).filter((f) => f.endsWith('.txt')) : [];

				const alreadyExists = [...pendingTasks, ...processedTasks].some((t) => taskPattern.test(t));

				if (!alreadyExists) {
					// Read the phase plan
					const content = fs.readFileSync(path.join(planPath, phaseFile), 'utf-8');
					const firstLine = content.split('\n').find((l) => l.trim().length > 0) || phaseName;
					const title = firstLine.replace(/^#+\s*/, '').trim();

					return {
						planDir,
						phaseFile,
						phaseNum,
						phaseName,
						title,
						workingDir: MEKONG_DIR,
						content: content.slice(0, 500), // First 500 chars for prompt
					};
				}
			}
		}
	} catch (e) {
		log(`[CHAIN] Error scanning plans: ${e.message}`);
	}
	return null;
}

/**
 * Generate a task file from a phase plan
 */
function generateTaskFromPhase(phase) {
	const priority = phase.phaseNum <= '02' ? 'HIGH' : 'MEDIUM';
	const taskFileName = `${priority}_mission_mekong_phase${phase.phaseNum}_${phase.phaseName}.txt`;
	const taskPath = path.join(TASKS_DIR, taskFileName);

	if (fs.existsSync(taskPath)) {
		log(`[CHAIN] Task already exists: ${taskFileName}`);
		return null;
	}

	const taskContent = `Working Dir: ${phase.workingDir}
Read ${phase.planDir}/${phase.phaseFile} then implement according to plan. ${phase.title}. Test results before finishing.`;

	fs.writeFileSync(taskPath, taskContent);
	log(`[CHAIN] 🔗 AUTO-GENERATED: ${taskFileName} (from ${phase.planDir}/${phase.phaseFile})`);
	return taskFileName;
}

/**
 * Called after each mission completes. Checks if queue needs more tasks.
 *
 * STRATEGY (始計): Instead of dumb file scanning, CTO dispatches a
 * STRATEGIC PLANNING mission to CC CLI — it reads the master tracker,
 * assesses progress, and creates task files for the next batch.
 *
 * This is what makes CTO a real CTO, not just a task runner.
 */
function chainNextTask() {
	try {
		// Count pending tasks
		const pendingTasks = fs.existsSync(TASKS_DIR) ? fs.readdirSync(TASKS_DIR).filter((f) => f.endsWith('.txt') && !f.startsWith('.')) : [];

		if (pendingTasks.length > 0) {
			log(`[CHAIN] Queue has ${pendingTasks.length} tasks — CTO resting`);
			return null;
		}

		// Cooldown: don't generate strategic missions too frequently (min 30min gap)
		const lockFile = path.join(TASKS_DIR, '.chain-cooldown');
		if (fs.existsSync(lockFile)) {
			const lockAge = Date.now() - fs.statSync(lockFile).mtimeMs;
			if (lockAge < 30 * 60 * 1000) {
				log(`[CHAIN] Cooldown active (${Math.round(lockAge / 60000)}min / 30min) — waiting`);
				return null;
			}
		}

		// Step 1: Try simple phase scan first (fast, no API cost)
		const nextPhase = findNextPhase();
		if (nextPhase) {
			return generateTaskFromPhase(nextPhase);
		}

		// Step 2: No phases left — dispatch STRATEGIC PLANNING mission
		// CC CLI will read the tracker, check git log, and create next tasks
		log(`[CHAIN] 🧠 CTO STRATEGIC PLANNING — Dispatching mission to CC CLI`);

		const strategicTask = `MEDIUM_mission_cto_strategic_planning_${Date.now()}.txt`;
		const taskPath = path.join(TASKS_DIR, strategicTask);

		const trackerPath = path.join(MEKONG_DIR, 'knowledge/DUAL_AGI_TRACKER.md');
		const trackerExists = fs.existsSync(trackerPath);

		const taskContent = `Working Dir: ${MEKONG_DIR}
[CTO STRATEGIC PLANNING — 始計]

You are CTO Tôm Hùm. Task queue is empty. Mission: CREATE new tasks autonomously.

STEP 1: Read current status
- Read ${trackerExists ? 'knowledge/DUAL_AGI_TRACKER.md' : 'packages/docs/MASTER_PRD.md'}
- Read git log -10 to see recent work
- Read plans/ folder for any roadmaps

STEP 2: Assess (始計 — Seven Considerations)
- Which modules ❓ are not yet audited?
- Which modules ⏳ are incomplete?
- Which tests are failing?

STEP 3: Create 3-5 task files
- Write to ${TASKS_DIR}/HIGH_mission_*.txt or MEDIUM_mission_*.txt
- Each file contains 1 specific, concise task (under 200 chars)
- Priority: HIGH for blockers, MEDIUM for features, LOW for polish
- Format: "Working Dir: /path\\nSpecific task description"

DO NOT create more than 5 tasks. DO NOT create tasks that duplicate the processed/ folder.`;

		fs.writeFileSync(taskPath, taskContent);

		// Set cooldown lock
		fs.writeFileSync(lockFile, new Date().toISOString());

		log(`[CHAIN] 🧠 STRATEGIC MISSION CREATED: ${strategicTask}`);
		return strategicTask;
	} catch (e) {
		log(`[CHAIN] Error in chainNextTask: ${e.message}`);
		return null;
	}
}

module.exports = { chainNextTask, findNextPhase };
