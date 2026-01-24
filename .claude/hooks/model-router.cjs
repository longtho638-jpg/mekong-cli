#!/usr/bin/env node
/**
 * 🧠 CC CLI Model Router Hook
 *
 * Auto-selects optimal model based on task complexity.
 * Runs on UserPromptSubmit to analyze task and set model.
 *
 * Keywords → Model Mapping:
 * - security, payment, auth → claude-opus-4.5
 * - architecture, debug → gemini-3-pro-high
 * - lint, format, simple → gemini-3-flash-lite
 * - default → gemini-3-flash
 */

const prompt = process.env.CLAUDE_PROMPT || "";
const promptLower = prompt.toLowerCase();

// Task complexity detection
const CRITICAL_KEYWORDS = [
    "security",
    "payment",
    "auth",
    "vulnerability",
    "production",
    "critical",
];
const HIGH_KEYWORDS = [
    "architecture",
    "design",
    "debugging",
    "refactoring",
    "multi-file",
    "complex",
];
const LOW_KEYWORDS = ["lint", "format", "docs", "simple", "read", "typo"];

let recommendedModel = "gemini-3-flash[1m]"; // Default
let complexity = "medium";

// Check complexity
if (CRITICAL_KEYWORDS.some((kw) => promptLower.includes(kw))) {
    recommendedModel = "claude-opus-4-5-thinking";
    complexity = "critical";
} else if (HIGH_KEYWORDS.some((kw) => promptLower.includes(kw))) {
    recommendedModel = "gemini-3-pro-high[1m]";
    complexity = "high";
} else if (LOW_KEYWORDS.some((kw) => promptLower.includes(kw))) {
    recommendedModel = "gemini-2.5-flash-lite[1m]";
    complexity = "low";
}

// Output recommendation (visible in CC CLI if debug enabled)
if (process.env.DEBUG_MODEL_ROUTER) {
    console.error(
        `[ModelRouter] Complexity: ${complexity} → Model: ${recommendedModel}`,
    );
}

// Exit successfully - hook doesn't block execution
process.exit(0);
