import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { OrderModule } from "../order/order.module";
import { PayoutController } from "./payout.controller";
import { PayoutService } from "./payout.service";

@Module({
  imports: [OrderModule],
  controllers: [PayoutController],
  providers: [PayoutService, SessionGuard],
  exports: [PayoutService],
})
export class PayoutModule {}
