import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  createTestApp,
  getApp,
  cleanDatabase,
  closeTestApp,
} from "./setup";
import { createSessionCookie } from "./helpers";

describe("Trips Endpoints (e2e)", () => {
  beforeAll(async () => {
    await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/trips", () => {
    it("creates a trip", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const res = await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({
          country: "Japan",
          city: "Tokyo",
          description: "Shopping trip",
        })
        .expect(201);

      expect(res.body).toMatchObject({
        country: "Japan",
        city: "Tokyo",
        description: "Shopping trip",
      });
      expect(res.body.id).toBeDefined();
    });

    it("rejects missing country", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({ city: "Tokyo" })
        .expect(400);
    });
  });

  describe("GET /api/trips", () => {
    it("returns paginated trips", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({ country: "Japan", city: "Tokyo" })
        .expect(201);

      await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({ country: "Korea", city: "Seoul" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get("/api/trips")
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it("filters by country", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({ country: "Japan" })
        .expect(201);

      await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({ country: "Korea" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get("/api/trips?country=Japan")
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].country).toBe("Japan");
    });
  });

  describe("GET /api/trips/:id", () => {
    it("returns a trip by id", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({ country: "Japan" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/trips/${createRes.body.id}`)
        .expect(200);

      expect(res.body.country).toBe("Japan");
    });

    it("returns 404 for non-existent trip", async () => {
      const app = getApp();

      await request(app.getHttpServer())
        .get("/api/trips/nonexistent-id")
        .expect(404);
    });
  });

  describe("PATCH /api/trips/:id", () => {
    it("updates a trip owned by session", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({ country: "Japan", city: "Tokyo" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/trips/${createRes.body.id}`)
        .set("Cookie", cookie)
        .send({ city: "Osaka" })
        .expect(200);

      expect(res.body.city).toBe("Osaka");
    });

    it("rejects update by non-owner", async () => {
      const app = getApp();
      const ownerCookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", ownerCookie)
        .send({ country: "Japan" })
        .expect(201);

      const otherCookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .patch(`/api/trips/${createRes.body.id}`)
        .set("Cookie", otherCookie)
        .send({ city: "Osaka" })
        .expect(403);
    });
  });

  describe("DELETE /api/trips/:id", () => {
    it("cancels a trip", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/trips")
        .set("Cookie", cookie)
        .send({ country: "Japan" })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/trips/${createRes.body.id}`)
        .set("Cookie", cookie)
        .expect(204);
    });
  });
});
