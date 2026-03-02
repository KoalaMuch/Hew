import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { IoAdapter } from "@nestjs/platform-socket.io";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { validateEnv } from "./config/env";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
});

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) =>
        (req.headers["x-request-id"] as string) || crypto.randomUUID(),
      autoLogging: true,
    }),
  );

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.info(`API server running on http://localhost:${port}`);
}
bootstrap();
