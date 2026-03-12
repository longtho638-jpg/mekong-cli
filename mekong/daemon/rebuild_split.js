const { spawnBrain } = require('./lib/brain-process-manager');
const { execSync } = require('child_process');
(async () => {
    try {
        execSync("pkill -9 -f 'node.*task-watcher'");
        execSync("tmux kill-session -t tom_hum || true");
        execSync("rm /Users/macbookprom1/mekong-cli/apps/openclaw-worker/.mission-active-P*.lock || true");
        
        execSync("tmux new-session -d -s tom_hum -n brain -x 200 -y 50 -c /Users/macbookprom1/mekong-cli");
        
        // Split the window into 2 panes side-by-side
        execSync("tmux split-window -h -t tom_hum:brain");
        execSync("tmux select-layout -t tom_hum:brain even-horizontal");
        
        // We will manually inject the boot commands into the panes to guarantee the layout
        const proCmd = "export CLAUDE_CONFIG_DIR='/Users/macbookprom1/.claude_antigravity_pro' && unset ANTHROPIC_API_KEY && unset ANTHROPIC_BASE_URL && unset CLAUDE_BASE_URL && export NPM_CONFIG_WORKSPACES=false && export npm_config_workspaces=false && claude --model claude-sonnet-4-6-20250514 --mcp-config '/Users/macbookprom1/.claude_antigravity_pro/mcp.json' --dangerously-skip-permissions";
        execSync(`tmux send-keys -t tom_hum:brain.0 "${proCmd}" Enter`);
        
        const apiCmd = "export CLAUDE_CONFIG_DIR='/Users/macbookprom1/.claude_antigravity_api' && unset ANTHROPIC_API_KEY && export ANTHROPIC_BASE_URL='http://127.0.0.1:20128' && export ANTHROPIC_DEFAULT_HAIKU_MODEL='gemini-3-flash' && export CLAUDE_CODE_SUBAGENT_MODEL='gemini-3-flash' && export NPM_CONFIG_WORKSPACES=false && export npm_config_workspaces=false && claude --model claude-sonnet-4-6-20250514 --mcp-config '/Users/macbookprom1/.claude_antigravity_api/mcp.json' --dangerously-skip-permissions";
        execSync(`tmux send-keys -t tom_hum:brain.1 "${apiCmd}" Enter`);
        
        await new Promise(r => setTimeout(r, 10000));
        
        // Auto-auth
        execSync("tmux send-keys -t tom_hum:brain.0 Down Enter");
        execSync("tmux send-keys -t tom_hum:brain.1 Down Enter");
        await new Promise(r => setTimeout(r, 2000));
        execSync("tmux send-keys -t tom_hum:brain.0 Enter");
        execSync("tmux send-keys -t tom_hum:brain.1 Enter");
        
    } catch (e) {
        /* Error setting up split panes */
    }
    process.exit(0);
})();
