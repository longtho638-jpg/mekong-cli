/**
 * 🌊 BLUE OCEAN - Core Systems
 * Treasury + Workflow Unified
 */

// ============================================
// TREASURY
// ============================================

export type Planet = 'venus' | 'uranus' | 'saturn' | 'jupiter' | 'mars' | 'earth' | 'mercury' | 'neptune';

export const PLANET_REVENUE: Record<Planet, number> = {
    venus: 0.30, uranus: 0.20, saturn: 0.40, jupiter: 0.25,
    mars: 0.20, earth: 0.40, mercury: 0.10, neptune: 0.02,
};

export const DISTRIBUTION = {
    rnd: { share: 0.40, planets: ['saturn', 'earth'] },
    growth: { share: 0.25, planets: ['mercury', 'jupiter'] },
    infra: { share: 0.20, planets: ['mars', 'uranus'] },
    design: { share: 0.10, planets: ['venus'] },
    reserve: { share: 0.05, planets: ['neptune'] },
};

export class Treasury {
    private balance = 0;

    collect(planet: Planet, amount: number): number {
        const share = amount * PLANET_REVENUE[planet];
        this.balance += share;
        return share;
    }

    distribute(total: number): Record<string, number> {
        const result: Record<string, number> = {};
        for (const [key, config] of Object.entries(DISTRIBUTION)) {
            result[key] = total * config.share;
            this.balance -= result[key];
        }
        return result;
    }

    getBalance(): number { return this.balance; }
}

// ============================================
// WORKFLOW
// ============================================

export type UserState = 'visitor' | 'lead' | 'user' | 'customer' | 'advocate';
export type JourneyStage = 'discover' | 'explore' | 'signup' | 'activate' | 'measure' | 'build' | 'deploy' | 'monetize' | 'refer';

export const STATE_TRANSITIONS: Record<UserState, { next: UserState; stage: JourneyStage }> = {
    visitor: { next: 'lead', stage: 'signup' },
    lead: { next: 'user', stage: 'activate' },
    user: { next: 'customer', stage: 'monetize' },
    customer: { next: 'advocate', stage: 'refer' },
    advocate: { next: 'advocate', stage: 'refer' },
};

export class JourneyTracker {
    private journeys = new Map<string, { state: UserState; stages: JourneyStage[] }>();

    start(userId: string) {
        this.journeys.set(userId, { state: 'visitor', stages: [] });
        return this.journeys.get(userId);
    }

    complete(userId: string, stage: JourneyStage) {
        const journey = this.journeys.get(userId);
        if (!journey) return;

        journey.stages.push(stage);
        const transition = STATE_TRANSITIONS[journey.state];
        if (stage === transition.stage) journey.state = transition.next;

        return journey;
    }

    getFunnel(): Record<UserState, number> {
        const funnel: Record<UserState, number> = { visitor: 0, lead: 0, user: 0, customer: 0, advocate: 0 };
        for (const j of this.journeys.values()) funnel[j.state]++;
        return funnel;
    }
}

// ============================================
// EXPORTS
// ============================================

export const treasury = new Treasury();
export const tracker = new JourneyTracker();
