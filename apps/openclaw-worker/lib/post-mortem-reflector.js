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
 * Append a line to a specific section in memory.md (with Rotation)
 * @param {string} section - 'LESSONS', 'GOTCHAS', or 'STRENGTHS'
 * @param {string} line - the line to append
 */
function appendToMemorySection(section, line) {
    try {
        if (!fs.existsSync(MEMORY_FILE)) {
            log(`REFLECTOR: memory.md not found, creating...`);
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
            content += `\n${header}\n\n${line}\n`;
        } else {
            // Find insertion point (top of list/table)
            let insertPos = -1;
            const afterHeader = content.indexOf('\n', headerIndex);

            if (afterHeader === -1) {
                content += `\n${line}\n`;
            } else {
                if (section === 'LESSONS') {
                    // Find table start (after |---|)
                    const tableHeaderEnd = content.indexOf('|---', headerIndex);
                    if (tableHeaderEnd !== -1) {
                        const afterTableHeader = content.indexOf('\n', tableHeaderEnd);
                        if (afterTableHeader !== -1) insertPos = afterTableHeader + 1;
                    }
                } else {
                    // Find first blank line or placeholder
                    const nextSection = content.indexOf('## ', headerIndex + 5);
                    const sectionEnd = nextSection !== -1 ? nextSection : content.length;

                    // Look for placeholder to replace
                    const placeholder = content.indexOf('- _(', headerIndex);
                    if (placeholder !== -1 && placeholder < sectionEnd) {
                         const placeholderEnd = content.indexOf('\n', placeholder);
                         content = content.slice(0, placeholder) + content.slice(placeholderEnd + 1);
                         insertPos = placeholder;
                    } else {
                        // Insert after header + newline
                        insertPos = afterHeader + 1;
                        // Skip empty lines
                        while (insertPos < content.length && content[insertPos] === '\n') insertPos++;
                    }
                }

                if (insertPos === -1) insertPos = afterHeader + 1;

                // Insert the new line
                content = content.slice(0, insertPos) + line + '\n' + content.slice(insertPos);
            }
        }

        // ROTATION LOGIC
        if (section === 'LESSONS') {
            const MAX_LESSONS = 50;
            const lessonsStart = content.indexOf('## LESSONS');
            const lessonsEnd = content.indexOf('\n## ', lessonsStart + 5);
            const endPos = lessonsEnd !== -1 ? lessonsEnd : content.length;

            const sectionContent = content.slice(lessonsStart, endPos);
            const lines = sectionContent.split('\n');
            const tableRows = lines.filter(l => l.trim().startsWith('|') && !l.includes('---') && !l.includes('Date'));

            if (tableRows.length > MAX_LESSONS) {
                // Keep header + separator + top N rows
                const linesToKeep = [];
                let rowCount = 0;
                for (const l of lines) {
                    if (l.trim().startsWith('|') && !l.includes('---') && !l.includes('Date')) {
                        rowCount++;
                        if (rowCount <= MAX_LESSONS) linesToKeep.push(l);
                    } else {
                        linesToKeep.push(l);
                    }
                }
                content = content.slice(0, lessonsStart) + linesToKeep.join('\n') + content.slice(endPos);
            }
        } else if (section === 'GOTCHAS') {
            const MAX_GOTCHAS = 15; // Keep top 15
            const start = content.indexOf('## GOTCHAS');
            const end = content.indexOf('\n## ', start + 5);
            const endPos = end !== -1 ? end : content.length;

            const sectionLines = content.slice(start, endPos).split('\n');
            const items = sectionLines.filter(l => l.trim().startsWith('- **'));

            if (items.length > MAX_GOTCHAS) {
                 const linesToKeep = [];
                 let count = 0;
                 for (const l of sectionLines) {
                     if (l.trim().startsWith('- **')) {
                         count++;
                         if (count <= MAX_GOTCHAS) linesToKeep.push(l);
                     } else {
                         linesToKeep.push(l);
                     }
                 }
                 content = content.slice(0, start) + linesToKeep.join('\n') + content.slice(endPos);
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

// ═══ Task 13: Cross-module integration ═══
// Post-mortem now triggers knowledge synthesis and skill generation
// for high-value missions. This makes CTO learn reusable patterns.
const _originalReflect = reflectOnMission;
async function enhancedReflect(data) {
    await _originalReflect(data);

    // Only trigger for successful, complex missions
    if (!data.success) return;
    if ((data.duration || 0) < 120000) return; // Skip missions < 2min

    try {
        const { isLearnableMission, synthesizeKnowledge } = require('./knowledge-synthesizer');
        if (isLearnableMission(data)) {
            await synthesizeKnowledge({
                missionId: data.missionId,
                prompt: data.content || '',
                logContent: data.buildResult?.output || '',
                project: data.project,
            });
        }
    } catch (e) { /* knowledge-synthesizer not available */ }

    try {
        const { generateSkill } = require('./skill-factory');
        // Only generate skill for very successful complex missions
        if ((data.tokensUsed || 0) > 5000 && data.buildResult?.build !== false) {
            await generateSkill({
                missionId: data.missionId,
                prompt: data.content || '',
                logContent: data.buildResult?.output || '',
                project: data.project,
                category: 'auto-detected',
            });
        }
    } catch (e) { /* skill-factory not available */ }
}

// Override export
module.exports = { reflectOnMission: enhancedReflect, getTopLessons };

