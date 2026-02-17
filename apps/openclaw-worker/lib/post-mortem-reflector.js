/**
 * Post-Mortem Reflector — HỒI QUANG PHẢN CHIẾU
 * 
 * 📜 Binh Pháp Ch.3 謀攻: 「知己知彼，百戰不殆」
 * 
 * After each mission completes, auto-reflect:
 * 1. What worked / what failed
 * 2. Token efficiency analysis
 * 3. Append structured lesson to knowledge/memory.md
 * 4. Detect recurring failures → add to GOTCHAS
 * 
 * This is the engine that makes Tôm Hùm SMARTER every day.
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./brain-process-manager');

const MEMORY_FILE = path.join(__dirname, '../knowledge/memory.md');
const KNOWLEDGE_DIR = path.dirname(MEMORY_FILE);

// Ensure knowledge directory exists
if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
}

/**
 * Reflect on a completed mission and persist lessons
 * @param {Object} data
 * @param {string} data.project - project name
 * @param {string} data.missionId - mission identifier
 * @param {boolean} data.success - did mission succeed?
 * @param {number} data.duration - duration in ms
 * @param {number} data.tokensUsed - tokens consumed
 * @param {Object} data.buildResult - { build: boolean, output: string }
 * @param {string} data.content - original mission content (for context)
 */
async function reflectOnMission(data) {
    try {
        const {
            project = 'unknown',
            missionId = 'unnamed',
            success = false,
            duration = 0,
            tokensUsed = 0,
            buildResult = {},
            content = ''
        } = data;

        const date = new Date().toISOString().slice(0, 10);
        const durationMin = Math.round(duration / 60000);
        const tokensPerMin = durationMin > 0 ? Math.round(tokensUsed / durationMin) : tokensUsed;

        // === Step 1: Determine lesson based on outcome ===
        let lesson = '';
        let category = '';

        if (!success) {
            lesson = `FAILED — ${extractFailureReason(data)}`;
            category = 'failure';
        } else if (buildResult && buildResult.build === false && buildResult.output !== 'not_run') {
            lesson = `Code worked but BUILD FAILED — check types/lint`;
            category = 'build_fail';
        } else if (tokensPerMin > 500) {
            lesson = `Success but HIGH token burn (${tokensPerMin}/min) — optimize prompts`;
            category = 'token_waste';
        } else if (durationMin > 45) {
            lesson = `Success but SLOW (${durationMin}min) — consider splitting task`;
            category = 'slow';
        } else {
            lesson = `Clean success in ${durationMin}min — good pattern`;
            category = 'success';
        }

        // === Step 2: Append to LESSONS table in memory.md ===
        const lessonRow = `| ${date} | ${project} | ${missionId.slice(0, 30)} | ${lesson} | ${tokensUsed} | ${tokensPerMin}/min |`;
        appendToMemorySection('LESSONS', lessonRow);

        // === Step 3: Detect recurring failures → add to GOTCHAS ===
        if (category === 'failure' || category === 'build_fail') {
            const gotchaPattern = detectGotchaPattern(data);
            if (gotchaPattern) {
                appendToMemorySection('GOTCHAS', `- **${date}** [${project}]: ${gotchaPattern}`);
            }
        }

        // === Step 4: Detect strengths → add to STRENGTHS ===
        if (category === 'success' && tokensPerMin < 100 && durationMin < 20) {
            appendToMemorySection('STRENGTHS', `- **${date}** [${project}]: Efficient mission — ${tokensPerMin} tokens/min in ${durationMin}min`);
        }

        log(`REFLECTOR [${category.toUpperCase()}]: ${project}/${missionId} — ${lesson}`);

    } catch (error) {
        log(`REFLECTOR ERROR: ${error.message}`);
    }
}

/**
 * Extract failure reason from mission data
 */
function extractFailureReason(data) {
    if (data.buildResult && data.buildResult.output) {
        const output = String(data.buildResult.output);
        if (output.includes('TypeError')) return 'TypeError in code';
        if (output.includes('SyntaxError')) return 'SyntaxError in code';
        if (output.includes('timeout')) return 'Mission timed out';
        if (output.includes('RESOURCE_EXHAUSTED')) return 'API quota exhausted';
        return output.slice(0, 80);
    }
    return 'Unknown failure (no build output)';
}

/**
 * Detect recurring gotcha patterns from failure data
 */
function detectGotchaPattern(data) {
    const content = String(data.content || '');
    const output = String(data.buildResult?.output || '');

    // Check for common patterns
    if (output.includes('Cannot find module')) return `Missing module — always check imports before implementing`;
    if (output.includes('is not a function')) return `API mismatch — verify function signature before calling`;
    if (output.includes('ENOENT')) return `File not found — validate file paths`;
    if (output.includes('RESOURCE_EXHAUSTED')) return `Quota exhausted — use model fallback (九變 Biến 4)`;
    if (content.length > 5000) return `Oversized prompt (${content.length} chars) — keep missions focused`;

    return null;
}

/**
 * Append a line to a specific section in memory.md
 * @param {string} section - 'LESSONS', 'GOTCHAS', or 'STRENGTHS'  
 * @param {string} line - the line to append
 */
