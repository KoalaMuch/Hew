import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { SESSION_COOKIE_NAME } from "@hew/shared";

/**
 * Makes a request that triggers SessionGuard, extracting the
 * session cookie from the response for subsequent requests.
 */
export async function createSessionCookie(
  app: INestApplication,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .get("/api/sessions/me")
    .expect((r) => {
      if (r.status !== 200 && r.status !== 201) {
        // SessionGuard creates a session — cookie should be set
      }
    });

  const cookies = res.headers["set-cookie"] as string[] | undefined;
  if (!cookies || cookies.length === 0) {
    throw new Error("No session cookie returned");
  }

  const sessionCookie = cookies.find((c: string) =>
    c.startsWith(SESSION_COOKIE_NAME),
  );
  if (!sessionCookie) {
    throw new Error(`No ${SESSION_COOKIE_NAME} cookie found`);
  }

  return sessionCookie.split(";")[0];
}

/**
 * Creates a session and registers a user, returning the cookie
 * for authenticated requests.
 */
export async function createAuthenticatedSession(
  app: INestApplication,
  userData: {
    email: string;
    password: string;
    displayName: string;
  },
): Promise<string> {
  const cookie = await createSessionCookie(app);

  await request(app.getHttpServer())
    .post("/api/auth/register")
    .set("Cookie", cookie)
    .send(userData)
    .expect(201);

  return cookie;
}
