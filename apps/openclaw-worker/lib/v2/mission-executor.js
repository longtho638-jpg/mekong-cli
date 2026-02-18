/**
 * Mission Executor v2
 * Orchestrates mission execution using WorkerPool and direct process control.
 * Implements AGI Evolution Phase 3: ACTION.
 */

const WorkerPool = require('./worker-pool');
const config = require('../../config');
const { log } = require('../brain-process-manager'); // Re-use logger for consistency

const { diagnoseFailure, getFallbackModel, truncatePrompt } = require('../mission-recovery');

class MissionExecutor {
  constructor() {
    this.maxWorkers = config.MAX_CONCURRENT_MISSIONS || 3;
    this.pool = new WorkerPool(this.maxWorkers);
    // Queue is currently managed by task-queue.js, but we prepare for future
    this.queue = [];
  }

  /**
   * Execute a mission
   * @param {string} prompt - The prompt to run
   * @param {string} projectDir - Directory to run in
   * @param {number} timeoutMs - Timeout in ms
   * @param {string} model - Model override
   * @returns {Promise<{success: boolean, result: string, elapsed: number, stderr: string}>}
   */
  async execute(prompt, projectDir, timeoutMs, model) {
    // 1. Acquire Worker
    const worker = this.pool.getFreeWorker();
    if (!worker) {
      // This should theoretically not happen if task-queue respects concurrency limit
      throw new Error('No free workers available in MissionExecutor pool');
    }

    // 2. Prepare Mission Object
    let currentMission = {
      prompt,
      projectDir,
      timeoutMs,
      model,
      isRetry: false
    };

    try {
      // 3. Run Mission (First Attempt)
      log(`[Executor] Assigning mission to Worker ${worker.id}`);
      let result = await worker.run(currentMission);

      // 4. Handle Result (Self-Correction / Recovery)
      if (!result.success && result.stderr) {
        log(`[Executor] Mission failed: ${result.result}. Analyzing failure...`);

        const diagnosis = diagnoseFailure(result.stderr);

        if (diagnosis.action) {
          log(`[Executor] 🩹 RECOVERY ACTION: ${diagnosis.action.toUpperCase()}`);

          const retryMission = { ...currentMission, isRetry: true };

          if (diagnosis.action === 'model_failover') {
            retryMission.model = diagnosis.model || getFallbackModel();
            log(`[Executor] 🔄 Retrying with fallback model: ${retryMission.model}`);
          } else if (diagnosis.action === 'context_truncate') {
            retryMission.prompt = truncatePrompt(currentMission.prompt);
            log(`[Executor] ✂️ Retrying with truncated prompt (${retryMission.prompt.length} chars)`);
          }

          // Retry execution
          result = await worker.run(retryMission);

          if (result.success) {
            log(`[Executor] ✅ RECOVERY SUCCESSFUL`);
          } else {
            log(`[Executor] ❌ RECOVERY FAILED`);
          }
        }
      }

      return result;
    } catch (error) {
      log(`[Executor] Critical error: ${error.message}`);
      return {
        success: false,
        result: 'executor_exception',
        elapsed: 0,
        stderr: error.message
      };
    }
  }

  getStatus() {
    return this.pool.getStatus();
  }
}

// Singleton instance
const missionExecutor = new MissionExecutor();
module.exports = missionExecutor;
