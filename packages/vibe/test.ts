/**
 * 🌊 BLUE OCEAN - Test Suite
 */

import {
    colors, gradients, formatVND, calculateGrowthMetrics,
    AGENT_REGISTRY, TIER_CONFIG, validateWinWinWin,
    DEPLOY_COMMANDS, EVOLUTION_TARGETS, ReferralEngine,
    ARR_TARGET_2026, toUSD, PLANETS
} from './planets';

import {
    Treasury, JourneyTracker, PLANET_REVENUE, DISTRIBUTION,
    STATE_TRANSITIONS, treasury, tracker
} from './core';

// ============================================
// TESTS
// ============================================

const results: { name: string; passed: boolean }[] = [];

function test(name: string, fn: () => boolean) {
    try {
        const passed = fn();
        results.push({ name, passed });
        console.log(passed ? `✅ ${name}` : `❌ ${name}`);
    } catch (err) {
        results.push({ name, passed: false });
        console.log(`❌ ${name}: ${err}`);
    }
}

// PLANETS TESTS
test('Colors exist', () => !!colors.primary[500]);
test('Gradients exist', () => !!gradients.ocean);
test('formatVND works', () => formatVND(1_000_000) === '1 triệu');
test('Growth metrics calculate', () => calculateGrowthMetrics(100000).annualizedRunRate === 1_200_000);
test('Agent registry has 6 agents', () => AGENT_REGISTRY.length === 6);
test('Tier config has 3 tiers', () => Object.keys(TIER_CONFIG).length === 3);
test('WIN-WIN-WIN validates', () => validateWinWinWin('warrior').aligned === true);
test('Deploy commands exist', () => !!DEPLOY_COMMANDS.deploy);
test('Evolution has 4 stages', () => Object.keys(EVOLUTION_TARGETS).length === 4);
test('Referral engine works', () => {
    const ref = new ReferralEngine();
    const link = ref.generate('user1');
    return !!link.code;
});
test('ARR target is $1M', () => ARR_TARGET_2026 === 1_000_000);
test('Currency conversion works', () => toUSD(24500, 'VND') === 1);
test('8 planets registered', () => PLANETS.length === 8);

// CORE TESTS
test('Planet revenue config', () => PLANET_REVENUE.saturn === 0.40);
test('Distribution sums to 100%', () => {
    const sum = Object.values(DISTRIBUTION).reduce((s, c) => s + c.share, 0);
    return sum === 1.0;
});
test('Treasury collects', () => {
    const t = new Treasury();
    const collected = t.collect('saturn', 100);
    return collected === 40;
});
test('Journey tracker starts', () => {
    const jt = new JourneyTracker();
    const journey = jt.start('user1');
    return journey?.state === 'visitor';
});
test('Journey tracker transitions', () => {
    const jt = new JourneyTracker();
    jt.start('user1');
    jt.complete('user1', 'signup');
    const funnel = jt.getFunnel();
    return funnel.lead === 1;
});
test('State transitions defined', () => STATE_TRANSITIONS.visitor.next === 'lead');
test('Singleton instances exist', () => !!treasury && !!tracker);

// ============================================
// SUMMARY
// ============================================

const passed = results.filter(r => r.passed).length;
const total = results.length;

console.log('\n🌊 BLUE OCEAN TEST RESULTS');
console.log(`${passed}/${total} tests passed (${Math.round(passed / total * 100)}%)`);

export { results, passed, total };
