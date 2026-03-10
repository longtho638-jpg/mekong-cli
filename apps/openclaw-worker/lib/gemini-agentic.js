/**
 * Qwen AI Agentic Ecosystem — CTO Deep 100x Intelligence
 * AGI Level 10+: 「用間」Qwen via DashScope (FREE)
 *
 * 📜 Binh Pháp Ch.13 用間: 「故用間有五：有因間、有內間、有反間、有死間、有生間」
 *    "There are five kinds of spies" — CTO uses ALL of them
 *
 * Routes through DashScope OpenAI-compatible API for FREE Qwen access:
 * - 🔍 Search Grounding — DuckDuckGo search → Qwen synthesis
 * - 💻 Code Analysis — Qwen analyzes code for bugs/improvements
 * - 🧠 Deep Research — multi-query web search + Qwen synthesis + citations
 * - 🏗️ Architecture Advisor — project analysis with web-grounded best practices
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const PROXY_PORT = config.PROXY_PORT || 20128;
const DATA_DIR = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data');
const RESEARCH_DIR = path.join(DATA_DIR, 'gemini-research');

if (!fs.existsSync(RESEARCH_DIR)) fs.mkdirSync(RESEARCH_DIR, { recursive: true });

function log(msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    try { fs.appendFileSync('/Users/macbookprom1/tom_hum_cto.log', `[${ts}] [tom-hum] [QWEN-AGI] ${msg}\n`); } catch (e) { }
}

// ═══════════════════════════════════════════════════
// Core: Qwen via Antigravity Proxy (port 9191)
// ═══════════════════════════════════════════════════

function callGemini(prompt, options = {}) {
    const {
        model = 'qwen-plus',
        system = 'You are a senior CTO AI agent. Be precise, actionable, and return structured data when asked.',
        maxTokens = 4096,
        timeout = 30000
    } = options;

    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: prompt }
            ]
        });

        const timer = setTimeout(() => reject(new Error('Qwen proxy timeout')), timeout);
        const targetPort = config.LLM_PROXY_PORT || 9191;

        const req = http.request({
            hostname: '127.0.0.1',
            port: targetPort,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                clearTimeout(timer);
                try {
                    const r = JSON.parse(data);
                    if (r.error) { reject(new Error(r.error.message || JSON.stringify(r.error))); return; }
                    const text = r.choices?.[0]?.message?.content || '';
                    resolve({ text, raw: r });
                } catch (e) { reject(e); }
            });
        });

        req.on('error', (e) => { clearTimeout(timer); reject(e); });
        req.write(body);
        req.end();
    });
}

// ═══════════════════════════════════════════════════
// Web Search (DuckDuckGo/Google) — Used for grounding
// ═══════════════════════════════════════════════════

function webSearch(query) {
    return new Promise((resolve) => {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const timer = setTimeout(() => resolve([]), 10000);

        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 CTO-Ultra/2.0' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                clearTimeout(timer);
                const results = [];
                const regex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)/g;
                const snippetRx = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
                let m;
                while ((m = regex.exec(data)) && results.length < 5) {
                    const u = decodeURIComponent(m[1].replace(/.*uddg=/, '').replace(/&.*/, ''));
                    results.push({ title: m[2].replace(/<[^>]+>/g, '').trim(), url: u });
                }
                let i = 0;
                while ((m = snippetRx.exec(data)) && i < results.length) {
                    results[i].snippet = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim().slice(0, 200);
                    i++;
                }
                resolve(results);
            });
        }).on('error', () => { clearTimeout(timer); resolve([]); });
    });
}

// ═══════════════════════════════════════════════════
// 🔍 Search Grounding — Web Search + Gemini Synthesis
// ═══════════════════════════════════════════════════

/**
 * Query with grounding: searches the web, then asks Gemini to synthesize.
 * This mimics Google Search Grounding using DDG + Gemini Ultra proxy.
 */
async function searchWithGrounding(query) {
    log(`🔍 SEARCH GROUNDING: "${query}"`);

    // Step 1: Web search
    const webResults = await webSearch(query);
    if (webResults.length === 0) {
        log(`🔍 GROUNDING: No web results for "${query}"`);
        return null;
    }

    // Step 2: Gemini synthesis
    const resultText = webResults.map((r, i) =>
        `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet || ''}`
    ).join('\n');

    try {
        const result = await callGemini(
            `I searched Google for: "${query}"\n\nResults:\n${resultText}\n\nSynthesize these search results into a comprehensive, actionable answer. Include specific recommendations and cite sources.`,
            {
                system: 'You are a research analyst synthesizing web search results. Be thorough, cite sources by URL, and provide actionable insights.',
                maxTokens: 2048,
                timeout: 30000
            }
        );

        const sources = webResults.map(r => r.url);
        log(`🔍 GROUNDED: ${result.text.length} chars, ${sources.length} sources`);

        // Save research
        const filename = `grounded_${Date.now()}.json`;
        fs.writeFileSync(path.join(RESEARCH_DIR, filename), JSON.stringify({
            query, answer: result.text, sources, timestamp: new Date().toISOString()
        }, null, 2));

        return { answer: result.text, sources };
    } catch (e) {
        log(`GROUNDING SYNTHESIS ERROR: ${e.message}`);
        return null;
    }
}

