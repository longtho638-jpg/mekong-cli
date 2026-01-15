#!/usr/bin/env node
/**
 * 🏯 WIN-WIN-WIN Validation Gate
 * 
 * Pre-execution hook that validates all revenue operations
 * create value for ALL three parties.
 * 
 * "Bất chiến nhi khuất nhân chi binh, thiện chi thiện giả dã"
 * - Win without fighting is the supreme excellence
 */

const fs = require('fs');
const path = require('path');

// WIN-WIN-WIN Validation Framework
const WIN_CRITERIA = {
    ANH: {
        name: '👑 ANH (Owner)',
        checks: [
            'increases_personal_wealth',
            'saves_time',
            'builds_legacy',
            'aligned_with_values'
        ],
        minScore: 2, // At least 2 criteria must be met
    },
    AGENCY: {
        name: '🏢 AGENCY',
        checks: [
            'generates_revenue',
            'builds_moat',
            'creates_case_study',
            'expands_network'
        ],
        minScore: 2,
    },
    CLIENT: {
        name: '🚀 CLIENT/STARTUP',
        checks: [
            'delivers_10x_value',
            'solves_real_problem',
            'saves_runway',
            'accelerates_growth'
        ],
        minScore: 2,
    }
};

// Red flags that ALWAYS block
const RED_FLAGS = [
    { pattern: /one.?sided/i, message: 'One-sided deal detected' },
    { pattern: /exploit/i, message: 'Exploitation language detected' },
    { pattern: /hidden.?fee/i, message: 'Hidden fees detected' },
    { pattern: /bait.?switch/i, message: 'Bait and switch detected' },
];

/**
 * Validate WIN-WIN-WIN alignment for a deal
 * @param {Object} deal - Deal object with parties and terms
 * @returns {Object} - Validation result
 */
function validateWinWinWin(deal) {
    const result = {
        valid: true,
        scores: {},
        warnings: [],
        redFlags: [],
        summary: ''
    };

    // Strip comments to prevent false positives
    const strippedText = dealText.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
    
    // Check for red flags in deal description (excluding comments)
    for (const flag of RED_FLAGS) {
        if (flag.pattern.test(strippedText)) {
            result.redFlags.push(flag.message);
            result.valid = false;
        }
    }

    // Score each party
    for (const [party, criteria] of Object.entries(WIN_CRITERIA)) {
        const partyData = deal[party.toLowerCase()] || {};
        let score = 0;
        const met = [];
        const unmet = [];

        for (const check of criteria.checks) {
            if (partyData[check]) {
                score++;
                met.push(check);
            } else {
                unmet.push(check);
            }
        }

        result.scores[party] = {
            name: criteria.name,
            score: score,
            minRequired: criteria.minScore,
            passed: score >= criteria.minScore,
            met: met,
            unmet: unmet
        };

        if (!result.scores[party].passed) {
            result.valid = false;
            result.warnings.push(`${criteria.name} does not have enough WIN criteria (${score}/${criteria.minScore})`);
        }
    }

    // Generate summary
    if (result.valid) {
        result.summary = '✅ WIN-WIN-WIN VALIDATED - All parties benefit';
    } else if (result.redFlags.length > 0) {
        result.summary = '❌ BLOCKED - Red flags detected: ' + result.redFlags.join(', ');
    } else {
        result.summary = '⚠️ NEEDS REVIEW - ' + result.warnings.join('; ');
    }

    return result;
}

/**
 * Format validation result for display
 * @param {Object} result - Validation result
 * @returns {string} - Formatted output
 */
function formatResult(result) {
    let output = '\n';
    output += '╔═══════════════════════════════════════════════════╗\n';
    output += '║  🏯 WIN-WIN-WIN VALIDATION GATE                   ║\n';
    output += '╠═══════════════════════════════════════════════════╣\n';

    for (const [party, data] of Object.entries(result.scores)) {
        const status = data.passed ? '✅' : '❌';
        output += `║  ${status} ${data.name}: ${data.score}/${data.minRequired} criteria met\n`;
    }

    output += '╠═══════════════════════════════════════════════════╣\n';
    output += `║  ${result.summary}\n`;
    output += '╚═══════════════════════════════════════════════════╝\n';

    if (result.redFlags.length > 0) {
        output += '\n🚨 RED FLAGS:\n';
        for (const flag of result.redFlags) {
            output += `   • ${flag}\n`;
        }
    }

    if (result.warnings.length > 0 && result.valid) {
        output += '\n⚠️ WARNINGS:\n';
        for (const warning of result.warnings) {
            output += `   • ${warning}\n`;
        }
    }

    return output;
}

/**
 * Quick validation check for deal text
 * @param {string} text - Deal description text
 * @returns {boolean} - Whether deal appears aligned
 */
function quickCheck(text) {
    // Check for required positive indicators
    const positiveIndicators = [
        /win.?win/i,
        /mutual.?benefit/i,
        /value.?creation/i,
        /aligned/i,
        /partnership/i
    ];

    let positiveCount = 0;
    for (const indicator of positiveIndicators) {
        if (indicator.test(text)) positiveCount++;
    }

    // Check for red flags
    for (const flag of RED_FLAGS) {
        if (flag.pattern.test(text)) return false;
    }

    return positiveCount >= 1;
}

// Export for use in other modules
module.exports = {
    validateWinWinWin,
    formatResult,
    quickCheck,
    WIN_CRITERIA,
    RED_FLAGS
};

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node win-win-win-gate.cjs <deal-json-file>');
        console.log('       node win-win-win-gate.cjs --quick "<deal text>"');
        process.exit(0);
    }

    if (args[0] === '--quick') {
        const text = args.slice(1).join(' ');
        const passed = quickCheck(text);
        console.log(passed ? '✅ Quick check passed' : '❌ Quick check failed');
        process.exit(passed ? 0 : 1);
    }

    // Load and validate deal from file
    try {
        const dealFile = args[0];
        const deal = JSON.parse(fs.readFileSync(dealFile, 'utf8'));
        const result = validateWinWinWin(deal);
        console.log(formatResult(result));
        process.exit(result.valid ? 0 : 1);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}
