'use strict';

/**
 * AGI Score Calculator — 5 dimensions × 20 pts = 100/100
 * Objective scoring based on real metrics, not hardcoded values.
 */

function scoreHeartbeatStability(heartbeatAgeMs) {
	if (heartbeatAgeMs === Infinity) return 0;
	if (heartbeatAgeMs < 30_000) return 20;
	if (heartbeatAgeMs < 60_000) return 15;
	if (heartbeatAgeMs < 90_000) return 5;
	return 0;
}

function scoreDLQRatio(dlqCount, totalProcessed) {
	if (totalProcessed === 0) return 10;
	const ratio = dlqCount / (totalProcessed + dlqCount);
	if (ratio === 0) return 20;
	if (ratio < 0.05) return 15;
	if (ratio < 0.15) return 8;
	return 0;
}

function scoreCircuitHealth(circuitState) {
	const scores = { CLOSED: 20, HALF_OPEN: 8, OPEN: 0 };
	return scores[circuitState] || 0;
}

function scoreMissionSuccessRate(successRate) {
	if (successRate >= 0.9) return 20;
	if (successRate >= 0.8) return 15;
	if (successRate >= 0.6) return 8;
	if (successRate >= 0.4) return 3;
	return 0;
}

function scoreTaskDiversity(recentTaskTypes) {
	const unique = new Set(recentTaskTypes || []).size;
	if (unique >= 5) return 20;
	if (unique >= 3) return 12;
	if (unique >= 2) return 6;
	return 0;
}

function calculateAGIScore({ heartbeatAgeMs, dlqCount, totalProcessed, circuitState, successRate, recentTaskTypes }) {
	const breakdown = {
		heartbeat_stability: scoreHeartbeatStability(heartbeatAgeMs),
		dlq_ratio: scoreDLQRatio(dlqCount, totalProcessed),
		circuit_health: scoreCircuitHealth(circuitState),
		mission_success_rate: scoreMissionSuccessRate(successRate),
		task_diversity: scoreTaskDiversity(recentTaskTypes || []),
	};
	const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
	return { total, breakdown, calculatedAt: new Date().toISOString() };
}

module.exports = { calculateAGIScore };
