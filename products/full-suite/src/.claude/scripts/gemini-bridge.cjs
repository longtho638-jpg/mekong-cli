#!/usr/bin/env node
/**
 * 🏯 Gemini CLI Bridge (Refactored)
 * 
 * Bridges Claude/Antigravity to Gemini CLI with async execution, 
 * robust rate limiting, and "Binh Pháp" architecture.
 * 
 * Usage:
 *   node gemini-bridge.cjs <command> [args...]
 * 
 * Commands:
 *   ask <prompt>      - Ask Gemini a text question
 *   vision <file>     - Analyze image/video with Gemini
 *   code <file>       - Code review/generation
 *   status            - Check rate limit status
 *   test-rate-limit   - Test rate limiting (mock)
 *   
 * "Dụng Gián" - Use intelligence agents wisely.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
    // Rate limiting
    MAX_REQUESTS_PER_MINUTE: 15,
    REQUEST_WINDOW_MS: 60 * 1000, // 1 minute

    // Retry logic
    MAX_RETRIES: 3,
    INITIAL_BACKOFF_MS: 2000,

    // State file
    STATE_FILE: path.join(__dirname, '.gemini-bridge-state.json'),

    // Gemini CLI command
    GEMINI_CLI: 'gemini',
};

// =====================================================
// CLASS: RATE LIMITER (PHÁP)
// =====================================================

/**
 * Manages request quotas and timing.
 */
class RateLimiter {
    constructor(config) {
        this.config = config;
    }

    _loadState() {
        try {
            if (fs.existsSync(this.config.STATE_FILE)) {
                return JSON.parse(fs.readFileSync(this.config.STATE_FILE, 'utf-8'));
            }
        } catch (error) {
            console.error('⚠️ Could not load state:', error.message);
        }
        return { requests: [] };
    }

    _saveState(state) {
        try {
            fs.writeFileSync(this.config.STATE_FILE, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('⚠️ Could not save state:', error.message);
        }
    }

    _cleanOldRequests(state) {
        const now = Date.now();
        const cutoff = now - this.config.REQUEST_WINDOW_MS;
        state.requests = state.requests.filter(ts => ts > cutoff);
        return state;
    }

    check() {
        let state = this._loadState();
        state = this._cleanOldRequests(state);

        const currentCount = state.requests.length;
        const remaining = this.config.MAX_REQUESTS_PER_MINUTE - currentCount;
        const oldestRequest = state.requests[0] || Date.now();
        
        return {
            allowed: currentCount < this.config.MAX_REQUESTS_PER_MINUTE,
            remaining,
            resetIn: Math.max(0, this.config.REQUEST_WINDOW_MS - (Date.now() - oldestRequest)),
            currentCount,
        };
    }

    record() {
        let state = this._loadState();
        state = this._cleanOldRequests(state);
        state.requests.push(Date.now());
        this._saveState(state);
    }

    async wait() {
        const status = this.check();
        if (status.allowed) return;

        const waitMs = status.resetIn + 1000; // Add 1s buffer
        console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitMs / 1000)}s...`);
        
        await new Promise(resolve => setTimeout(resolve, waitMs));
        
        // Recursively check again to ensure we are clear
        return this.wait();
    }
}

// =====================================================
// CLASS: GEMINI BRIDGE (TƯỚNG)
// =====================================================

/**
 * Orchestrates calls to the Gemini CLI.
 */
class GeminiBridge {
    constructor(config) {
        this.config = config;
        this.limiter = new RateLimiter(config);
    }

    /**
     * Executes the Gemini CLI command asynchronously.
     * @param {string} prompt The prompt to send.
     * @param {object} options Options like retryCount.
     */
    async execute(prompt, options = {}) {
        const { retryCount = 0, timeout = 60000 } = options;

        // 1. Check Rate Limit
        await this.limiter.wait();
        const status = this.limiter.check();
        
        // 2. Record Request
        this.limiter.record();
        console.log(`🚀 Sending to Gemini... (${status.remaining - 1} requests remaining)`);

        // 3. Spawn Process (Async)
        try {
            const output = await this._spawnGemini(prompt, timeout);
            return { success: true, output };
        } catch (error) {
            return this._handleError(error, prompt, options);
        }
    }

    _spawnGemini(prompt, timeout) {
        return new Promise((resolve, reject) => {
            // Escape quotes for shell safety if simple exec, but spawn handles args safer
            // Note: The original CLI usage was -p "prompt". 
            // With spawn, we pass args array.
            
            const child = spawn(this.config.GEMINI_CLI, ['-p', prompt], {
                stdio: ['ignore', 'pipe', 'pipe'], // Ignore stdin, pipe stdout/stderr
                timeout: timeout
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(stderr || `Process exited with code ${code}`));
                }
            });

            child.on('error', (err) => {
                reject(err);
            });
        });
    }

    async _handleError(error, prompt, options) {
        const { retryCount = 0 } = options;
        const errMsg = error.message || '';

        // Check for 429/Rate Limit from API response
        if (errMsg.includes('429') || errMsg.includes('Too Many Requests')) {
            if (retryCount < this.config.MAX_RETRIES) {
                const backoffMs = this.config.INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
                console.log(`⚠️ API Rate Limit. Retrying in ${backoffMs/1000}s... (Attempt ${retryCount + 1})`);
                
                await new Promise(resolve => setTimeout(resolve, backoffMs));
                return this.execute(prompt, { ...options, retryCount: retryCount + 1 });
            }
        }

        return {
            success: false,
            error: errMsg,
            stderr: errMsg // In spawn catch, often same
        };
    }
}

// =====================================================
// COMMAND HANDLERS
// =====================================================

const bridge = new GeminiBridge(CONFIG);

async function cmdAsk(prompt) {
    if (!prompt) return console.log('❌ Usage: gemini-bridge.cjs ask "your question"');

    const result = await bridge.execute(prompt);
    if (result.success) {
        console.log('\n📝 Gemini Response:\n');
        console.log(result.output);
    } else {
        console.log('❌ Error:', result.error);
    }
}

async function cmdVision(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
        return console.log(`❌ File not found: ${filePath}`);
    }

    const prompt = `Analyze this image/video: ${filePath}`;
    const result = await bridge.execute(prompt);

    if (result.success) {
        console.log('\n🖼️ Vision Analysis:\n');
        console.log(result.output);
    } else {
        console.log('❌ Error:', result.error);
    }
}

async function cmdCode(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
        return console.log(`❌ File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const prompt = `Review this code and suggest improvements:\n\n${content.substring(0, 4000)}`; // Limit context
    
