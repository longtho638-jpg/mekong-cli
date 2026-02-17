import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { PrismaClient } from "@lobster/db";
import { createDefaultRegistry } from "@lobster/agents";

const app = new Hono();
const prisma = new PrismaClient();
const agentRegistry = createDefaultRegistry();

// Middleware
app.use("*", cors());
app.use("*", logger());

// ============================================
// 🦞 LOBSTER EMPIRE — API GATEWAY
// ============================================

// Health Check
app.get("/health", (c) => {
    return c.json({
        status: "ALIVE",
        vibe: "HIGH",
        empire: "LOBSTER",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Root endpoint
app.get("/", (c) => {
    return c.json({
        name: "🦞 Lobster Empire API",
        version: "0.1.0",
        endpoints: {
            health: "GET /health",
            agents: "GET /api/agents (coming soon)",
            subscriptions: "GET /api/subscriptions (coming soon)",
        },
        message: "Đại Tướng Quân, hệ thống sẵn sàng nhận lệnh!",
    });
});

// API Routes (scaffolded)
const api = new Hono();

// GET /api/agents/status — List agent status
api.get("/agents/status", (c) => {
    const agents = agentRegistry.listAgents();
    return c.json({
        success: true,
        agents,
        total: agents.length,
    });
});

// POST /api/agents/run — Execute agent swarm
api.post("/agents/run", async (c) => {
    try {
        console.log("🦞 Running Agent Swarm...");
        const results = await agentRegistry.executeAll();
        return c.json({
            success: true,
            results,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("Agent execution failed:", error);
        return c.json({
            success: false,
            error: error.message || "Unknown error",
        }, 500);
    }
});

// GET /api/missions — List all missions
api.get("/missions", async (c) => {
    try {
        const missions = await prisma.mission.findMany({
            orderBy: { createdAt: "desc" },
        });
        return c.json({ success: true, data: missions });
    } catch (e: any) {
        return c.json(
            {
                success: false,
                error: { message: e.message, code: "INTERNAL_ERROR" },
            },
            500
        );
    }
});

// POST /api/missions — Create mission
api.post("/missions", async (c) => {
    try {
        const body = await c.req.json();
        const { title, status, priority } = body;

        // Validation
        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return c.json(
                {
                    success: false,
                    error: { message: "Title is required", code: "VALIDATION_ERROR" },
                },
                400
            );
        }

        const mission = await prisma.mission.create({
            data: {
                title: title.trim(),
                status: status || "TODO",
                priority: priority || "MEDIUM",
            },
        });
        return c.json({ success: true, data: mission }, 201);
    } catch (e: any) {
        return c.json(
            {
                success: false,
                error: { message: e.message, code: "INTERNAL_ERROR" },
            },
            500
        );
    }
});

// PATCH /api/missions/:id — Update mission
api.patch("/missions/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();
        const { title, status, priority } = body;

        // Build update data (only include defined fields)
        const data: any = {};
        if (title !== undefined) data.title = title.trim();
        if (status !== undefined) data.status = status;
        if (priority !== undefined) data.priority = priority;

        if (Object.keys(data).length === 0) {
            return c.json(
                {
                    success: false,
                    error: { message: "No fields to update", code: "VALIDATION_ERROR" },
                },
                400
            );
        }

        const mission = await prisma.mission.update({
            where: { id },
            data,
        });
        return c.json({ success: true, data: mission });
    } catch (e: any) {
        if (e.code === "P2025") {
            return c.json(
                {
                    success: false,
                    error: { message: "Mission not found", code: "NOT_FOUND" },
                },
                404
            );
        }
        return c.json(
            {
                success: false,
                error: { message: e.message, code: "INTERNAL_ERROR" },
            },
            500
        );
    }
});

// DELETE /api/missions/:id — Delete mission
api.delete("/missions/:id", async (c) => {
    try {
        const id = c.req.param("id");
        await prisma.mission.delete({
            where: { id },
        });
        return c.json({ success: true, data: { id } });
    } catch (e: any) {
        if (e.code === "P2025") {
            return c.json(
                {
                    success: false,
                    error: { message: "Mission not found", code: "NOT_FOUND" },
                },
                404
            );
        }
        return c.json(
            {
                success: false,
                error: { message: e.message, code: "INTERNAL_ERROR" },
            },
            500
        );
    }
});

api.get("/subscriptions/plans", (c) => {
    return c.json({
        plans: [
            {
                id: "genesis",
                name: "GENESIS",
                price: 0,
                agents: 2,
                features: ["Basic ROI tracking", "Community support"],
            },
            {
                id: "commander",
                name: "COMMANDER",
                price: 99,
                agents: 12,
                features: [
                    "Advanced AI agents",
                    "Priority support",
                    "Custom strategies",
                ],
            },
            {
                id: "emperor",
                name: "EMPEROR",
                price: 499,
                agents: 100,
                features: [
                    "Unlimited agents",
                    "White-glove support",
                    "Custom AI models",
                    "Dedicated infrastructure",
                ],
            },
        ],
    });
});

app.route("/api", api);

// ============================================
// 🚀 LAUNCH SERVER
// ============================================

const port = Number(process.env.PORT) || 8000;

console.log(`
╔══════════════════════════════════════════╗
║  🦞 LOBSTER EMPIRE — API GATEWAY        ║
║  Status: OPERATIONAL                     ║
║  Port: ${String(port).padEnd(5)}                            ║
║  Vibe: HIGH                              ║
╚══════════════════════════════════════════╝
`);

serve({
    fetch: app.fetch,
    port,
});
