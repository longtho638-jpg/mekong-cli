/**
 * 📊 VIBE Analytics Facade (Proxy)
 */
export * from "./src/types";
export * from "./src/session";
export * from "./src/telemetry";
export * from "./src/growth";
export * from "./src/web-vitals";

// Re-export named instance for convenience
export { vibeTelemetry } from "./src/telemetry";