    const result = await bridge.execute(prompt);

    if (result.success) {
        console.log('\n💻 Code Review:\n');
        console.log(result.output);
    } else {
        console.log('❌ Error:', result.error);
    }
}

function cmdStatus() {
    const status = bridge.limiter.check();
    
    console.log('\n📊 Gemini CLI Bridge Status');
    console.log('═══════════════════════════════════════');
    console.log(`Rate Limit:     ${CONFIG.MAX_REQUESTS_PER_MINUTE} requests/minute`);
    console.log(`Used:           ${status.currentCount}/${CONFIG.MAX_REQUESTS_PER_MINUTE}`);
    console.log(`Remaining:      ${status.remaining}`);
    console.log(`Reset In:       ${Math.ceil(status.resetIn / 1000)}s`);
    console.log(`Status:         ${status.allowed ? '✅ Ready' : '⏳ Rate Limited'}`);
    console.log('═══════════════════════════════════════\n');
}

async function cmdTestRateLimit() {
    console.log('🧪 Testing rate limiting logic...\n');
    const limiter = new RateLimiter(CONFIG);
    
    for (let i = 1; i <= 5; i++) {
        const status = limiter.check();
        console.log(`Request ${i}: ${status.allowed ? '✅ Allowed' : '❌ Blocked'} (${status.remaining} left)`);
        if (status.allowed) limiter.record();
        await new Promise(r => setTimeout(r, 100));
    }
    
    console.log('\n✅ Rate limit test complete');
    cmdStatus();
}

function cmdHelp() {
    console.log(`
🏯 Gemini CLI Bridge - AgencyOS
═══════════════════════════════════════
Commands:
  ask <prompt>        Ask text question
  vision <file>       Analyze media
  code <file>         Review code
  status              Check quotas
  test-rate-limit     Simulate traffic
  help                Show this message
═══════════════════════════════════════
`);
}

// =====================================================
// MAIN ENTRY
// =====================================================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    const params = args.slice(1).join(' ');

    try {
        switch (command) {
            case 'ask': await cmdAsk(params); break;
            case 'vision': await cmdVision(params); break;
            case 'code': await cmdCode(params); break;
            case 'status': cmdStatus(); break;
            case 'test-rate-limit': await cmdTestRateLimit(); break;
            default: cmdHelp();
        }
    } catch (err) {
        console.error('❌ Fatal Error:', err.message);
    }
}

main();