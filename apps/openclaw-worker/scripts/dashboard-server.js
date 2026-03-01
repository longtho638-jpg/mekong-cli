'use strict';

/**
 * 🏭 Factory Floor Dashboard Server
 * Real-time monitoring of Vibe Factory — CTO + 4 Tôm workers.
 * http://localhost:3456
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3456;
const SESSION = 'tom_hum:brain';
const MEKONG_DIR = path.resolve(__dirname, '..', '..', '..');
const LOG_FILE = path.join(process.env.HOME || '/tmp', 'tom_hum_vibe.log');
const STATE_FILE = path.join(MEKONG_DIR, '.tom_hum_state.json');

const PANES = [
    { idx: 0, project: 'mekong-cli', dir: MEKONG_DIR },
    { idx: 1, project: 'well', dir: path.join(MEKONG_DIR, 'apps/well') },
    { idx: 2, project: 'algo-trader', dir: path.join(MEKONG_DIR, 'apps/algo-trader') },
    { idx: 3, project: 'apex-os', dir: path.join(MEKONG_DIR, 'apps/apex-os') },
];

function safe(fn, fallback = null) { try { return fn(); } catch { return fallback; } }

function tmuxCapture(idx) {
    return safe(() => execSync(`tmux capture-pane -t ${SESSION}.${idx} -p 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim(), '');
}

function detectState(output) {
    if (!output || output.includes('Pane is dead')) return 'DEAD';
    if (/macbookprom1@.*%\s*$/.test(output)) return 'CRASHED';
    if (/rate-limit-options|You've hit your limit/.test(output)) return 'RATE_LIMITED';
    if (/› try "/.test(output) && /bypass permissions on/.test(output)) return 'IDLE';
    if (/bypass permissions on/.test(output) && !/Whisking|Churning|Hashing|Perambulating|Crunched/.test(output)) return 'IDLE';
    if (/Cooked for \d/.test(output)) return 'COMPLETE';
    if (/❯\s*$/.test(output)) return 'IDLE';
    if (/(Whisking|Churning|Hashing|Perambulating|Crunched|Reading|Writing|Running|Building|Nesting|Crafting)/i.test(output)) return 'WORKING';
    return 'ACTIVE';
}

function getLastLines(output, n = 3) {
    return output.split('\n').filter(l => l.trim()).slice(-n).join('\n');
}

function getPanes() {
    return PANES.map(p => {
        const output = tmuxCapture(p.idx);
        const state = detectState(output);
        let score = { total: 0, grade: 'F' };
        try {
            const sc = require('../lib/project-score-calculator');
            score = sc.calculateProjectScore(p.dir, { fast: true });
        } catch { }
        return { idx: p.idx, project: p.project, state, score: score.total, grade: score.grade, lastOutput: getLastLines(output, 3) };
    });
}

function getHealth() {
    let state = {};
    try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); } catch { }
    const cto = safe(() => execSync('pgrep -f task-watcher 2>/dev/null').toString().trim(), '');
    const proxy = safe(() => { execSync('curl -sf http://localhost:9191/health', { timeout: 2000 }); return true; }, false);
    const vibe = safe(() => { execSync('pgrep -f vibe-factory-monitor', { timeout: 2000 }); return true; }, false);
    return { ...(state.perception?.metrics || {}), cto: !!cto, proxy, vibeFactory: vibe, timestamp: new Date().toISOString() };
}

function getLogs(n = 50) {
    try {
        const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(l => l.trim());
        return lines.slice(-n);
    } catch { return []; }
}

function getTokenBudget() {
    try {
        const lp = require('../lib/llm-perception');
        return lp.getTokenBudgetStatus();
    } catch { return {}; }
}

function getPipeline() {
    const stages = { intake: 0, bootstrap: 0, coding: 0, qa: 0, scoring: 0, handover: 0 };
    try {
        const tasksDir = path.join(__dirname, '..', 'tasks');
        if (fs.existsSync(tasksDir)) {
            const files = fs.readdirSync(tasksDir);
            stages.intake = files.filter(f => f.startsWith('INTAKE_')).length;
            stages.bootstrap = files.filter(f => f.includes('bootstrap')).length;
            stages.coding = files.filter(f => f.startsWith('HIGH_') && !f.includes('bootstrap')).length;
        }
    } catch { }
    const panes = getPanes();
    stages.qa = panes.filter(p => p.state === 'WORKING').length;
    stages.scoring = panes.filter(p => p.grade !== 'F' && p.grade !== 'S').length;
    stages.handover = panes.filter(p => p.grade === 'S').length;
    return stages;
}

// --- HTTP Server ---
const DASHBOARD_HTML = path.join(__dirname, '..', 'public', 'index.html');

const server = http.createServer((req, res) => {
    const url = req.url;

    if (url === '/api/panes') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(getPanes()));
    } else if (url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(getHealth()));
    } else if (url === '/api/logs') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(getLogs()));
    } else if (url === '/api/tokens') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(getTokenBudget()));
    } else if (url === '/api/factory') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        try {
            const fp = require('../lib/factory-pipeline');
            res.end(JSON.stringify(fp.getFactoryStatus()));
        } catch { res.end(JSON.stringify({ activePipelines: [], stats: {} })); }
    } else if (url === '/api/board') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        try {
            const pb = require('../lib/production-board');
            res.end(JSON.stringify({ board: pb.getBoard(), stats: pb.getStats(), overdue: pb.getOverdue() }));
        } catch { res.end(JSON.stringify({ board: { workOrders: [] }, stats: {}, overdue: [] })); }
    } else if (url.startsWith('/api/gantt/')) {
        const project = url.split('/api/gantt/')[1];
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        try {
            const pb = require('../lib/production-board');
            res.end(JSON.stringify(pb.getGanttData(decodeURIComponent(project))));
        } catch { res.end(JSON.stringify([])); }
    } else if (url === '/factory') {
        try {
            const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'factory.html'), 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch { res.writeHead(404); res.end('Not found'); }
    } else {
        // Serve dashboard HTML
        try {
            const html = fs.readFileSync(DASHBOARD_HTML, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch {
            res.writeHead(404);
            res.end('Dashboard HTML not found');
        }
    }
});

server.listen(PORT, () => {
    console.log(`🏭 Factory Floor Dashboard: http://localhost:${PORT}`);
});
