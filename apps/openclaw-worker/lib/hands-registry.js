/**
 * 🐉 BINH PHÁP v6.0: The Hands Registry — Backward-Compatible Wrapper
 *
 * Re-exports from the new 105-Hands system (lib/hands/index.js).
 * Legacy API `getHandForIntent(intent)` still works 100%.
 *
 * v5: 3 hardcoded hands (PLANNER, CODER, REVIEWER)
 * v6: 105 specialist roles + semantic matching, backward compat with v5
 */

'use strict';

const { HANDS, ALL_HANDS, getHandForIntent, getHandByName, matchRole } = require('./hands/index');

module.exports = {
	// Backward compat: original 3 HANDS still exist
	HANDS,
	// Full 105 roles
	ALL_HANDS,
	// Backward compat API: map intent → PLANNER/CODER/REVIEWER
	getHandForIntent,
	// New: lookup by exact name
	getHandByName,
	// New: semantic matching task text → specialist role
	matchRole,
};
