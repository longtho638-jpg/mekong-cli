/**
 * Task Dedup Registry — Chống Loop Trùng Lặp
 * 
 * Lưu hash mỗi task đã dispatch → data/dispatched-tasks.json
 * Check trước khi inject → nếu trùng → SKIP
 * TTL 24h: task cũ hơn 24h được phép re-dispatch
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DEDUP_FILE = path.join(DATA_DIR, 'dispatched-tasks.json');
const MAX_HISTORY = 200;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashTask(taskText) {
    // Normalize: lowercase, collapse whitespace, remove timestamps/IDs
    const normalized = taskText.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\d{4}-\d{2}-\d{2}/g, '')
        .replace(/\b(commit|--auto)\b/gi, '')
        .trim();
    return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 12);
}

function loadRegistry() {
    try {
        if (fs.existsSync(DEDUP_FILE)) {
            return JSON.parse(fs.readFileSync(DEDUP_FILE, 'utf8'));
        }
    } catch (e) { /* corrupt file */ }
    return { tasks: [], chapterIndex: 0 };
}

function saveRegistry(registry) {
    ensureDataDir();
    // Trim to MAX_HISTORY
    if (registry.tasks.length > MAX_HISTORY) {
        registry.tasks = registry.tasks.slice(-MAX_HISTORY);
    }
    fs.writeFileSync(DEDUP_FILE, JSON.stringify(registry, null, 2));
}

/**
 * Check if a task has been dispatched recently (within TTL)
 * @param {string} taskText - The task description
 * @returns {boolean} true if DUPLICATE (should skip), false if NEW
 */
function isDuplicate(taskText) {
    const hash = hashTask(taskText);
    const registry = loadRegistry();
    const now = Date.now();

    // Clean expired entries
    registry.tasks = registry.tasks.filter(t => (now - t.dispatchedAt) < TTL_MS);
    saveRegistry(registry);

    return registry.tasks.some(t => t.hash === hash);
}

/**
 * Record a dispatched task
 * @param {string} taskText - The task description
 * @param {string} project - Target project name
 * @param {number} paneIndex - Which pane received the task
 * @param {string} chapter - Binh Phap chapter (e.g. "Ch.1 始計")
 */
function recordTask(taskText, project, paneIndex, chapter) {
    const registry = loadRegistry();
    registry.tasks.push({
        hash: hashTask(taskText),
        project,
        pane: paneIndex,
        chapter: chapter || 'unknown',
        preview: taskText.slice(0, 80),
        dispatchedAt: Date.now(),
    });
    saveRegistry(registry);
}

/**
 * Get current chapter index for round-robin
 * @returns {number} Current chapter index (0-12)
 */
function getChapterIndex() {
    return loadRegistry().chapterIndex || 0;
}

/**
 * Advance to next chapter in round-robin
 * @returns {number} New chapter index
 */
function advanceChapter() {
    const registry = loadRegistry();
    registry.chapterIndex = ((registry.chapterIndex || 0) + 1) % 13;
    saveRegistry(registry);
    return registry.chapterIndex;
}

/**
 * Get stats for monitoring
 */
function getStats() {
    const registry = loadRegistry();
    const now = Date.now();
    const active = registry.tasks.filter(t => (now - t.dispatchedAt) < TTL_MS);
    const byChapter = {};
    active.forEach(t => {
        byChapter[t.chapter] = (byChapter[t.chapter] || 0) + 1;
    });
    return {
        totalDispatched: active.length,
        chapterIndex: registry.chapterIndex || 0,
        byChapter,
    };
}

module.exports = {
    isDuplicate,
    recordTask,
    hashTask,
    getChapterIndex,
    advanceChapter,
    getStats,
};
