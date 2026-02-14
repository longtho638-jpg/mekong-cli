/**
 * AI Price Optimization Engine
 * Calculates optimal price based on multiple factors
 */

export interface PriceFactors {
    baseCost: number;
    category: 'rose' | 'lily' | 'orchid' | 'sunflower' | 'carnation' | 'other';
    season: 'spring' | 'summer' | 'fall' | 'winter';
    inventory: number;
    competitionCount: number;
    historicalSales?: number;
}

export interface PriceRecommendation {
    optimalPrice: number;
    minPrice: number;
    maxPrice: number;
    demandScore: number; // 0-100
    profitMargin: number; // percentage
    expectedRevenue: number;
    confidence: number; // 0-100
    reasoning: string[];
}

// Demand index by category (based on market research)
const DEMAND_INDEX = {
    rose: 1.5,      // High demand (Valentine's, weddings)
    lily: 1.2,      // Medium-high
    orchid: 2.0,    // Premium
    sunflower: 1.1, // Medium
    carnation: 0.9, // Lower
    other: 1.0      // Baseline
};

// Seasonal multipliers (Vietnam flower market)
const SEASONAL_FACTORS = {
    spring: {
        rose: 1.3,    // Tet & Valentine's
        lily: 1.2,
        orchid: 1.1,
        sunflower: 1.0,
        carnation: 1.1,
        other: 1.1
    },
    summer: {
        rose: 0.9,    // Lower demand
        lily: 1.0,
        orchid: 1.0,
        sunflower: 1.2,  // Popular in summer
        carnation: 0.9,
        other: 1.0
    },
    fall: {
        rose: 1.1,
        lily: 1.1,
        orchid: 1.2,   // Wedding season
        sunflower: 1.0,
        carnation: 1.0,
        other: 1.0
    },
    winter: {
        rose: 1.2,    // Holiday season
        lily: 1.1,
        orchid: 1.0,
        sunflower: 0.9,
        carnation: 1.1,
        other: 1.0
    }
};

/**
 * Get current season based on month
 */
export function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth(); // 0-11
    if (month >= 2 && month <= 4) return 'spring';   // Mar-May
    if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
    if (month >= 8 && month <= 10) return 'fall';    // Sep-Nov
    return 'winter';                                 // Dec-Feb
}

/**
 * Calculate optimal price using AI algorithm
 */
export function calculateOptimalPrice(factors: PriceFactors): PriceRecommendation {
    const {
        baseCost,
        category,
        season,
        inventory,
        competitionCount,
        historicalSales = 0
    } = factors;

    const reasoning: string[] = [];

    // 1. Base markup (50-80%)
    const baseMarkup = 1.65; // 65% default profit margin
    let optimalPrice = baseCost * baseMarkup;
    reasoning.push(`Base cost ${baseCost.toLocaleString()}đ + 65% markup`);

    // 2. Category demand adjustment
    const demandMultiplier = DEMAND_INDEX[category];
    optimalPrice *= demandMultiplier;
    reasoning.push(`${category} demand index: ${demandMultiplier}x`);

    // 3. Seasonal adjustment
    const seasonalFactor = SEASONAL_FACTORS[season][category];
    optimalPrice *= seasonalFactor;
    if (seasonalFactor > 1.0) {
        reasoning.push(`Peak season bonus: +${((seasonalFactor - 1) * 100).toFixed(0)}%`);
    } else if (seasonalFactor < 1.0) {
        reasoning.push(`Off-season discount: ${((1 - seasonalFactor) * 100).toFixed(0)}%`);
    }

    // 4. Inventory scarcity (low inventory = higher price)
    let scarcityMultiplier = 1.0;
    if (inventory < 10) {
        scarcityMultiplier = 1.25; // +25% if low stock
        reasoning.push(`Low inventory (${inventory} units): +25% scarcity premium`);
    } else if (inventory > 50) {
        scarcityMultiplier = 0.95; // -5% if overstocked
        reasoning.push(`High inventory (${inventory} units): -5% clearance discount`);
    }
    optimalPrice *= scarcityMultiplier;

    // 5. Competition adjustment
    let competitionFactor = 1.0;
    if (competitionCount > 5) {
        competitionFactor = 0.92; // -8% if high competition
        reasoning.push(`High competition (${competitionCount} sellers): -8% competitive pricing`);
    } else if (competitionCount < 2) {
        competitionFactor = 1.1; // +10% if low competition
        reasoning.push(`Low competition (${competitionCount} sellers): +10% market premium`);
    }
    optimalPrice *= competitionFactor;

    // 6. Historical sales boost
    if (historicalSales > 100) {
        optimalPrice *= 1.05; // +5% for proven sellers
        reasoning.push(`Proven seller (${historicalSales} sales): +5% trust premium`);
    }

    // Round to nearest 1000 VND (Vietnamese pricing convention)
    optimalPrice = Math.round(optimalPrice / 1000) * 1000;

    // Calculate price range
    const minPrice = Math.round(optimalPrice * 0.85 / 1000) * 1000;
    const maxPrice = Math.round(optimalPrice * 1.2 / 1000) * 1000;

    // Calculate profit margin
    const profitMargin = ((optimalPrice - baseCost) / optimalPrice) * 100;

    // Calculate demand score (0-100)
    const demandScore = Math.min(100, Math.round(
        (demandMultiplier * 30) +
        (seasonalFactor * 30) +
        (scarcityMultiplier * 20) +
        (competitionFactor * 20)
    ));

    // Estimate revenue (assuming demand correlates with price acceptance)
    const estimatedSales = Math.max(1, Math.round(demandScore / 10));
    const expectedRevenue = optimalPrice * estimatedSales;

    // Confidence score (higher with more data points)
    const confidence = Math.min(95, 70 + (historicalSales > 50 ? 25 : 0));

    return {
        optimalPrice,
        minPrice,
        maxPrice,
        demandScore,
        profitMargin: Math.round(profitMargin * 10) / 10,
        expectedRevenue,
        confidence,
        reasoning
    };
}

/**
 * Get pricing recommendations for multiple scenarios
 */
export function getPricingScenarios(factors: PriceFactors) {
    const base = calculateOptimalPrice(factors);

    // Conservative (min price)
    const conservative = calculateOptimalPrice({
        ...factors,
        competitionCount: Math.max(factors.competitionCount, 5)
    });

    // Aggressive (max price)
    const aggressive = calculateOptimalPrice({
        ...factors,
        competitionCount: Math.min(factors.competitionCount, 1),
        inventory: Math.min(factors.inventory, 5)
    });

    return {
        recommended: base,
        conservative: { ...conservative, optimalPrice: base.minPrice },
        aggressive: { ...aggressive, optimalPrice: base.maxPrice }
    };
}
