import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { AdminGuard } from "../../common/admin.guard";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { DisputeModule } from "../dispute/dispute.module";

@Module({
  imports: [DisputeModule],
  controllers: [AdminController],
  providers: [AdminService, SessionGuard, AdminGuard],
})
export class AdminModule {}
