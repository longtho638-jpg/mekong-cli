/**
 * LightMem Retrieval Engine — Similarity-Based Memory Search
 *
 * Based on: arxiv.org/abs/2510.18866 (LightMem Paper)
 *
 * Features:
 * - Keyword-based similarity scoring
 * - Recency boosting
 * - Importance weighting
 * - Top-K retrieval
 * - Context formatting for LLM prompts
 */

const { workingMemory, longTermMemory, calculateEffectiveImportance } = require('./lightmem-memory');

// ============================================================================
// Similarity Scoring
// ============================================================================

/**
 * Calculate keyword overlap between query and memory content
 * @param {string} query - Search query
 * @param {string} content - Memory content
 * @returns {number} Similarity score (0.0 - 1.0)
 */
function keywordSimilarity(query, content) {
	const queryWords = new Set(
		query
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 2),
	);
	const contentWords = new Set(
		content
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 2),
	);

	if (queryWords.size === 0 || contentWords.size === 0) return 0;

	let overlap = 0;
	for (const word of queryWords) {
		if (contentWords.has(word)) {
			overlap++;
		}
	}

	return overlap / queryWords.size;
}

/**
 * Calculate recency boost (newer = higher)
 * @param {number} timestamp - Memory timestamp
 * @returns {number} Recency score (0.5 - 1.0)
 */
function recencyScore(timestamp) {
	const now = Date.now();
	const ageInHours = (now - timestamp) / (1000 * 60 * 60);

	// Exponential decay: 1.0 for fresh, 0.5 for old
	return 0.5 + 0.5 * Math.exp(-ageInHours / 24); // Half-life: 24 hours
}

/**
 * Calculate total retrieval score
 * @param {MemoryItem} item - Memory item
 * @param {string} query - Search query
 * @returns {number} Total score (0.0 - 1.0)
 */
function calculateRetrievalScore(item, query) {
	const keywordSim = keywordSimilarity(query, item.content);
	const recency = recencyScore(item.timestamp);
	const importance = item.importance;
	const decay = item.decay;

	// Weighted combination
	const score =
		keywordSim * 0.4 + // Keyword similarity: 40%
		recency * 0.2 + // Recency: 20%
		importance * 0.25 + // Base importance: 25%
		decay * 0.15; // Decay factor: 15%

	return Math.min(score, 1.0);
}

// ============================================================================
// Retrieval Functions
// ============================================================================

/**
 * Retrieve top-K memories from working + long-term memory
 * @param {string} query - Search query
 * @param {number} k - Number of results (default: 5)
 * @param {Object} options - Additional options
 * @returns {Array<{item: MemoryItem, score: number}>}
 */
function retrieveTopK(query, k = 5, options = {}) {
	const { project = null, type = null, minImportance = 0, includeWorking = true, includeLongTerm = true } = options;

	const results = [];

	// Search working memory
	if (includeWorking) {
		const working = workingMemory.getAll({ type, project, minImportance });
		for (const item of working) {
			const score = calculateRetrievalScore(item, query);
			if (score > 0.1) {
				// Threshold
				results.push({ item, score, source: 'working' });
			}
		}
	}

	// Search long-term memory
	if (includeLongTerm) {
		const longterm = longTermMemory.getAll({ type, project, minImportance });
		for (const item of longterm) {
			const score = calculateRetrievalScore(item, query);
			if (score > 0.1) {
				results.push({ item, score, source: 'longterm' });
			}
		}
	}

	// Sort by score (descending) and take top-K
	results.sort((a, b) => b.score - a.score);
	return results.slice(0, k);
}

/**
 * Search memories by project
 * @param {string} project - Project name
 * @param {number} k - Max results
 * @returns {Array<{item: MemoryItem, score: number}>}
 */
function searchByProject(project, k = 10) {
	return retrieveTopK(project, k, { project });
}

/**
 * Search memories by type
 * @param {string} type - Memory type
 * @param {number} k - Max results
 * @returns {Array<{item: MemoryItem, score: number}>}
 */
function searchByType(type, k = 10) {
	return retrieveTopK(type, k, { type });
}

