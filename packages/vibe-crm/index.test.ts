import { describe, it, expect } from "vitest";
import { TIER_CONFIG, validateWinWinWin, type Deal } from "./index";

describe("VIBE CRM Core", () => {
  describe("Tier Configuration", () => {
    it("should have correct warrior tier config", () => {
      const warrior = TIER_CONFIG.warrior;
      expect(warrior.retainerMin).toBe(2000);
      expect(warrior.retainerMax).toBe(3000);
      expect(warrior.equityMin).toBe(5);
      expect(warrior.equityMax).toBe(8);
    });

    it("should have correct general tier config", () => {
      const general = TIER_CONFIG.general;
      expect(general.retainerMin).toBe(5000);
      expect(general.retainerMax).toBe(8000);
      expect(general.equityMin).toBe(3);
      expect(general.equityMax).toBe(5);
    });

    it("should have correct tuong_quan tier config", () => {
      const tuongQuan = TIER_CONFIG.tuong_quan;
      expect(tuongQuan.retainerMin).toBe(0);
      expect(tuongQuan.retainerMax).toBe(0);
      expect(tuongQuan.equityMin).toBe(15);
      expect(tuongQuan.equityMax).toBe(30);
    });
  });

  describe("Win-Win-Win Validation", () => {
    it("should validate warrior tier deal correctly", () => {
      const deal: Deal = {
        id: "test-deal",
        contactId: "test-contact",
        name: "Test Deal",
        value: 2500,
        stage: "lead",
        tier: "warrior",
        probability: 25,
        expectedCloseDate: new Date(),
        tags: [],
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation = validateWinWinWin(deal);
      expect(validation.ownerWin).toContain("Equity 5-8%");
      expect(validation.ownerWin).toContain("Retainer $2000/mo");
      expect(validation.agencyWin).toBe(
        "Deal flow + Knowledge + Infrastructure",
      );
      expect(validation.clientWin).toBe(
        "Protection + Strategy + Network access",
      );
      expect(validation.aligned).toBe(true);
    });

    it("should reject deal below minimum value", () => {
      const deal: Deal = {
        id: "test-deal",
        contactId: "test-contact",
        name: "Test Deal",
        value: 1000, // Below warrior minimum
        stage: "lead",
        tier: "warrior",
        probability: 25,
        expectedCloseDate: new Date(),
        tags: [],
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation = validateWinWinWin(deal);
      expect(validation.aligned).toBe(false);
    });

    it("should validate tuong_quan tier correctly", () => {
      const deal: Deal = {
        id: "test-deal",
        contactId: "test-contact",
        name: "Test Deal",
        value: 0, // Tuong quan has no retainer
        stage: "lead",
        tier: "tuong_quan",
        probability: 25,
        expectedCloseDate: new Date(),
        tags: [],
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation = validateWinWinWin(deal);
      expect(validation.ownerWin).toContain("Equity 15-30%");
      expect(validation.ownerWin).toContain("Retainer $0/mo");
    });
  });

  describe("Basic Functionality", () => {
    it("should handle type definitions correctly", () => {
      // Basic type tests to ensure the module loads
      expect(TIER_CONFIG).toBeDefined();
      expect(validateWinWinWin).toBeDefined();
      expect(typeof validateWinWinWin).toBe("function");
    });

    it("should export expected constants", () => {
      expect(typeof TIER_CONFIG.warrior).toBe("object");
      expect(typeof TIER_CONFIG.general).toBe("object");
      expect(typeof TIER_CONFIG.tuong_quan).toBe("object");
    });
  });
});
