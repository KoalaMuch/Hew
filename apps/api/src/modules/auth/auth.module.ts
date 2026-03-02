import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionGuard],
  exports: [AuthService],
})
export class AuthModule {}