/**
 * Search memories by time range
 * @param {number} since - Start timestamp (ms)
 * @param {number} until - End timestamp (ms)
 * @returns {MemoryItem[]}
 */
function searchByTimeRange(since, until = Date.now()) {
	return longTermMemory.getAll({ since });
}

/**
 * Find similar missions (same project + similar task)
 * @param {string} project - Project name
 * @param {string} taskId - Task ID pattern
 * @param {number} k - Max results
 * @returns {Array<{item: MemoryItem, score: number}>}
 */
function findSimilarMissions(project, taskId, k = 5) {
	// Extract task type from taskId (e.g., "fix_test", "add_feature")
	const taskType = taskId.split('_').slice(0, 2).join('_');
	const query = `${project} ${taskType}`;

	return retrieveTopK(query, k, { project, type: 'mission_outcome' });
}

// ============================================================================
// Context Formatting for LLM Prompts
// ============================================================================

/**
 * Format retrieved memories as context for LLM prompt
 * @param {Array<{item: MemoryItem, score: number}>} results - Retrieved memories
 * @param {Object} options - Formatting options
 * @returns {string} Formatted context
 */
function formatRetrievalContext(results, options = {}) {
	const { maxItems = 5, includeScore = false, includeMetadata = true, maxLength = 2000 } = options;

	if (results.length === 0) {
		return '// No relevant memories found. Starting fresh.';
	}

	const lines = ['// Relevant memories from past missions:'];
	let currentLength = lines[0].length;

	for (let i = 0; i < Math.min(results.length, maxItems); i++) {
		const { item, score, source } = results[i];

		// Truncate content if needed
		let content = item.content;
		if (content.length > 200) {
			content = content.slice(0, 200) + '...';
		}

		// Build memory line
		let line = `// [${i + 1}] `;
		if (includeScore) {
			line += `Score: ${(score * 100).toFixed(0)}% | `;
		}
		line += `${item.project}/${item.type} (${source}): ${content}`;

		if (includeMetadata) {
			const date = new Date(item.timestamp).toISOString().split('T')[0];
			line += ` [${date}, importance: ${item.importance.toFixed(2)}]`;
		}

		// Check length limit
		if (currentLength + line.length > maxLength) {
			lines.push('// [truncated due to length]');
			break;
		}

		lines.push(line);
		currentLength += line.length;
	}

	return lines.join('\n');
}

/**
 * Build mission context with memory injection
 * @param {string} project - Project name
 * @param {string} missionId - Mission ID
 * @param {string} taskDescription - Task description
 * @returns {string} Full prompt with context
 */
function buildMissionContext(project, missionId, taskDescription) {
	// Find similar past missions
	const similar = findSimilarMissions(project, missionId, 3);

	// Build context header
	let context = `=== PAST EXPERIENCE CONTEXT ===\n\n`;

	if (similar.length > 0) {
		context += `Based on ${similar.length} similar past mission(s):\n\n`;
		context += formatRetrievalContext(similar, {
			maxItems: 3,
			includeScore: true,
			includeMetadata: true,
			maxLength: 1500,
		});
	} else {
		context += `No similar past missions found. This is a new type of task.\n`;
	}

	context += `\n\n=== CURRENT MISSION ===\n\n${taskDescription}`;

	return context;
}

// ============================================================================
// Stats & Debugging
// ============================================================================

/**
 * Get retrieval statistics
 * @returns {Object}
 */
function getRetrievalStats() {
	return {
		workingMemorySize: workingMemory.size(),
		longTermMemorySize: longTermMemory.size(),
		workingStats: workingMemory.getAll().map((item) => ({
			type: item.type,
			importance: item.importance,
			decay: item.decay,
		})),
		longTermStats: longTermMemory.getStats(),
	};
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
	// Core functions
	retrieveTopK,
	searchByProject,
	searchByType,
	searchByTimeRange,
	findSimilarMissions,

	// Context formatting
	formatRetrievalContext,
	buildMissionContext,

	// Utilities
	keywordSimilarity,
	recencyScore,
	calculateRetrievalScore,

	// Stats
	getRetrievalStats,
};
