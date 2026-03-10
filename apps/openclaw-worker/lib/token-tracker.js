/**
 * Token Tracker — 作戰 Hậu Cần (Resource Management)
 *
 * "日費千金" — Mỗi ngày tốn ngàn vàng (token budget!)
 * "兵貴勝不貴久" — Quân quý thắng nhanh, không kéo dài
 *
 * Tracks tokens per mission by scraping proxy log timestamps.
 * Records to .token-usage.json for daily/weekly reporting.
 */

const fs = require('fs');
const path = require('path');

const PROXY_LOG = '/tmp/proxy_20128.log';
const USAGE_FILE = path.join(__dirname, '..', '.token-usage.json');
const DAILY_BUDGET = 50000; // 🔒 Alert threshold

// Parse tokens from proxy log line: "[15:30:38] ✅ 52tok (AG:gemini-3-pro) [200]"
const TOKEN_REGEX = /\[(\d{2}:\d{2}:\d{2})\]\s+[✅❌]\s+(\d+)tok/;

/**
 * Count tokens used between two Date objects by scraping proxy log.
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {{ tokens: number, requests: number, model: string }}
 */
function countTokensBetween(startTime, endTime) {
	try {
		if (!fs.existsSync(PROXY_LOG)) return { tokens: 0, requests: 0, model: 'unknown' };

		const lines = fs.readFileSync(PROXY_LOG, 'utf-8').split('\n');
		const startHMS = formatHMS(startTime);
		const endHMS = formatHMS(endTime);

		let totalTokens = 0;
		let requestCount = 0;
		let lastModel = 'unknown';

		for (const line of lines) {
			const match = line.match(TOKEN_REGEX);
			if (!match) continue;

			const [, timeStr, tokStr] = match;
			if (timeStr >= startHMS && timeStr <= endHMS) {
				totalTokens += parseInt(tokStr);
				requestCount++;
				// Extract model from line
				const modelMatch = line.match(/\(([^)]+)\)/);
				if (modelMatch) lastModel = modelMatch[1];
			}
		}

		return { tokens: totalTokens, requests: requestCount, model: lastModel };
	} catch (e) {
		return { tokens: 0, requests: 0, model: 'error' };
	}
}

function formatHMS(date) {
	return date.toISOString().slice(11, 19);
}

/**
 * Record completed mission token usage.
 * @param {string} missionId
 * @param {string} project
 * @param {number} tokens
 * @param {number} durationSec
 * @param {string} model
 */
function recordMission(missionId, project, tokens, durationSec, model) {
	try {
		let records = [];
		if (fs.existsSync(USAGE_FILE)) {
			records = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
		}

		records.push({
			ts: new Date().toISOString(),
			mission: missionId,
			project,
			tokens,
			duration: durationSec,
			model,
		});

		// Keep last 500 records
		if (records.length > 500) records = records.slice(-500);
		fs.writeFileSync(USAGE_FILE, JSON.stringify(records, null, 2));
	} catch (e) {
		/* non-critical */
	}
}

/**
 * Get today's total token usage.
 * @returns {{ tokens: number, missions: number, overBudget: boolean }}
 */
function getDailyUsage() {
	try {
		if (!fs.existsSync(USAGE_FILE)) return { tokens: 0, missions: 0, overBudget: false };

		const records = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
		const today = new Date().toISOString().slice(0, 10);
		const todayRecords = records.filter((r) => r.ts.startsWith(today));

		const tokens = todayRecords.reduce((sum, r) => sum + (r.tokens || 0), 0);
		return {
			tokens,
			missions: todayRecords.length,
			overBudget: tokens > DAILY_BUDGET,
		};
	} catch (e) {
		return { tokens: 0, missions: 0, overBudget: false };
	}
}

/**
 * Check if we have enough budget to run a mission
 * @returns {boolean} true if under budget, false if exhausted
 */
function shouldUseBudget() {
	try {
		const usage = getDailyUsage();
		if (usage.overBudget) {
			console.log(`TOKEN_TRACKER: 🚫 Daily budget exhausted (${usage.tokens}/${DAILY_BUDGET}). Stopping dispatch.`);
			return false;
		}

		if (usage.tokens > DAILY_BUDGET * 0.8) {
			console.log(`TOKEN_TRACKER: ⚠️ Warning: 80% of daily budget used (${usage.tokens}/${DAILY_BUDGET}).`);
		}

		return true;
	} catch (e) {
		return true; // Fail open if error
	}
}

module.exports = { countTokensBetween, recordMission, getDailyUsage, shouldUseBudget, DAILY_BUDGET };
