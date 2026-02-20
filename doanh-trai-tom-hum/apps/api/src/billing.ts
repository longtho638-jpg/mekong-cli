import { Hono } from "hono";
import { PrismaClient } from "@lobster/db";

// ============================================
// 🦞 ROIaaS BILLING MODULE — Outcome-Based Pricing
// ============================================

const billing = new Hono();

// Package pricing: cost-per-action by type
const PACKAGE_PRICING: Record<string, {
    name: string;
    basePrice: number;
    includedActions: number;
    overageCost: number;
    actionMultipliers: Record<string, number>;
}> = {
    SCAVENGER: {
        name: "Scavenger",
        basePrice: 0,
        includedActions: 50,
        overageCost: 0.50,
        actionMultipliers: {
            TICKET_RESOLVED: 1.0,
            DATA_ANALYZED: 0.5,
            ALERT_HANDLED: 0.8,
        },
    },
    AUTOMATOR: {
        name: "Automator",
        basePrice: 49,
        includedActions: 500,
        overageCost: 0.25,
        actionMultipliers: {
            TICKET_RESOLVED: 1.0,
            ORDER_PROCESSED: 1.2,
            WORKFLOW_COMPLETED: 1.5,
            DATA_ANALYZED: 0.5,
            ALERT_HANDLED: 0.8,
        },
    },
    RAINMAKER: {
        name: "Rainmaker",
        basePrice: 199,
        includedActions: 2000,
        overageCost: 0.15,
        actionMultipliers: {
            TICKET_RESOLVED: 1.0,
            ORDER_PROCESSED: 1.2,
            LEAD_GENERATED: 2.0,
            CONTENT_CREATED: 1.8,
            WORKFLOW_COMPLETED: 1.5,
            DATA_ANALYZED: 0.5,
            ALERT_HANDLED: 0.8,
        },
    },
    SHIELD: {
        name: "Shield",
        basePrice: 499,
        includedActions: 5000,
        overageCost: 0.10,
        actionMultipliers: {
            TICKET_RESOLVED: 1.0,
            ORDER_PROCESSED: 1.2,
            LEAD_GENERATED: 2.0,
            CONTENT_CREATED: 1.8,
            THREAT_BLOCKED: 2.5,
            WORKFLOW_COMPLETED: 1.5,
            DATA_ANALYZED: 0.5,
            ALERT_HANDLED: 0.8,
        },
    },
};

export function createBillingRoutes(prisma: PrismaClient) {
    // GET /billing/packages — List all packages with pricing
    billing.get("/packages", (c) => {
        const packages = Object.entries(PACKAGE_PRICING).map(([id, pkg]) => ({
            id,
            ...pkg,
        }));
        return c.json({ success: true, data: packages });
    });

    // GET /billing/usage/:userId — Current usage for a user
    billing.get("/usage/:userId", async (c) => {
        try {
            const userId = c.req.param("userId");

            const activeCycle = await prisma.billingCycle.findFirst({
                where: { userId, status: "OPEN" },
                orderBy: { periodStart: "desc" },
            });

            if (!activeCycle) {
                return c.json({
                    success: true,
                    data: { cycle: null, actions: [], summary: null },
                });
            }

            const actions = await prisma.agentAction.groupBy({
                by: ["actionType"],
                where: { billingCycleId: activeCycle.id },
                _count: { id: true },
                _sum: { cost: true },
            });

            const pkg = PACKAGE_PRICING[activeCycle.package] || PACKAGE_PRICING.SCAVENGER;
            const totalActions = actions.reduce((sum: number, a: typeof actions[number]) => sum + a._count.id, 0);

            return c.json({
                success: true,
                data: {
                    cycle: activeCycle,
                    breakdown: actions.map((a: typeof actions[number]) => ({
                        actionType: a.actionType,
                        count: a._count.id,
                        cost: a._sum.cost || 0,
                    })),
                    summary: {
                        totalActions,
                        includedActions: pkg.includedActions,
                        overageActions: Math.max(0, totalActions - pkg.includedActions),
                        estimatedCost: activeCycle.totalCost,
                    },
                },
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            return c.json(
                { success: false, error: { message: msg, code: "INTERNAL_ERROR" } },
                500
            );
        }
    });

    // POST /billing/calculate — Calculate cost for given actions
    billing.post("/calculate", async (c) => {
        try {
            const body = await c.req.json();
            const { packageId, actions } = body as {
                packageId: string;
                actions: { type: string; count: number }[];
            };

            if (!packageId || !PACKAGE_PRICING[packageId]) {
                return c.json(
                    { success: false, error: { message: "Invalid package", code: "VALIDATION_ERROR" } },
                    400
                );
            }
            if (!actions || !Array.isArray(actions) || actions.length === 0) {
                return c.json(
                    { success: false, error: { message: "Actions array required", code: "VALIDATION_ERROR" } },
                    400
                );
            }

            const pkg = PACKAGE_PRICING[packageId];
            let totalActions = 0;
            const breakdown = actions.map((a) => {
                const multiplier = pkg.actionMultipliers[a.type] ?? 1.0;
                const weighted = Math.round(a.count * multiplier);
                totalActions += weighted;
                return {
                    type: a.type,
                    rawCount: a.count,
                    multiplier,
                    weightedCount: weighted,
                };
            });

            const overageActions = Math.max(0, totalActions - pkg.includedActions);
            const overageCost = overageActions * pkg.overageCost;
            const totalCost = pkg.basePrice + overageCost;

            return c.json({
                success: true,
                data: {
                    package: packageId,
                    basePrice: pkg.basePrice,
                    includedActions: pkg.includedActions,
                    totalWeightedActions: totalActions,
                    overageActions,
                    overageCost: Math.round(overageCost * 100) / 100,
                    totalCost: Math.round(totalCost * 100) / 100,
                    breakdown,
                },
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            return c.json(
                { success: false, error: { message: msg, code: "INTERNAL_ERROR" } },
                500
            );
        }
    });

    // POST /billing/record — Record an agent action
    billing.post("/record", async (c) => {
        try {
            const body = await c.req.json();
            const { agentId, agentName, actionType, outcome, metadata, userId } = body;

            if (!agentId || !actionType) {
                return c.json(
                    { success: false, error: { message: "agentId and actionType required", code: "VALIDATION_ERROR" } },
                    400
                );
            }

            // Find active billing cycle for user (if userId provided)
            let billingCycleId: string | undefined;
            if (userId) {
                const cycle = await prisma.billingCycle.findFirst({
                    where: { userId, status: "OPEN" },
                    orderBy: { periodStart: "desc" },
                });
                billingCycleId = cycle?.id;
            }

            const action = await prisma.agentAction.create({
                data: {
                    agentId,
                    agentName: agentName || agentId,
                    actionType,
                    outcome: outcome || "SUCCESS",
                    metadata: metadata || undefined,
                    userId: userId || undefined,
                    billingCycleId,
                },
            });

            // Update cycle counters
            if (billingCycleId) {
                await prisma.billingCycle.update({
                    where: { id: billingCycleId },
                    data: {
                        actionCount: { increment: 1 },
                    },
                });
            }

            return c.json({ success: true, data: action }, 201);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            return c.json(
                { success: false, error: { message: msg, code: "INTERNAL_ERROR" } },
                500
            );
        }
    });

    return billing;
}
