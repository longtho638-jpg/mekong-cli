#!/usr/bin/env node
/**
 * AgencyOS Unified Bridge
 * 
 * Master entry point for all AgencyOS bridge scripts.
 * "Dễ như ăn kẹo" - Easy as candy!
 * 
 * Usage: node agencyos-bridge.cjs <bridge> <command> [args...]
 * 
 * Bridges:
 *   gemini <cmd>     - Gemini CLI integration
 *   git <cmd>        - Git worktree management
 *   antigravity      - Python module bridge
 *   status           - Unified status dashboard
 *   help             - Show all commands
 *   
 * 🏯 "Không đánh mà thắng" - Win Without Fighting
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
    // Paths to bridge scripts
    BRIDGES: {
        gemini: path.join(__dirname, 'gemini-bridge.cjs'),
        git: path.join(__dirname, 'worktree.cjs'),
        antigravity: path.join(__dirname, 'antigravity-bridge.cjs'),
    },

    // Rate limiting (shared across bridges)
    RATE_LIMIT: {
        MAX_PER_MINUTE: 15,
        WINDOW_MS: 60 * 1000,
    },

    // State file
    STATE_FILE: path.join(__dirname, '.agencyos-bridge-state.json'),

    // Version
    VERSION: '1.0.0',
};

// =====================================================
// STATE MANAGEMENT
// =====================================================

function loadState() {
    try {
        if (fs.existsSync(CONFIG.STATE_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG.STATE_FILE, 'utf-8'));
        }
    } catch (error) {
        // Silent fail
    }
    return {
        requests: [],
        lastReset: Date.now(),
        stats: { gemini: 0, git: 0, antigravity: 0 }
    };
}

function saveState(state) {
    try {
        fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2));
    } catch (error) {
        // Silent fail
    }
}

function cleanOldRequests(state) {
    const now = Date.now();
    const cutoff = now - CONFIG.RATE_LIMIT.WINDOW_MS;
    state.requests = state.requests.filter(ts => ts > cutoff);
    return state;
}

// =====================================================
// RATE LIMITING
// =====================================================

function getRateLimitStatus() {
    let state = loadState();
    state = cleanOldRequests(state);

    const currentCount = state.requests.length;
    const remaining = CONFIG.RATE_LIMIT.MAX_PER_MINUTE - currentCount;
    const oldestRequest = state.requests[0] || Date.now();
    const resetIn = Math.max(0, CONFIG.RATE_LIMIT.WINDOW_MS - (Date.now() - oldestRequest));

    return {
        allowed: currentCount < CONFIG.RATE_LIMIT.MAX_PER_MINUTE,
        remaining,
        used: currentCount,
        max: CONFIG.RATE_LIMIT.MAX_PER_MINUTE,
        resetIn,
        resetInSec: Math.ceil(resetIn / 1000),
    };
}

function recordRequest(bridge) {
    let state = loadState();
    state = cleanOldRequests(state);
    state.requests.push(Date.now());
    state.stats[bridge] = (state.stats[bridge] || 0) + 1;
    saveState(state);
}

// =====================================================
// BRIDGE EXECUTION
// =====================================================

function executeBridge(bridge, args) {
    const bridgePath = CONFIG.BRIDGES[bridge];

    if (!bridgePath) {
        console.error(`❌ Unknown bridge: ${bridge}`);
        console.log('   Available bridges: gemini, git, antigravity');
        process.exit(1);
    }

    if (!fs.existsSync(bridgePath)) {
        console.error(`❌ Bridge script not found: ${bridgePath}`);
        process.exit(1);
    }

    // Check rate limit for gemini
    if (bridge === 'gemini') {
        const status = getRateLimitStatus();
        if (!status.allowed) {
            console.log(`⏳ Rate limit reached. Waiting ${status.resetInSec}s...`);
            console.log('   Use "agencyos-bridge status" to check rate limit');
            process.exit(1);
        }
        recordRequest(bridge);
    }

    // Execute bridge script
    try {
        const result = execSync(`node "${bridgePath}" ${args.join(' ')}`, {
            encoding: 'utf-8',
            stdio: 'inherit',
            cwd: process.cwd(),
        });
    } catch (error) {
        process.exit(error.status || 1);
    }
}

// =====================================================
// COMMANDS
// =====================================================

function cmdStatus() {
    const state = loadState();
    const rateLimit = getRateLimitStatus();

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🏯 AgencyOS Unified Bridge v${CONFIG.VERSION}              ║
╠═══════════════════════════════════════════════════════════╣
║  "Dễ như ăn kẹo" - Easy as candy!                         ║
╚═══════════════════════════════════════════════════════════╝

📊 Rate Limit Status
────────────────────
  Used:       ${rateLimit.used}/${rateLimit.max} requests
  Remaining:  ${rateLimit.remaining}
  Reset In:   ${rateLimit.resetInSec}s
  Status:     ${rateLimit.allowed ? '✅ Ready' : '⏳ Rate Limited'}

📈 Usage Statistics
────────────────────
  Gemini:       ${state.stats?.gemini || 0} calls
  Git:          ${state.stats?.git || 0} calls
  Antigravity:  ${state.stats?.antigravity || 0} calls

🔗 Available Bridges
────────────────────
  ✅ gemini       ${fs.existsSync(CONFIG.BRIDGES.gemini) ? 'Ready' : '❌ Missing'}
  ✅ git          ${fs.existsSync(CONFIG.BRIDGES.git) ? 'Ready' : '❌ Missing'}
  ✅ antigravity  ${fs.existsSync(CONFIG.BRIDGES.antigravity) ? 'Ready' : '❌ Missing'}
`);
}

function cmdHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🏯 AgencyOS Unified Bridge v${CONFIG.VERSION}              ║
╠═══════════════════════════════════════════════════════════╣
║  "Dễ như ăn kẹo" - Easy as candy!                         ║
╚═══════════════════════════════════════════════════════════╝

USAGE
    node agencyos-bridge.cjs <bridge> <command> [args...]

BRIDGES
────────────────────────────────────────────────────────────
  gemini <cmd>          Gemini CLI integration
    ask <prompt>        Ask Gemini a question
    vision <file>       Analyze image/video
    code <file>         Code review
    status              Check rate limit

  git <cmd>             Git worktree management
    create <feature>    Create worktree
    remove <name>       Remove worktree
    list                List worktrees
    info                Repository info

  antigravity <cmd>     Python module bridge
    dna                 Get agency DNA
    content <count>     Generate content ideas

SYSTEM
────────────────────────────────────────────────────────────
  status                Unified status dashboard
  help                  Show this help

EXAMPLES
────────────────────────────────────────────────────────────
  # Ask Gemini a question
  node agencyos-bridge.cjs gemini ask "Explain React hooks"

  # Create git worktree
  node agencyos-bridge.cjs git create my-feature

  # Check unified status
  node agencyos-bridge.cjs status

🏯 "Không đánh mà thắng" - Win Without Fighting
`);
}

function cmdQuickStart() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║              🍬 Quick Start - Dễ như ăn kẹo!              ║
╚═══════════════════════════════════════════════════════════╝

1️⃣  Ask Gemini anything:
    node agencyos-bridge.cjs gemini ask "How to use React?"

2️⃣  Analyze an image:
    node agencyos-bridge.cjs gemini vision ./screenshot.png

3️⃣  Create a feature branch:
    node agencyos-bridge.cjs git create my-feature

4️⃣  Check status:
    node agencyos-bridge.cjs status

🏯 That's it! You're ready to go!
`);
}

// =====================================================
// MAIN
// =====================================================

function main() {
    const args = process.argv.slice(2);
    const bridge = args[0] || 'help';
    const bridgeArgs = args.slice(1);

    switch (bridge) {
        case 'status':
            cmdStatus();
            break;

        case 'help':
        case '--help':
        case '-h':
            cmdHelp();
            break;

        case 'quickstart':
        case 'start':
            cmdQuickStart();
            break;

        case 'gemini':
        case 'git':
        case 'antigravity':
            executeBridge(bridge, bridgeArgs);
            break;

        default:
            console.error(`❌ Unknown command: ${bridge}`);
            console.log('   Use "node agencyos-bridge.cjs help" for usage');
            process.exit(1);
    }
}

main();
