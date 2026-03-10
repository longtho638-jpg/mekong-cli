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
TRẬN THẾ: Trận đánh "${missionId}" đã làm hỏng tính năng (Build FAILED).
LỖI CHI TIẾT:
${errorSnippet}

NHIỆM VỤ: Dùng /debug để tìm và sửa lỗi vừa gây ra. KHÔNG để project trong trạng thái đỏ.
Chiến thuật: Tập trung hỏa lực vào lỗi sitemap/i18n/test vừa xuất hiện.`;

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
TRẬN THẾ: CC CLI vừa báo cáo lỗi trong khi thực hiện nhiệm vụ.
LỖI: ${result.error}

NHIỆM VỤ: Sử dụng /debug hoặc /cook để giải quyết triệt để lỗi này.
Hàn Băng Quyết v5: Ưu tiên ổn định hệ thống trước khi tiếp tục tính năng.`;

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
