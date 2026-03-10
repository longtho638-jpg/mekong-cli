/**
 * 🦞 AUTO TASK CHAIN — Tự tạo task kế tiếp sau mỗi mission xong
 *
 * Khi CTO xong 1 task, module này scan:
 * 1. plans/ folders có phase files chưa implement
 * 2. knowledge/DUAL_AGI_TRACKER.md có ❓ items
 * 3. Tạo task file mới trong tasks/ folder
 *
 * → CTO KHÔNG BAO GIỜ hết việc
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
Đọc ${phase.planDir}/${phase.phaseFile} rồi implement theo plan. ${phase.title}. Test kết quả trước khi xong.`;

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
[CTO STRATEGIC PLANNING — 始計 Kế Sách]

Bạn là CTO Tôm Hùm. Queue task trống. Nhiệm vụ: TỰ TẠO task mới.

BƯỚC 1: Đọc tình hình
- Đọc ${trackerExists ? 'knowledge/DUAL_AGI_TRACKER.md' : 'packages/docs/MASTER_PRD.md'} 
- Đọc git log -10 để biết gần đây làm gì
- Đọc plans/ folder xem có roadmap nào

BƯỚC 2: Đánh giá (始計 — Thất Kế)
- Module nào ❓ chưa audit?
- Module nào ⏳ đang thiếu?
- Test nào đang fail?

BƯỚC 3: Tạo 3-5 task files
- Viết vào ${TASKS_DIR}/HIGH_mission_*.txt hoặc MEDIUM_mission_*.txt
- Mỗi file chứa 1 task cụ thể, ngắn gọn (dưới 200 chars)
- Priority: HIGH cho blocker, MEDIUM cho feature, LOW cho polish
- Format: "Working Dir: /path\\nMô tả task cụ thể"

KHÔNG ĐƯỢC tạo quá 5 task. KHÔNG ĐƯỢC tạo task trùng với processed/ folder.
Trả lời TIẾNG VIỆT.`;

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
