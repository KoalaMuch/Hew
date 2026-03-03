import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  createTestApp,
  getApp,
  getPrisma,
  cleanDatabase,
  closeTestApp,
} from "./setup";
import { createSessionCookie, seedTestOrder } from "./helpers";

describe("Payments Endpoints (e2e)", () => {
  beforeAll(async () => {
    await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  async function seedOrderForPayment() {
    return seedTestOrder(getApp(), getPrisma(), { status: "ESCROW_PENDING" });
  }

  describe("POST /api/payments/webhook/omise", () => {
    it("rejects payload missing required fields", async () => {
      const app = getApp();

      await request(app.getHttpServer())
        .post("/api/payments/webhook/omise")
        .send({})
        .expect(400);
    });

    it("rejects payload without id", async () => {
      const app = getApp();

      await request(app.getHttpServer())
        .post("/api/payments/webhook/omise")
        .send({ key: "some-key" })
        .expect(400);
    });

    it("rejects payload without key", async () => {
      const app = getApp();

      await request(app.getHttpServer())
        .post("/api/payments/webhook/omise")
        .send({ id: "some-id" })
        .expect(400);
    });

    it("handles valid payload for non-existent charge gracefully", async () => {
      const app = getApp();

      const res = await request(app.getHttpServer())
        .post("/api/payments/webhook/omise")
        .send({
          id: "chrg_nonexistent",
          key: "charge.complete",
        })
        .expect(200);

      expect(res.body).toMatchObject({
        processed: false,
        reason: "Escrow payment not found",
      });
    });

    it("processes valid webhook and marks as funded (idempotent)", async () => {
      const prisma = getPrisma();
      const app = getApp();
      const { order } = await seedOrderForPayment();

      await prisma.escrowPayment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          idempotencyKey: `idem-${Date.now()}`,
          status: "PENDING",
          providerChargeId: "chrg_test_123",
        },
      });

      const res1 = await request(app.getHttpServer())
        .post("/api/payments/webhook/omise")
        .send({
          id: "chrg_test_123",
          key: "charge.complete",
        })
        .expect(200);

      expect(res1.body.processed).toBe(true);

      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder?.status).toBe("PAID");

      // Idempotent: calling again should not fail
      const res2 = await request(app.getHttpServer())
        .post("/api/payments/webhook/omise")
        .send({
          id: "chrg_test_123",
          key: "charge.complete",
        })
        .expect(200);

      expect(res2.body).toMatchObject({
        processed: true,
        reason: "Already funded (idempotent)",
      });
    });
  });

  describe("POST /api/payments/charge", () => {
    it("rejects charge by non-buyer", async () => {
      const app = getApp();
      const { order, travelerCookie } = await seedOrderForPayment();

      await request(app.getHttpServer())
        .post("/api/payments/charge")
        .set("Cookie", travelerCookie)
        .send({
          orderId: order.id,
          paymentMethod: "promptpay",
        })
        .expect(403);
    });
  });

  describe("GET /api/payments/order/:orderId/status", () => {
    it("rejects access from unrelated session", async () => {
      const app = getApp();
      const prisma = getPrisma();
      const { order } = await seedOrderForPayment();

      await prisma.escrowPayment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          idempotencyKey: `idem-status-${Date.now()}`,
          status: "FUNDED",
          fundedAt: new Date(),
        },
      });

      const otherCookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .get(`/api/payments/order/${order.id}/status`)
        .set("Cookie", otherCookie)
        .expect(403);
    });
  });
});
