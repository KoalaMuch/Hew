import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { ItemRequestController } from "./item-request.controller";
import { ItemRequestService } from "./item-request.service";

@Module({
  controllers: [ItemRequestController],
  providers: [ItemRequestService, SessionGuard],
  exports: [ItemRequestService],
})
export class ItemRequestModule {}
