import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { OfferController } from "./offer.controller";
import { OfferService } from "./offer.service";
import { OrderModule } from "../order/order.module";

@Module({
  imports: [OrderModule],
  controllers: [OfferController],
  providers: [OfferService, SessionGuard],
  exports: [OfferService],
})
export class OfferModule {}
