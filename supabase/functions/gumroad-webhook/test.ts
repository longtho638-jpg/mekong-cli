
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { calculateTier } from "./logic.ts";

Deno.test("Tier Calculation Logic", () => {
  // Bronze
  assertEquals(calculateTier(0), "bronze"); // Default
  assertEquals(calculateTier(1), "bronze");
  assertEquals(calculateTier(2), "bronze");

  // Silver
  assertEquals(calculateTier(3), "silver");
  assertEquals(calculateTier(9), "silver");

  // Gold
  assertEquals(calculateTier(10), "gold");
  assertEquals(calculateTier(24), "gold");

  // Platinum
  assertEquals(calculateTier(25), "platinum");
  assertEquals(calculateTier(100), "platinum");
});
