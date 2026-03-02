import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { DisputeController } from "./dispute.controller";
import { DisputeService } from "./dispute.service";

@Module({
  controllers: [DisputeController],
  providers: [DisputeService, SessionGuard],
  exports: [DisputeService],
})
export class DisputeModule {}
