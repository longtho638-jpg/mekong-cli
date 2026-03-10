/**
 * LightMem Forgetting Mechanism — Selective Memory Consolidation & Cleanup
 *
 * Based on: arxiv.org/abs/2510.18866 (LightMem Paper)
 * Implements forgetting strategies for memory management:
 * - Time-based forgetting (stale memories)
 * - Importance-based forgetting (low-value memories)
 * - Context-aware forgetting (irrelevant to current tasks)
 */

const { workingMemory, longTermMemory, calculateEffectiveImportance, PRUNING_THRESHOLD } = require('./lightmem-memory');

// ============================================================================
// Forgetting Strategies
// ============================================================================

/**
 * Forget low-importance memories based on threshold
 * @param {number} threshold - Minimum importance threshold (default: PRUNING_THRESHOLD)
 * @returns {number} Number of memories forgotten
 */
function forgetLowImportance(threshold = PRUNING_THRESHOLD) {
	let forgottenCount = 0;

	// Forget from working memory
	const workingItems = [...workingMemory.items.entries()];
	for (const [id, item] of workingItems) {
		if (calculateEffectiveImportance(item) < threshold) {
			workingMemory.delete(id);
			forgottenCount++;
		}
	}

	// Forget from long-term memory
	const longTermItems = [...longTermMemory.items];
	for (const item of longTermItems) {
		if (calculateEffectiveImportance(item) < threshold) {
			longTermMemory.delete(item.id);
			forgottenCount++;
		}
	}

	console.log(`[LightMem] Forgot ${forgottenCount} low-importance memories (< ${threshold})`);
	return forgottenCount;
}

/**
 * Forget memories older than specified age
 * @param {number} maxAgeInDays - Maximum age in days
 * @returns {number} Number of memories forgotten
 */
function forgetByAge(maxAgeInDays) {
	const now = Date.now();
	const maxAgeMs = maxAgeInDays * 24 * 60 * 60 * 1000;

	let forgottenCount = 0;

	// Forget from working memory
	const workingItems = [...workingMemory.items.entries()];
	for (const [id, item] of workingItems) {
		if (now - item.timestamp > maxAgeMs) {
			workingMemory.delete(id);
			forgottenCount++;
		}
	}

	// Forget from long-term memory
	const longTermItems = [...longTermMemory.items];
	for (const item of longTermItems) {
		if (now - item.timestamp > maxAgeMs) {
			longTermMemory.delete(item.id);
			forgottenCount++;
		}
	}

	console.log(`[LightMem] Forgot ${forgottenCount} memories older than ${maxAgeInDays} days`);
	return forgottenCount;
}

/**
 * Forget memories not related to specified context
 * @param {string} context - Context keyword (e.g., project name, task type)
 * @param {number} unrelatedThreshold - Threshold for unrelated memories (0.0 - 1.0)
 * @returns {number} Number of memories forgotten
 */
function forgetByContext(context, unrelatedThreshold = 0.3) {
	let forgottenCount = 0;

	// Calculate keyword similarity to context
	const contextWords = new Set(
		context
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 2),
	);

	// Forget from working memory
	const workingItems = [...workingMemory.items.entries()];
	for (const [id, item] of workingItems) {
		const contentWords = new Set(
			item.content
				.toLowerCase()
				.split(/\s+/)
				.filter((w) => w.length > 2),
		);

		// Calculate overlap with context
		let overlap = 0;
		for (const word of contextWords) {
			if (contentWords.has(word)) {
				overlap++;
			}
		}

		const similarity = overlap / Math.max(contextWords.size, 1);
		if (similarity < unrelatedThreshold) {
			workingMemory.delete(id);
			forgottenCount++;
		}
	}

	// Forget from long-term memory
	const longTermItems = [...longTermMemory.items];
	for (const item of longTermItems) {
		const contentWords = new Set(
			item.content
				.toLowerCase()
				.split(/\s+/)
				.filter((w) => w.length > 2),
		);

		// Calculate overlap with context
		let overlap = 0;
		for (const word of contextWords) {
			if (contentWords.has(word)) {
				overlap++;
			}
		}

		const similarity = overlap / Math.max(contextWords.size, 1);
		if (similarity < unrelatedThreshold) {
			longTermMemory.delete(item.id);
			forgottenCount++;
		}
	}

	console.log(`[LightMem] Forgot ${forgottenCount} memories unrelated to context: "${context}"`);
	return forgottenCount;
}

/**
 * Consolidate memories by combining similar ones
 * @param {number} similarityThreshold - Minimum similarity to merge (0.0 - 1.0)
 * @returns {number} Number of consolidations performed
 */
