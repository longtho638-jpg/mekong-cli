/**
 * CLI Worker v2
 * Wraps a single execution of Claude Code CLI via child_process.spawn.
 * Corresponds to a single "slot" in the worker pool.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../../config');

class CLIWorker {
  constructor(id) {
    this.id = id;
    this.activeProcess = null;
    this.busy = false;
  }

  /**
   * Run a mission
   * @param {object} mission - { prompt, projectDir, timeoutMs, model, isRetry }
   * @returns {Promise<{success: boolean, result: string, elapsed: number, stderr: string}>}
   */
  async run(mission) {
    if (this.busy) throw new Error(`Worker ${this.id} is busy`);
    this.busy = true;

    const { prompt, projectDir, timeoutMs, model, isRetry } = mission;
    const effectiveModel = model || config.MODEL_NAME;
    const startTime = Date.now();

    // Log start
    this.log(`START: [model=${effectiveModel}] [cwd=${projectDir}] [timeout=${Math.round(timeoutMs/60000)}m]`);

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let resolved = false;

      const args = [
        '-p', prompt,
        '--model', effectiveModel,
        '--dangerously-skip-permissions',
      ];

      try {
        const child = spawn('claude', args, {
          cwd: projectDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            ANTHROPIC_API_KEY: 'ollama',
            ANTHROPIC_BASE_URL: config.CLOUD_BRAIN_URL,
            CLAUDE_BASE_URL: config.CLOUD_BRAIN_URL,
            // Ensure we don't inherit conflicting vars
            TOM_HUM_BRAIN_MODE: undefined,
          },
          timeout: timeoutMs,
        });

        this.activeProcess = child;

        child.stdout.on('data', (chunk) => {
          stdout += chunk.toString();
          // Optional: Stream output to a per-worker log or main log
          // For now, we rely on the main logger
        });

        child.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });

        const timer = setTimeout(() => {
          if (resolved) return;
          this.cleanup(child, resolve, false, 'timeout', Math.round((Date.now() - startTime)/1000), stderr);
        }, timeoutMs);

        child.on('close', (code) => {
          clearTimeout(timer);
          if (resolved) return;
          const success = code === 0;
          const result = success ? 'done' : `exit_${code}`;
          this.cleanup(child, resolve, success, result, Math.round((Date.now() - startTime)/1000), stderr);
        });

        child.on('error', (err) => {
          clearTimeout(timer);
          if (resolved) return;
          this.cleanup(child, resolve, false, 'spawn_error', Math.round((Date.now() - startTime)/1000), err.message);
        });

      } catch (e) {
        this.busy = false;
        resolve({ success: false, result: 'exception', elapsed: 0, stderr: e.message });
      }
    });
  }

  cleanup(child, resolve, success, result, elapsed, stderr) {
    this.busy = false;
    this.activeProcess = null;
    try { child.kill('SIGTERM'); } catch (e) {}

    this.log(`${success ? 'COMPLETE' : 'FAILED'}: ${result} (${elapsed}s)`);
    resolve({ success, result, elapsed, stderr });
  }

  log(msg) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const formatted = `[${timestamp}] [worker-${this.id}] ${msg}\n`;
    process.stderr.write(formatted);
    try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) { }
  }

  terminate() {
    if (this.activeProcess) {
      try { this.activeProcess.kill('SIGKILL'); } catch (e) {}
      this.activeProcess = null;
    }
    this.busy = false;
  }
}

module.exports = CLIWorker;
