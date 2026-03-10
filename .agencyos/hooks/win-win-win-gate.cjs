/**
 * WIN-WIN-WIN Validation Gate Hook
 * 
 * Ensures all parties benefit before proceeding with deals.
 * 
 * 🏯 "Mọi quyết định phải tạo ra 3 WIN cùng lúc"
 */

const fs = require('fs');
const path = require('path');

// WIN-WIN-WIN validation
function validateWinWinWin(context) {
    const { anhWin, agencyWin, startupWin } = context;

    const result = {
        isAligned: true,
        warnings: [],
        errors: []
    };

    // Check each party
    if (!anhWin || anhWin.trim() === '') {
        result.isAligned = false;
        result.errors.push('👑 ANH (Owner) không WIN - Dừng lại!');
    }

    if (!agencyWin || agencyWin.trim() === '') {
        result.isAligned = false;
        result.errors.push('🏢 AGENCY không WIN - Dừng lại!');
    }

    if (!startupWin || startupWin.trim() === '') {
        result.isAligned = false;
        result.errors.push('🚀 STARTUP không WIN - Dừng lại!');
    }

    return result;
}

// Red flag detection for term sheets
function detectRedFlags(termSheet) {
    const redFlags = [];

    if (termSheet.liquidationPreference >= 2) {
        redFlags.push({
            severity: 'CRITICAL',
            message: '2x+ liquidation preference - WALK AWAY',
            action: 'REJECT'
        });
    }

    if (termSheet.antiDilution === 'full_ratchet') {
        redFlags.push({
            severity: 'CRITICAL',
            message: 'Full ratchet anti-dilution - WALK AWAY',
            action: 'REJECT'
        });
    }

    if (termSheet.boardSeats && termSheet.boardSeats.investor > termSheet.boardSeats.founder) {
        redFlags.push({
            severity: 'WARNING',
            message: 'Investor board majority - NEGOTIATE',
            action: 'NEGOTIATE'
        });
    }

    return redFlags;
}

// Format output
function formatWinCheck(result) {
    const banner = `
┌───────────────────────────────────────────────────┐
│  WIN-WIN-WIN Alignment Check                      │
├───────────────────────────────────────────────────┤
│  Status: ${result.isAligned ? '✅ ALIGNED' : '❌ NOT ALIGNED'}                             │
└───────────────────────────────────────────────────┘`;

    return banner;
}

// Export for hook system
module.exports = {
    validateWinWinWin,
    detectRedFlags,
    formatWinCheck
};

// CLI execution
if (require.main === module) {
    console.log('🏯 WIN-WIN-WIN Gate Active');
    console.log('   All deals must pass WIN-WIN-WIN validation');
}
