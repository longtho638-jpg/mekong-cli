/**
 * LightMem Core Memory Module — Lightweight Memory for LLM Agents
 *
 * Based on: arxiv.org/abs/2510.18866 (LightMem Paper)
 * GitHub: github.com/zjunlp/LightMem
 *
 * Architecture:
 * - WorkingMemory: In-memory, fast access for active tasks
 * - LongTermMemory: File-based, persistent storage for consolidated knowledge
 * - MemoryItem: Standardized schema with importance scoring & decay
 *
 * @see https://arxiv.org/abs/2510.18866
 * @see https://github.com/zjunlp/LightMem
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

// ============================================================================
// Constants & Configuration
// ============================================================================

const MEMORY_DIR = path.join(config.MEKONG_DIR, 'apps/openclaw-worker', 'data', 'lightmem');
const WORKING_MEMORY_FILE = path.join(MEMORY_DIR, 'working-memory.json');
const LONGTERM_MEMORY_FILE = path.join(MEMORY_DIR, 'longterm-memory.json');
const ARCHIVE_MEMORY_FILE = path.join(MEMORY_DIR, 'archive-memory.json');

// Memory limits
const MAX_WORKING_MEMORY_SIZE = 100;      // Max items in RAM
const MAX_LONGTERM_MEMORY_SIZE = 10000;   // Max items on disk
const MAX_ARCHIVE_MEMORY_SIZE = 50000;    // Max archived items

// Decay configuration
const DECAY_RATE = 0.01;                  // Daily decay rate (1% per day)
const PRUNING_THRESHOLD = 0.1;            // Remove items with importance < 0.1
const DEFAULT_IMPORTANCE = 0.5;           // Default importance for new memories
const SUCCESS_BONUS = 0.2;                // Bonus for successful missions
const FAILURE_PENALTY = -0.1;             // Penalty for failed missions

// Memory types
const MemoryType = {
  MISSION_OUTCOME: 'mission_outcome',
  LESSON_LEARNED: 'lesson_learned',
  PATTERN_IDENTIFIED: 'pattern_identified',
  STRATEGIC_INSIGHT: 'strategic_insight',
  CODE_CHANGE: 'code_change',
  ERROR_RESOLUTION: 'error_resolution',
};

/**
 * MemoryItem Schema
 * @typedef {Object} MemoryItem
 * @property {string} id - Unique identifier (hash of content + timestamp)
 * @property {MemoryType} type - Type of memory
 * @property {string} content - Main content/payload
 * @property {string} project - Associated project name
 * @property {number} importance - Importance score (0.0 - 1.0)
 * @property {number} decay - Current decay level (0.0 - 1.0)
 * @property {number} timestamp - Creation timestamp (ms)
 * @property {number} lastAccessed - Last access timestamp (ms)
 * @property {Record<string, any>} metadata - Additional metadata
 */

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique memory ID
 * @param {string} content - Memory content
 * @param {number} timestamp - Creation timestamp
 * @returns {string} Unique ID
 */
function generateId(content, timestamp) {
  return crypto.createHash('sha256').update(`${content}:${timestamp}`).digest('hex').slice(0, 16);
}

/**
 * Calculate effective importance (importance * decay)
 * @param {MemoryItem} item - Memory item
 * @returns {number} Effective importance
 */
function calculateEffectiveImportance(item) {
  return item.importance * item.decay;
}

/**
 * Calculate time-based decay
 * @param {number} ageInDays - Age of memory in days
 * @returns {number} Decay factor (0.0 - 1.0)
 */
function calculateDecay(ageInDays) {
  // Exponential decay: decay = e^(-decay_rate * age)
  return Math.exp(-DECAY_RATE * ageInDays);
}

/**
 * Atomic file write (temp file + rename)
 * @param {string} filePath - Target file path
 * @param {string} data - JSON data to write
 */
function atomicWrite(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempFile = `${filePath}.tmp.${process.pid}`;
  fs.writeFileSync(tempFile, data, 'utf-8');
  fs.renameSync(tempFile, filePath);
}

/**
 * Load JSON file with error handling
 * @param {string} filePath - File path
 * @param {Array} defaultValue - Default value if file doesn't exist
 * @returns {Array} Loaded data
 */
function loadJsonFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error(`[LightMem] Error loading ${filePath}:`, e.message);
  }
  return defaultValue;
}

