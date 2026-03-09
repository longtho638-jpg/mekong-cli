const { execSync } = require('child_process');
const fs = require('fs');

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
if (!DASHSCOPE_API_KEY) {
    console.error("DASHSCOPE_API_KEY is not set.");
    process.exit(1);
}

const TASK_FILE = '/Users/macbookprom1/mekong-cli/tasks/CRITICAL_RAAS_UNIFICATION.txt';
// Optional: also load the plan if it exists
const PLAN_FILE = '/Users/macbookprom1/mekong-cli/plans/260309-2004-monorepo-restructure/phase-0a-extract-public.md';

const LOG_FILE = '/tmp/opus_qwen_watcher.log';

function log(msg) {
    const t = new Date().toISOString();
    console.log(`[${t}] ${msg}`);
    fs.appendFileSync(LOG_FILE, `[${t}] ${msg}\n`);
}

function getOpusPane() {
    try {
        return execSync('tmux capture-pane -t opus_algo:0.0 -p 2>/dev/null | tail -n 35', { encoding: 'utf-8' });
    } catch (e) {
        return "";
    }
}

async function askQwen(paneOutput) {
    let taskInfo = "No task file found.";
    try { taskInfo = fs.readFileSync(TASK_FILE, 'utf-8'); } catch (e) { }

    const prompt = `You are a Grandmaster CTO AI. You are monitoring a sub-agent named Opus 4.6 running in Tmux.
The overall mission is:
---
${taskInfo}
---

The current terminal output of the sub-agent is:
---
${paneOutput}
---

Your job:
1. Examine if the sub-agent has completed its task successfully.
2. If it is waiting for input (at the '❯' prompt without saying 'Running' or 'Churning' etc), decide the next best command to send to it to continue the execution of the mission.
3. If it failed, provide the command to fix it or continue.
4. Output ONLY the exact raw bash/cli command to type into the sub-agent's prompt, nothing else. If you want it to run a /cook command, output just the /cook command.
If it is not done (still running), output exactly "STILL_RUNNING"
`;

    try {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
            })
        });
        const data = await res.json();

        // Handle Gemini 404 or missing choices
        if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            log('Gemini API Error: ' + JSON.stringify(data));
            return "STILL_RUNNING";
        }
        return data.candidates[0].content.parts[0].text.trim();
    } catch (e) {
        log('Failed to contact Gemini API: ' + e.message);
        return "STILL_RUNNING";
    }
}

async function loop() {
    log("Starting Opus Watchdog loop...");
    while (true) {
        const paneOutput = getOpusPane();
        if (!paneOutput) {
            await new Promise(r => setTimeout(r, 10000));
            continue;
        }

        if (paneOutput.includes('❯')) {
            // If the prompt contains "❯", check if it's currently actively thinking/running.
            // "Tempring…", "Crunching…", "Running…" are active.
            // "Brewed for", "Churned for" mean it FINISHED.
            const isThinking = /(Running…|Tempering…|Crunching…|Newspapering…|Prestidigitating…|Working)/.test(paneOutput);
            const isFinished = /(Brewed for|Churned for)/.test(paneOutput);

            // If it's NOT thinking, OR if it says it finished (even if it matches some other keyword by accident), it's idle.
            const isRunning = isThinking && !isFinished;

            if (!isRunning) {
                log("Opus appears idle. Asking Qwen API for the next command...");
                const nextCommand = await askQwen(paneOutput);

                if (nextCommand && nextCommand !== "STILL_RUNNING") {
                    log("Qwen suggests command: " + nextCommand);
                    // inject via tmux
                    // we need to escape single quotes
                    const safeCmd = nextCommand.replace(/'/g, "'\\''");
                    execSync(`tmux send-keys -t opus_algo:0.0 '${safeCmd}' Enter`);
                    log("Command sent. Sleeping for 20s to let it start.");
                    await new Promise(r => setTimeout(r, 20000));
                } else {
                    log("Qwen returned STILL_RUNNING or empty. Waiting.");
                }
            }
        }
        await new Promise(r => setTimeout(r, 10000));
    }
}

loop();
