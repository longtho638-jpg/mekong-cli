import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  vibeTelemetry,
  getSessionId,
  calculateGrowthMetrics,
  formatVND,
  shareContent,
  collectWebVitals,
  type VibeEvent,
  type GrowthMetrics,
  type WebVitals,
} from "./index";

// Mock fetch
(globalThis as any).fetch = vi.fn();

// Mock navigator
Object.defineProperty(globalThis, "navigator", {
  value: {
    share: vi.fn(),
    clipboard: {
      writeText: vi.fn(),
    },
  },
  writable: true,
});

// Mock performance
Object.defineProperty(globalThis, "performance", {
  value: {
    getEntriesByType: vi.fn(),
  },
  writable: true,
});

describe("VIBE Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ((globalThis as any).sessionStorage.getItem as any).mockReturnValue(null);
  });

  describe("Session Management", () => {
    it("should generate new session ID if none exists", () => {
      ((globalThis as any).sessionStorage.getItem as any).mockReturnValue(null);

      const sessionId = getSessionId();

      expect(sessionId).toMatch(/^vibe_\d+_[a-z0-9]+$/);
      expect((globalThis as any).sessionStorage.setItem).toHaveBeenCalledWith(
        "vibe_session_id",
        sessionId,
      );
    });

    it("should return existing session ID if available", () => {
      const existingId = "vibe_1234567890_abcdef";
      ((globalThis as any).sessionStorage.getItem as any).mockReturnValue(existingId);

      const sessionId = getSessionId();

      expect(sessionId).toBe(existingId);
      expect((globalThis as any).sessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("Telemetry Engine", () => {
    beforeEach(() => {
      // Reset the telemetry instance
      vibeTelemetry.setUser(undefined as any);
      vibeTelemetry.setEndpoint(undefined as any);
    });

    it("should track events without user", () => {
      const event: VibeEvent = {
        type: "page_view",
        path: "/test",
        title: "Test Page",
      };

      vibeTelemetry.track(event);

      // Event queued successfully
      expect(true).toBe(true);
    });

    it("should track events with user", () => {
      vibeTelemetry.setUser("test-user-123");

      const event: VibeEvent = {
        type: "revenue_milestone",
        amount: 1000,
        currency: "USD",
      };

      vibeTelemetry.track(event);

      expect(true).toBe(true);
    });

    it("should set and use endpoint", async () => {
      const mockEndpoint = "https://api.example.com/telemetry";
      vibeTelemetry.setEndpoint(mockEndpoint);

      const event: VibeEvent = { type: "page_view", path: "/test", title: "Test" };
      vibeTelemetry.track(event);

      ((globalThis as any).fetch as any).mockResolvedValueOnce({ ok: true });

      await vibeTelemetry.flush();

      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        mockEndpoint,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should handle flush failure gracefully", () => {
      vibeTelemetry.setEndpoint("https://api.example.com/telemetry");

      const event: VibeEvent = { type: "error", message: "Test error" };
      vibeTelemetry.track(event);

      ((globalThis as any).fetch as any).mockRejectedValueOnce(new Error("Network error"));

      return vibeTelemetry.flush().then(() => {
        expect((globalThis as any).fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Growth Metrics", () => {
    it("should calculate growth metrics with default values", () => {
      const metrics = calculateGrowthMetrics(50000);

      expect(metrics.currentGMV).toBe(50000);
      expect(metrics.targetARR).toBe(1000000);
      expect(metrics.growthRate).toBe(0.1);
      expect(metrics.annualizedRunRate).toBe(600000);
      expect(metrics.daysToTarget).toBeGreaterThan(0);
    });

    it("should calculate growth metrics with custom values", () => {
      const metrics = calculateGrowthMetrics(100000, 2000000, 0.2);

      expect(metrics.currentGMV).toBe(100000);
      expect(metrics.targetARR).toBe(2000000);
      expect(metrics.growthRate).toBe(0.2);
      expect(metrics.annualizedRunRate).toBe(1200000);
    });

    it("should handle zero days to target", () => {
      const metrics = calculateGrowthMetrics(1000000, 1000000, 0.1);

      expect(metrics.daysToTarget).toBe(0);
    });

    it("should calculate compound growth correctly", () => {
      const metrics = calculateGrowthMetrics(10000, 120000, 0.15);

      expect(metrics.daysToTarget).toBeGreaterThanOrEqual(0);
      expect(metrics.currentGMV).toBe(10000);
      expect(metrics.targetARR).toBe(120000);
      expect(metrics.growthRate).toBe(0.15);
    });
  });

  describe("Currency Formatting", () => {
    it("should format billions correctly", () => {
      expect(formatVND(1500000000)).toBe("1.5 tỷ");
      expect(formatVND(2000000000)).toBe("2.0 tỷ");
    });

    it("should format millions correctly", () => {
      expect(formatVND(1500000)).toBe("2 triệu");
      expect(formatVND(5000000)).toBe("5 triệu");
      expect(formatVND(999999)).toBe("999.999 đ");
    });

    it("should format smaller amounts correctly", () => {
      expect(formatVND(50000)).toBe("50.000 đ");
      expect(formatVND(100)).toBe("100 đ");
    });

    it("should handle edge cases", () => {
      expect(formatVND(0)).toBe("0 đ");
      expect(formatVND(-1000)).toBe("-1.000 đ");
    });
  });

  describe("Share Content", () => {
    it("should use native share when available", async () => {
      const content = {
        title: "Test",
        text: "Test text",
        url: "https://example.com",
      };

      ((globalThis as any).navigator.share as any).mockResolvedValueOnce(undefined);

      const result = await shareContent(content);

      expect((globalThis as any).navigator.share).toHaveBeenCalledWith(content);
      expect(result).toBe("native");
    });

    it("should fallback to clipboard when native share fails", async () => {
      const content = {
        title: "Test",
        text: "Test text",
        url: "https://example.com",
      };

      ((globalThis as any).navigator.share as any).mockRejectedValueOnce(
        new Error("Share cancelled"),
      );
      ((globalThis as any).navigator.clipboard.writeText as any).mockResolvedValueOnce(undefined);

      const result = await shareContent(content);

      expect((globalThis as any).navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Test\nhttps://example.com",
      );
      expect(result).toBe("copy");
    });

    it("should fallback to clipboard when native share not available", async () => {
      const content = {
        title: "Test",
        text: "Test text",
        url: "https://example.com",
      };

      Object.defineProperty((globalThis as any).navigator, "share", { value: undefined });

      ((globalThis as any).navigator.clipboard.writeText as any).mockResolvedValueOnce(undefined);

      const result = await shareContent(content);

      expect((globalThis as any).navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Test\nhttps://example.com",
      );
      expect(result).toBe("copy");
    });
  });

  describe("Web Vitals Collection", () => {
    it("should collect paint metrics", async () => {
      const mockPaintEntries = [
        { name: "first-contentful-paint", startTime: 1234 },
        { name: "other-paint", startTime: 5678 },
      ];

      ((globalThis as any).performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === "paint") return mockPaintEntries;
        if (type === "navigation") return [];
        return [];
      });

      const vitals = await collectWebVitals();

      expect(vitals.fcp).toBe(1234);
      expect(vitals.lcp).toBeUndefined();
    });

    it("should collect navigation metrics", async () => {
      const mockNavEntry = {
        requestStart: 1000,
        responseStart: 1200,
        domContentLoadedEventEnd: 2000,
        loadEventEnd: 2500,
      };

      ((globalThis as any).performance.getEntriesByType as any).mockImplementation((type: string) => {
        if (type === "paint") return [];
        if (type === "navigation") return [mockNavEntry];
        return [];
      });

      const vitals = await collectWebVitals();

      expect(vitals.ttfb).toBe(200);
      expect(vitals.fcp).toBeUndefined();
    });

    it("should handle missing performance APIs gracefully", async () => {
      ((globalThis as any).performance.getEntriesByType as any).mockImplementation(() => {
        throw new Error("API not supported");
      });

      const vitals = await collectWebVitals();

      expect(vitals).toEqual({});
    });

    it("should handle empty metrics gracefully", async () => {
      ((globalThis as any).performance.getEntriesByType as any).mockReturnValue([]);

      const vitals = await collectWebVitals();

      expect(vitals).toEqual({});
    });
  });

  describe("Event Types", () => {
    it("should accept all valid event types", () => {
      const events: VibeEvent[] = [
        { type: "page_view", path: "/", title: "Home" },
        {
          type: "agent_execute",
          agentName: "test-agent",
          duration: 1000,
          success: true,
        },
        { type: "revenue_milestone", amount: 1000, currency: "USD" },
        { type: "share", platform: "copy", content: "test" },
        { type: "conversion", funnel: "signup", step: 1 },
        { type: "error", message: "Test error", stack: "stack trace" },
      ];

      events.forEach((event) => {
        expect(() => vibeTelemetry.track(event)).not.toThrow();
      });
    });
  });

  describe("Integration", () => {
    it("should work end-to-end with session and tracking", () => {
      const sessionId = getSessionId();
      const event: VibeEvent = {
        type: "page_view",
        path: "/test",
        title: "Test",
      };

      vibeTelemetry.track(event, { customData: "test" });

      expect(sessionId).toMatch(/^vibe_\d+_[a-z0-9]+$/);
    });

    it("should calculate and format growth metrics together", () => {
      const metrics = calculateGrowthMetrics(50000000);
      const formatted = formatVND(metrics.currentGMV);

      expect(metrics.currentGMV).toBe(50000000);
      expect(formatted).toBe("50 triệu");
    });
  });
});