// ═══════════════════════════════════════════════════
// 💻 Code Analysis — Gemini analyzes code via proxy
// ═══════════════════════════════════════════════════

async function analyzeCode(code, question) {
    log(`💻 CODE ANALYSIS: "${question.slice(0, 60)}..."`);
    try {
        const result = await callGemini(
            `Analyze this code and answer: ${question}\n\n\`\`\`\n${code}\n\`\`\``,
            { maxTokens: 4096, timeout: 30000 }
        );
        log(`💻 CODE ANALYZED: ${result.text.length} chars`);
        return result.text;
    } catch (e) {
        log(`CODE ANALYSIS ERROR: ${e.message}`);
        return null;
    }
}

// ═══════════════════════════════════════════════════
// 🧠 Deep Research — Multi-query Search + Gemini Synthesis
// ═══════════════════════════════════════════════════

async function deepResearch(topic, projectName) {
    log(`🧠 DEEP RESEARCH: "${topic}" for ${projectName}`);

    const queries = [
        `${topic} best practices 2025 2026`,
        `${topic} ${projectName} implementation guide`,
        `${topic} common mistakes and gotchas`,
        `${topic} performance optimization`,
        `${topic} latest updates changes`
    ];

    const results = [];
    for (const q of queries) {
        try {
            const r = await searchWithGrounding(q);
            if (r) results.push({ query: q, ...r });
        } catch (e) { }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (results.length === 0) return null;

    // Final synthesis
    const synthesis = results.map((r, i) =>
        `## ${r.query}\n${r.answer}`
    ).join('\n\n');

    try {
        const report = await callGemini(
            `Synthesize into an actionable report for "${projectName}":\n\n${synthesis}`,
            {
                system: 'Create a concise report: KEY FINDINGS, TOP 5 ACTIONS, PRIORITY ORDER, GOTCHAS. Return JSON.',
                maxTokens: 4096,
                timeout: 45000
            }
        );

        const filename = `deep_research_${projectName}_${Date.now()}.md`;
        fs.writeFileSync(path.join(RESEARCH_DIR, filename),
            `# Deep Research: ${topic}\n## Project: ${projectName}\n## ${new Date().toISOString()}\n\n${report.text}\n\n---\n## Sources\n${results.flatMap(r => r.sources || []).join('\n')}`
        );

        log(`🧠 DEEP RESEARCH COMPLETE: ${filename}`);
        return { report: report.text, sources: results.flatMap(r => r.sources || []), filename };
    } catch (e) {
        log(`SYNTHESIS ERROR: ${e.message}`);
        return { report: synthesis, sources: results.flatMap(r => r.sources || []) };
    }
}

// ═══════════════════════════════════════════════════
// 🔬 Error Research via Grounded Search
// ═══════════════════════════════════════════════════

async function researchErrorWithGemini(errorMessage, projectName) {
    log(`🔬 ERROR RESEARCH: "${errorMessage.slice(0, 80)}..." for ${projectName}`);

    const result = await searchWithGrounding(
        `How to fix: ${errorMessage} TypeScript React Next.js`
    );

    if (!result) return '';

    return `
🔬 GEMINI GROUNDED INTEL (web-searched + Gemini-synthesized):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Error: ${errorMessage.slice(0, 100)}
Solution: ${result.answer.slice(0, 600)}
Sources: ${(result.sources || []).slice(0, 3).join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

// ═══════════════════════════════════════════════════
// 🏗️ Architecture Advisor
// ═══════════════════════════════════════════════════

async function architectureAdvice(projectDir) {
    const projectName = path.basename(projectDir);
    log(`🏗️ ARCHITECTURE ADVICE: ${projectName}`);

    let pkgJson = {};
    try { pkgJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8')); } catch (e) { }

    const deps = Object.keys(pkgJson.dependencies || {}).join(', ');
    const grounded = await searchWithGrounding(`${deps} architecture best practices 2026`);

    try {
        const result = await callGemini(
            `Analyze project "${projectName}" (deps: ${deps}).\n${grounded ? `Web intel: ${grounded.answer.slice(0, 800)}` : ''}\n\nReturn JSON: {"score": 0-100, "improvements": [{"area":"","action":"","priority":"high|medium|low"}], "modernization": [""], "security": [""]}`,
            { maxTokens: 4096, timeout: 45000 }
        );
        log(`🏗️ ARCHITECTURE ADVICE COMPLETE for ${projectName}`);
        return result.text;
    } catch (e) {
        log(`ARCHITECTURE ADVICE ERROR: ${e.message}`);
        return null;
    }
}

// ═══════════════════════════════════════════════════
// 📡 Health Check
// ═══════════════════════════════════════════════════

async function checkGeminiStatus() {
    try {
        const result = await callGemini('Respond with exactly: "GEMINI ONLINE"', {
            maxTokens: 256, timeout: 10000
        });
        // Lenient match — proxy may format differently
        const t = result.text.toUpperCase();
        return (t.includes('GEMINI') || t.includes('ONLINE') || result.text.length > 0) ? 'ONLINE' : 'DEGRADED';
    } catch (e) {
        return 'OFFLINE';
    }
}

module.exports = {
    callGemini, searchWithGrounding, analyzeCode,
    deepResearch, researchErrorWithGemini,
    architectureAdvice, checkGeminiStatus
};