// ============================================================================
// WorkingMemory Class (In-Memory, Fast Access)
// ============================================================================

class WorkingMemory {
  constructor() {
    this.items = new Map(); // id → MemoryItem
    this.load();
  }

  /**
   * Load working memory from file
   */
  load() {
    const data = loadJsonFile(WORKING_MEMORY_FILE);
    this.items = new Map(data.map(item => [item.id, item]));
    console.log(`[LightMem] Loaded ${this.items.size} working memory items`);
  }

  /**
   * Save working memory to file
   */
  save() {
    const data = Array.from(this.items.values());
    atomicWrite(WORKING_MEMORY_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * Add item to working memory
   * @param {MemoryItem} item - Memory item
   * @returns {MemoryItem} Added item
   */
  add(item) {
    // Enforce size limit
    if (this.items.size >= MAX_WORKING_MEMORY_SIZE) {
      // Remove least important item
      let minImportance = Infinity;
      let minId = null;
      for (const [id, it] of this.items.entries()) {
        const eff = calculateEffectiveImportance(it);
        if (eff < minImportance) {
          minImportance = eff;
          minId = id;
        }
      }
      if (minId) {
        this.items.delete(minId);
      }
    }

    this.items.set(item.id, item);
    this.save();
    return item;
  }

  /**
   * Get item by ID
   * @param {string} id - Memory ID
   * @returns {MemoryItem|null}
   */
  get(id) {
    const item = this.items.get(id);
    if (item) {
      item.lastAccessed = Date.now();
    }
    return item || null;
  }

  /**
   * Get all items (optionally filtered by type/project)
   * @param {Object} filter - Filter options
   * @returns {MemoryItem[]}
   */
  getAll(filter = {}) {
    let items = Array.from(this.items.values());

    if (filter.type) {
      items = items.filter(item => item.type === filter.type);
    }
    if (filter.project) {
      items = items.filter(item => item.project === filter.project);
    }
    if (filter.minImportance !== undefined) {
      items = items.filter(item => item.importance >= filter.minImportance);
    }

    return items;
  }

  /**
   * Update item
   * @param {string} id - Memory ID
   * @param {Partial<MemoryItem>} updates - Updates to apply
   * @returns {MemoryItem|null}
   */
  update(id, updates) {
    const item = this.items.get(id);
    if (!item) return null;

    Object.assign(item, updates);
    this.save();
    return item;
  }

  /**
   * Delete item
   * @param {string} id - Memory ID
   * @returns {boolean}
   */
  delete(id) {
    const deleted = this.items.delete(id);
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  /**
   * Clear all items
   */
  clear() {
    this.items.clear();
    this.save();
  }

  /**
   * Get size
   * @returns {number}
   */
  size() {
    return this.items.size;
  }
}

// ============================================================================
// LongTermMemory Class (File-Based, Persistent)
// ============================================================================

class LongTermMemory {
  constructor() {
    this.items = []; // Array<MemoryItem>
    this.index = new Map(); // id → index
    this.load();
  }

  /**
   * Load long-term memory from file
   */
  load() {
    this.items = loadJsonFile(LONGTERM_MEMORY_FILE);
    this.index = new Map(this.items.map((item, idx) => [item.id, idx]));
    console.log(`[LightMem] Loaded ${this.items.length} long-term memory items`);
  }

  /**
   * Save long-term memory to file
   */
  save() {
    atomicWrite(LONGTERM_MEMORY_FILE, JSON.stringify(this.items, null, 2));
  }

  /**
   * Add item to long-term memory
   * @param {MemoryItem} item - Memory item
   * @returns {MemoryItem} Added item
   */
  add(item) {
    // Enforce size limit
    if (this.items.length >= MAX_LONGTERM_MEMORY_SIZE) {
      // Archive oldest, least important items
      this.archive(100);
    }

    this.index.set(item.id, this.items.length);
    this.items.push(item);
    this.save();
    return item;
  }

  /**
   * Get item by ID
   * @param {string} id - Memory ID
   * @returns {MemoryItem|null}
   */
  get(id) {
    const idx = this.index.get(id);
    if (idx === undefined) return null;
    return this.items[idx] || null;
  }

  /**
   * Get all items (optionally filtered)
   * @param {Object} filter - Filter options
   * @returns {MemoryItem[]}
   */
  getAll(filter = {}) {
    let items = [...this.items];

    if (filter.type) {
      items = items.filter(item => item.type === filter.type);
    }
    if (filter.project) {
      items = items.filter(item => item.project === filter.project);
    }
    if (filter.minImportance !== undefined) {
      items = items.filter(item => item.importance >= filter.minImportance);
    }
    if (filter.since) {
      items = items.filter(item => item.timestamp >= filter.since);
    }

    return items;
  }

  /**
   * Update item (triggers reindex)
   * @param {string} id - Memory ID
   * @param {Partial<MemoryItem>} updates - Updates to apply
   * @returns {MemoryItem|null}
   */
  update(id, updates) {
    const idx = this.index.get(id);
    if (idx === undefined) return null;

    Object.assign(this.items[idx], updates);
    this.save();
    return this.items[idx];
  }

  /**
   * Delete item
   * @param {string} id - Memory ID
   * @returns {boolean}
   */
  delete(id) {
    const idx = this.index.get(id);
    if (idx === undefined) return false;

    this.items.splice(idx, 1);
    this.index.delete(id);

    // Rebuild index
    this.index = new Map(this.items.map((item, i) => [item.id, i]));
    this.save();
    return true;
  }

  /**
   * Archive old items
   * @param {number} count - Number of items to archive
   */
  archive(count = 100) {
    // Sort by effective importance (ascending)
    const sorted = [...this.items].sort((a, b) => {
      return calculateEffectiveImportance(a) - calculateEffectiveImportance(b);
    });

    const toArchive = sorted.slice(0, count);
    const toKeep = sorted.slice(count);

    // Load archive and add
    const archive = loadJsonFile(ARCHIVE_MEMORY_FILE);
    archive.push(...toArchive);

    // Enforce archive limit
    if (archive.length > MAX_ARCHIVE_MEMORY_SIZE) {
      archive.splice(0, archive.length - MAX_ARCHIVE_MEMORY_SIZE);
    }

    atomicWrite(ARCHIVE_MEMORY_FILE, JSON.stringify(archive, null, 2));

    // Update current items
    this.items = toKeep;
    this.index = new Map(this.items.map((item, i) => [item.id, i]));
    this.save();

    console.log(`[LightMem] Archived ${toArchive.length} items`);
  }

  /**
   * Apply decay to all items
   */
  applyDecay() {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    for (const item of this.items) {
      const ageInDays = (now - item.timestamp) / DAY_MS;
      item.decay = calculateDecay(ageInDays);
    }

    this.save();
  }

  /**
   * Prune low-importance items
   * @returns {number} Number of items pruned
   */
  prune() {
    const before = this.items.length;
    this.items = this.items.filter(item => {
      return calculateEffectiveImportance(item) >= PRUNING_THRESHOLD;
    });
    this.index = new Map(this.items.map((item, i) => [item.id, i]));
    this.save();

    const pruned = before - this.items.length;
    if (pruned > 0) {
      console.log(`[LightMem] Pruned ${pruned} low-importance items`);
    }
    return pruned;
  }

  /**
   * Get size
   * @returns {number}
   */
  size() {
    return this.items.length;
  }

  /**
   * Get stats
   * @returns {Object}
   */
  getStats() {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const byType = {};
    const byProject = {};
    let totalImportance = 0;
    let avgAge = 0;

    for (const item of this.items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byProject[item.project] = (byProject[item.project] || 0) + 1;
      totalImportance += item.importance;
      avgAge += (now - item.timestamp) / DAY_MS;
    }

    return {
      total: this.items.length,
      byType,
      byProject,
      avgImportance: this.items.length > 0 ? (totalImportance / this.items.length).toFixed(3) : 0,
      avgAgeDays: this.items.length > 0 ? (avgAge / this.items.length).toFixed(1) : 0,
    };
  }
}

// ============================================================================
// Singleton Exports
// ============================================================================

const workingMemory = new WorkingMemory();
const longTermMemory = new LongTermMemory();

module.exports = {
  // Classes
  WorkingMemory,
  LongTermMemory,

  // Singletons
  workingMemory,
  longTermMemory,

  // Constants
  MemoryType,
  MAX_WORKING_MEMORY_SIZE,
  MAX_LONGTERM_MEMORY_SIZE,
  DECAY_RATE,
  PRUNING_THRESHOLD,

  // Utilities
  calculateEffectiveImportance,
  calculateDecay,
  generateId,
};
