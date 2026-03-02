import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  createTestApp,
  getApp,
  cleanDatabase,
  closeTestApp,
} from "./setup";
import { createSessionCookie } from "./helpers";

describe("Item Requests Endpoints (e2e)", () => {
  beforeAll(async () => {
    await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/item-requests", () => {
    it("creates an item request", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const res = await request(app.getHttpServer())
        .post("/api/item-requests")
        .set("Cookie", cookie)
        .send({
          title: "iPhone 16",
          description: "Looking for iPhone 16 Pro from Japan",
          countries: ["Japan"],
          maxBudget: 50000,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        title: "iPhone 16",
        countries: ["Japan"],
      });
      expect(res.body.id).toBeDefined();
    });

    it("rejects missing title", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/item-requests")
        .set("Cookie", cookie)
        .send({
          description: "No title",
          countries: ["Japan"],
        })
        .expect(400);
    });
  });

  describe("GET /api/item-requests", () => {
    it("returns paginated item requests", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/item-requests")
        .set("Cookie", cookie)
        .send({ title: "Item 1", countries: ["Japan"] })
        .expect(201);

      await request(app.getHttpServer())
        .post("/api/item-requests")
        .set("Cookie", cookie)
        .send({ title: "Item 2", countries: ["Korea"] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get("/api/item-requests")
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });
  });

  describe("GET /api/item-requests/:id", () => {
    it("returns an item request by id", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/item-requests")
        .set("Cookie", cookie)
        .send({ title: "Test Item", countries: ["Japan"] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/item-requests/${createRes.body.id}`)
        .expect(200);

      expect(res.body.title).toBe("Test Item");
    });

    it("returns 404 for non-existent item request", async () => {
      const app = getApp();

      await request(app.getHttpServer())
        .get("/api/item-requests/nonexistent-id")
        .expect(404);
    });
  });

  describe("PATCH /api/item-requests/:id", () => {
    it("updates an item request owned by session", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/item-requests")
        .set("Cookie", cookie)
        .send({ title: "Original", countries: ["Japan"] })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/item-requests/${createRes.body.id}`)
        .set("Cookie", cookie)
        .send({ title: "Updated" })
        .expect(200);

      expect(res.body.title).toBe("Updated");
    });
  });
});
