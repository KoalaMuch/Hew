import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  createTestApp,
  getApp,
  cleanDatabase,
  closeTestApp,
} from "./setup";
import { createSessionCookie, createAuthenticatedSession } from "./helpers";

describe("Auth Endpoints (e2e)", () => {
  beforeAll(async () => {
    await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const res = await request(app.getHttpServer())
        .post("/api/auth/register")
        .set("Cookie", cookie)
        .send({
          email: "test@example.com",
          password: "password123",
          displayName: "Test User",
        })
        .expect(201);

      expect(res.body).toMatchObject({
        email: "test@example.com",
        displayName: "Test User",
      });
      expect(res.body.id).toBeDefined();
    });

    it("rejects duplicate email", async () => {
      const app = getApp();
      const cookie1 = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/auth/register")
        .set("Cookie", cookie1)
        .send({
          email: "dup@example.com",
          password: "password123",
          displayName: "User 1",
        })
        .expect(201);

      const cookie2 = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/auth/register")
        .set("Cookie", cookie2)
        .send({
          email: "dup@example.com",
          password: "password456",
          displayName: "User 2",
        })
        .expect(400);
    });

    it("rejects invalid input (missing email)", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/auth/register")
        .set("Cookie", cookie)
        .send({
          password: "password123",
          displayName: "No Email",
        })
        .expect(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with correct credentials", async () => {
      const app = getApp();
      const cookie = await createAuthenticatedSession(app, {
        email: "login@example.com",
        password: "password123",
        displayName: "Login User",
      });

      const newCookie = await createSessionCookie(app);

      const res = await request(app.getHttpServer())
        .post("/api/auth/login")
        .set("Cookie", newCookie)
        .send({
          email: "login@example.com",
          password: "password123",
        })
        .expect(200);

      expect(res.body).toMatchObject({
        email: "login@example.com",
        displayName: "Login User",
      });
    });

    it("rejects wrong password", async () => {
      const app = getApp();
      await createAuthenticatedSession(app, {
        email: "wrong@example.com",
        password: "correctpassword",
        displayName: "Wrong PW",
      });

      const newCookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/auth/login")
        .set("Cookie", newCookie)
        .send({
          email: "wrong@example.com",
          password: "wrongpassword",
        })
        .expect(401);
    });

    it("rejects non-existent user", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      await request(app.getHttpServer())
        .post("/api/auth/login")
        .set("Cookie", cookie)
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);
    });
  });

  describe("GET /api/auth/profile", () => {
    it("returns profile for authenticated session", async () => {
      const app = getApp();
      const cookie = await createAuthenticatedSession(app, {
        email: "profile@example.com",
        password: "password123",
        displayName: "Profile User",
      });

      const res = await request(app.getHttpServer())
        .get("/api/auth/profile")
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body).toMatchObject({
        isRegistered: true,
        user: {
          email: "profile@example.com",
          displayName: "Profile User",
        },
      });
    });

    it("returns null user for unauthenticated session", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);

      const res = await request(app.getHttpServer())
        .get("/api/auth/profile")
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body.isRegistered).toBe(false);
      expect(res.body.user).toBeNull();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears registered user from session", async () => {
      const app = getApp();
      const cookie = await createAuthenticatedSession(app, {
        email: "logout@example.com",
        password: "password123",
        displayName: "Logout User",
      });

      await request(app.getHttpServer())
        .post("/api/auth/logout")
        .set("Cookie", cookie)
        .expect(204);

      const profileRes = await request(app.getHttpServer())
        .get("/api/auth/profile")
        .set("Cookie", cookie)
        .expect(200);

      expect(profileRes.body.isRegistered).toBe(false);
    });
  });

  describe("GET /api/auth/:provider (OAuth redirect)", () => {
    it("redirects to Google OAuth with correct params", async () => {
      const app = getApp();
      const cookie = await createSessionCookie(app);
      const sessionId = cookie.split("=")[1];

      const res = await request(app.getHttpServer())
        .get(`/api/auth/google?session=${sessionId}`)
        .expect(302);

      expect(res.headers.location).toContain("accounts.google.com");
    });

    it("rejects unsupported provider", async () => {
      const app = getApp();

      await request(app.getHttpServer())
        .get("/api/auth/twitter?session=test")
        .expect(400);
    });

    it("rejects missing session param", async () => {
      const app = getApp();

      await request(app.getHttpServer())
        .get("/api/auth/google")
        .expect(400);
    });
  });
});
