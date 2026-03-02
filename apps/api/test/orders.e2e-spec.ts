import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  createTestApp,
  getApp,
  getPrisma,
  cleanDatabase,
  closeTestApp,
} from "./setup";
import { createSessionCookie } from "./helpers";

describe("Orders Endpoints (e2e)", () => {
  beforeAll(async () => {
    await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  async function seedOrder() {
    const prisma = getPrisma();
    const app = getApp();

    const buyerCookie = await createSessionCookie(app);
    const travelerCookie = await createSessionCookie(app);

    const buyerSessionId = buyerCookie.split("=")[1];
    const travelerSessionId = travelerCookie.split("=")[1];

    const order = await prisma.order.create({
      data: {
        buyerSessionId,
        travelerSessionId,
        offerId: null as unknown as string,
        totalAmount: 1075,
        commissionAmount: 75,
        payoutAmount: 1000,
        status: "PAID",
        idempotencyKey: `test-${Date.now()}`,
      },
    });

    return { order, buyerCookie, travelerCookie, buyerSessionId, travelerSessionId };
  }

  describe("GET /api/orders", () => {
    it("returns orders for a session", async () => {
      const app = getApp();
      const { buyerCookie } = await seedOrder();

      const res = await request(app.getHttpServer())
        .get("/api/orders")
        .set("Cookie", buyerCookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("filters by buyer role", async () => {
      const app = getApp();
      const { buyerCookie, travelerCookie } = await seedOrder();

      const buyerRes = await request(app.getHttpServer())
        .get("/api/orders?role=buyer")
        .set("Cookie", buyerCookie)
        .expect(200);

      expect(buyerRes.body).toHaveLength(1);

      const travelerAsBuyer = await request(app.getHttpServer())
        .get("/api/orders?role=buyer")
        .set("Cookie", travelerCookie)
        .expect(200);

      expect(travelerAsBuyer.body).toHaveLength(0);
    });
  });

  describe("GET /api/orders/:id", () => {
    it("returns order for buyer", async () => {
      const app = getApp();
      const { order, buyerCookie } = await seedOrder();

      const res = await request(app.getHttpServer())
        .get(`/api/orders/${order.id}`)
        .set("Cookie", buyerCookie)
        .expect(200);

      expect(res.body.id).toBe(order.id);
    });

    it("rejects access by unrelated session", async () => {
      const app = getApp();
      const { order } = await seedOrder();
      const otherCookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .get(`/api/orders/${order.id}`)
        .set("Cookie", otherCookie)
        .expect(403);
    });
  });

  describe("PATCH /api/orders/:id/deliver", () => {
    it("allows buyer to confirm delivery", async () => {
      const app = getApp();
      const prisma = getPrisma();
      const { order, buyerCookie } = await seedOrder();

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "SHIPPED" },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/orders/${order.id}/deliver`)
        .set("Cookie", buyerCookie)
        .expect(200);

      expect(res.body.status).toBe("DELIVERED");
    });

    it("rejects delivery confirmation by traveler", async () => {
      const app = getApp();
      const prisma = getPrisma();
      const { order, travelerCookie } = await seedOrder();

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "SHIPPED" },
      });

      await request(app.getHttpServer())
        .patch(`/api/orders/${order.id}/deliver`)
        .set("Cookie", travelerCookie)
        .expect(403);
    });
  });
});
