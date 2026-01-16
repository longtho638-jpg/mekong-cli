/**
 * 🚀 User Workflow - Solar System Journey
 * 
 * State machine for user progression through 8 planets
 */

// ============================================
// TYPES
// ============================================

export type UserState =
    | 'visitor'    // Just arrived
    | 'lead'       // Signed up
    | 'user'       // Activated
    | 'customer'   // Paying
    | 'advocate';  // Referring

export type Planet =
    | 'mercury' | 'venus' | 'jupiter' | 'saturn'
    | 'uranus' | 'earth' | 'mars' | 'neptune';

export type JourneyStage =
    | 'discover' | 'explore' | 'signup' | 'activate'
    | 'measure' | 'build' | 'deploy' | 'monetize' | 'refer';

export interface JourneyEvent {
    id: string;
    userId: string;
    stage: JourneyStage;
    planet: Planet;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

export interface UserJourney {
    userId: string;
    state: UserState;
    currentPlanet: Planet;
    completedStages: JourneyStage[];
    events: JourneyEvent[];
    startedAt: Date;
    lastActiveAt: Date;
}

// ============================================
// STAGE → PLANET MAPPING
// ============================================

export const STAGE_PLANET_MAP: Record<JourneyStage, Planet> = {
    discover: 'mercury',
    explore: 'venus',
    signup: 'jupiter',
    activate: 'saturn',
    measure: 'uranus',
    build: 'earth',
    deploy: 'mars',
    monetize: 'neptune',
    refer: 'mercury',
};

// ============================================
// STATE TRANSITIONS
// ============================================

export const STATE_TRANSITIONS: Record<UserState, {
    next: UserState;
    requiredStage: JourneyStage;
}> = {
    visitor: { next: 'lead', requiredStage: 'signup' },
    lead: { next: 'user', requiredStage: 'activate' },
    user: { next: 'customer', requiredStage: 'monetize' },
    customer: { next: 'advocate', requiredStage: 'refer' },
    advocate: { next: 'advocate', requiredStage: 'refer' }, // Loop
};

// ============================================
// JOURNEY TRACKER
// ============================================

export class JourneyTracker {
    private journeys: Map<string, UserJourney> = new Map();

    // Start new journey
    start(userId: string): UserJourney {
        const journey: UserJourney = {
            userId,
            state: 'visitor',
            currentPlanet: 'mercury',
            completedStages: [],
            events: [],
            startedAt: new Date(),
            lastActiveAt: new Date(),
        };
        this.journeys.set(userId, journey);
        return journey;
    }

    // Record stage completion
    complete(userId: string, stage: JourneyStage): UserJourney | undefined {
        const journey = this.journeys.get(userId);
        if (!journey) return undefined;

        const planet = STAGE_PLANET_MAP[stage];

        // Add event
        const event: JourneyEvent = {
            id: `event_${Date.now()}`,
            userId,
            stage,
            planet,
            timestamp: new Date(),
        };
        journey.events.push(event);

        // Update journey
        if (!journey.completedStages.includes(stage)) {
            journey.completedStages.push(stage);
        }
        journey.currentPlanet = planet;
        journey.lastActiveAt = new Date();

        // Check state transition
        const transition = STATE_TRANSITIONS[journey.state];
        if (stage === transition.requiredStage) {
            journey.state = transition.next;
        }

        return journey;
    }

    // Get journey
    get(userId: string): UserJourney | undefined {
        return this.journeys.get(userId);
    }

    // Get users by state
    getByState(state: UserState): UserJourney[] {
        return Array.from(this.journeys.values())
            .filter(j => j.state === state);
    }

    // Get funnel metrics
    getFunnel(): Record<UserState, number> {
        const funnel: Record<UserState, number> = {
            visitor: 0,
            lead: 0,
            user: 0,
            customer: 0,
            advocate: 0,
        };

        for (const journey of this.journeys.values()) {
            funnel[journey.state]++;
        }

        return funnel;
    }

    // Get conversion rate
    getConversionRate(from: UserState, to: UserState): number {
        const funnel = this.getFunnel();
        if (funnel[from] === 0) return 0;
        return (funnel[to] / funnel[from]) * 100;
    }
}

// ============================================
// EXPORTS
// ============================================

export const tracker = new JourneyTracker();

export default {
    JourneyTracker,
    STAGE_PLANET_MAP,
    STATE_TRANSITIONS,
    tracker,
};
