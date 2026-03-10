/**
 * Deal Approval Hook
 * 
 * Validates tier pricing and equity before deal approval.
 * 
 * 💰 Aligned with Binh Pháp tier structure
 */

const TIER_PRICING = {
    warrior: {
        retainer: 2000,
        equityRange: [5, 8],
        successFee: 2.0,
        description: 'Pre-Seed/Seed Stage'
    },
    general: {
        retainer: 5000,
        equityRange: [3, 5],
        successFee: 1.5,
        description: 'Series A Support'
    },
    tuong_quan: {
        retainer: 0,
        equityRange: [15, 30],
        successFee: 0,
        description: 'Venture Studio Co-Founder'
    }
};

function validateDeal(deal) {
    const tier = TIER_PRICING[deal.tier];
    if (!tier) {
        return { valid: false, error: `Unknown tier: ${deal.tier}` };
    }

    const warnings = [];

    // Check retainer
    if (deal.retainer < tier.retainer * 0.8) {
        warnings.push(`Retainer below tier minimum (${tier.retainer})`);
    }

    // Check equity
    const [minEquity, maxEquity] = tier.equityRange;
    if (deal.equity < minEquity || deal.equity > maxEquity) {
        warnings.push(`Equity ${deal.equity}% outside tier range (${minEquity}-${maxEquity}%)`);
    }

    // Check success fee
    if (deal.successFee < tier.successFee * 0.5) {
        warnings.push(`Success fee below tier standard (${tier.successFee}%)`);
    }

    return {
        valid: warnings.length === 0,
        tier: deal.tier,
        tierInfo: tier,
        warnings,
        recommendation: warnings.length === 0 ? 'APPROVE' : 'REVIEW'
    };
}

function calculateDealValue(deal) {
    const annualRetainer = deal.retainer * 12;
    const equityValue = deal.valuation * (deal.equity / 100);
    const potentialFee = deal.fundingTarget * (deal.successFee / 100);

    return {
        annualRetainer,
        equityValue,
        potentialFee,
        totalValue: annualRetainer + equityValue + potentialFee
    };
}

module.exports = {
    TIER_PRICING,
    validateDeal,
    calculateDealValue
};

if (require.main === module) {
    console.log('💰 Deal Approval Hook Active');
    console.log('   Tier pricing validated for all deals');
}
