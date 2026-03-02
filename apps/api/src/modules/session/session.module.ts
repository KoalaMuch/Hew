import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";

@Module({
  controllers: [SessionController],
  providers: [SessionService, SessionGuard],
  exports: [SessionService],
})
export class SessionModule {}
