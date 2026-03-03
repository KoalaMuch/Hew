import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  createTestApp,
  getApp,
  cleanDatabase,
  closeTestApp,
} from "./setup";
import { createSessionCookie } from "./helpers";

describe("Posts Endpoints (e2e)", () => {
  beforeAll(async () => {
    await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/posts", () => {
    it("creates a post", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const res = await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({
          type: "RUBHEW",
          content: "Going to Japan next week! Anyone need anything?",
          country: "Japan",
        })
        .expect(201);

      expect(res.body).toMatchObject({
        type: "RUBHEW",
        content: "Going to Japan next week! Anyone need anything?",
        country: "Japan",
      });
    });

    it("rejects post without content", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "RUBHEW" })
        .expect(400);
    });
  });

  describe("GET /api/posts", () => {
    it("returns paginated posts", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "RUBHEW", content: "Post 1" })
        .expect(201);

      await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "HAKHONG", content: "Post 2" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get("/api/posts")
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it("filters by type", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "RUBHEW", content: "Rubhew post" })
        .expect(201);

      await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "HAKHONG", content: "Hakhong post" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get("/api/posts?type=RUBHEW")
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe("RUBHEW");
    });
  });

  describe("GET /api/posts/:id", () => {
    it("returns a post by id", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "RUBHEW", content: "Test post" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/posts/${createRes.body.id}`)
        .expect(200);

      expect(res.body.content).toBe("Test post");
    });

    it("returns 404 for non-existent post", async () => {
      const app = getApp();

      await request(app.getHttpServer())
        .get("/api/posts/nonexistent-id")
        .expect(404);
    });
  });

  describe("DELETE /api/posts/:id", () => {
    it("deletes own post", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "RUBHEW", content: "To delete" })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/posts/${createRes.body.id}`)
        .set("Cookie", cookie)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/posts/${createRes.body.id}`)
        .expect(404);
    });

    it("rejects deletion by non-owner", async () => {
      const app = getApp();
      const ownerCookie = await createSessionCookie(app);

      const createRes = await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", ownerCookie)
        .send({ type: "RUBHEW", content: "Not yours" })
        .expect(201);

      const otherCookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .delete(`/api/posts/${createRes.body.id}`)
        .set("Cookie", otherCookie)
        .expect(403);
    });
  });

  describe("GET /api/posts/hashtags/search", () => {
    it("returns trending hashtags when query is empty", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "RUBHEW", content: "Going to #japan #tokyo" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get("/api/posts/hashtags/search?q=")
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const hasJapan = res.body.some((h: { name: string }) => h.name === "#japan");
      expect(hasJapan).toBe(true);
    });

    it("returns matching hashtags for query", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/posts")
        .set("Cookie", cookie)
        .send({ type: "RUBHEW", content: "Post with #japan and #jelly" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get("/api/posts/hashtags/search?q=jap")
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const names = res.body.map((h: { name: string }) => h.name);
      expect(names).toContain("#japan");
    });
  });
});
