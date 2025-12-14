#!/usr/bin/env node
'use strict';

/**
 * Custom Claude Code statusline for Node.js
 * Cross-platform support: Windows, macOS, Linux
 * Theme: detailed | Features: directory, git, model, usage, session, tokens
 * No external dependencies - uses only Node.js built-in modules
 *
 * Context Window Calculation:
 * - 100% = compaction threshold (not model limit)
 * - Self-calibrates via PreCompact hook
 * - Falls back to smart defaults based on window size
 */

const { stdin, env } = require('process');
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Calibration file path
const CALIBRATION_PATH = path.join(os.tmpdir(), 'claude-compact-calibration.json');


/**
 * Safe command execution wrapper
 */
function exec(cmd) {
    try {
        return execSync(cmd, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
            windowsHide: true
        }).trim();
    } catch (err) {
        return '';
    }
}

/**
 * Format epoch timestamp as HH:mm
 */
function formatTimeHM(epoch) {
    try {
        const date = new Date(epoch * 1000);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (err) {
        return '00:00';
    }
}

/**
 * Get smart default compact threshold based on context window size
 * Research-based defaults:
 * - 200k window: ~80% (160k) - confirmed from GitHub issues
 * - 500k window: ~60% (300k) - estimated
 * - 1M window: ~33% (330k) - derived from user observations
 *
 * @param {number} contextWindowSize - Model's context window size
 * @returns {number} Estimated compact threshold in tokens
 */
function getDefaultCompactThreshold(contextWindowSize) {
    // Known thresholds from research (autocompact buffer = 22.5% for 200k)
    const KNOWN_THRESHOLDS = {
        200000: 155000,   // 77.5% - confirmed via /context showing 45k buffer
        1000000: 330000,  // 33% - 1M beta window
    };

    // Exact match
    if (KNOWN_THRESHOLDS[contextWindowSize]) {
        return KNOWN_THRESHOLDS[contextWindowSize];
    }

    // Tiered defaults based on window size
    if (contextWindowSize >= 1000000) {
        return Math.floor(contextWindowSize * 0.33);
    } else {
        // Default: ~77.5% for standard windows (200k confirmed)
        return Math.floor(contextWindowSize * 0.775);
    }
}

/**
 * Read calibration data from file
 * Calibration is recorded by PreCompact hook when compaction occurs
 *
 * @returns {Object} Calibration data keyed by context window size
 */
function readCalibration() {
    try {
        if (fs.existsSync(CALIBRATION_PATH)) {
            return JSON.parse(fs.readFileSync(CALIBRATION_PATH, 'utf8'));
        }
    } catch (err) {
        // Silent fail - use defaults
    }
    return {};
}

/**
 * Get compact threshold, preferring calibrated value over default
 *
 * @param {number} contextWindowSize - Model's context window size
 * @returns {number} Compact threshold in tokens
 */
function getCompactThreshold(contextWindowSize) {
    // Check for calibrated threshold first
    const calibration = readCalibration();
    const key = String(contextWindowSize);

    if (calibration[key] && calibration[key].threshold > 0) {
        return calibration[key].threshold;
    }

    // Fall back to smart defaults
    return getDefaultCompactThreshold(contextWindowSize);
}

/**
 * Generate Unicode progress bar (horizontal rectangles)
 * Uses smooth block characters for consistent rendering
 *
 * @param {number} percent - 0-100 percentage
 * @param {number} width - bar width in characters (default 12)
 * @returns {string} Unicode progress bar like ▰▰▰▰▰▱▱▱▱▱▱▱
 */
function progressBar(percent, width = 12) {
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.round(clamped * width / 100);
    const empty = width - filled;
    // ▰ (U+25B0) filled, ▱ (U+25B1) empty - smooth horizontal rectangles
    return '▰'.repeat(filled) + '▱'.repeat(empty);
}

/**
 * Get severity emoji based on percentage (no color codes)
 *
 * @param {number} percent - 0-100 percentage
 * @returns {string} Emoji indicator
 */
function getSeverityEmoji(percent) {
    if (percent >= 90) return '🔴';      // Critical
    if (percent >= 70) return '🟡';      // Warning
    return '🟢';                          // Healthy
}

/**
 * Get baseline for post-compaction percentage calculation
 *
 * After compaction, we track tokens relative to a baseline (cumulative total at compaction)
 * This allows percentage to reset to ~0% after compaction and grow naturally
 *
 * @param {string} sessionId - Current session ID
 * @param {number} currentTotal - Current cumulative token total
 * @returns {Object} { showCompactIndicator: boolean, baseline: number }
 */
function getCompactBaseline(sessionId, currentTotal) {
    try {
        const markerDir = path.join(os.tmpdir(), 'claude-compact-markers');
        const sessionMarkerPath = path.join(markerDir, `${sessionId}.json`);

        if (!fs.existsSync(sessionMarkerPath)) {
            return { showCompactIndicator: false, baseline: 0 };
        }

        const marker = JSON.parse(fs.readFileSync(sessionMarkerPath, 'utf8'));

        // First read after compaction - record baseline and show indicator
        if (!marker.baselineRecorded) {
            marker.baselineRecorded = true;
            marker.baseline = currentTotal;
            fs.writeFileSync(sessionMarkerPath, JSON.stringify(marker));
            return { showCompactIndicator: true, baseline: currentTotal };
        }

        // Baseline already recorded - return it for percentage calculation
        return { showCompactIndicator: false, baseline: marker.baseline };

    } catch (err) {
        return { showCompactIndicator: false, baseline: 0 };
    }
}

/**
 * Expand home directory to ~
 */
function expandHome(filePath) {
    const homeDir = os.homedir();
    if (filePath.startsWith(homeDir)) {
        return filePath.replace(homeDir, '~');
    }
    return filePath;
}

/**
 * Read stdin asynchronously
 */
async function readStdin() {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stdin.setEncoding('utf8');

        stdin.on('data', (chunk) => {
            chunks.push(chunk);
        });

        stdin.on('end', () => {
            resolve(chunks.join(''));
        });

        stdin.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Main function
 */
async function main() {
    try {
        // Read and parse JSON input
        const input = await readStdin();
        if (!input.trim()) {
            console.error('No input provided');
            process.exit(1);
        }

        const data = JSON.parse(input);

        // Extract basic information
        let currentDir = 'unknown';
        if (data.workspace?.current_dir) {
            currentDir = data.workspace.current_dir;
        } else if (data.cwd) {
            currentDir = data.cwd;
        }
        currentDir = expandHome(currentDir);

        const modelName = data.model?.display_name || 'Claude';
        const modelVersion = data.model?.version && data.model.version !== 'null' ? data.model.version : '';

        // Git branch detection
        let gitBranch = '';
        const gitCheck = exec('git rev-parse --git-dir');
        if (gitCheck) {
            gitBranch = exec('git branch --show-current');
            if (!gitBranch) {
                gitBranch = exec('git rev-parse --short HEAD');
            }
        }

        // Native Claude Code data integration
        let sessionText = '';
        let costUSD = '';
        let linesAdded = 0;
        let linesRemoved = 0;
        let contextPercent = 0;
        let contextText = '';
        const billingMode = env.CLAUDE_BILLING_MODE || 'api';

        // Extract native cost data from Claude Code
        costUSD = data.cost?.total_cost_usd || '';
        linesAdded = data.cost?.total_lines_added || 0;
        linesRemoved = data.cost?.total_lines_removed || 0;

        // Extract context window usage (Claude Code v2.0.65+)
        // Calculate percentage against COMPACT THRESHOLD, not model limit
        // 100% = compaction imminent
        const contextInput = data.context_window?.total_input_tokens || 0;
        const contextOutput = data.context_window?.total_output_tokens || 0;
        const contextSize = data.context_window?.context_window_size || 0;

        if (contextSize > 0) {
            const contextTotal = contextInput + contextOutput;
            const compactThreshold = getCompactThreshold(contextSize);
            const sessionId = data.session_id || 'default';

            // Check for compaction baseline
            // After compaction, we track tokens relative to baseline
            const { showCompactIndicator, baseline } = getCompactBaseline(sessionId, contextTotal);

            if (showCompactIndicator) {
                // First render after compaction - show indicator once
                contextText = `🔄 ▱▱▱▱▱▱▱▱▱▱▱▱`;
            } else {
                // Calculate percentage
                // If baseline > 0, we're post-compaction: track tokens since compaction
                // Otherwise, use absolute cumulative total (first session or no compaction yet)
                let effectiveTotal;
                if (baseline > 0) {
                    // Post-compaction: tokens since last compaction
                    effectiveTotal = contextTotal - baseline;
                    if (effectiveTotal < 0) effectiveTotal = 0; // Safety check
                } else {
                    // No compaction yet: use cumulative total
                    effectiveTotal = contextTotal;
                }

                contextPercent = Math.min(100, Math.floor(effectiveTotal * 100 / compactThreshold));

                const emoji = getSeverityEmoji(contextPercent);
                const bar = progressBar(contextPercent, 12);
                contextText = `${emoji} ${bar} ${contextPercent}%`;
            }
        }

        // Session timer - parse local transcript JSONL (zero external dependencies)
        const transcriptPath = data.transcript_path;

        if (transcriptPath) {
            try {
                if (fs.existsSync(transcriptPath)) {
                    const content = fs.readFileSync(transcriptPath, 'utf8');
                    const lines = content.split('\n').filter(l => l.trim());

                    // Find first API call with usage data
                    let firstApiCall = null;
                    for (const line of lines) {
                        try {
                            const entry = JSON.parse(line);
                            if (entry.usage && entry.timestamp) {
                                firstApiCall = entry.timestamp;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }

                    if (firstApiCall) {
                        // Calculate 5-hour billing block (Anthropic windows)
                        const now = new Date();
                        const currentUtcHour = now.getUTCHours();
                        const blockStart = Math.floor(currentUtcHour / 5) * 5;
                        let blockEnd = blockStart + 5;

                        // Handle day wraparound
                        let blockEndDate = new Date(now);
                        if (blockEnd >= 24) {
                            blockEnd -= 24;
                            blockEndDate.setUTCDate(blockEndDate.getUTCDate() + 1);
                        }
                        blockEndDate.setUTCHours(blockEnd, 0, 0, 0);

                        const nowSec = Math.floor(Date.now() / 1000);
                        const blockEndSec = Math.floor(blockEndDate.getTime() / 1000);
                        const remaining = blockEndSec - nowSec;

                        if (remaining > 0 && remaining < 18000) {
                            const rh = Math.floor(remaining / 3600);
                            const rm = Math.floor((remaining % 3600) / 60);
                            const blockEndLocal = formatTimeHM(blockEndSec);
                            sessionText = `${rh}h ${rm}m until reset at ${blockEndLocal}`;
                        }
                    }
                }
            } catch (err) {
                // Silent fail - transcript not readable
            }
        }

        // Render statusline (no ANSI colors - emoji only for indicators)
        let output = '';

        // Directory
        output += `📁 ${currentDir}`;

        // Git branch
        if (gitBranch) {
            output += `  🌿 ${gitBranch}`;
        }

        // Model
        output += `  🤖 ${modelName}`;

        // Model version
        if (modelVersion) {
            output += ` ${modelVersion}`;
        }

        // Session time
        if (sessionText) {
            output += `  ⌛ ${sessionText}`;
        }

        // Cost (only show for API billing mode)
        if (billingMode === 'api' && costUSD && /^\d+(\.\d+)?$/.test(costUSD.toString())) {
            const costUSDNum = parseFloat(costUSD);
            output += `  💵 $${costUSDNum.toFixed(4)}`;
        }

        // Lines changed
        if ((linesAdded > 0 || linesRemoved > 0)) {
            output += `  📝 +${linesAdded} -${linesRemoved}`;
        }

        // Context window usage (Claude Code v2.0.65+)
        if (contextText) {
            output += `  ${contextText}`;
        }

        console.log(output);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
