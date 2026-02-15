/**
 * Worker Pool v2
 * Manages a pool of CLIWorker instances.
 * Handles queuing and worker assignment.
 */

const CLIWorker = require('./cli-worker');

class WorkerPool {
  constructor(size = 1) {
    this.size = size;
    this.workers = [];
    this.queue = [];

    // Initialize workers
    for (let i = 0; i < size; i++) {
      this.workers.push(new CLIWorker(i + 1));
    }
  }

  /**
   * Acquire a worker. If none available, returns null (or promise that resolves when one is free?)
   * For simplicity in this iteration, we'll just check availability.
   * The MissionExecutor will handle the queuing logic.
   */
  getFreeWorker() {
    return this.workers.find(w => !w.busy);
  }

  /**
   * Check if any worker is free
   */
  hasFreeWorker() {
    return this.workers.some(w => !w.busy);
  }

  /**
   * Terminate all workers
   */
  terminateAll() {
    this.workers.forEach(w => w.terminate());
  }

  /**
   * Get pool status
   */
  getStatus() {
    return {
      total: this.size,
      busy: this.workers.filter(w => w.busy).length,
      free: this.workers.filter(w => !w.busy).length
    };
  }
}

module.exports = WorkerPool;
