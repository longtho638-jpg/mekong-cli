#!/usr/bin/env node

/**
 * Development Rules Reminder - PreToolUse Hook
 *
 * Injects modularization reminders before Write/Edit operations.
 * Uses transcript checking to inject only once per ~50 messages for token efficiency.
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

const fs = require('fs');

/**
 * Check if reminder was recently injected by scanning transcript
 */
function wasRecentlyInjected(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      // Transcript doesn't exist - inject reminder
      return false;
    }

    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    const lines = transcript.split('\n');

    // Check last 50 lines for reminder marker
    const recentLines = lines.slice(-50);
    const wasInjected = recentLines.some(line => line.includes('**[IMPORTANT]** Consider Modularization'));

    return wasInjected;

  } catch (error) {
    // If we can't read transcript, assume not injected (fail-open)
    return false;
  }
}

/**
 * Main hook execution
 */
async function main() {
  try {
    // Read hook payload from stdin
    const stdin = fs.readFileSync(0, 'utf-8').trim();

    if (!stdin) {
      process.exit(0);
    }

    const payload = JSON.parse(stdin);
    const toolName = payload.tool_name;

    // Check if reminder was recently injected
    if (wasRecentlyInjected(payload.transcript_path)) {
      process.exit(0);
    }

    const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const memTotal = Math.round(require('os').totalmem() / 1024 / 1024);
    const memPercent = Math.round((memUsed / memTotal) * 100);

    const cpuUsage = Math.round((process.cpuUsage().user / 1000000) * 100);
    const cpuSystem = Math.round((process.cpuUsage().system / 1000000) * 100);

    const reminder = [
      `## Current environment`,
      `- Date time: ${new Date().toLocaleString()}`,
      `- Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      `- Working directory: ${process.cwd()}`,
      `- OS: ${process.platform}`,
      `- User: ${process.env.USERNAME}`,
      `- Locale: ${process.env.LANG}`,
      `- Memory usage: ${memUsed}MB/${memTotal}MB (${memPercent}%)`,
      `- CPU usage: ${cpuUsage}% user / ${cpuSystem}% system`,
      `- Include these information when delegating tasks to subagents.`,
      ``,
      `## Rules`,
      `- Development rules: "./.claude/workflows/development-rules.md"`,
      `- Documentation management: "./.claude/workflows/documentation-management.md"`,
      `- Ensure token consumption efficiency while maintaining high quality.`,
      `- Activate skills: Run \`python .claude/scripts/generate_catalogs.py --skills\` to generate skills catalog and analyze it, then activate the relevant skills that are needed for the task during the process.`,
      `- Check existing modules before creating new`,
      `- YAGNI, KISS, DRY principles`,
      `- Sacrifice grammar for the sake of concision when writing reports.`,
      `- In reports, list any unresolved questions at the end, if any.`,
      `- Include these rules when delegating tasks to subagents.`,
      ``,
      `## **[IMPORTANT] Consider Modularization:**`,
      `- Analyze logical separation boundaries (functions, classes, concerns)`,
      `- Use kebab-case naming with descriptive names, it does not matter if the file name is too long because this ensures file names are self-documenting for LLM tools (Grep, Glob)`,
      `- Write descriptive code comments`,
      `- After modularization, continue with main task`,
      `- Markdown files don't need to be modularized`,
      `- Markdown files are organized in: Plans → ./plans/, Docs → ./docs/`,
      `- Include these reminders when delegating tasks to subagents.`,
    ].join('\n');

    console.log(reminder);
    process.exit(0);

  } catch (error) {
    // Fail-open: log error but allow operation to continue
    console.error(`Dev rules hook error: ${error.message}`);
    process.exit(0);
  }
}

main();
