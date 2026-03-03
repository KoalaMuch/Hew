import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import { PrismaService } from "../src/common/prisma.service";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";
import { TestAppModule } from "./test-app.module";

process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "test-google-id";
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "test-google-secret";
process.env.LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || "test-line-id";
process.env.LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "test-line-secret";
process.env.FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "test-fb-id";
process.env.FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "test-fb-secret";
process.env.OTEL_SDK_DISABLED = "true";

let app: INestApplication;
let prisma: PrismaService;

export async function createTestApp(): Promise<INestApplication> {
  if (app) return app;

  const moduleRef = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  prisma = app.get(PrismaService);
  return app;
}

export function getApp(): INestApplication {
  return app;
}

export function getPrisma(): PrismaService {
  return prisma;
}

export async function cleanDatabase(): Promise<void> {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE`);
  }
}

export async function closeTestApp(): Promise<void> {
  // no-op: app is reused across test suites in singleFork mode.
  // NestJS will clean up when the process exits.
}
