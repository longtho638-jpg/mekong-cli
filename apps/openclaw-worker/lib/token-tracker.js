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

const PROXY_LOG = '/tmp/proxy_11436.log';
const USAGE_FILE = path.join(__dirname, '..', '.token-usage.json');
const DAILY_BUDGET = 50000; // 🔒 Alert threshold

// Parse tokens from proxy log line: "[15:30:38] ✅ 52tok (AG:gemini-3-pro) [200]"
const TOKEN_REGEX = /\[(\d{2}:\d{2}:\d{2})\]\s+[✅❌]\s+(\d+)tok/;

/**
 * Safely read a file line by line synchronously without loading it all into memory.
 * @param {string} filePath
 * @param {function(string): void} callback
 */
function readLinesSync(filePath, callback) {
    if (!fs.existsSync(filePath)) return;

    let fd;
    try {
        fd = fs.openSync(filePath, 'r');
        const bufferSize = 64 * 1024; // 64KB
        const buffer = Buffer.alloc(bufferSize);
        let leftOver = '';
        let bytesRead = 0;

        while ((bytesRead = fs.readSync(fd, buffer, 0, bufferSize, null)) !== 0) {
            const chunk = buffer.toString('utf8', 0, bytesRead);
            const lines = (leftOver + chunk).split('\n');
            leftOver = lines.pop(); // Keep the last partial line

            for (const line of lines) {
                callback(line);
            }
        }
        if (leftOver) {
            callback(leftOver);
        }
    } catch (e) {
        // Ignore read errors
    } finally {
        if (fd !== undefined) fs.closeSync(fd);
    }
}

/**
 * Count tokens used between two Date objects by scraping proxy log.
 * Uses stream-like reading to avoid OOM on large logs.
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {{ tokens: number, requests: number, model: string }}
 */
function countTokensBetween(startTime, endTime) {
    try {
        const startHMS = formatHMS(startTime);
        const endHMS = formatHMS(endTime);

        let totalTokens = 0;
        let requestCount = 0;
        let lastModel = 'unknown';

        readLinesSync(PROXY_LOG, (line) => {
            const match = line.match(TOKEN_REGEX);
            if (!match) return;

            const [, timeStr, tokStr] = match;
            // Simple string comparison for HMS works within the same day
            if (timeStr >= startHMS && timeStr <= endHMS) {
                totalTokens += parseInt(tokStr);
                requestCount++;
                // Extract model from line
                const modelMatch = line.match(/\(([^)]+)\)/);
                if (modelMatch) lastModel = modelMatch[1];
            }
        });

        return { tokens: totalTokens, requests: requestCount, model: lastModel };
    } catch (e) {
        return { tokens: 0, requests: 0, model: 'error' };
    }
}

function formatHMS(date) {
    return date.toISOString().slice(11, 19);
}

/**
 * Safe JSON parse with backup for corrupted files
 * @param {string} filePath
 * @returns {Array}
 */
function safeLoadHistory(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
        console.error(`TOKEN_TRACKER: ❌ Corrupt JSON in ${path.basename(filePath)}. Backing up and resetting.`);
        try {
            const backupPath = `${filePath}.bak.${Date.now()}`;
            fs.copyFileSync(filePath, backupPath);
        } catch (copyErr) { /* ignore */ }
        return [];
    }
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
        let records = safeLoadHistory(USAGE_FILE);

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
    } catch (e) { /* non-critical */ }
}

/**
 * Get today's total token usage.
 * @returns {{ tokens: number, missions: number, overBudget: boolean }}
 */
function getDailyUsage() {
    try {
        const records = safeLoadHistory(USAGE_FILE);
        const today = new Date().toISOString().slice(0, 10);
        const todayRecords = records.filter(r => r.ts && r.ts.startsWith(today));

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

        if (usage.tokens > (DAILY_BUDGET * 0.8)) {
             console.log(`TOKEN_TRACKER: ⚠️ Warning: 80% of daily budget used (${usage.tokens}/${DAILY_BUDGET}).`);
        }

        return true;
    } catch (e) {
        return true; // Fail open if error
    }
}

module.exports = { countTokensBetween, recordMission, getDailyUsage, shouldUseBudget, DAILY_BUDGET };
