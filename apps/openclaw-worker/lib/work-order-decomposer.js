'use strict';

/**
 * 🔨 Work Order Decomposer
 * 
 * Uses LLM (Antigravity Proxy) to break down a project intake/contract
 * into atomic Work Orders with 5W1H metadata.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const productionBoard = require('./production-board');

const PROXY_URL = 'http://127.0.0.1:9191';

const DECOMPOSE_PROMPT = `You are a Senior Project Manager. Break down a project into atomic Work Orders.

Each Work Order must have 5W1H:
- what: Specific task description (1 sentence, actionable)
- why: Business reason for this task
- where: File path or area of codebase
- how: ClaudeKit command to execute (e.g. /cook "...", /plan:hard "...", /debug "...")
- priority: CRITICAL, HIGH, MED, or LOW
- taktTime: Estimated minutes to complete (15-240)
- dependencies: Array of task indices this depends on (e.g. [0, 1] means depends on task 0 and 1)

RULES:
- Return ONLY a JSON array of objects, no markdown
- Each task should be completable in 1 CC CLI session (15-240 min)
- Order tasks logically: setup → core features → polish → testing
- Mark infrastructure/setup as CRITICAL, core features as HIGH, polish as MED
- Dependencies reference the INDEX in the array (0-based)
- Generate 8-20 tasks depending on project complexity
- How field MUST use ClaudeKit commands (/cook, /plan:hard, /debug)`;

/**
 * Decompose an intake file into Work Orders.
 * @param {string} intakePath - Path to INTAKE_*.json
 * @param {string} projectDir - Project directory
 * @returns {Promise<object[]>} Array of created Work Orders
 */
async function decomposeFromIntake(intakePath, projectDir) {
    let intake;
    try {
        intake = JSON.parse(fs.readFileSync(intakePath, 'utf-8'));
    } catch (e) {
        throw new Error(`Cannot read intake: ${e.message}`);
    }

    const projectName = intake.project?.name || path.basename(projectDir);

    // Build context for LLM
    let codebaseContext = '';
    try {
        const readme = path.join(projectDir, 'README.md');
        if (fs.existsSync(readme)) {
            codebaseContext = fs.readFileSync(readme, 'utf-8').slice(0, 1000);
        }
    } catch { }

    const userPrompt = `Project: ${projectName}
Description: ${intake.project?.description || 'N/A'}
Tech Stack: ${JSON.stringify(intake.tech_stack || {})}
Features (must have): ${JSON.stringify(intake.features?.must_have || [])}
Features (nice to have): ${JSON.stringify(intake.features?.nice_to_have || [])}
Design: ${JSON.stringify(intake.design || {})}
Existing Codebase: ${codebaseContext || 'New project, no existing code'}

Break this into atomic Work Orders with 5W1H.`;

    const rawWOs = await callLLM(userPrompt);

    // Convert indices to IDs after bulk creation
    const created = productionBoard.bulkCreate(projectName, rawWOs);

    // Fix dependency references: convert indices to actual WO IDs
    const board = productionBoard.getBoard();
    for (let i = 0; i < created.length; i++) {
        const wo = created[i];
        if (rawWOs[i].dependencies && rawWOs[i].dependencies.length > 0) {
            wo.dependencies = rawWOs[i].dependencies
                .filter(idx => idx < created.length)
                .map(idx => created[idx].id);
            // Save updated dependencies
            const bwo = board.workOrders.find(w => w.id === wo.id);
            if (bwo) bwo.dependencies = wo.dependencies;
        }
    }
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'production-board.json'), JSON.stringify(board, null, 2));

    return created;
}

/**
 * Quick decompose from a project README (no intake file needed).
 */
async function decomposeFromReadme(projectDir) {
    const projectName = path.basename(projectDir);
    let readme = '';
    try {
        readme = fs.readFileSync(path.join(projectDir, 'README.md'), 'utf-8').slice(0, 2000);
    } catch {
        readme = `Project directory: ${projectDir}`;
    }

    const userPrompt = `Project: ${projectName}
Existing README:
${readme}

Analyze this project and create Work Orders for bringing it to 100/100 production quality.
Focus on: testing, docs, CI/CD, security, performance, and polish.`;

    const rawWOs = await callLLM(userPrompt);
    const created = productionBoard.bulkCreate(projectName, rawWOs);
    return created;
}

function callLLM(userPrompt) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            model: 'gemini-2.5-pro',
            max_tokens: 2000,
            messages: [
                { role: 'system', content: DECOMPOSE_PROMPT },
                { role: 'user', content: userPrompt }
            ]
        });

        const url = new URL(`${PROXY_URL}/v1/chat/completions`);
        const req = http.request({
            hostname: url.hostname, port: url.port, path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
            timeout: 30000,
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.message?.content || '';
                    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    const wos = JSON.parse(cleaned);
                    if (!Array.isArray(wos)) throw new Error('Expected array');
                    resolve(wos);
                } catch (e) {
                    reject(new Error(`LLM decompose parse error: ${e.message}`));
                }
            });
        });

        req.on('error', e => reject(e));
        req.on('timeout', () => { req.destroy(); reject(new Error('LLM timeout')); });
        req.write(payload);
        req.end();
    });
}

module.exports = { decomposeFromIntake, decomposeFromReadme };
