import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OAuthService } from "./oauth/oauth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, OAuthService, SessionGuard],
  exports: [AuthService],
})
export class AuthModule {}
