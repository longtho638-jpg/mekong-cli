/**
 * cto-pane-state-detector.js
 * Detects CC CLI pane state from tmux captured output.
 * Returns one of: DEAD | CRASHED | MODEL_UNAVAILABLE | CONTEXT_LIMIT | LOW_CONTEXT |
 *                 RATE_LIMITED | PENDING | STUCK_PROMPT | INTERACTIVE |
 *                 WORKING | IDLE | ACTIVE
 */

'use strict';

/**
 * @param {string} output - raw tmux capture-pane output
 * @returns {string} state name
 */
function detectPaneState(output) {
    if (!output || output.includes('Pane is dead')) return 'DEAD';

    if (
        /macbookprom1@/.test(output) ||
        /Resume this session with:/.test(output) ||
        /zsh: command not found/.test(output) ||
        /zsh: no such file or directory/.test(output) ||
        /bash-3\.2\$/.test(output)
    ) return 'CRASHED';

    // Idle: prompt line followed immediately by horizontal rule
    if (/(›|❯)\s*\n[─━]+/.test(output)) return 'IDLE';

    if (/Context limit reached/.test(output)) return 'CONTEXT_LIMIT';
    if (/Context left until auto-compact: ([0-9]|1[0-5])%/.test(output)) return 'LOW_CONTEXT';
    if (/Context left until auto-compact: 0%/.test(output)) return 'LOW_CONTEXT';

    if (/issue with the selected model|model.*not exist|not have access to it|Run \/model to pick/.test(output))
        return 'MODEL_UNAVAILABLE';

    if (/rate-limit-options|You've hit your limit|API Error: 429|"code":"throttling"|quota exceeded|AccountQuotaExceeded|TooManyRequests|exceeded the.*usage quota|Retrying in \d+ seconds/.test(output))
        return 'RATE_LIMITED';

    if (/(›|❯)\s*(git (push|commit|add)|queued messages|Press up to edit)/.test(output)) return 'PENDING';
    if (/(›|❯)\s*\/(cook|bootstrap|plan|debug) /.test(output)) return 'STUCK_PROMPT';

    if (/Enter to select|↑\/↓ to navigate|Esc to cancel|Yes \(Recommended\)|Type something|Submit answers|Review your answers|Ready to submit/.test(output))
        return 'INTERACTIVE';

    // WORKING — check before IDLE to avoid blind injection
    if (/(Whisking|Bloviating|Churning|Crystallizing|Sprouting|Deciphering|Prestidigitating|Puttering|Nesting|Crafting|Warping|Flowing|Sock-hopping|Building|Zigzagging|Quantumizing|Enchanting|Discombobulating|Smooshing|Spiraling|Explore agents|Running \d|Perambulating|Hashing|Processing|Unfurling|thinking|Moseying|Waddling|Jitterbugging|Flummoxing|Swooping|Hatching|Searching for)/i.test(output))
        return 'WORKING';

    if (/Running…|Waiting…|Bash\(|Read\(|Write\(|fullstack-developer\(|planner\(|debugger\(|tester\(|code-reviewer\(|researcher\(|hook error|background tasks/i.test(output))
        return 'WORKING';

    // Fresh boot idle patterns
    if (/(›|❯)\s*[Tt]ry "/.test(output) && /bypass permissions on/.test(output)) return 'IDLE';
    if (
        /bypass permissions on/.test(output) &&
        !/Searching|Running|Explore|Read \d|Smooshing|Whisking|Bloviating|Churning|Building|Prestidigitating|Flowing|Crafting|Spiraling|Nesting|Puttering|Zigzagging|Perambulating|Hashing|Processing|Unfurling|thinking|thought for|Running…|Waiting…|Bash\(/.test(output)
    ) return 'IDLE';

    if (/Cooked for \d/.test(output)) return 'IDLE';
    if (/Crunched for \d/.test(output)) return 'IDLE';
    if (/Choreographed for \d/.test(output)) return 'IDLE';
    if (/Sautéed for \d/.test(output)) return 'IDLE';
    if (/\w+ed for \d+[ms]/.test(output) && /bypass permissions on/.test(output) && /❯/.test(output)) return 'IDLE';
    if (/❯\s*$/.test(output)) return 'IDLE';

    return 'ACTIVE';
}

module.exports = { detectPaneState };
