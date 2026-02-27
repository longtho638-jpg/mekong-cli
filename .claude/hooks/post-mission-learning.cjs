#!/usr/bin/env node
/**
 * Post-Mission Learning Hook — AGI Feedback Loop
 * 
 * Fires: SessionEnd
 * Purpose: Reads mission gate results and appends failures to lessons.md
 *          Also injects top lessons into session-init context via wins+lessons summary.
 *
 * Binh Pháp: 知己知彼百戰不殆 — Self-awareness through negative feedback
 */

const fs = require('fs');
const path = require('path');

const LESSONS_FILE = path.join(process.cwd(), 'apps', 'openclaw-worker', 'lessons.md');
const WINS_FILE = path.join(process.cwd(), 'apps', 'openclaw-worker', 'wins.jsonl');
const GATE_RESULTS = path.join(process.cwd(), 'apps', 'openclaw-worker', '.gate-results.json');

function appendLesson(taskName, failureMode, rootCause) {
    const date = new Date().toISOString().slice(0, 10);
    const entry = `
### ${date} ${taskName}
- **Failure Mode:** ${failureMode}
- **Root Cause:** ${rootCause}
- **Fix Applied:** Auto-detected by post-mission-learning hook
- **Prevention:** Review before next similar task
`;

    try {
        fs.appendFileSync(LESSONS_FILE, entry, 'utf8');
    } catch (err) {
        process.stderr.write(`[post-mission-learning] Failed to write lesson: ${err.message}\n`);
    }
}

function checkGateResults() {
    if (!fs.existsSync(GATE_RESULTS)) return;

    try {
        const raw = fs.readFileSync(GATE_RESULTS, 'utf8');
        const results = JSON.parse(raw);

        // Check the most recent gate results for failures
        const recent = Array.isArray(results) ? results.slice(-5) : [];
        for (const result of recent) {
            if (result.status === 'RED' || result.status === 'FAILED') {
                appendLesson(
                    result.missionId || result.project || 'Unknown Mission',
                    result.error || result.reason || 'Build/Test gate RED',
                    result.details || 'Gate check failed — review build output'
                );
            }
        }
    } catch (err) {
        // Silently skip if gate results are malformed
    }
}

function getSummaryStats() {
    let wins = 0;
    let lessons = 0;

    try {
        if (fs.existsSync(WINS_FILE)) {
            const content = fs.readFileSync(WINS_FILE, 'utf8');
            wins = content.trim().split('\n').filter(Boolean).length;
        }
    } catch (_) { }

    try {
        if (fs.existsSync(LESSONS_FILE)) {
            const content = fs.readFileSync(LESSONS_FILE, 'utf8');
            lessons = (content.match(/^### \d{4}-\d{2}-\d{2}/gm) || []).length;
        }
    } catch (_) { }

    return { wins, lessons };
}

function main() {
    try {
        // Check gate results for failures and auto-log
        checkGateResults();

        // Print summary for session context
        const stats = getSummaryStats();
        console.log(`📊 Learning Loop: ${stats.wins} wins, ${stats.lessons} lessons recorded.`);

        if (stats.lessons > 0) {
            // Read last 3 lessons for context injection
            try {
                const content = fs.readFileSync(LESSONS_FILE, 'utf8');
                const entries = content.split(/(?=^### \d{4})/gm).filter(e => e.startsWith('###'));
                const recent = entries.slice(-3);
                if (recent.length > 0) {
                    console.log(`⚠️ Recent lessons to avoid:`);
                    for (const entry of recent) {
                        const firstLine = entry.split('\n')[0].trim();
                        console.log(`  - ${firstLine}`);
                    }
                }
            } catch (_) { }
        }

        process.exit(0);
    } catch (error) {
        process.stderr.write(`[post-mission-learning] Error: ${error.message}\n`);
        process.exit(0);
    }
}

main();
