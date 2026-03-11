/**
 * Tactical Responder — Real-time mission adaptation (AGI Level 9)
 * 📜 Binh Pháp Ch.11 九地: "Move only when you see an advantage... Fight only when the position is critical."
 *
 * If a mission fails or hits a bug, this responder immediately launches
 * a counter-mission (like /debug) to resolve the blockage.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [tom-hum] [TACTICAL] ${msg}`;
	console.log(line);
	try {
		fs.appendFileSync(config.LOG_FILE, line + '\n');
	} catch (e) {}
}

/**
 * Analyze a mission failure and decide if an immediate follow-up is needed.
 */
function handleMissionFailure(data) {
	const { project, missionId, taskFile, result, buildResult } = data;

	// 1. Build Failure Response (The "Gate" detected a bug)
	if (buildResult && buildResult.build === false) {
		log(`🚨 DETECTED BUILD BUG in ${project}. Launching rescue mission...`);

		const errorSnippet = buildResult.output ? buildResult.output.slice(-500) : 'Unknown build error';
		const debugTask = `CRITICAL_mission_auto_debug_${Date.now()}.txt`;
		const content = `[PROJECT: ${project}] ĐỊA BÀN: ${project}. 
SITUATION: Mission "${missionId}" broke the feature (Build FAILED).
LỖI CHI TIẾT:
${errorSnippet}

TASK: Use /debug to find and fix the error just introduced. DO NOT leave the project in a red state.
Tactic: Focus firepower on the sitemap/i18n/test error that just appeared.`;

		try {
			fs.writeFileSync(path.join(config.WATCH_DIR, debugTask), content);
			log(`🎯 Tactical counter-mission dispatched: ${debugTask}`);
			return true;
		} catch (e) {
			log(`❌ Failed to dispatch tactical mission: ${e.message}`);
		}
	}

	// 2. Runtime/CLI Failure Response (CC CLI reported error)
	if (result && result.success === false && result.error) {
		log(`🚨 CC CLI REPORTED BUG in ${project}. Analyzing for debug mission...`);

		const debugTask = `CRITICAL_mission_auto_fix_${Date.now()}.txt`;
		const content = `[PROJECT: ${project}] ĐỊA BÀN: ${project}.
SITUATION: CC CLI just reported an error while executing the mission.
LỖI: ${result.error}

TASK: Use /debug or /cook to fully resolve this error.
Han Bang Quyet v5: Prioritize system stability before continuing with features.`;

		try {
			fs.writeFileSync(path.join(config.WATCH_DIR, debugTask), content);
			log(`🎯 Tactical fix-mission dispatched: ${debugTask}`);
			return true;
		} catch (e) {
			log(`❌ Failed to dispatch tactical mission: ${e.message}`);
		}
	}

	return false;
}

module.exports = { handleMissionFailure };
