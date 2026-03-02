import { describe, it, expect } from "vitest";
import { calculateCommission, generateIdempotencyKey } from "./index";

describe("calculateCommission", () => {
  it("applies 7.5% commission rate", () => {
    const result = calculateCommission(4000, 0);
    expect(result.commissionFee).toBe(300);
    expect(result.totalPrice).toBe(4300);
    expect(result.payoutAmount).toBe(4000);
  });

  it("includes shipping in subtotal", () => {
    const result = calculateCommission(3200, 500);
    expect(result.payoutAmount).toBe(3700);
    expect(result.commissionFee).toBe(278);
    expect(result.totalPrice).toBe(3978);
  });

  it("handles small amounts correctly", () => {
    const result = calculateCommission(10, 0);
    expect(result.commissionFee).toBe(1);
    expect(result.totalPrice).toBe(11);
  });

  it("handles large amounts", () => {
    const result = calculateCommission(100000, 5000);
    expect(result.payoutAmount).toBe(105000);
    expect(result.commissionFee).toBe(7875);
    expect(result.totalPrice).toBe(112875);
  });
});

describe("generateIdempotencyKey", () => {
  it("returns a valid UUID", () => {
    const key = generateIdempotencyKey();
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("generates unique values", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateIdempotencyKey()));
    expect(keys.size).toBe(100);
  });
});
