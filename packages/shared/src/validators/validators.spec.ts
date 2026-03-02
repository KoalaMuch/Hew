import { describe, it, expect } from "vitest";
import {
  createTripSchema,
  createItemRequestSchema,
  createOfferSchema,
  guestCheckoutSchema,
  shipOrderSchema,
  updateSessionSchema,
  registerSchema,
} from "./index";

describe("Validators", () => {
  describe("createTripSchema", () => {
    it("accepts valid trip data", () => {
      const result = createTripSchema.safeParse({
        country: "Japan",
        city: "Tokyo",
        description: "Shopping trip",
      });
      expect(result.success).toBe(true);
    });

    it("requires country", () => {
      const result = createTripSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty country", () => {
      const result = createTripSchema.safeParse({ country: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("createItemRequestSchema", () => {
    it("accepts valid item request", () => {
      const result = createItemRequestSchema.safeParse({
        title: "Adidas Stan Smith",
        countries: ["Japan"],
      });
      expect(result.success).toBe(true);
    });

    it("requires at least one country", () => {
      const result = createItemRequestSchema.safeParse({
        title: "Test",
        countries: [],
      });
      expect(result.success).toBe(false);
    });

    it("validates maxBudget is positive", () => {
      const result = createItemRequestSchema.safeParse({
        title: "Test",
        countries: ["Japan"],
        maxBudget: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("guestCheckoutSchema", () => {
    it("accepts valid Thai phone number", () => {
      const result = guestCheckoutSchema.safeParse({
        orderId: "order-1",
        phone: "0812345678",
        paymentMethod: "promptpay",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid phone number", () => {
      const result = guestCheckoutSchema.safeParse({
        orderId: "order-1",
        phone: "12345",
        paymentMethod: "promptpay",
      });
      expect(result.success).toBe(false);
    });

    it("accepts credit card payment method", () => {
      const result = guestCheckoutSchema.safeParse({
        orderId: "order-1",
        email: "test@example.com",
        paymentMethod: "credit_card",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("shipOrderSchema", () => {
    it("requires at least one proof image", () => {
      const result = shipOrderSchema.safeParse({
        proofImageUrls: [],
        bankAccount: {
          bankName: "SCB",
          accountNumber: "1234567890",
          accountName: "Test User",
        },
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid shipping data", () => {
      const result = shipOrderSchema.safeParse({
        trackingNumber: "TH123456",
        carrier: "Kerry Express",
        proofImageUrls: ["https://example.com/proof.jpg"],
        bankAccount: {
          bankName: "SCB",
          accountNumber: "1234567890",
          accountName: "Test User",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateSessionSchema", () => {
    it("accepts display name update", () => {
      const result = updateSessionSchema.safeParse({
        displayName: "NewNick",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty display name", () => {
      const result = updateSessionSchema.safeParse({
        displayName: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("requires 8+ character password", () => {
      const result = registerSchema.safeParse({
        email: "test@test.com",
        password: "short",
        displayName: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid registration", () => {
      const result = registerSchema.safeParse({
        email: "test@test.com",
        password: "longpassword123",
        displayName: "Test User",
      });
      expect(result.success).toBe(true);
    });
  });
});