function appendToMemorySection(section, line) {
    try {
        if (!fs.existsSync(MEMORY_FILE)) {
            log(`REFLECTOR: memory.md not found, creating...`);
            // Create minimal memory file
            fs.writeFileSync(MEMORY_FILE, `# 🧠 TÔM HÙM MEMORY\n\n## LESSONS\n\n## GOTCHAS\n\n## STRENGTHS\n`);
        }

        let content = fs.readFileSync(MEMORY_FILE, 'utf-8');

        // Find the section header
        const sectionHeaders = {
            'LESSONS': '## LESSONS',
            'GOTCHAS': '## GOTCHAS',
            'STRENGTHS': '## STRENGTHS'
        };

        const header = sectionHeaders[section];
        if (!header) return;

        const headerIndex = content.indexOf(header);
        if (headerIndex === -1) {
            // Section not found, append at end
            content += `\n${header}\n\n${line}\n`;
        } else {
            // Find the end of the header line
            const afterHeader = content.indexOf('\n', headerIndex);
            if (afterHeader === -1) {
                content += `\n${line}\n`;
            } else {
                // Find the table header line (for LESSONS) or first content line
                // Insert after the first blank line or separator after header
                let insertPos = afterHeader + 1;

                // Skip past table headers and separators for LESSONS
                if (section === 'LESSONS') {
                    // Find the table rows area (after |---|)
                    const tableHeaderEnd = content.indexOf('|---', headerIndex);
                    if (tableHeaderEnd !== -1) {
                        const afterTableHeader = content.indexOf('\n', tableHeaderEnd);
                        if (afterTableHeader !== -1) {
                            insertPos = afterTableHeader + 1;
                        }
                    }
                }

                // For GOTCHAS/STRENGTHS, find first blank line or "- _(" placeholder
                if (section !== 'LESSONS') {
                    // Remove placeholder if present
                    const placeholder = content.indexOf('- _(Chưa có', headerIndex);
                    if (placeholder !== -1 && placeholder < headerIndex + 200) {
                        const placeholderEnd = content.indexOf('\n', placeholder);
                        if (placeholderEnd !== -1) {
                            content = content.slice(0, placeholder) + content.slice(placeholderEnd + 1);
                        }
                    }
                    // Re-find insert position after potential removal
                    const newAfterHeader = content.indexOf('\n', content.indexOf(header));
                    insertPos = newAfterHeader + 1;
                    // Skip blank lines and description
                    while (insertPos < content.length && (content[insertPos] === '\n' || content[insertPos] === '>')) {
                        insertPos = content.indexOf('\n', insertPos) + 1;
                        if (insertPos === 0) break; // indexOf returned -1
                    }
                }

                // Remove placeholder row for LESSONS
                if (section === 'LESSONS') {
                    const placeholder = content.indexOf('| _Chưa có mission', headerIndex);
                    if (placeholder !== -1) {
                        const placeholderEnd = content.indexOf('\n', placeholder);
                        if (placeholderEnd !== -1) {
                            content = content.slice(0, placeholder) + content.slice(placeholderEnd + 1);
                            // Recalculate insertPos
                            const tableHeaderEnd2 = content.indexOf('|---', headerIndex);
                            if (tableHeaderEnd2 !== -1) {
                                const afterTableHeader2 = content.indexOf('\n', tableHeaderEnd2);
                                if (afterTableHeader2 !== -1) {
                                    insertPos = afterTableHeader2 + 1;
                                }
                            }
                        }
                    }
                }

                // Insert the new line
                content = content.slice(0, insertPos) + line + '\n' + content.slice(insertPos);
            }
        }

        fs.writeFileSync(MEMORY_FILE, content);
    } catch (error) {
        log(`REFLECTOR: Failed to write to memory.md: ${error.message}`);
    }
}

/**
 * Read top N lessons from memory for injection into prompts
 * @param {number} n - number of recent lessons to return
 * @returns {string} formatted lessons text
 */
function getTopLessons(n = 10) {
    try {
        if (!fs.existsSync(MEMORY_FILE)) return '';

        const content = fs.readFileSync(MEMORY_FILE, 'utf-8');

        // Extract LESSONS table rows
        const lessonsStart = content.indexOf('## LESSONS');
        if (lessonsStart === -1) return '';

        const lessonsEnd = content.indexOf('\n---', lessonsStart + 10);
        const lessonsSection = lessonsEnd !== -1
            ? content.slice(lessonsStart, lessonsEnd)
            : content.slice(lessonsStart, lessonsStart + 2000); // cap at 2000 chars

        // Extract table rows (lines starting with |, skip header/separator)
        const rows = lessonsSection.split('\n')
            .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Date'))
            .slice(0, n);

        if (rows.length === 0) return '';

        // Extract GOTCHAS
        const gotchasStart = content.indexOf('## GOTCHAS');
        let gotchas = '';
        if (gotchasStart !== -1) {
            const gotchasEnd = content.indexOf('\n---', gotchasStart + 10);
            const gotchasSection = gotchasEnd !== -1
                ? content.slice(gotchasStart, gotchasEnd)
                : content.slice(gotchasStart, gotchasStart + 1000);
            const gotchaLines = gotchasSection.split('\n')
                .filter(l => l.startsWith('- **'))
                .slice(0, 5);
            if (gotchaLines.length > 0) {
                gotchas = `\nGOTCHAS:\n${gotchaLines.join('\n')}`;
            }
        }

        return `[🧠 MEMORY — Recent ${rows.length} lessons]\n${rows.join('\n')}${gotchas}\n[/MEMORY]`;
    } catch (e) {
        return '';
    }
}

module.exports = { reflectOnMission, getTopLessons };
