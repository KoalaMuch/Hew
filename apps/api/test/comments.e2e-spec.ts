import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  createTestApp,
  getApp,
  cleanDatabase,
  closeTestApp,
} from "./setup";
import { createSessionCookie } from "./helpers";

describe("Comments Endpoints (e2e)", () => {
  beforeAll(async () => {
    await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  async function createPost(cookie: string) {
    const app = getApp();
    const res = await request(app.getHttpServer())
      .post("/api/posts")
      .set("Cookie", cookie)
      .send({ type: "RUBHEW", content: "Test post for comments" })
      .expect(201);
    return res.body;
  }

  describe("POST /api/posts/:postId/comments", () => {
    it("creates a comment on a post", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);
      const post = await createPost(cookie);

      const res = await request(app.getHttpServer())
        .post(`/api/posts/${post.id}/comments`)
        .set("Cookie", cookie)
        .send({ content: "Great post!" })
        .expect(201);

      expect(res.body).toMatchObject({
        content: "Great post!",
        postId: post.id,
      });
    });

    it("rejects empty content", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);
      const post = await createPost(cookie);

      await request(app.getHttpServer())
        .post(`/api/posts/${post.id}/comments`)
        .set("Cookie", cookie)
        .send({ content: "" })
        .expect(400);
    });

    it("returns 404 for non-existent post", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/posts/nonexistent/comments")
        .set("Cookie", cookie)
        .send({ content: "test" })
        .expect(404);
    });
  });

  describe("GET /api/posts/:postId/comments", () => {
    it("lists comments for a post", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);
      const post = await createPost(cookie);

      await request(app.getHttpServer())
        .post(`/api/posts/${post.id}/comments`)
        .set("Cookie", cookie)
        .send({ content: "Comment 1" })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/posts/${post.id}/comments`)
        .set("Cookie", cookie)
        .send({ content: "Comment 2" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/posts/${post.id}/comments`)
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });
  });

  describe("PATCH /api/posts/:postId/comments/:id", () => {
    it("updates own comment", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);
      const post = await createPost(cookie);

      const createRes = await request(app.getHttpServer())
        .post(`/api/posts/${post.id}/comments`)
        .set("Cookie", cookie)
        .send({ content: "Original" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/posts/${post.id}/comments/${createRes.body.id}`)
        .set("Cookie", cookie)
        .send({ content: "Updated" })
        .expect(200);

      expect(res.body.content).toBe("Updated");
    });

    it("rejects update by non-owner", async () => {
      const app = getApp();
      const ownerCookie = await createSessionCookie(app);
      const post = await createPost(ownerCookie);

      const createRes = await request(app.getHttpServer())
        .post(`/api/posts/${post.id}/comments`)
        .set("Cookie", ownerCookie)
        .send({ content: "Owner comment" })
        .expect(201);

      const otherCookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .patch(`/api/posts/${post.id}/comments/${createRes.body.id}`)
        .set("Cookie", otherCookie)
        .send({ content: "Hacked" })
        .expect(403);
    });
  });

  describe("DELETE /api/posts/:postId/comments/:id", () => {
    it("deletes own comment", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);
      const post = await createPost(cookie);

      const createRes = await request(app.getHttpServer())
        .post(`/api/posts/${post.id}/comments`)
        .set("Cookie", cookie)
        .send({ content: "To delete" })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/posts/${post.id}/comments/${createRes.body.id}`)
        .set("Cookie", cookie)
        .expect(204);

      const listRes = await request(app.getHttpServer())
        .get(`/api/posts/${post.id}/comments`)
        .set("Cookie", cookie)
        .expect(200);

      expect(listRes.body.data).toHaveLength(0);
    });

    it("rejects deletion by non-owner", async () => {
      const app = getApp();
      const ownerCookie = await createSessionCookie(app);
      const post = await createPost(ownerCookie);

      const createRes = await request(app.getHttpServer())
        .post(`/api/posts/${post.id}/comments`)
        .set("Cookie", ownerCookie)
        .send({ content: "Not yours" })
        .expect(201);

      const otherCookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .delete(`/api/posts/${post.id}/comments/${createRes.body.id}`)
        .set("Cookie", otherCookie)
        .expect(403);
    });
  });
});
