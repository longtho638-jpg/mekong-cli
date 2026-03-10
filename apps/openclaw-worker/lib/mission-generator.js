/**
 * Mission Generator — CTO Custom Mission Creation via LLM
 * AGI Level 9: Autonomous Decision Making
 *
 * 📜 Binh Pháp Ch.11 九地: 「投之亡地然後存」
 *    "Throw them into desperate situations and they survive"
 *
 * Uses LLM to analyze codebase and generate custom improvement missions
 * beyond the static BINH_PHAP_TASKS list. The CTO thinks for itself.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

function log(msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    try { fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', `[${ts}] [tom-hum] [MISSION-GEN] ${msg}\n`); } catch (e) { }
}

/**
 * Analyze project structure and generate a custom mission.
 * Reads package.json, tsconfig, dir structure, recent changes.
 */
async function generateCustomMission(projectDir, learningReport) {
    const projectName = path.basename(projectDir);

    // Gather project intelligence
    let pkgJson = {};
    try { pkgJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8')); } catch (e) { }

    let tsConfig = null;
    try { tsConfig = JSON.parse(fs.readFileSync(path.join(projectDir, 'tsconfig.json'), 'utf-8')); } catch (e) { }

    // Get top-level directory structure
    let dirStructure = [];
    try {
        const srcDir = path.join(projectDir, 'src');
        if (fs.existsSync(srcDir)) {
            dirStructure = fs.readdirSync(srcDir, { withFileTypes: true })
                .slice(0, 20)
                .map(d => `${d.isDirectory() ? '📁' : '📄'} ${d.name}`);
        }
    } catch (e) { }

    // Get recent git changes
    let recentChanges = '';
    try {
        const { execSync } = require('child_process');
        recentChanges = execSync('git log --oneline -5 2>/dev/null', { cwd: projectDir, encoding: 'utf-8', timeout: 5000 }).trim();
    } catch (e) { }

    // Gather Google Drive intelligence
    let driveFiles = [];
    try {
        const { searchDrive } = require('./google-ultra');
        driveFiles = searchDrive(`${projectName} architecture design`, 3)
            .map(f => `${f.name} (${f.mimeType})`);
    } catch (e) { }

    // Build context for LLM
    const context = {
        project: projectName,
        deps: Object.keys(pkgJson.dependencies || {}).slice(0, 15),
        devDeps: Object.keys(pkgJson.devDependencies || {}).slice(0, 10),
        scripts: Object.keys(pkgJson.scripts || {}),
        hasTypescript: !!tsConfig,
        srcStructure: dirStructure,
        recentCommits: recentChanges,
        googleDriveFiles: driveFiles,
        learningReport: learningReport ? {
            totalMissions: learningReport.totalMissions,
            overallRate: learningReport.overallRate,
            lessons: (learningReport.lessons || []).slice(0, 5)
        } : null
    };

    const { callLLM } = require('./llm-interpreter');
    // Note: callLLM might not be exported, use interpretState's internal approach


    const prompt = `You are a senior CTO analyzing a codebase to find the SINGLE most impactful improvement.

Project: ${context.project}
Dependencies: ${context.deps.join(', ')}
Scripts: ${context.scripts.join(', ')}
TypeScript: ${context.hasTypescript ? 'Yes' : 'No'}
Structure: ${context.srcStructure.join(', ')}
Recent commits: ${context.recentCommits}
Google Drive docs: ${context.googleDriveFiles.join(', ') || 'None found'}
Past mission lessons: ${JSON.stringify(context.learningReport)}

Generate ONE custom improvement mission. It should be:
- Specific and actionable (not vague "improve code quality")
- Different from: security scan, perf audit, test suite, lint fix (those are already in rotation)
- Focused on architectural improvements, DX, or user experience
- Consider any specs or designs found in Google Drive docs
- Completable in ONE session (max 5 file changes)

Return JSON: {"cmd": "description of what to do (max 80 chars)", "complexity": "medium", "reason": "why this is the most impactful improvement right now"}`;

    return new Promise((resolve) => {
        const API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
        const apiKey = process.env.DASHSCOPE_API_KEY || 'sk-sp-afce4429a10e41bb901d6012d7f525c8';

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-plus',
                messages: [
                    { role: 'system', content: 'Return ONLY valid JSON. No explanation.' },
                    { role: 'user', content: prompt }
                ]
            }),
            signal: AbortSignal.timeout(15000)
        })
            .then(res => res.json())
            .then(data => {
                try {
                    const content = data?.choices?.[0]?.message?.content || '';
                    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                    const result = JSON.parse(jsonStr);
                    if (result.cmd) {
                        log(`GENERATED: "${result.cmd}" — ${result.reason?.slice(0, 60)}`);
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    log(`Parse error: ${e.message}`);
                    resolve(null);
                }
            })
            .catch(e => {
                log(`Network/Timeout error: ${e.message}`);
                resolve(null);
            });
    });
}

/**
 * Enhanced scan interpretation via LLM.
 * Sends raw build/lint/test output and gets nuanced analysis.
 */
async function interpretScanOutput(rawOutput, projectName) {


    const prompt = `Analyze this build/lint/test output for project "${projectName}".
Return JSON: {"build": "pass|fail", "lint": {"errors": 0, "warnings": 0}, "test": {"pass": 0, "fail": 0, "total": 0}, "nuancedIssues": ["description of subtle issues"], "coverageChange": "up|down|same|unknown"}

Output:
${rawOutput.slice(-2000)}`;

    return new Promise((resolve) => {
        const API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
        const apiKey = process.env.DASHSCOPE_API_KEY || 'sk-sp-afce4429a10e41bb901d6012d7f525c8';

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-plus',
                messages: [
                    { role: 'system', content: 'Return ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ]
            }),
            signal: AbortSignal.timeout(15000)
        })
            .then(res => res.json())
            .then(data => {
                try {
                    const content = data?.choices?.[0]?.message?.content || '';
                    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                    resolve(JSON.parse(jsonStr));
                } catch (e) { resolve(null); }
            })
            .catch(e => resolve(null));
    });
}

module.exports = { generateCustomMission, interpretScanOutput };
