import type { INestApplication } from "@nestjs/common";
import type { PrismaService } from "../src/common/prisma.service";
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

/**
 * Creates a full offer chain (sessions + item request + offer)
 * then an order linked to the offer, suitable for order/payment tests.
 */
export async function seedTestOrder(
  app: INestApplication,
  prisma: PrismaService,
  overrides: { status?: string } = {},
) {
  const buyerCookie = await createSessionCookie(app);
  const travelerCookie = await createSessionCookie(app);

  const buyerSessionId = buyerCookie.split("=")[1];
  const travelerSessionId = travelerCookie.split("=")[1];

  const itemRequest = await prisma.itemRequest.create({
    data: {
      sessionId: buyerSessionId,
      title: "Test item",
      countries: ["Japan"],
    },
  });

  const offer = await prisma.offer.create({
    data: {
      itemRequestId: itemRequest.id,
      travelerSessionId,
      buyerSessionId,
      productPrice: 1000,
      shippingFee: 50,
      commissionFee: 75,
      totalPrice: 1125,
      status: "ACCEPTED",
    },
  });

  const order = await prisma.order.create({
    data: {
      offerId: offer.id,
      buyerSessionId,
      travelerSessionId,
      totalAmount: 1125,
      commissionAmount: 75,
      payoutAmount: 1050,
      status: (overrides.status as "PAID") || "PAID",
      idempotencyKey: `test-${Date.now()}-${Math.random()}`,
    },
  });

  return { order, offer, itemRequest, buyerCookie, travelerCookie, buyerSessionId, travelerSessionId };
}
