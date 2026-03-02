import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.registeredUser.upsert({
    where: { email: "admin@hew.th" },
    update: {},
    create: {
      email: "admin@hew.th",
      displayName: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const session = await prisma.session.upsert({
    where: { registeredUserId: admin.id },
    update: {},
    create: {
      displayName: "Admin",
      registeredUserId: admin.id,
    },
  });

  const trip1 = await prisma.trip.upsert({
    where: { id: "seed-trip-japan" },
    update: {},
    create: {
      id: "seed-trip-japan",
      sessionId: session.id,
      country: "Japan",
      city: "Tokyo",
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      description: "Shopping trip to Tokyo",
    },
  });

  const trip2 = await prisma.trip.upsert({
    where: { id: "seed-trip-korea" },
    update: {},
    create: {
      id: "seed-trip-korea",
      sessionId: session.id,
      country: "Korea",
      city: "Seoul",
      departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      returnDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      description: "Seoul shopping and sightseeing",
    },
  });

  const trip3 = await prisma.trip.upsert({
    where: { id: "seed-trip-indonesia" },
    update: {},
    create: {
      id: "seed-trip-indonesia",
      sessionId: session.id,
      country: "Indonesia",
      city: "Bali",
      departureDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      returnDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      description: "Bali vacation",
    },
  });

  const itemRequest1 = await prisma.itemRequest.upsert({
    where: { id: "seed-request-1" },
    update: {},
    create: {
      id: "seed-request-1",
      sessionId: session.id,
      title: "Japanese skincare products",
      description: "Looking for popular Japanese skincare brands",
      imageUrls: [],
      countries: ["Japan"],
      maxBudget: 5000,
    },
  });

  const itemRequest2 = await prisma.itemRequest.upsert({
    where: { id: "seed-request-2" },
    update: {},
    create: {
      id: "seed-request-2",
      sessionId: session.id,
      title: "K-pop merchandise",
      description: "BTS and Blackpink official merchandise",
      imageUrls: [],
      countries: ["Korea"],
      maxBudget: 3000,
    },
  });

  console.log("Seed completed:", {
    admin: admin.email,
    session: session.id,
    trips: [trip1.country, trip2.country, trip3.country],
    itemRequests: [itemRequest1.title, itemRequest2.title],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
