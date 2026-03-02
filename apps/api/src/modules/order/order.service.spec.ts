import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { OrderService } from "./order.service";

const mockPrisma = {
  order: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

describe("OrderService", () => {
  let service: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrderService(mockPrisma as any);
  });

  describe("createFromOffer", () => {
    it("creates an order from an accepted offer", async () => {
      const offer = {
        id: "offer-1",
        buyerSessionId: "buyer-session",
        travelerSessionId: "traveler-session",
        totalPrice: { toString: () => "1075" },
        commissionFee: { toString: () => "75" },
        productPrice: { toString: () => "1000" },
        shippingFee: { toString: () => "0" },
      };
      const mockOrder = {
        id: "order-1",
        offerId: "offer-1",
        status: "ESCROW_PENDING",
      };
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.createFromOffer(offer);

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          offerId: "offer-1",
          buyerSessionId: "buyer-session",
          travelerSessionId: "traveler-session",
          totalAmount: 1075,
          commissionAmount: 75,
          payoutAmount: 1000,
          status: "ESCROW_PENDING",
          idempotencyKey: expect.any(String),
        }),
      });
    });

    it("calculates payout as productPrice + shippingFee", async () => {
      const offer = {
        id: "offer-2",
        buyerSessionId: "b",
        travelerSessionId: "t",
        totalPrice: { toString: () => "3978" },
        commissionFee: { toString: () => "278" },
        productPrice: { toString: () => "3200" },
        shippingFee: { toString: () => "500" },
      };
      mockPrisma.order.create.mockResolvedValue({ id: "order-2" });

      await service.createFromOffer(offer);

      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payoutAmount: 3700,
        }),
      });
    });

    it("uses provided transaction client when given", async () => {
      const txClient = { order: { create: vi.fn().mockResolvedValue({ id: "order-tx" }) } };
      const offer = {
        id: "offer-3",
        buyerSessionId: "b",
        travelerSessionId: "t",
        totalPrice: { toString: () => "100" },
        commissionFee: { toString: () => "8" },
        productPrice: { toString: () => "100" },
        shippingFee: { toString: () => "0" },
      };

      await service.createFromOffer(offer, txClient as any);

      expect(txClient.order.create).toHaveBeenCalled();
      expect(mockPrisma.order.create).not.toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("returns order with relations when found", async () => {
      const mockOrder = {
        id: "order-1",
        status: "PAID",
        offer: {},
        escrowPayment: null,
        shipment: null,
        payout: null,
      };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findById("order-1");

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1" },
        include: {
          offer: true,
          escrowPayment: true,
          shipment: true,
          payout: true,
        },
      });
    });

    it("throws NotFoundException when order does not exist", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findById("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findBySession", () => {
    it("finds orders as buyer", async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.findBySession("session-1", "buyer");

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { buyerSessionId: "session-1" },
        }),
      );
    });

    it("finds orders as traveler", async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.findBySession("session-1", "traveler");

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { travelerSessionId: "session-1" },
        }),
      );
    });

    it("finds orders as both buyer and traveler when no role specified", async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      await service.findBySession("session-1");

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { buyerSessionId: "session-1" },
              { travelerSessionId: "session-1" },
            ],
          },
        }),
      );
    });
  });

  describe("confirmDelivery", () => {
    it("updates status to DELIVERED when buyer confirms", async () => {
      const mockOrder = {
        id: "order-1",
        buyerSessionId: "buyer-session",
        status: "SHIPPED",
      };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: "DELIVERED",
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.confirmDelivery("order-1", "buyer-session");

      expect(result.status).toBe("DELIVERED");
    });

    it("throws ForbiddenException when non-buyer tries to confirm", async () => {
      const mockOrder = {
        id: "order-1",
        buyerSessionId: "buyer-session",
        status: "SHIPPED",
      };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.confirmDelivery("order-1", "other-session"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("updateStatus", () => {
    it("updates order status and creates audit log", async () => {
      const updatedOrder = { id: "order-1", status: "PAID" };
      mockPrisma.order.update.mockResolvedValue(updatedOrder);
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.updateStatus("order-1", "PAID" as any, "session-1");

      expect(result).toEqual(updatedOrder);
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "PAID" },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          sessionId: "session-1",
          action: "ORDER_STATUS_UPDATE",
          entity: "Order",
          entityId: "order-1",
          metadata: { status: "PAID" },
        },
      });
    });

    it("records null sessionId when not provided", async () => {
      mockPrisma.order.update.mockResolvedValue({ id: "order-1", status: "CANCELLED" });
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.updateStatus("order-1", "CANCELLED" as any);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: null,
        }),
      });
    });
  });
});