function consolidateSimilar(similarityThreshold = 0.7) {
	let consolidationCount = 0;

	// Consolidate within working memory
	const workingItems = [...workingMemory.items.values()];
	const processed = new Set();

	for (let i = 0; i < workingItems.length; i++) {
		if (processed.has(workingItems[i].id)) continue;

		for (let j = i + 1; j < workingItems.length; j++) {
			if (processed.has(workingItems[j].id)) continue;

			// Calculate similarity between items
			const similarity = calculateContentSimilarity(workingItems[i].content, workingItems[j].content);

			if (similarity >= similarityThreshold) {
				// Merge the memories, keeping the one with higher importance
				const primary = workingItems[i].importance >= workingItems[j].importance ? workingItems[i] : workingItems[j];
				const secondary = workingItems[i].importance >= workingItems[j].importance ? workingItems[j] : workingItems[i];

				// Combine content and update importance
				primary.content += ` [MERGED: ${secondary.content}]`;
				primary.importance = Math.max(primary.importance, secondary.importance);

				// Remove the secondary memory
				workingMemory.delete(secondary.id);
				processed.add(secondary.id);
				consolidationCount++;
			}
		}
		processed.add(workingItems[i].id);
	}

	console.log(`[LightMem] Consolidated ${consolidationCount} similar memories (similarity >= ${similarityThreshold})`);
	return consolidationCount;
}

/**
 * Calculate content similarity (simple word overlap)
 * @param {string} content1 - First content
 * @param {string} content2 - Second content
 * @returns {number} Similarity score (0.0 - 1.0)
 */
function calculateContentSimilarity(content1, content2) {
	const words1 = new Set(
		content1
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 2),
	);
	const words2 = new Set(
		content2
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 2),
	);

	if (words1.size === 0 || words2.size === 0) return 0;

	let intersection = 0;
	for (const word of words1) {
		if (words2.has(word)) {
			intersection++;
		}
	}

	// Jaccard similarity: intersection / union
	const union = words1.size + words2.size - intersection;
	return union > 0 ? intersection / union : 0;
}

/**
 * Perform garbage collection on memory systems
 * Applies multiple forgetting strategies based on configuration
 * @param {Object} options - Forgetting configuration
 * @returns {Object} Forgetting statistics
 */
function garbageCollect(options = {}) {
	const {
		maxAgeInDays = 30, // Default: forget memories older than 30 days
		importanceThreshold = PRUNING_THRESHOLD, // Default: use system threshold
		enableConsolidation = true, // Whether to consolidate similar memories
		maxWorkingMemorySize = 50, // Start forgetting if working memory exceeds this
	} = options;

	const stats = {
		lowImportance: 0,
		byAge: 0,
		consolidations: 0,
		totalForgotten: 0,
	};

	// Apply forgetting strategies based on current state

	// 1. If working memory is too large, forget low-importance items
	if (workingMemory.size() > maxWorkingMemorySize) {
		stats.lowImportance = forgetLowImportance(importanceThreshold);
	}

	// 2. Forget old memories
	stats.byAge = forgetByAge(maxAgeInDays);

	// 3. Consolidate similar memories if enabled
	if (enableConsolidation) {
		stats.consolidations = consolidateSimilar();
	}

	stats.totalForgotten = stats.lowImportance + stats.byAge;

	console.log(`[LightMem] Garbage collection completed:`, stats);
	return stats;
}

/**
 * Get forgetting statistics
 * @returns {Object} Forgetting statistics
 */
function getForgettingStats() {
	return {
		workingMemorySize: workingMemory.size(),
		longTermMemorySize: longTermMemory.size(),
		pruningThreshold: PRUNING_THRESHOLD,
	};
}

// ============================================================================
// Periodic Cleanup Scheduler
// ============================================================================

/**
 * Schedule periodic forgetting tasks
 * @param {number} intervalMinutes - Interval in minutes
 */
function schedulePeriodicCleanup(intervalMinutes = 60) {
	console.log(`[LightMem] Scheduling periodic cleanup every ${intervalMinutes} minutes`);

	setInterval(
		() => {
			console.log('[LightMem] Running scheduled cleanup...');
			try {
				garbageCollect({
					maxAgeInDays: 30,
					importanceThreshold: PRUNING_THRESHOLD,
					enableConsolidation: true,
				});
			} catch (error) {
				console.error('[LightMem] Cleanup error:', error);
			}
		},
		intervalMinutes * 60 * 1000,
	);
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
	// Core forgetting functions
	forgetLowImportance,
	forgetByAge,
	forgetByContext,
	consolidateSimilar,
	garbageCollect,

	// Utilities
	calculateContentSimilarity,

	// Stats and scheduling
	getForgettingStats,
	schedulePeriodicCleanup,
};
