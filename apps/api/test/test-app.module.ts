import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { featureModules } from "../src/app.module";
import { HealthController } from "../src/common/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1, limit: 10000 },
      { name: "long", ttl: 1, limit: 10000 },
      { name: "uploads", ttl: 1, limit: 10000 },
    ]),
    ...featureModules,
  ],
  controllers: [HealthController],
})
export class TestAppModule {}
