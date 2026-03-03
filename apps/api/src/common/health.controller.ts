import {
  Controller,
  Get,
  HttpStatus,
  OnModuleDestroy,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { PrismaService } from "./prisma.service";
import Redis from "ioredis";

@Controller("health")
export class HealthController implements OnModuleDestroy {
  private redis: Redis | null = null;

  constructor(private readonly prisma: PrismaService) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        lazyConnect: true,
      });
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  @Get()
  async getHealth(@Res() res: Response) {
    const checks: Record<string, "ok" | "error"> = {};

    try {
      await this.prisma.$queryRawUnsafe("SELECT 1");
      checks.postgres = "ok";
    } catch {
      checks.postgres = "error";
    }

    if (this.redis) {
      try {
        await this.redis.ping();
        checks.redis = "ok";
      } catch {
        checks.redis = "error";
      }
    }

    const allOk = Object.values(checks).every((v) => v === "ok");
    const status = allOk ? "ok" : "degraded";
    const httpStatus = allOk
      ? HttpStatus.OK
      : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(httpStatus).json({
      status,
      timestamp: new Date().toISOString(),
      checks,
    });
  }
}
