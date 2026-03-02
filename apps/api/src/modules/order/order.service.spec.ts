import { describe, it, expect } from "vitest";
import { calculateCommission, generateIdempotencyKey } from "@hew/shared";

describe("Order Utilities", () => {
  describe("calculateCommission", () => {
    it("calculates 7.5% commission on subtotal", () => {
      const result = calculateCommission(3200, 500);
      expect(result.commissionFee).toBe(278); // ceil(3700 * 0.075) = ceil(277.5) = 278
      expect(result.totalPrice).toBe(3978); // 3700 + 278
      expect(result.payoutAmount).toBe(3700); // 3200 + 500
    });

    it("handles zero shipping", () => {
      const result = calculateCommission(1000, 0);
      expect(result.commissionFee).toBe(75); // ceil(1000 * 0.075)
      expect(result.totalPrice).toBe(1075);
      expect(result.payoutAmount).toBe(1000);
    });

    it("rounds commission up to nearest integer", () => {
      const result = calculateCommission(100, 0);
      expect(result.commissionFee).toBe(8); // ceil(7.5) = 8
      expect(result.totalPrice).toBe(108);
    });
  });

  describe("generateIdempotencyKey", () => {
    it("generates a UUID string", () => {
      const key = generateIdempotencyKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    });

    it("generates unique keys", () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();
      expect(key1).not.toBe(key2);
    });
  });
});
