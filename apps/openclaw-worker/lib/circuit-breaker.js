'use strict';
/**
 * Circuit Breaker — fault tolerance state machine (CLOSED/OPEN/HALF_OPEN).
 * Prevents cascading failures by tracking consecutive errors per named breaker.
 * Auto-resets after RESET_TIMEOUT_MS cooldown period.
 */
const { log } = require('./brain-logger');

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 60_000;

const breakers = new Map();

function getBreaker(name) {
	if (!breakers.has(name)) {
		breakers.set(name, { state: 'CLOSED', failureCount: 0, lastFailureTime: null, halfOpenCalls: 0 });
	}
	return breakers.get(name);
}

function isOpen(name) {
	const b = getBreaker(name);
	if (b.state === 'OPEN') {
		if (Date.now() - b.lastFailureTime > RESET_TIMEOUT_MS) {
			b.state = 'HALF_OPEN';
			b.halfOpenCalls = 0;
			log(`[CIRCUIT] ${name}: OPEN → HALF_OPEN`);
			return false;
		}
		return true;
	}
	if (b.state === 'HALF_OPEN' && b.halfOpenCalls >= 1) return true;
	return false;
}

function recordSuccess(name) {
	const b = getBreaker(name);
	if (b.state === 'HALF_OPEN') {
		log(`[CIRCUIT] ${name}: HALF_OPEN → CLOSED`);
		b.state = 'CLOSED';
	}
	b.failureCount = 0;
}

function recordFailure(name) {
	const b = getBreaker(name);
	b.failureCount++;
	b.lastFailureTime = Date.now();
	if (b.state === 'HALF_OPEN') {
		log(`[CIRCUIT] ${name}: HALF_OPEN → OPEN`);
		b.state = 'OPEN';
	} else if (b.state === 'CLOSED' && b.failureCount >= FAILURE_THRESHOLD) {
		log(`[CIRCUIT] ${name}: CLOSED → OPEN (${b.failureCount} failures)`);
		b.state = 'OPEN';
	}
}

function getState(name) {
	return getBreaker(name).state;
}

module.exports = { isOpen, recordSuccess, recordFailure, getState };
